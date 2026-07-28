import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiQuery({ name: 'unreadOnly', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getNotifications(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      page,
      limit,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  markAsRead(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('send-appointment-confirmation/:appointmentId')
  @Roles('ADMIN', 'RECEPTIONIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Enviar confirmação de agendamento' })
  sendAppointmentConfirmation(
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.notificationsService.sendAppointmentConfirmation(appointmentId);
  }

  @Post('send-appointment-reminder/:appointmentId')
  @Roles('ADMIN', 'RECEPTIONIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Enviar lembrete de agendamento' })
  sendAppointmentReminder(
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.notificationsService.sendAppointmentReminder(appointmentId);
  }

  @Post('send-payment-reminder/:transactionId')
  @Roles('ADMIN', 'RECEPTIONIST', 'ASSISTANT')
  @ApiOperation({ summary: 'Enviar lembrete de pagamento' })
  sendPaymentReminder(
    @Param('transactionId') transactionId: string,
  ) {
    return this.notificationsService.sendPaymentReminder(transactionId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de notificações' })
  getStats(
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.getStats(userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  markAllAsRead(
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
