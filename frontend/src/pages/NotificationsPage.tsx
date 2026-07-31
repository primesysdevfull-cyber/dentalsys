import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Bell, Calendar, DollarSign, MessageSquare, Mail, ChevronDown, ChevronUp, CheckCheck, Loader2, Send, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

function getUserId(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) return '';
  try {
    return JSON.parse(atob(token.split('.')[1])).sub;
  } catch {
    return '';
  }
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'há alguns segundos';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 7) return `há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'APPOINTMENT_CONFIRMATION': return Calendar;
    case 'APPOINTMENT_REMINDER': return Bell;
    case 'PAYMENT_DUE': return DollarSign;
    case 'PAYMENT_RECEIVED': return CheckCircle2;
    case 'SYSTEM': return Bell;
    default: return Bell;
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APPOINTMENT_CONFIRMATION: 'Confirmação de Consulta',
    APPOINTMENT_REMINDER: 'Lembrete de Consulta',
    PAYMENT_DUE: 'Pagamento Pendente',
    PAYMENT_RECEIVED: 'Pagamento Recebido',
    SYSTEM: 'Sistema',
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    APPOINTMENT_CONFIRMATION: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    APPOINTMENT_REMINDER: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    PAYMENT_DUE: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    PAYMENT_RECEIVED: 'bg-green-50 text-green-600 dark:bg-success-500/10 dark:text-success-400',
    SYSTEM: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200',
  };
  return colors[type] || 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200';
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentVia: string[];
  createdAt: string;
  appointmentId?: string;
  transactionId?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  today: number;
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const userId = getUserId();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['notifications-stats', userId],
    queryFn: () => api.get(`/notifications/stats?userId=${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: notifications, isLoading } = useQuery<{ data: Notification[] }>({
    queryKey: ['notifications', userId, unreadOnly],
    queryFn: () => api.get(`/notifications?userId=${userId}${unreadOnly ? '&unreadOnly=true' : ''}`).then((r) => r.data),
    enabled: !!userId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read?userId=${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-stats'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-stats'] });
    },
  });

  const sendConfirmationMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/send-appointment-confirmation/${id}`),
    onSuccess: () => alert('Confirmação enviada com sucesso!'),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao enviar confirmação'),
  });

  const sendReminderMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/send-appointment-reminder/${id}`),
    onSuccess: () => alert('Lembrete enviado com sucesso!'),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao enviar lembrete'),
  });

  const sendPaymentReminderMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/send-payment-reminder/${id}`),
    onSuccess: () => alert('Lembrete de pagamento enviado com sucesso!'),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao enviar lembrete de pagamento'),
  });

  function handleMarkAsRead(id: string) {
    markAsReadMutation.mutate(id);
  }

  function handleSendConfirmation() {
    if (!appointmentId) return;
    sendConfirmationMutation.mutate(appointmentId);
  }

  function handleSendReminder() {
    if (!appointmentId) return;
    sendReminderMutation.mutate(appointmentId);
  }

  function handleSendPaymentReminder() {
    if (!transactionId) return;
    sendPaymentReminderMutation.mutate(transactionId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notificações</h1>
          <p className="text-gray-500 dark:text-gray-400">Central de notificações e lembretes</p>
        </div>
        <button
          onClick={() => setShowSendPanel(!showSendPanel)}
          className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700"
        >
          {showSendPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Enviar Notificação
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Não Lidas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.unread ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 dark:bg-success-500/10">
              <Bell className="h-5 w-5 text-green-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hoje</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.today ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[false, true].map((unread) => (
            <button
              key={String(unread)}
              onClick={() => setUnreadOnly(unread)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                unreadOnly === unread ? 'bg-dental-100 text-dental-700 dark:bg-dental-500/15 dark:text-dental-300 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {unread ? 'Não Lidas' : 'Todas'}
            </button>
          ))}
        </div>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || (stats?.unread ?? 0) === 0}
          className="flex items-center gap-2 rounded-lg border border-dental-200 dark:border-dental-500/30 px-4 py-2 text-sm font-medium text-dental-700 dark:text-dental-300 hover:bg-dental-50 dark:hover:bg-dental-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-4 w-4" />
          {markAllAsReadMutation.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
        </button>
      </div>

      <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-dental-600" />
          </div>
        ) : !notifications?.data || notifications.data.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              {unreadOnly ? 'Nenhuma notificação não lida' : 'Nenhuma notificação encontrada'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.data.map((n: Notification) => {
              const Icon = getNotificationIcon(n.type);
              return (
                <li
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                    !n.isRead ? 'bg-dental-50/50 dark:bg-dental-500/10 cursor-pointer hover:bg-dental-100/50 dark:hover:bg-dental-500/15' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {!n.isRead && (
                    <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-dental-500" />
                  )}
                  {n.isRead && <div className="w-2.5 shrink-0" />}
                  <div className={`rounded-lg p-2 ${getTypeColor(n.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{getRelativeTime(n.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(n.type)}`}>
                        {getTypeLabel(n.type)}
                      </span>
                      {n.sentVia?.map((via: string) => (
                        <span
                          key={via}
                          className="inline-flex items-center gap-1 rounded-full bg-dental-50 dark:bg-dental-500/10 px-2 py-0.5 text-xs font-medium text-dental-700 dark:text-dental-300"
                        >
                          {via === 'WHATSAPP' && <MessageSquare className="h-3 w-3" />}
                          {via === 'EMAIL' && <Mail className="h-3 w-3" />}
                          {via === 'SMS' && <MessageSquare className="h-3 w-3" />}
                          {via === 'WHATSAPP' ? 'WhatsApp' : via === 'EMAIL' ? 'Email' : via === 'SMS' ? 'SMS' : via}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showSendPanel && (
        <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enviar Notificação Manual</h2>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">Agendamento</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ID do Agendamento</label>
                  <input
                    type="text"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    placeholder="Digite o ID do agendamento"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                  />
                </div>
                <button
                  onClick={handleSendConfirmation}
                  disabled={!appointmentId || sendConfirmationMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                >
                  {sendConfirmationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Enviar Confirmação
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={!appointmentId || sendReminderMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {sendReminderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Enviar Lembrete
                </button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">Pagamento</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ID da Transação</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Digite o ID da transação"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                  />
                </div>
                <button
                  onClick={handleSendPaymentReminder}
                  disabled={!transactionId || sendPaymentReminderMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {sendPaymentReminderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Lembrete de Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
