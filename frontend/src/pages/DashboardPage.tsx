import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '../utils';
import {
  Users, Calendar, DollarSign, AlertTriangle,
  TrendingUp, Clock, UserPlus, BarChart3, PlusCircle, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts';

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

  const cashFlowData = (cashFlow?.data || cashFlow || []).map((item: any) => ({
    name: getMonthName(new Date(item.month || item.date).getMonth()),
    income: item.income || item.revenue || 0,
    expense: item.expense || item.expenses || 0,
  }));

  const appointments = todayAppointments?.data || [];
  const appointmentsToday = todayAppointments?.meta?.total || 0;

  const stats = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(billingDashboard?.revenue || 0),
      icon: DollarSign,
      bgColor: 'bg-success-50',
      iconColor: 'text-success-500',
      variation: patientStats?.newThisMonth ? `+${patientStats.newThisMonth} este mês` : null,
      variationColor: 'text-success-500',
    },
    {
      title: 'Pacientes Cadastrados',
      value: patientStats?.totalPatients || 0,
      icon: Users,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      variation: patientStats?.newThisMonth ? `+${patientStats.newThisMonth} este mês` : null,
      variationColor: 'text-primary-600',
    },
    {
      title: 'Agendamentos Hoje',
      value: appointmentsToday,
      icon: Calendar,
      bgColor: 'bg-success-50',
      iconColor: 'text-success-500',
      variation: null,
      variationColor: 'text-gray-400',
    },
    {
      title: 'Inadimplência',
      value: formatCurrency(billingDashboard?.overdueAmount || 0),
      icon: AlertTriangle,
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning-500',
      variation: `${billingDashboard?.overdueCount || 0} pendências`,
      variationColor: 'text-warning-500',
    },
    {
      title: 'Comissões do Mês',
      value: formatCurrency(billingDashboard?.commissions || 0),
      icon: TrendingUp,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      variation: null,
      variationColor: 'text-gray-400',
    },
  ];

  const quickActions = [
    { label: 'Novo Paciente', icon: UserPlus, route: '/patients', primary: true },
    { label: 'Novo Agendamento', icon: Calendar, route: '/appointments', primary: true },
    { label: 'Novo Lançamento', icon: PlusCircle, route: '/billing', primary: false },
    { label: 'Relatórios', icon: BarChart3, route: '/reports', primary: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Dashboard</h1>
        <p className="text-sm text-[#6B7280]">Visão geral da clínica</p>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-xl bg-white p-5 shadow-card flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-[#1F2937] truncate">{stat.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{stat.title}</p>
            </div>
            {stat.variation && (
              <div className="shrink-0">
                <span className={`text-xs font-medium ${stat.variationColor}`}>{stat.variation}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico + Status Agendamentos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-[#1F2937]">Receita vs Despesas (12 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData} barGap={0} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="income" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32}>
                <LabelList dataKey="income" position="top" fontSize={10} fill="#10B981" fontWeight={600} formatter={(v: any) => (Number(v) > 0 ? (Number(v) / 1000).toFixed(0) + 'k' : '') as any} />
              </Bar>
              <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32}>
                <LabelList dataKey="expense" position="top" fontSize={10} fill="#EF4444" fontWeight={600} formatter={(v: any) => (Number(v) > 0 ? (Number(v) / 1000).toFixed(0) + 'k' : '') as any} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-[#1F2937]">Status dos Agendamentos</h3>
          </div>
          {appointmentsToday === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <Calendar className="h-12 w-12 text-[#E5E7EB] mb-3" />
              <p className="text-sm font-medium text-[#6B7280]">Nenhum agendamento registrado ainda.</p>
              <p className="text-xs text-[#9CA3AF] mt-1 mb-4">Clique em Novo Agendamento para começar.</p>
              <button
                onClick={() => navigate('/appointments')}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Novo Agendamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 6).map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: apt.professional?.color || '#2563EB' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1F2937] truncate">{apt.patient?.name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{apt.professional?.name} • {apt.procedure?.name || 'Consulta'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-[#1F2937]">{new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-[#1F2937]">Atalhos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex items-center gap-3 rounded-lg px-5 py-3.5 text-sm font-semibold transition-all ${
                action.primary
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-card'
                  : 'border border-[#E5E7EB] text-primary-600 hover:bg-primary-50 hover:border-primary-200'
              }`}
            >
              <action.icon className={`h-5 w-5 ${action.primary ? 'text-white' : 'text-primary-600'} shrink-0`} />
              <span className="text-left">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Próximos Agendamentos + Resumo Financeiro */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-[#1F2937]">Próximos Agendamentos</h3>
          <div className="space-y-2">
            {appointments.length > 0 ? appointments.slice(0, 5).map((apt: any) => (
              <div key={apt.id} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full shrink-0" style={{ backgroundColor: apt.professional?.color || '#2563EB' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F2937] truncate">{apt.patient?.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{apt.professional?.name} • {apt.procedure?.name || 'Consulta'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-[#1F2937]">{new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                </div>
              </div>
            )) : (
              <p className="py-8 text-center text-sm text-[#6B7280]">Nenhum agendamento para hoje</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-[#1F2937]">Resumo Financeiro</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-success-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success-500" />
                <span className="text-sm font-medium text-[#1F2937]">Receitas Pagas</span>
              </div>
              <span className="text-sm font-bold text-[#1F2937]">{formatCurrency(billingDashboard?.revenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-warning-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning-500" />
                <span className="text-sm font-medium text-[#1F2937]">A Receber</span>
              </div>
              <span className="text-sm font-bold text-[#1F2937]">{formatCurrency(billingDashboard?.pendingAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-[#1F2937]">Inadimplência</span>
              </div>
              <span className="text-sm font-bold text-[#1F2937]">{formatCurrency(billingDashboard?.overdueAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-[#1F2937]">Despesas</span>
              </div>
              <span className="text-sm font-bold text-[#1F2937]">{formatCurrency(billingDashboard?.expenses || 0)}</span>
            </div>
            <div className="border-t border-[#E5E7EB] pt-3 mt-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-[#6B7280]">Lucro Líquido</span>
                <span className="text-base font-bold text-[#1F2937]">{formatCurrency(billingDashboard?.netProfit || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
