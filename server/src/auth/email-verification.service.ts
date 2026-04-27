import { createHash, randomInt } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class EmailVerificationService implements OnModuleInit {
  private readonly logger = new Logger(EmailVerificationService.name);
  private transporter: Transporter | null = null;
  private fromAddress = '';

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? user;

    if (!host || !port || !user || !pass || !from) {
      this.logger.warn(
        'SMTP not configured (SMTP_HOST/PORT/USER/PASS/FROM). Verification codes will be logged to the server console only.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
    this.fromAddress = from;

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP transport ready (host=${host}, from=${from})`);
    } catch (error) {
      this.transporter = null;
      this.logger.error(
        `SMTP verification failed; falling back to console logging. ${error instanceof Error ? error.message : ''}`,
      );
    }
  }

  async issueCode(userId: string, email: string) {
    const recent = await this.prisma.emailVerification.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (
      recent &&
      Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${waitSeconds}s before requesting another code`,
      );
    }

    await this.prisma.emailVerification.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await this.prisma.emailVerification.create({
      data: { userId, codeHash, expiresAt },
    });

    await this.sendEmail(email, code);
  }

  async verifyCode(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { alreadyVerified: true, userId: user.id };
    }

    const record = await this.prisma.emailVerification.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('No active verification code. Request a new one.');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired. Request a new one.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const codeHash = this.hashCode(code);

    if (codeHash !== record.codeHash) {
      await this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    return { alreadyVerified: false, userId: user.id };
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async sendEmail(to: string, code: string) {
    if (!this.transporter) {
      this.logger.log(
        `[DEV FALLBACK] Verification code for ${to}: ${code} (valid 15 minutes)`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Your Moments verification code',
        text: `Your verification code is ${code}. It expires in 15 minutes.`,
        html: `
          <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a;">
            <h2 style="margin: 0 0 12px;">Verify your email</h2>
            <p>Use this code to finish signing up for Moments:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${code}</p>
            <p style="color: #64748b; font-size: 13px;">This code expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Verification code sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error instanceof Error ? error.message : error}`,
      );
      throw new BadRequestException(
        'Could not send verification email. Please try again shortly.',
      );
    }
  }
}
