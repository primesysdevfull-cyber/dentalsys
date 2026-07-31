import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Lock, Unlock, Calendar, Search, Loader2, FileText, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface PeriodSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
  pendingBalance: number;
  transactionCount: number;
  transactions: any[];
}

interface DailyRow {
  date: string;
  income: number;
  expense: number;
  balance: number;
  transactions: number;
  closed: boolean;
}

export function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [closeDate, setCloseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [showClosures, setShowClosures] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const [sumRes, dailyRes] = await Promise.all([
        api.get(`/cash-flow/summary?${params}`),
        api.get(`/cash-flow/daily?${params}`),
      ]);
      setSummary(sumRes.data);
      setDaily(dailyRes.data);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleClose() {
    setClosing(true);
    try {
      await api.post('/cash-flow/close', { closureDate: closeDate, notes: closeNotes || undefined });
      toast.success('Dia fechado com sucesso');
      setCloseNotes('');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao fechar dia');
    } finally {
      setClosing(false);
    }
  }

  async function loadClosures() {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const { data } = await api.get(`/cash-flow/closures?${params}`);
      setClosures(data);
      setShowClosures(!showClosures);
    } catch {
      toast.error('Erro ao carregar fechamentos');
    }
  }

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const todayKey = new Date().toISOString().split('T')[0];
  const today = daily.find(d => d.date === todayKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fluxo de Caixa</h1>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe entradas, saídas e fechamento diário</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">De</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Até</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button onClick={loadClosures} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
          <FileText className="h-4 w-4" /> {showClosures ? 'Ocultar' : 'Histórico'} de Fechamentos
        </button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success-50 dark:bg-success-900/20 p-2.5"><TrendingUp className="h-5 w-5 text-success-500" /></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Entradas (pagas)</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(summary.totalIncome)}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5"><TrendingDown className="h-5 w-5 text-red-500" /></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Saídas (pagas)</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(summary.totalExpense)}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${summary.balance >= 0 ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}><DollarSign className={`h-5 w-5 ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`} /></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Saldo do Período</p><p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>{fmt(summary.balance)}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning-50 dark:bg-warning-900/20 p-2.5"><Calendar className="h-5 w-5 text-warning-500" /></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Transações</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.transactionCount}</p><p className="text-xs text-gray-400">{summary.pendingIncome > 0 || summary.pendingExpense > 0 ? `${fmt(summary.pendingIncome)} pendentes` : ''}</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resumo Diário</h3>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Data</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Entradas</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Saídas</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Saldo</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                    ) : daily.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">Nenhum dado no período</td></tr>
                    ) : daily.slice().reverse().map((row) => (
                      <tr key={row.date} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${row.date === todayKey ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                        <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-success-600 dark:text-success-400">{row.income > 0 ? fmt(row.income) : '-'}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-red-600 dark:text-red-400">{row.expense > 0 ? fmt(row.expense) : '-'}</td>
                        <td className={`px-4 py-2.5 text-sm text-right font-medium ${row.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>{fmt(row.balance)}</td>
                        <td className="px-4 py-2.5 text-center">
                          {row.closed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 dark:bg-success-900/20 px-2 py-0.5 text-xs font-medium text-success-600 dark:text-success-400"><Lock className="h-3 w-3" /> Fechado</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400"><Unlock className="h-3 w-3" /> Aberto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><Lock className="h-4 w-4 text-primary" /> Fechamento Diário</h3>
                <div className="space-y-3">
                  {today && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-1">
                      <p className="text-gray-500 dark:text-gray-400">Hoje ({new Date().toLocaleDateString('pt-BR')})</p>
                      <p className="text-success-600 dark:text-success-400">Entradas: {fmt(today.income)}</p>
                      <p className="text-red-600 dark:text-red-400">Saídas: {fmt(today.expense)}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Saldo: {fmt(today.balance)}</p>
                      {today.closed && <p className="text-success-600 dark:text-success-400 font-medium mt-1">✓ Dia já fechado</p>}
                    </div>
                  )}
                  {(!today || !today.closed) && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data</label>
                        <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Observações</label>
                        <textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Obs. opcionais..." />
                      </div>
                      <button onClick={handleClose} disabled={closing} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                        {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Fechar Dia
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showClosures && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Fechamentos Recentes</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {closures.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum fechamento</p>
                    ) : closures.map((c: any) => (
                      <div key={c.id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-2.5 text-xs space-y-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(c.closureDate).toLocaleDateString('pt-BR')}</p>
                        <p className="text-success-600">Entradas: {fmt(Number(c.totalIncome))}</p>
                        <p className="text-red-600">Saídas: {fmt(Number(c.totalExpense))}</p>
                        <p className="text-gray-700 dark:text-gray-300">Saldo: {fmt(Number(c.balance))}</p>
                        <p className="text-gray-400">{c.transactionCount} transações</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Transações Pendentes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">A receber</span>
                    <span className="text-success-600 dark:text-success-400 font-medium">{fmt(summary.pendingIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">A pagar</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{fmt(summary.pendingExpense)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Saldo previsto</span>
                    <span className={summary.pendingBalance >= 0 ? 'text-success-600' : 'text-red-600'}>{fmt(summary.pendingBalance)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
