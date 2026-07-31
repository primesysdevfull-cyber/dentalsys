import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Search, Filter, CheckCircle, XCircle, Loader2, Eye, Ban, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface Professional {
  id: string;
  name: string;
  color: string;
}

interface Commission {
  id: string;
  professional: Professional;
  description: string;
  amount: number;
  rate: number;
  commissionAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt: string | null;
  createdAt: string;
  transaction?: { id: string; description: string; totalAmount: number };
}

interface Summary {
  pendingAmount: number;
  pendingCount: number;
  paidAmount: number;
  paidCount: number;
  cancelledAmount: number;
  cancelledCount: number;
}

export function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [summary, setSummary] = useState<Summary>({ pendingAmount: 0, pendingCount: 0, paidAmount: 0, paidCount: 0, cancelledAmount: 0, cancelledCount: 0 });
  const [loading, setLoading] = useState(true);
  const [professionalFilter, setProfessionalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (professionalFilter) params.set('professionalId', professionalFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/commissions?${params}`);
      setCommissions(data.data);
      setSummary(data.summary);
    } catch {
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  }, [professionalFilter, statusFilter, search]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  useEffect(() => {
    api.get('/professionals').then(({ data }) => setProfessionals(data.data || [])).catch(() => {});
  }, []);

  async function handlePay(id: string) {
    try {
      await api.put(`/commissions/${id}/pay`, {});
      toast.success('Comissão paga');
      fetchCommissions();
    } catch { toast.error('Erro ao pagar comissão'); }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancelar esta comissão?')) return;
    try {
      await api.put(`/commissions/${id}/cancel`, {});
      toast.success('Comissão cancelada');
      fetchCommissions();
    } catch { toast.error('Erro ao cancelar'); }
  }

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comissões</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerenciar comissões dos profissionais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning-50 dark:bg-warning-900/20 p-2.5"><DollarSign className="h-5 w-5 text-warning-500" /></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">A Pagar</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(summary.pendingAmount)}</p><p className="text-xs text-gray-400">{summary.pendingCount} comissões</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success-50 dark:bg-success-900/20 p-2.5"><CheckCircle className="h-5 w-5 text-success-500" /></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Pago</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(summary.paidAmount)}</p><p className="text-xs text-gray-400">{summary.paidCount} comissões</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5"><Percent className="h-5 w-5 text-gray-500" /></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Total</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{fmt(summary.pendingAmount + summary.paidAmount)}</p><p className="text-xs text-gray-400">{summary.pendingCount + summary.paidCount} comissões</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Buscar por descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={professionalFilter} onChange={(e) => setProfessionalFilter(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">Todos os profissionais</option>
          {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">Todos os status</option>
          <option value="PENDING">A Pagar</option>
          <option value="PAID">Pago</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Profissional</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Taxa</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Comissão</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Data</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
              ) : commissions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">Nenhuma comissão encontrada</td></tr>
              ) : commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: c.professional.color || '#3B82F6' }}>{c.professional.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.professional.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{c.description}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{fmt(Number(c.amount))}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{Number(c.rate)}%</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">{fmt(Number(c.commissionAmount))}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === 'PAID' ? 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' :
                      c.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                      'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400'
                    }`}>
                      {c.status === 'PAID' ? <CheckCircle className="h-3 w-3" /> : c.status === 'CANCELLED' ? <XCircle className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {c.status === 'PAID' ? 'Pago' : c.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.status === 'PENDING' && (
                        <>
                          <button onClick={() => handlePay(c.id)} className="rounded-lg p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20" title="Pagar"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => handleCancel(c.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Cancelar"><Ban className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
