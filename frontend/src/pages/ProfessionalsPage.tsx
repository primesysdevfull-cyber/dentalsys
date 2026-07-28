import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { Plus, Search, UserCog, X, Trash2, Edit, Percent, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  croNumber?: string;
  specialty?: string;
  color?: string;
  commissionRate: number;
  isActive: boolean;
  _count?: { appointments: number };
  user?: { id: string; email: string; role: string; phone?: string; maxAppointmentsPerDay?: number };
}

interface CommissionEntry {
  date?: string;
  month?: string;
  revenue: number;
  commission: number;
  transactions: number;
}

interface CommissionSummary {
  id: string;
  name: string;
  specialty?: string;
  commissionRate: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  commission: number;
  daily: CommissionEntry[];
  monthly: CommissionEntry[];
}

export function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [tab, setTab] = useState<'list' | 'commissions'>('list');
  const [expandedPro, setExpandedPro] = useState<string | null>(null);
  const [commPeriod, setCommPeriod] = useState<'all' | 'monthly' | 'daily'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    name: '', croNumber: '', specialty: '', color: '#3B82F6',
    commissionRate: '0', isActive: true,
    email: '', phone: '', maxAppointmentsPerDay: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['professionals', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return api.get(`/professionals?${params}`).then((r) => r.data);
    },
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['commissions', startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      return api.get(`/professionals/commissions?${params}`).then((r) => r.data);
    },
    enabled: tab === 'commissions',
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/professionals', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['professionals'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/professionals/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['professionals'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/professionals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });

  function openCreate() {
    setEditingPro(null);
    setFormData({ name: '', croNumber: '', specialty: '', color: '#3B82F6', commissionRate: '0', isActive: true, email: '', phone: '', maxAppointmentsPerDay: '' });
    setShowModal(true);
  }

  function openEdit(pro: Professional) {
    setEditingPro(pro);
    setFormData({
      name: pro.name, croNumber: pro.croNumber || '', specialty: pro.specialty || '',
      color: pro.color || '#3B82F6', commissionRate: String(pro.commissionRate), isActive: pro.isActive,
      email: pro.user?.email || '', phone: pro.user?.phone || '',
      maxAppointmentsPerDay: pro.user?.maxAppointmentsPerDay ? String(pro.user.maxAppointmentsPerDay) : '',
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingPro(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData, commissionRate: Number(formData.commissionRate) };
    if (editingPro) updateMutation.mutate({ id: editingPro.id, ...payload });
    else createMutation.mutate(payload);
  }

  function setPeriodQuick(monthsAgo: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }

  function clearPeriod() {
    setStartDate('');
    setEndDate('');
  }

  const professionals: Professional[] = data?.data || [];
  const commissionData: CommissionSummary[] = commissions || [];

  const grandTotalRevenue = commissionData.reduce((s, c) => s + c.totalRevenue, 0);
  const grandTotalCommission = commissionData.reduce((s, c) => s + c.commission, 0);
  const grandTotalTransactions = commissionData.reduce((s, c) => s + c.completedAppointments, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500">Gestão de profissionais e comissões</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" /> Novo Profissional
        </button>
      </div>

      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        <button onClick={() => setTab('list')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'list' ? 'bg-white text-dental-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Profissionais
        </button>
        <button onClick={() => setTab('commissions')} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'commissions' ? 'bg-white text-dental-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Comissões e Ganhos
        </button>
      </div>

      {tab === 'list' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar profissional..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Profissional</th>
                    <th className="px-6 py-3">CRO</th>
                    <th className="px-6 py-3">Especialidade</th>
                    <th className="px-6 py-3">Comissão</th>
                    <th className="px-6 py-3">Agendamentos</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">Carregando...</td></tr>
                  ) : professionals.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">Nenhum profissional encontrado</td></tr>
                  ) : (
                    professionals.map((pro) => (
                      <tr key={pro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: pro.color || '#3B82F6' }}>
                              {pro.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{pro.name}</p>
                              {pro.user?.email && <p className="text-xs text-gray-500">{pro.user.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{pro.croNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{pro.specialty || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                            <Percent className="h-3.5 w-3.5 text-gray-400" />
                            {pro.commissionRate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {pro._count?.appointments || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${pro.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {pro.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(pro)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-dental-600"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => { if (window.confirm('Remover este profissional?')) deleteMutation.mutate(pro.id); }} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'commissions' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Filtrar por período:</span>
              <div className="flex gap-2">
                <button onClick={clearPeriod} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!startDate && !endDate ? 'bg-dental-100 text-dental-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                  Tudo
                </button>
                <button onClick={() => setPeriodQuick(0)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${startDate && endDate ? 'bg-dental-100 text-dental-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                  Este mês
                </button>
                <button onClick={() => setPeriodQuick(1)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                  Último mês
                </button>
                <button onClick={() => setPeriodQuick(3)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                  Últimos 3 meses
                </button>
                <button onClick={() => setPeriodQuick(6)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                  Últimos 6 meses
                </button>
                <button onClick={() => setPeriodQuick(12)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                  Último ano
                </button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                <span className="text-gray-400">até</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Receita Total (Pago)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(grandTotalRevenue)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total de Comissões</p>
              <p className="text-2xl font-bold text-dental-700">{formatCurrency(grandTotalCommission)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Atendimentos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{grandTotalTransactions}</p>
            </div>
          </div>

          {commissionsLoading ? (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400">Carregando...</div>
          ) : commissionData.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400">Nenhum dado de comissão disponível</div>
          ) : (
            <div className="space-y-3">
              {commissionData.map((pro) => (
                <div key={pro.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedPro(expandedPro === pro.id ? null : pro.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dental-100 text-sm font-bold text-dental-700">
                        {pro.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{pro.name}</p>
                        <p className="text-xs text-gray-500">{pro.specialty || 'Geral'} • {pro.commissionRate}% comissão</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Receita</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(pro.totalRevenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Comissão</p>
                        <p className="text-sm font-bold text-dental-700">{formatCurrency(pro.commission)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Atendimentos</p>
                        <p className="text-sm font-semibold text-gray-900">{pro.completedAppointments}/{pro.totalAppointments}</p>
                      </div>
                      {expandedPro === pro.id ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    </div>
                  </button>

                  {expandedPro === pro.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="mb-3 flex gap-2">
                        <button onClick={() => setCommPeriod('monthly')} className={`rounded-lg px-3 py-1 text-xs font-medium ${commPeriod === 'monthly' ? 'bg-white text-dental-700 shadow-sm border' : 'text-gray-500 hover:bg-gray-100'}`}>
                          Mensal
                        </button>
                        <button onClick={() => setCommPeriod('daily')} className={`rounded-lg px-3 py-1 text-xs font-medium ${commPeriod === 'daily' ? 'bg-white text-dental-700 shadow-sm border' : 'text-gray-500 hover:bg-gray-100'}`}>
                          Diário
                        </button>
                      </div>

                      {commPeriod === 'monthly' && pro.monthly.length > 0 && (
                        <div className="rounded-lg border bg-white">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                                <th className="px-4 py-2">Mês</th>
                                <th className="px-4 py-2">Atendimentos</th>
                                <th className="px-4 py-2">Receita</th>
                                <th className="px-4 py-2">Comissão</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {pro.monthly.map((entry) => (
                                <tr key={entry.month} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {new Date(entry.month + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{entry.transactions}</td>
                                  <td className="px-4 py-2 text-sm font-semibold text-green-600">{formatCurrency(entry.revenue)}</td>
                                  <td className="px-4 py-2 text-sm font-bold text-dental-700">{formatCurrency(entry.commission)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {commPeriod === 'daily' && pro.daily.length > 0 && (
                        <div className="max-h-64 overflow-y-auto rounded-lg border bg-white">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-white">
                              <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                                <th className="px-4 py-2">Data</th>
                                <th className="px-4 py-2">Atendimentos</th>
                                <th className="px-4 py-2">Receita</th>
                                <th className="px-4 py-2">Comissão</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {pro.daily.map((entry) => (
                                <tr key={entry.date} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{entry.transactions}</td>
                                  <td className="px-4 py-2 text-sm font-semibold text-green-600">{formatCurrency(entry.revenue)}</td>
                                  <td className="px-4 py-2 text-sm font-bold text-dental-700">{formatCurrency(entry.commission)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {((commPeriod === 'monthly' && pro.monthly.length === 0) || (commPeriod === 'daily' && pro.daily.length === 0)) && (
                        <p className="py-4 text-center text-sm text-gray-400">Nenhum pagamento registrado neste período</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editingPro ? 'Editar Profissional' : 'Novo Profissional'}</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nome *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CRO</label>
                  <input type="text" value={formData.croNumber} onChange={(e) => setFormData({ ...formData, croNumber: e.target.value })} placeholder="CRO-SP 12345" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                  <input type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="profissional@email.com" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comissão (%)</label>
                  <input type="number" step="0.01" min="0" max="100" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Máx. Pacientes/Dia</label>
                  <input type="number" min="1" value={formData.maxAppointmentsPerDay} onChange={(e) => setFormData({ ...formData, maxAppointmentsPerDay: e.target.value })} placeholder="10" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cor</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-dental-600 focus:ring-dental-500" />
                Ativo
              </label>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {editingPro ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
