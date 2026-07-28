import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

export interface SendSmsParams {
  to: string;
  body: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client: ReturnType<typeof twilio> | null = null;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER', '');

    if (accountSid && accountSid.startsWith('AC') && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async send(params: SendSmsParams): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Twilio não configurado. SMS não enviado.');
      return false;
    }

    try {
      await this.client.messages.create({
        body: params.body,
        from: this.fromNumber,
        to: params.to,
      });

      this.logger.log(`SMS enviado para ${params.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar SMS para ${params.to}`, error.message);
      return false;
    }
  }
}
