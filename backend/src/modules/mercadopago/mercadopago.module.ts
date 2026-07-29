import { Module } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadoPagoWebhookHandler } from './mercadopago.webhook';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, MercadoPagoWebhookHandler],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
