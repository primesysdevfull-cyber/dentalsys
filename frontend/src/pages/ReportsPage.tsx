import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import {
  TrendingUp, TrendingDown, Users, Calendar, AlertTriangle,
  BarChart3, DollarSign, Clock, CheckCircle, Percent, Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function getPeriodDates(period: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (period) {
    case 'this-month':
      return { start: new Date(year, month, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0], label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
    case 'last-month': { const d = new Date(year, month - 1, 1); return { start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0], end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }; }
    case 'this-quarter': { const qStart = Math.floor(month / 3) * 3; return { start: new Date(year, qStart, 1).toISOString().split('T')[0], end: new Date(year, qStart + 3, 0).toISOString().split('T')[0], label: `${Math.floor(month / 3) + 1}º Tri ${year}` }; }
    case 'this-year': return { start: `${year}-01-01`, end: `${year}-12-31`, label: `Ano ${year}` };
    case 'last-year': return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, label: `Ano ${year - 1}` };
    default: return { start: new Date(year, month, 1).toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0], label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
  }
}

function SummaryCard({ icon: Icon, iconBg, iconColor, title, value, valueColor = 'text-gray-900', sub }: { icon: any; iconBg: string; iconColor: string; title: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className={`rounded-xl p-3 ${iconBg}`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`truncate text-xl font-bold ${valueColor}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<'financeiro' | 'produtividade'>('financeiro');
  const [period, setPeriod] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isCustom = period === 'custom';
  const { start, end, label } = isCustom
    ? { start: customStart, end: customEnd, label: `${customStart} a ${customEnd}` }
    : getPeriodDates(period);

  const dateParams = start && end ? `startDate=${start}&endDate=${end}` : '';

  const { data: revenueReport } = useQuery({ queryKey: ['revenue-report', start, end], queryFn: () => api.get(`/reports/revenue?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: billingDashboard } = useQuery({ queryKey: ['billing-dashboard-reports', start, end], queryFn: () => api.get(`/billing/dashboard?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: occupancyReport } = useQuery({ queryKey: ['occupancy-report', start, end], queryFn: () => api.get(`/reports/occupancy?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: professionalReport } = useQuery({ queryKey: ['professional-report', start, end], queryFn: () => api.get(`/reports/professional-performance?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: proceduresReport } = useQuery({ queryKey: ['procedures-report', start, end], queryFn: () => api.get(`/reports/procedures?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: delinquencyReport } = useQuery({ queryKey: ['delinquency-report'], queryFn: () => api.get('/reports/delinquency').then((r) => r.data) });
  const { data: appointmentsReport } = useQuery({ queryKey: ['appointments-report', start, end], queryFn: () => api.get(`/reports/appointments?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: commissionsReport } = useQuery({ queryKey: ['commissions-report', start, end], queryFn: () => api.get(`/professionals/commissions?${dateParams}`).then((r) => r.data), enabled: !!start && !!end });
  const { data: productivity } = useQuery({ queryKey: ['productivity-report', start, end], queryFn: () => api.get(`/reports/productivity?${dateParams}`).then((r) => r.data), enabled: !!start && !!end && tab === 'produtividade' });

  const revenue = Number(revenueReport?.totalRevenue || 0);
  const paid = Number(revenueReport?.paidRevenue || 0);
  const pending = Number(billingDashboard?.pendingAmount || 0);
  const pendingCount = Number(billingDashboard?.pendingCount || 0);
  const expenses = Number(billingDashboard?.expenses || 0);
  const commissions = Number(billingDashboard?.commissions || 0);
  const netProfit = Number(billingDashboard?.netProfit || 0);
  const totalRevenueVal = professionalReport?.professionals?.reduce((sum: number, p: any) => sum + p.revenue, 0) || 0;

  const periods = [
    { value: 'this-month', label: 'Este Mês' }, { value: 'last-month', label: 'Mês Passado' },
    { value: 'this-quarter', label: 'Este Trimestre' }, { value: 'this-year', label: 'Este Ano' },
    { value: 'last-year', label: 'Ano Passado' }, { value: 'custom', label: 'Personalizado' },
  ];

  async function exportPDF() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`relatorio-dentalclinic-${start}-a-${end}.pdf`);
    } catch (err) {
      alert('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400">Indicadores e métricas da clínica</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Período:</span>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${period === p.value ? 'bg-dental-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}>{p.label}</button>
            ))}
          </div>
          {isCustom && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <span className="text-gray-400 dark:text-gray-500">até</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
          )}
        </div>
        <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700 disabled:opacity-50">
          <Printer className="h-4 w-4" /> {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </button>
      </div>

      <div className="flex gap-2 border-b">
        {[{ key: 'financeiro', label: 'Financeiro' }, { key: 'produtividade', label: 'Produtividade' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-400'}`}>{t.label}</button>
        ))}
      </div>

      <div ref={reportRef} className="space-y-6">
        {tab === 'financeiro' && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <SummaryCard icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" title="Receita Total" value={formatCurrency(revenue)} sub={`${revenueReport?.totalTransactions || 0} transações`} />
              <SummaryCard icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Recebido" value={formatCurrency(paid)} valueColor="text-emerald-600" />
              <SummaryCard icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" title="A Receber" value={formatCurrency(pending)} valueColor="text-yellow-600" sub={`${pendingCount} pendência${pendingCount !== 1 ? 's' : ''}`} />
              <SummaryCard icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-600" title="Despesas" value={formatCurrency(expenses)} valueColor="text-red-600" />
              <SummaryCard icon={Percent} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Comissões" value={formatCurrency(commissions)} valueColor="text-indigo-600" />
              <SummaryCard icon={netProfit >= 0 ? TrendingUp : TrendingDown} iconBg={netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} iconColor={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} title="Lucro Líquido" value={formatCurrency(netProfit)} valueColor={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b px-6 py-4 dark:border-gray-700"><h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Composição Financeira</h3></div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { label: 'Receitas (Pago)', value: paid, color: 'bg-green-500', textColor: 'text-green-700' },
                    { label: 'A Receber (Pendente)', value: pending, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                    { label: 'Despesas (Pago)', value: expenses, color: 'bg-red-500', textColor: 'text-red-700' },
                    { label: 'Comissões Profissionais', value: commissions, color: 'bg-indigo-500', textColor: 'text-indigo-700' },
                  ].map((item) => {
                    const maxVal = Math.max(paid, pending, expenses, commissions, 1);
                    const pct = (item.value / maxVal) * 100;
                    return (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{item.label}</span>
                          <span className={`text-sm font-bold ${item.textColor}`}>{formatCurrency(item.value)}</span>
                        </div>
                        <div className="overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t pt-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Lucro Líquido (Receita - Despesas - Comissões)</span>
                      <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
                    </div>
                    {revenue > 0 && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Margem de Lucro</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{((netProfit / revenue) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5 text-blue-500" /> Ocupação e Agendamentos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Total Agendados</span><span className="font-semibold">{occupancyReport?.totalScheduled || 0}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Concluídos</span><span className="font-semibold text-green-600">{occupancyReport?.completed || 0}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Não Compareceu</span><span className="font-semibold text-red-600">{occupancyReport?.noShows || 0}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Cancelamentos</span><span className="font-semibold text-orange-600">{occupancyReport?.cancellations || 0}</span></div>
                  <div className="flex justify-between border-t pt-3 dark:border-gray-700"><span className="text-sm font-medium text-gray-700 dark:text-gray-400">Taxa de Ocupação</span><span className="text-lg font-bold text-dental-600">{(occupancyReport?.occupancyRate || 0).toFixed(1)}%</span></div>
                </div>
                {appointmentsReport?.byProfessional?.length > 0 && (
                  <div className="mt-4 border-t pt-4 dark:border-gray-700">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Por Profissional</p>
                    {appointmentsReport.byProfessional.map((p: any) => (
                      <div key={p.professionalId} className="flex justify-between py-1 text-sm"><span className="text-gray-500 dark:text-gray-400">{p.name}</span><span className="font-medium">{p.count} agend.</span></div>
                    ))}
                  </div>
                )}
              </div>

              {revenueReport?.byPaymentMethod?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><DollarSign className="h-5 w-5 text-green-500" /> Formas de Pagamento</h3>
                  <div className="space-y-3">
                    {revenueReport.byPaymentMethod.map((m: any) => {
                      const pct = paid > 0 ? (m.total / paid) * 100 : 0;
                      return (
                        <div key={m.method}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-400">{m.method || 'Não informado'}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(m.total)} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({m.count}x)</span></span>
                          </div>
                          <div className="overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-green-400" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {delinquencyReport && delinquencyReport.totalOverdueAmount > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-red-500" /> Inadimplência</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Total Inadimplente</span><span className="font-bold text-red-600">{formatCurrency(delinquencyReport.totalOverdueAmount || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Quantidade de Títulos</span><span className="font-semibold">{delinquencyReport.totalOverdueCount || 0}</span></div>
                  </div>
                  {delinquencyReport.overdueByAge && (
                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Por Faixa de Atraso</p>
                      {[{ key: 'upTo30Days', label: 'Até 30 dias', color: 'bg-yellow-400' }, { key: 'days31to60', label: '31-60 dias', color: 'bg-orange-400' }, { key: 'days61to90', label: '61-90 dias', color: 'bg-red-400' }, { key: 'over90Days', label: 'Mais de 90 dias', color: 'bg-red-700' }].map(({ key, label, color }) => {
                        const val = delinquencyReport.overdueByAge[key] || 0;
                        if (val === 0) return null;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-24 text-xs text-gray-500 dark:text-gray-400">{label}</span>
                            <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.min(100, (val / Math.max(delinquencyReport.totalOverdueAmount, 1)) * 100)}%` }} /></div>
                            <span className="w-28 text-right text-xs font-semibold text-red-600">{formatCurrency(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b px-6 py-4 dark:border-gray-700"><h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100"><Users className="h-5 w-5 text-purple-500" /> Desempenho por Profissional</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400"><th className="px-6 py-3">Profissional</th><th className="px-6 py-3">Especialidade</th><th className="px-6 py-3 text-right">Atendimentos</th><th className="px-6 py-3 text-right">Receita Gerada</th><th className="px-6 py-3 text-right">% do Total</th><th className="px-6 py-3 text-right">Comissão</th></tr></thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {professionalReport?.professionals?.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum dado no período</td></tr>}
                    {professionalReport?.professionals?.map((prof: any) => {
                      const pct = totalRevenueVal > 0 ? (prof.revenue / totalRevenueVal) * 100 : 0;
                      const commissionEntry = commissionsReport?.find?.((c: any) => c.id === prof.professionalId);
                      return (
                        <tr key={prof.professionalId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">{prof.name}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">{prof.specialty || '-'}</td>
                          <td className="px-6 py-3.5 text-right text-sm">{prof.completedAppointments}</td>
                          <td className="px-6 py-3.5 text-right text-sm font-medium text-green-600">{formatCurrency(prof.revenue)}</td>
                          <td className="px-6 py-3.5 text-right text-sm"><div className="flex items-center justify-end gap-2"><div className="w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-purple-400" style={{ width: `${pct}%` }} /></div><span className="w-12 text-right text-xs font-semibold text-purple-600">{pct.toFixed(1)}%</span></div></td>
                          <td className="px-6 py-3.5 text-right text-sm font-semibold text-indigo-600">{formatCurrency(commissionEntry?.commission || 0)}</td>
                        </tr>
                      );
                    })}
                    {professionalReport?.professionals?.length > 0 && (
                      <tr className="bg-gray-50 font-semibold dark:bg-gray-800">
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100" colSpan={2}>Total</td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{professionalReport.professionals.reduce((sum: number, p: any) => sum + p.completedAppointments, 0)}</td>
                        <td className="px-6 py-3 text-right text-sm text-green-700">{formatCurrency(totalRevenueVal)}</td>
                        <td className="px-6 py-3 text-right text-sm text-purple-700">100%</td>
                        <td className="px-6 py-3 text-right text-sm text-indigo-700">{formatCurrency(commissions)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {proceduresReport?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5 text-orange-500" /> Procedimentos Mais Realizados</h3>
                <div className="space-y-3">
                  {proceduresReport.map((p: any, i: number) => {
                    const maxCount = Math.max(...proceduresReport.map((x: any) => x.count), 1);
                    return (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between">
                          <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.procedure?.name || 'Não informado'}</p>{p.procedure?.code && <p className="text-xs text-gray-400 dark:text-gray-500">CDT: {p.procedure.code}</p>}</div>
                          <span className="text-sm font-bold text-orange-600">{p.count}x</span>
                        </div>
                        <div className="overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-orange-400" style={{ width: `${Math.min(100, (p.count / maxCount) * 100)}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'produtividade' && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productivity?.totals?.map((prof: any) => {
                const taxa = prof.attendanceRate || 0;
                return (
                  <div key={prof.professionalId} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{prof.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${taxa >= 80 ? 'bg-green-100 text-green-700' : taxa >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{taxa}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-blue-50 p-2"><p className="text-lg font-bold text-blue-700">{prof.scheduled}</p><p className="text-xs text-blue-500">Agendados</p></div>
                      <div className="rounded-lg bg-green-50 p-2"><p className="text-lg font-bold text-green-700">{prof.completed}</p><p className="text-xs text-green-500">Atendidos</p></div>
                      <div className="rounded-lg bg-red-50 p-2"><p className="text-lg font-bold text-red-700">{prof.noShow + prof.cancelled}</p><p className="text-xs text-red-500">Falhas</p></div>
                    </div>
                  </div>
                );
              })}
              {productivity?.totals?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Total Geral</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-blue-50 p-2"><p className="text-lg font-bold text-blue-700">{productivity.totals.reduce((s: number, p: any) => s + p.scheduled, 0)}</p><p className="text-xs text-blue-500">Agendados</p></div>
                    <div className="rounded-lg bg-green-50 p-2"><p className="text-lg font-bold text-green-700">{productivity.totals.reduce((s: number, p: any) => s + p.completed, 0)}</p><p className="text-xs text-green-500">Atendidos</p></div>
                    <div className="rounded-lg bg-red-50 p-2"><p className="text-lg font-bold text-red-700">{productivity.totals.reduce((s: number, p: any) => s + p.noShow + p.cancelled, 0)}</p><p className="text-xs text-red-500">Falhas</p></div>
                  </div>
                </div>
              )}
            </div>

            {productivity?.daily?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b px-6 py-4 dark:border-gray-700"><h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Detalhamento por Dia</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"><th className="px-4 py-3">Data</th><th className="px-4 py-3">Profissional</th><th className="px-4 py-3 text-center">Agendados</th><th className="px-4 py-3 text-center">Atendidos</th><th className="px-4 py-3 text-center">Não Compareceu</th><th className="px-4 py-3 text-center">Cancelados</th><th className="px-4 py-3 text-center">Aproveitamento</th></tr></thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {productivity.daily.map((day: any) =>
                        day.professionals.map((prof: any, i: number) => (
                          <tr key={`${day.date}-${prof.professionalId}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            {i === 0 && <td rowSpan={day.professionals.length} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 align-top">{new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>}
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">{prof.name}</td>
                            <td className="px-4 py-3 text-center text-sm">{prof.scheduled}</td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-green-600">{prof.completed}</td>
                            <td className="px-4 py-3 text-center text-sm text-red-500">{prof.noShow}</td>
                            <td className="px-4 py-3 text-center text-sm text-orange-500">{prof.cancelled}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${prof.scheduled > 0 && (prof.completed / prof.scheduled) >= 0.8 ? 'bg-green-100 text-green-700' : prof.scheduled > 0 && (prof.completed / prof.scheduled) >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {prof.scheduled > 0 ? Math.round((prof.completed / prof.scheduled) * 100) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!productivity?.daily || productivity.daily.length === 0) && (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum dado no período</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Selecione um período com agendamentos para ver a produtividade</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}