import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', ''),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      connectionTimeout: 5000,
      auth: {
        user: this.configService.get('SMTP_USER', ''),
        pass: this.configService.get('SMTP_PASS', ''),
      },
    });
  }

  async send(params: SendEmailParams): Promise<boolean> {
    try {
      const defaultUser = this.configService.get('SMTP_USER', '');
      const from = this.configService.get('SMTP_FROM', defaultUser);

      await this.transporter.sendMail({
        from: String(from),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      this.logger.log(`E-mail enviado para ${params.to}: ${params.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${params.to}`, error.message);
      return false;
    }
  }
}
