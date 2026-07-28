import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  return timeString;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return dateString;
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export function formatZipCode(zipCode: string): string {
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length !== 8) return zipCode;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter((_, index, arr) => index === 0 || index === arr.length - 1)
    .join('')
    .toUpperCase();
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não Compareceu',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: '#f59e0b',
    confirmed: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444',
    no_show: '#6b7280',
  };
  return colors[status] || '#6b7280';
}
