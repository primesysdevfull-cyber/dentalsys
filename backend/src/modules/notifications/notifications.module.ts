import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    WhatsAppProvider,
    SmsProvider,
    EmailProvider,
  ],
  exports: [NotificationsService, NotificationsProcessor],
})
export class NotificationsModule {}
