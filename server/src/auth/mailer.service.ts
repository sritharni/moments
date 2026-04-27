import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;
  private fromAddress = '';

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? user;

    if (!host || !port || !user || !pass || !from) {
      this.logger.warn(
        'SMTP not configured (SMTP_HOST/PORT/USER/PASS/FROM). Emails will be logged to the console only.',
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

  isReady(): boolean {
    return this.transporter !== null;
  }

  async sendMail(input: SendMailInput): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(
        `[DEV FALLBACK] Email to ${input.to} | ${input.subject} | ${input.text}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      this.logger.log(`Sent "${input.subject}" to ${input.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send "${input.subject}" to ${input.to}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
