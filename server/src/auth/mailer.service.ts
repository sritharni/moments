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
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM?.trim() ?? user;

    if (!host || !port || !user || !pass || !from) {
      this.logger.warn(
        'SMTP not configured (SMTP_HOST/PORT/USER/PASS/FROM). Emails will be logged to the console only.',
      );
      return;
    }

    const portNumber = Number(port);
    const secure = portNumber === 465;
    const isGmail = /gmail\.com$/i.test(host);

    this.transporter = nodemailer.createTransport({
      host,
      port: portNumber,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
      tls: {
        servername: host,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      ...(isGmail ? { service: 'gmail' } : {}),
    });
    this.fromAddress = from;

    try {
      await this.transporter.verify();
      this.logger.log(
        `SMTP transport ready (host=${host}, port=${portNumber}, from=${from})`,
      );
    } catch (error) {
      this.transporter = null;
      this.logger.error(
        `SMTP verification failed; falling back to console logging. ${error instanceof Error ? error.message : ''}`,
      );
      if (isGmail) {
        this.logger.warn(
          'For Gmail, use an app password from a 2FA-enabled account. Regular account passwords will not work.',
        );
      }
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
