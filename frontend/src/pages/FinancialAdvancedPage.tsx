import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar } from 'lucide-react';

type Period = 'thisMonth' | 'lastMonth' | 'quarter' | 'year' | 'custom';

function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const end = now.toISOString().split('T')[0];

  switch (period) {
    case 'thisMonth': {
      const start = new Date(y, m, 1).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case 'lastMonth': {
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
      return { startDate: start, endDate: lastDay };
    }
    case 'quarter': {
      const qStart = new Date(y, Math.floor(m / 3) * 3, 1).toISOString().split('T')[0];
      return { startDate: qStart, endDate: end };
    }
    case 'year': {
      return { startDate: `${y}-01-01`, endDate: end };
    }
    default:
      return { startDate: new Date(y, m, 1).toISOString().split('T')[0], endDate: end };
  }
}

export function FinancialAdvancedPage() {
  const [tab, setTab] = useState<'dre' | 'cashflow'>('dre');
  const [drePeriod, setDrePeriod] = useState<Period>('thisMonth');
  const [cfPeriod, setCfPeriod] = useState<Period>('thisMonth');
  const [dreStartDate, setDreStartDate] = useState('');
  const [dreEndDate, setDreEndDate] = useState('');
  const [cfStartDate, setCfStartDate] = useState('');
  const [cfEndDate, setCfEndDate] = useState('');

  const dreParams = drePeriod === 'custom'
    ? { startDate: dreStartDate, endDate: dreEndDate }
    : getPeriodDates(drePeriod);

  const cfParams = cfPeriod === 'custom'
    ? { startDate: cfStartDate, endDate: cfEndDate }
    : getPeriodDates(cfPeriod);

  const { data: dreData, isLoading: dreLoading } = useQuery({
    queryKey: ['dre', dreParams.startDate, dreParams.endDate],
    queryFn: () => api.get('/billing/dre', { params: dreParams }).then((r) => r.data),
  });

  const { data: cfData, isLoading: cfLoading } = useQuery({
    queryKey: ['cash-flow', cfParams.startDate, cfParams.endDate],
    queryFn: () => api.get('/billing/cash-flow', { params: cfParams }).then((r) => r.data),
  });

  const periodOptions: { value: Period; label: string }[] = [
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  function renderPeriodSelector(period: Period, onChange: (p: Period) => void, customStart: string, customEnd: string, onStartChange: (v: string) => void, onEndChange: (v: string) => void) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border bg-white p-0.5 shadow-sm">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === opt.value ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => onStartChange(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={customEnd} onChange={(e) => onEndChange(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none" />
          </div>
        )}
      </div>
    );
  }

  const summaryCards = dreData ? [
    { label: 'Receita Bruta', value: dreData.revenue?.total, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
    { label: 'Deduções (Comissões)', value: dreData.deductions?.commissions ?? 0, color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
    { label: 'Despesas', value: dreData.expenses?.total, color: 'text-red-600', bg: 'bg-red-50', icon: DollarSign },
    { label: 'Resultado Operacional', value: dreData.netOperating, color: (dreData.netOperating ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-blue-50', icon: PieChart },
    { label: 'Lucro Líquido', value: dreData.netProfit, color: dreData.netProfit >= 0 ? 'text-teal-600' : 'text-red-600', bg: 'bg-teal-50', icon: Calendar },
  ] : [];

  const barComparison = dreData ? [
    { name: 'Receitas', value: dreData.revenue?.total ?? 0, fill: '#16a34a' },
    { name: 'Despesas', value: (dreData.expenses?.total ?? 0) + (dreData.deductions?.commissions ?? 0), fill: '#dc2626' },
    { name: 'Resultado', value: dreData.netProfit, fill: dreData.netProfit >= 0 ? '#0d9488' : '#dc2626' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro Avançado</h1>
          <p className="text-gray-500">Análise detalhada de resultados</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab('dre')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'dre' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          DRE
        </button>
        <button
          onClick={() => setTab('cashflow')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'cashflow' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fluxo de Caixa
        </button>
      </div>

      {tab === 'dre' && (
        <div className="space-y-6">
          {renderPeriodSelector(drePeriod, setDrePeriod, dreStartDate, dreEndDate, setDreStartDate, setDreEndDate)}

          {dreLoading ? (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Carregando DRE...
            </div>
          ) : dreData ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${card.bg} p-2`}>
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{card.label}</p>
                          <p className={`text-lg font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">Receitas por Categoria</h3>
                  <div className="space-y-3">
                    {dreData.revenue?.byCategory?.length === 0 && (
                      <p className="text-sm text-gray-400">Nenhuma receita no período.</p>
                    )}
                    {dreData.revenue?.byCategory?.map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                    {dreData.revenue?.byCategory?.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                        <span className="text-sm font-bold text-gray-800">Total</span>
                        <span className="text-sm font-bold text-green-700">{formatCurrency(dreData.revenue.total)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">Despesas por Categoria</h3>
                  <div className="space-y-3">
                    {dreData.expenses?.byCategory?.length === 0 && (
                      <p className="text-sm text-gray-400">Nenhuma despesa no período.</p>
                    )}
                    {dreData.expenses?.byCategory?.map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                    {dreData.expenses?.byCategory?.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                        <span className="text-sm font-bold text-gray-800">Total</span>
                        <span className="text-sm font-bold text-red-700">{formatCurrency(dreData.expenses.total + (dreData.deductions?.commissions ?? 0))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Receitas vs Despesas vs Resultado</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barComparison} barSize={80}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      <Legend />
                      <Bar dataKey="value" name="Valor" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Erro ao carregar DRE. Tente novamente.
            </div>
          )}
        </div>
      )}

      {tab === 'cashflow' && (
        <div className="space-y-6">
          {renderPeriodSelector(cfPeriod, setCfPeriod, cfStartDate, cfEndDate, setCfStartDate, setCfEndDate)}

          {cfLoading ? (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Carregando fluxo de caixa...
            </div>
          ) : cfData ? (
            <>
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Fluxo de Caixa Mensal</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cfData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      <Legend />
                      <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" name="Despesas" fill="#dc2626" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                        <th className="px-6 py-3">Mês</th>
                        <th className="px-6 py-3">Receitas</th>
                        <th className="px-6 py-3">Despesas</th>
                        <th className="px-6 py-3">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cfData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                            Nenhum dado no período.
                          </td>
                        </tr>
                      ) : (
                        cfData.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.month}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(row.income)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-red-600">{formatCurrency(row.expense)}</td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              <span className={row.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(row.balance)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Erro ao carregar fluxo de caixa. Tente novamente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
