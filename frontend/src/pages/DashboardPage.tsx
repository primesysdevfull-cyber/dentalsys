import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '../utils';
import {
  Users, Calendar, DollarSign, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Percent,
  UserPlus, BarChart3, PlusCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, LabelList,
} from 'recharts';

const PIE_COLORS: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  CONFIRMED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#16a34a',
  CANCELLED: '#ef4444',
  NO_SHOW: '#f97316',
};

function getMonthName(m: number) {
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return names[m];
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: billingDashboard } = useQuery({
    queryKey: ['billing-dashboard'],
    queryFn: () => api.get('/billing/dashboard').then((r) => r.data),
  });

  const { data: patientStats } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: () => api.get('/patients/stats').then((r) => r.data),
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return api
        .get(`/appointments?startDate=${today}T00:00:00.000Z&endDate=${today}T23:59:59.999Z`)
        .then((r) => r.data);
    },
  });

  const today = new Date();
  const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { data: cashFlow } = useQuery({
    queryKey: ['cash-flow', twelveMonthsAgo.toISOString(), endOfMonth.toISOString()],
    queryFn: () => api
      .get(`/billing/cash-flow?startDate=${twelveMonthsAgo.toISOString()}&endDate=${endOfMonth.toISOString()}`)
      .then((r) => r.data),
  });

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const { data: productivity } = useQuery({
    queryKey: ['productivity', monthStart.toISOString(), endOfMonth.toISOString()],
    queryFn: () => api
      .get(`/reports/productivity?startDate=${monthStart.toISOString()}&endDate=${endOfMonth.toISOString()}`)
      .then((r) => r.data),
  });

  const cashFlowData = (cashFlow?.data || cashFlow || []).map((item: any) => ({
    name: getMonthName(new Date(item.month || item.date).getMonth()),
    income: item.income || item.revenue || 0,
    expense: item.expense || item.expenses || 0,
  }));

  const statusData = (() => {
    const raw = productivity?.statusBreakdown || productivity?.data?.statusBreakdown || productivity;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      return Object.entries(raw)
        .filter(([key]) => ['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].includes(key))
        .map(([name, value]) => ({ name: getStatusLabel(name), value, status: name }));
    }
    return [];
  })();

  const totalStatus = statusData.reduce((s: number, d: any) => s + (d.value || 0), 0);

  const stats = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(billingDashboard?.revenue || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Pacientes Cadastrados',
      value: patientStats?.totalPatients || 0,
      sub: `+${patientStats?.newThisMonth || 0} este mês`,
      subColor: 'text-green-600',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Agendamentos Hoje',
      value: todayAppointments?.meta?.total || 0,
      icon: Calendar,
      color: 'text-dental-600',
      bg: 'bg-dental-100',
    },
    {
      title: 'Inadimplência',
      value: formatCurrency(billingDashboard?.overdueAmount || 0),
      sub: `${billingDashboard?.overdueCount || 0} pendências`,
      subColor: 'text-red-600',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'Comissões do Mês',
      value: formatCurrency(billingDashboard?.commissions || 0),
      icon: Percent,
      color: 'text-dental-600',
      bg: 'bg-dental-100',
    },
  ];

  const quickActions = [
    { label: 'Novo Paciente', icon: UserPlus, route: '/patients' },
    { label: 'Novo Agendamento', icon: Calendar, route: '/appointments' },
    { label: 'Novo Lançamento Financeiro', icon: PlusCircle, route: '/billing' },
    { label: 'Ver Relatórios Completos', icon: BarChart3, route: '/reports' },
  ];

  function handleNavigation(route: string) {
    navigate(route);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">Visão geral da clínica</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="flex items-start justify-between rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{stat.title}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 truncate">{stat.value}</p>
              {stat.sub && (
                <p className={`mt-0.5 text-xs font-medium ${stat.subColor || 'text-gray-400'}`}>
                  {stat.sub}
                </p>
              )}
            </div>
            <div className={`ml-3 flex h-10 w-10 items-center justify-center rounded-full ${stat.bg} flex-shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Receita vs Despesas */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Receita vs Despesas (12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData} barGap={0} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar dataKey="income" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32}>
                <LabelList dataKey="income" position="top" fontSize={10} fill="#22c55e" formatter={(v: any) => (Number(v) > 0 ? (Number(v) / 1000).toFixed(0) + 'k' : '') as any} />
              </Bar>
              <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32}>
                <LabelList dataKey="expense" position="top" fontSize={10} fill="#ef4444" formatter={(v: any) => (Number(v) > 0 ? (Number(v) / 1000).toFixed(0) + 'k' : '') as any} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos Agendamentos */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Status dos Agendamentos (este mês)
          </h3>
          {totalStatus === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <Calendar className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">Nenhum agendamento registrado ainda</p>
              <p className="text-xs text-gray-300 mt-1">Os dados aparecerão conforme os agendamentos forem criados</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry: any) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `${value} agendamentos`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Atalhos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleNavigation(action.route)}
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:bg-dental-50 hover:border-dental-200"
            >
              <action.icon className="h-5 w-5 text-dental-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 leading-tight text-left">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Próximos Agendamentos + Resumo Financeiro */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximos Agendamentos */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Próximos Agendamentos
          </h3>
          <div className="space-y-2">
            {todayAppointments?.data?.slice(0, 5).map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-9 w-9 rounded-full flex-shrink-0"
                    style={{ backgroundColor: apt.professional?.color || '#3b82f6' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{apt.patient?.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {apt.professional?.name} • {apt.procedure?.name || 'Consulta'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(apt.startTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              </div>
            ))}
            {(!todayAppointments?.data || todayAppointments.data.length === 0) && (
              <p className="py-8 text-center text-sm text-gray-400">
                Nenhum agendamento para hoje
              </p>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Resumo Financeiro
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <span className="text-sm font-medium text-green-800">Receitas Pagas</span>
                  <p className="text-[10px] text-green-600">Recebido no mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-700">
                {formatCurrency(billingDashboard?.revenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <span className="text-sm font-medium text-yellow-800">A Receber</span>
                  <p className="text-[10px] text-yellow-600">Pendente de pagamento</p>
                </div>
              </div>
              <span className="text-sm font-bold text-yellow-700">
                {formatCurrency(billingDashboard?.pendingAmount || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <span className="text-sm font-medium text-red-800">Inadimplência</span>
                  <p className="text-[10px] text-red-600">Valores em atraso</p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-700">
                {formatCurrency(billingDashboard?.overdueAmount || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-red-50/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <span className="text-sm font-medium text-red-800">Despesas</span>
                  <p className="text-[10px] text-red-600">Pagas no mês</p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-700">
                {formatCurrency(billingDashboard?.expenses || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-indigo-600" />
                <div>
                  <span className="text-sm font-medium text-indigo-800">Comissões</span>
                  <p className="text-[10px] text-indigo-600">Do mês atual</p>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-700">
                {formatCurrency(billingDashboard?.commissions || 0)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Lucro Líquido</span>
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(billingDashboard?.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
