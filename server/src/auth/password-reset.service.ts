import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';

const TOKEN_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      return;
    }

    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    if (!this.mailer.isReady()) {
      this.logger.log(
        `[DEV FALLBACK] Password reset link for ${user.email}: ${resetUrl} (valid 30 minutes)`,
      );
      return;
    }

    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Reset your Moments password',
        text: `Click the link below to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
        html: `
          <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a;">
            <h2 style="margin: 0 0 12px;">Reset your password</h2>
            <p>Click the button below to choose a new password. The link expires in 30 minutes.</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}"
                 style="display:inline-block; padding:12px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">
                Reset password
              </a>
            </p>
            <p style="color:#64748b; font-size:13px;">If the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all;">${resetUrl}</span></p>
            <p style="color:#64748b; font-size:13px;">If you didn't request a password reset, you can ignore this email.</p>
          </div>
        `,
      });
    } catch {
      // Swallow — don't reveal whether the email exists.
    }
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken);

    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
      },
    });

    if (!record || record.consumedAt) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link has expired. Request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return { userId: record.userId };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
