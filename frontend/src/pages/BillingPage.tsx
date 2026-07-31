import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../utils';
import { Plus, DollarSign, TrendingUp, AlertTriangle, Clock, X, MessageCircle, Edit, Trash2, CheckCircle2, FileText } from 'lucide-react';

export function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [payMethod, setPayMethod] = useState('');
  const [payProfessionalId, setPayProfessionalId] = useState('');

  const [formData, setFormData] = useState({
    type: 'INCOME', description: '', amount: '', patientId: '', professionalId: '', paymentMethod: '',
    dueDate: '', category: '', notes: '', totalInstallments: '1',
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-billing'],
    queryFn: () => api.get('/patients?limit=500').then((r) => r.data),
    enabled: showModal,
  });

  const { data: professionalsData } = useQuery({
    queryKey: ['professionals-billing'],
    queryFn: () => api.get('/professionals?limit=500').then((r) => r.data),
    enabled: showModal || showPayModal,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['billing-dashboard'],
    queryFn: () => api.get('/billing/dashboard').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/billing?${params}`).then((r) => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/billing', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao criar transação'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/billing/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar transação'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/billing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard'] });
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao excluir transação'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, paymentMethod, professionalId }: { id: string; paymentMethod?: string; professionalId?: string }) =>
      api.patch(`/billing/${id}/pay`, { paymentMethod, professionalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard'] });
      setShowPayModal(false);
      setPayTarget(null);
      setPayMethod('');
      setPayProfessionalId('');
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao confirmar recebimento'),
  });

  const nfeMutation = useMutation({
    mutationFn: (transactionId: string) => api.post('/nfe/emitir', { transactionId }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (data?.nfeNumber) {
        alert(`NF-e emitida com sucesso! Número: ${data.nfeNumber}`);
      } else {
        alert('NF-e emitida com sucesso!');
      }
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao emitir NF-e'),
  });

  function openPay(tx: any) {
    setPayTarget(tx);
    setPayMethod(tx.paymentMethod || '');
    setPayProfessionalId(tx.professionalId || '');
    setShowPayModal(true);
  }

  function emitirNfe(tx: any) {
    if (window.confirm(`Emitir NF-e para "${tx.description}" - ${formatCurrency(tx.totalAmount)}?`)) {
      nfeMutation.mutate(tx.id);
    }
  }

  function handlePayConfirm() {
    if (payTarget) {
      payMutation.mutate({
        id: payTarget.id,
        paymentMethod: payMethod || undefined,
        professionalId: payProfessionalId || undefined,
      });
    }
  }

  function openCreate() {
    setEditingTx(null);
    setFormData({ type: 'INCOME', description: '', amount: '', patientId: '', professionalId: '', paymentMethod: '', dueDate: '', category: '', notes: '', totalInstallments: '1' });
    setShowModal(true);
  }

  function openEdit(tx: any) {
    setEditingTx(tx);
    setFormData({
      type: tx.type || 'INCOME',
      description: tx.description || '',
      amount: String(tx.amount || ''),
      patientId: tx.patientId || '',
      professionalId: tx.professionalId || '',
      paymentMethod: tx.paymentMethod || '',
      dueDate: tx.dueDate ? tx.dueDate.split('T')[0] : '',
      category: tx.category || '',
      notes: tx.notes || '',
      totalInstallments: tx.installments?.length > 1 ? String(tx.installments.length) : '1',
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingTx(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      type: formData.type,
      description: formData.description,
      amount: Number(formData.amount),
    };
    if (formData.patientId) payload.patientId = formData.patientId;
    if (formData.professionalId) payload.professionalId = formData.professionalId;
    if (formData.paymentMethod) payload.paymentMethod = formData.paymentMethod;
    if (formData.dueDate) payload.dueDate = formData.dueDate;
    if (formData.category) payload.category = formData.category;
    if (formData.notes) payload.notes = formData.notes;
    const installments = Number(formData.totalInstallments);
    if (installments > 1) payload.totalInstallments = installments;

    if (editingTx) {
      updateMutation.mutate({ id: editingTx.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financeiro</h1>
          <p className="text-gray-500 dark:text-gray-400">Controle financeiro da clínica</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receitas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.revenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.expenses || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comissões</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.commissions || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">A Receber</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.pendingAmount || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Inadimplência</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.overdueAmount || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lucro Líquido</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboard?.netProfit || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {['', 'INCOME', 'EXPENSE'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                typeFilter === t ? 'bg-dental-100 text-dental-700 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t === '' ? 'Todos' : t === 'INCOME' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', 'PENDING', 'PAID', 'OVERDUE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                statusFilter === s ? 'bg-dental-100 text-dental-700 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s === '' ? 'Todos Status' : getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Profissional</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Pagamento</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                data?.data?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          {tx.category && ` • ${tx.category}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {tx.patient?.name || '-'}
                      {tx.patient && (tx.patient.whatsapp || tx.patient.phone) && (
                        <a
                          href={`https://wa.me/${(tx.patient.whatsapp || tx.patient.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-flex items-center text-green-600 hover:text-green-700"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {tx.professional?.name || <span className="text-gray-300 dark:text-gray-500">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(tx.totalAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {tx.dueDate ? formatDate(tx.dueDate) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {tx.paymentMethod === 'CREDIT_CARD' && tx.installments?.length > 1 ? (
                        <span>
                          {tx.paymentMethod}{' '}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {tx.installments.filter((i: any) => i.status === 'PAID').length}/{tx.installments.length}x
                          </span>
                        </span>
                      ) : (
                        tx.paymentMethod || '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(tx.status === 'PENDING' || tx.status === 'OVERDUE') && (
                          <button onClick={() => openPay(tx)} className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700" title="Confirmar recebimento">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Receber
                          </button>
                        )}
                        {tx.status === 'PAID' && (
                          <button onClick={() => emitirNfe(tx)} className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700" title="Emitir NF-e">
                            <FileText className="h-3.5 w-3.5" />
                            NF-e
                          </button>
                        )}
                        <button onClick={() => openEdit(tx)} className="flex items-center gap-1 text-sm font-medium text-dental-600 hover:text-dental-700">
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => { if (window.confirm('Tem certeza que deseja excluir esta transação?')) deleteMutation.mutate(tx.id); }} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Despesas por Categoria */}
      {data?.data && data.data.filter((t: any) => t.type === 'EXPENSE').length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Despesas por Categoria</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(
              data.data
                .filter((t: any) => t.type === 'EXPENSE' && t.status === 'PAID')
                .reduce((acc: Record<string, number>, t: any) => {
                  const cat = t.category || 'Outras';
                  acc[cat] = (acc[cat] || 0) + Number(t.totalAmount);
                  return acc;
                }, {})
            ).map(([cat, total]) => (
              <div key={cat} className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-xs text-red-500">{cat}</p>
                <p className="mt-1 text-lg font-bold text-red-700">{formatCurrency(total as number)}</p>
              </div>
            ))}
            <div className="rounded-lg border border-red-200 bg-red-100 p-3">
              <p className="text-xs text-red-600 font-medium">Total Despesas Pagas</p>
              <p className="mt-1 text-lg font-bold text-red-800">
                {formatCurrency(
                  data.data
                    .filter((t: any) => t.type === 'EXPENSE' && t.status === 'PAID')
                    .reduce((acc: number, t: any) => acc + Number(t.totalAmount), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingTx ? 'Editar Transação' : 'Nova Transação'}</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Tipo *</label>
                  <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Categoria</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Consulta, Aluguel" className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Descrição *</label>
                <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Paciente</label>
                <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                  <option value="">Nenhum (pagamento avulso)</option>
                  {patientsData?.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Profissional Responsável</label>
                <select value={formData.professionalId} onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                  <option value="">Nenhum</option>
                  {professionalsData?.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` - ${p.specialty}` : ''}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Necessário para cálculo de comissões</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Valor (R$) *</label>
                  <input type="number" required step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Data Vencimento</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Forma de Pagamento</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value, totalInstallments: e.target.value === 'CREDIT_CARD' ? formData.totalInstallments : '1' })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                  <option value="">Selecionar...</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="BANK_TRANSFER">Transferência Bancária</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="INSURANCE">Convênio</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              {formData.paymentMethod === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Parcelas</label>
                  <select value={formData.totalInstallments} onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x {formData.amount ? `de ${formatCurrency(Number(formData.amount) / n)}` : ''}
                        {n === 1 ? ' (à vista)' : ''}
                      </option>
                    ))}
                  </select>
                  {Number(formData.totalInstallments) > 1 && formData.amount && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Total: {formatCurrency(Number(formData.amount))} em {formData.totalInstallments}x de {formatCurrency(Number(formData.amount) / Number(formData.totalInstallments))}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingTx ? 'Salvar' : 'Criar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPayModal && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmar Recebimento</h2>
              <button onClick={() => { setShowPayModal(false); setPayTarget(null); setPayMethod(''); }} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Transação</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{payTarget.description}</p>
                <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(Number(payTarget.totalAmount))}</p>
                {payTarget.patient?.name && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paciente: {payTarget.patient.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Forma de Pagamento</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                  <option value="">Manter atual</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="BANK_TRANSFER">Transferência Bancária</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="INSURANCE">Convênio</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Profissional Responsável</label>
                <select value={payProfessionalId} onChange={(e) => setPayProfessionalId(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary">
                  <option value="">Nenhum</option>
                  {professionalsData?.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` - ${p.specialty}` : ''}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Necessário para cálculo de comissão</p>
              </div>
              <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                <button onClick={() => { setShowPayModal(false); setPayTarget(null); setPayMethod(''); }} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button onClick={handlePayConfirm} disabled={payMutation.isPending} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {payMutation.isPending ? 'Confirmando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
