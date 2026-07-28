import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SendWhatsAppParams {
  to: string;
  message: string;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async send(params: SendWhatsAppParams): Promise<boolean> {
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
    const instanceName = this.configService.get<string>('WHATSAPP_INSTANCE_NAME');

    if (!apiUrl || !apiToken || !instanceName) {
      this.logger.warn('WhatsApp não configurado. Mensagem não enviada.');
      return false;
    }

    try {
      const url = `${apiUrl}/message/sendText/${instanceName}`;

      await firstValueFrom(
        this.httpService.post(
          url,
          {
            number: params.to,
            text: params.message,
          },
          {
            headers: {
              apikey: apiToken,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`WhatsApp enviado para ${params.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Falha ao enviar WhatsApp para ${params.to}`,
        error.message,
      );
      return false;
    }
  }
}
