import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private reminderInterval: NodeJS.Timeout;
  private readonly REMINDER_CHECK_MS = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.startReminderCheck();
  }

  onModuleDestroy() {
    this.stopReminderCheck();
  }

  startReminderCheck() {
    this.logger.log('Iniciando verificação periódica de lembretes');
    this.checkUpcomingAppointments();
    this.reminderInterval = setInterval(() => {
      this.checkUpcomingAppointments();
    }, this.REMINDER_CHECK_MS);
  }

  stopReminderCheck() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.logger.log('Verificação periódica de lembretes encerrada');
    }
  }

  async checkUpcomingAppointments() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          reminderSent: false,
          startTime: {
            gte: now,
            lte: tomorrow,
          },
        },
        include: {
          patient: {
            select: { id: true, name: true, whatsapp: true, phone: true, email: true },
          },
        },
      });

      this.logger.debug(
        `Encontrados ${upcomingAppointments.length} agendamentos para enviar lembretes`,
      );

      for (const appointment of upcomingAppointments) {
        try {
          await this.notificationsService.sendAppointmentReminder(appointment.id);
          this.logger.log(
            `Lembrete enviado para agendamento ${appointment.id} - paciente: ${appointment.patient.name}`,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao enviar lembrete para agendamento ${appointment.id}`,
            error.message,
          );
        }
      }

      await this.checkOverduePayments();
      await this.checkLowStockItems();
    } catch (error) {
      this.logger.error('Falha na verificação periódica de lembretes', error.message);
    }
  }

  private async checkOverduePayments() {
    try {
      const overdueTransactions = await this.prisma.financialTransaction.findMany({
        where: {
          status: 'OVERDUE',
          dueDate: { lt: new Date() },
        },
        include: {
          patient: {
            select: { id: true, name: true, whatsapp: true, phone: true, email: true },
          },
        },
      });

      this.logger.debug(
        `Encontradas ${overdueTransactions.length} transações atrasadas`,
      );

      for (const transaction of overdueTransactions) {
        if (!transaction.patient) continue;

        try {
          await this.notificationsService.sendPaymentReminder(transaction.id);
          this.logger.log(
            `Lembrete de pagamento enviado para transação ${transaction.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao enviar lembrete de pagamento para transação ${transaction.id}`,
            error.message,
          );
        }
      }
    } catch (error) {
      this.logger.error('Falha ao verificar pagamentos atrasados', error.message);
    }
  }

  private async checkLowStockItems() {
    try {
      const lowStockItems = await this.prisma.inventoryItem.findMany({
        where: {
          isActive: true,
        },
      });

      const itemsBelowMinimum = lowStockItems.filter(
        (item) => item.currentStock <= item.minStock,
      );

      this.logger.debug(
        `Encontrados ${itemsBelowMinimum.length} itens com estoque baixo`,
      );

      for (const item of itemsBelowMinimum) {
        try {
          await this.notificationsService.sendStockAlert(item.id);
          this.logger.log(
            `Alerta de estoque baixo enviado para item ${item.id} - ${item.name}`,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao enviar alerta de estoque para item ${item.id}`,
            error.message,
          );
        }
      }
    } catch (error) {
      this.logger.error('Falha ao verificar estoque baixo', error.message);
    }
  }
}
