import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappProvider: WhatsAppProvider,
    private smsProvider: SmsProvider,
    private emailProvider: EmailProvider,
  ) {}

  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    return this.whatsappProvider.send({ to, message });
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    return this.smsProvider.send({ to, body: message });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    return this.emailProvider.send({ to, subject, html });
  }

  async sendAppointmentConfirmation(appointmentId: string): Promise<{ success: boolean; channels: string[] }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: true,
        procedure: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const patient = appointment.patient;
    const professional = appointment.professional;
    const procedure = appointment.procedure;

    const dateStr = new Date(appointment.startTime).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = [
      `Olá ${patient.name}!`,
      '',
      `Sua consulta foi agendada com sucesso.`,
      '',
      `📅 Data: ${dateStr}`,
      `⏰ Horário: ${timeStr}`,
      `👨‍⚕️ Profissional: ${professional.name}`,
      procedure ? `🦷 Procedimento: ${procedure.name}` : '',
      '',
      'Para confirmar ou remarcar, entre em contato.',
      '',
      'Equipe Odontológica',
    ]
      .filter(Boolean)
      .join('\n');

    const channels: string[] = [];

    if (patient.whatsapp) {
      const sent = await this.sendWhatsApp(patient.whatsapp, message);
      if (sent) channels.push('WHATSAPP');
    }

    if (patient.phone) {
      const sent = await this.sendSMS(patient.phone, message);
      if (sent) channels.push('SMS');
    }

    if (patient.email) {
      const html = this.buildAppointmentConfirmationHtml(
        patient.name,
        dateStr,
        timeStr,
        professional.name,
        procedure?.name,
      );
      const sent = await this.sendEmail(
        patient.email,
        'Confirmação de Agendamento',
        html,
      );
      if (sent) channels.push('EMAIL');
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { confirmationSent: true },
    });

    await this.createInAppNotification({
      userId: appointment.professional.userId || '',
      type: 'APPOINTMENT_CONFIRMATION',
      title: 'Agendamento confirmado',
      message: `Consulta de ${patient.name} confirmada para ${dateStr} às ${timeStr}`,
      data: { appointmentId, patientId: patient.id },
      sentVia: channels,
    });

    return { success: channels.length > 0, channels };
  }

  async sendAppointmentReminder(appointmentId: string): Promise<{ success: boolean; channels: string[] }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        professional: true,
        procedure: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const patient = appointment.patient;
    const professional = appointment.professional;

    const dateStr = new Date(appointment.startTime).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = [
      `Olá ${patient.name}!`,
      '',
      `Lembrete: Você tem uma consulta agendada.`,
      '',
      `📅 Data: ${dateStr}`,
      `⏰ Horário: ${timeStr}`,
      `👨‍⚕️ Profissional: ${professional.name}`,
      '',
      'Caso precise remarcar, entre em contato o mais breve possível.',
      '',
      'Equipe Odontológica',
    ]
      .filter(Boolean)
      .join('\n');

    const channels: string[] = [];

    if (patient.whatsapp) {
      const sent = await this.sendWhatsApp(patient.whatsapp, message);
      if (sent) channels.push('WHATSAPP');
    }

    if (patient.phone) {
      const sent = await this.sendSMS(patient.phone, message);
      if (sent) channels.push('SMS');
    }

    if (patient.email) {
      const html = this.buildReminderHtml(
        patient.name,
        dateStr,
        timeStr,
        professional.name,
      );
      const sent = await this.sendEmail(
        patient.email,
        'Lembrete de Consulta',
        html,
      );
      if (sent) channels.push('EMAIL');
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });

    return { success: channels.length > 0, channels };
  }

  async sendPaymentReminder(transactionId: string): Promise<{ success: boolean; channels: string[] }> {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id: transactionId },
      include: {
        patient: true,
        procedure: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    const patient = transaction.patient;
    if (!patient) {
      return { success: false, channels: [] };
    }

    const dueDateStr = transaction.dueDate
      ? new Date(transaction.dueDate).toLocaleDateString('pt-BR')
      : 'a definir';

    const message = [
      `Olá ${patient.name}!`,
      '',
      `Você possui um pagamento pendente.`,
      '',
      `📋 Descrição: ${transaction.description}`,
      `💰 Valor: R$ ${Number(transaction.totalAmount).toFixed(2)}`,
      `📅 Vencimento: ${dueDateStr}`,
      '',
      'Por favor, efetue o pagamento na data indicada.',
      '',
      'Equipe Odontológica',
    ]
      .filter(Boolean)
      .join('\n');

    const channels: string[] = [];

    if (patient.whatsapp) {
      const sent = await this.sendWhatsApp(patient.whatsapp, message);
      if (sent) channels.push('WHATSAPP');
    }

    if (patient.phone) {
      const sent = await this.sendSMS(patient.phone, message);
      if (sent) channels.push('SMS');
    }

    if (patient.email) {
      const html = this.buildPaymentReminderHtml(
        patient.name,
        transaction.description,
        Number(transaction.totalAmount),
        dueDateStr,
      );
      const sent = await this.sendEmail(
        patient.email,
        'Lembrete de Pagamento',
        html,
      );
      if (sent) channels.push('EMAIL');
    }

    return { success: channels.length > 0, channels };
  }

  async sendStockAlert(itemId: string): Promise<{ success: boolean }> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        tenant: {
          include: {
            users: {
              where: { role: { in: ['ADMIN', 'ASSISTANT'] }, isActive: true },
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no estoque');
    }

    const adminUsers = item.tenant.users;
    const channels: string[] = [];

    for (const user of adminUsers) {
      if (user.email) {
        const html = this.buildStockAlertHtml(
          item.name,
          item.currentStock,
          item.minStock,
          item.unit,
        );
        const sent = await this.sendEmail(
          user.email,
          `Alerta de Estoque Baixo - ${item.name}`,
          html,
        );
        if (sent) channels.push('EMAIL');
      }

      await this.createInAppNotification({
        userId: user.id,
        type: 'STOCK_ALERT',
        title: 'Estoque baixo',
        message: `O item "${item.name}" está com estoque baixo (${item.currentStock} ${item.unit}). Mínimo: ${item.minStock} ${item.unit}`,
        data: { itemId: item.id, currentStock: item.currentStock, minStock: item.minStock },
        sentVia: channels,
      });
    }

    return { success: channels.length > 0 };
  }

  async createInAppNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    sentVia?: string[];
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        sentVia: params.sentVia || [],
      },
    });
  }

  async getNotifications(userId: string, query: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const { unreadOnly, page: rawPage, limit: rawLimit } = query;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async getStats(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [total, unread, today] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    return { total, unread, today };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { success: true };
  }

  private buildEmailHtml(title: string, headerBg: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${headerBg}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">${title}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          ${content}
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Equipe Odontológica</p>
        </div>
      </body>
      </html>
    `;
  }

  private buildAppointmentConfirmationHtml(
    patientName: string,
    date: string,
    time: string,
    professionalName: string,
    procedureName?: string,
  ): string {
    return this.buildEmailHtml('Confirmação de Agendamento', '#2563eb', `
      <p>Olá <strong>${patientName}</strong>,</p>
      <p>Sua consulta foi agendada com sucesso!</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>⏰ Horário:</strong> ${time}</p>
        <p style="margin: 5px 0;"><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
        ${procedureName ? `<p style="margin: 5px 0;"><strong>🦷 Procedimento:</strong> ${procedureName}</p>` : ''}
      </div>
      <p>Para confirmar ou remarcar, entre em contato.</p>
    `);
  }

  private buildReminderHtml(
    patientName: string,
    date: string,
    time: string,
    professionalName: string,
  ): string {
    return this.buildEmailHtml('Lembrete de Consulta', '#f59e0b', `
      <p>Olá <strong>${patientName}</strong>,</p>
      <p>Este é um lembrete da sua consulta agendada.</p>
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>⏰ Horário:</strong> ${time}</p>
        <p style="margin: 5px 0;"><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
      </div>
      <p>Caso precise remarcar, entre em contato o mais breve possível.</p>
    `);
  }

  private buildPaymentReminderHtml(
    patientName: string,
    description: string,
    amount: number,
    dueDate: string,
  ): string {
    return this.buildEmailHtml('Lembrete de Pagamento', '#dc2626', `
      <p>Olá <strong>${patientName}</strong>,</p>
      <p>Você possui um pagamento pendente.</p>
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📋 Descrição:</strong> ${description}</p>
        <p style="margin: 5px 0;"><strong>💰 Valor:</strong> R$ ${amount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>📅 Vencimento:</strong> ${dueDate}</p>
      </div>
      <p>Por favor, efetue o pagamento na data indicada.</p>
    `);
  }

  private buildStockAlertHtml(
    itemName: string,
    currentStock: number,
    minStock: number,
    unit: string,
  ): string {
    return this.buildEmailHtml('Alerta de Estoque Baixo', '#ea580c', `
      <p>O item abaixo está com estoque baixo:</p>
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>📦 Item:</strong> ${itemName}</p>
        <p style="margin: 5px 0;"><strong>📊 Estoque atual:</strong> ${currentStock} ${unit}</p>
        <p style="margin: 5px 0;"><strong>⚠️ Estoque mínimo:</strong> ${minStock} ${unit}</p>
      </div>
      <p>Reabastecer o mais breve possível.</p>
    `);
  }
}
