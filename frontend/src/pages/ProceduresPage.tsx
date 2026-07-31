import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { Plus, Search, Clock, DollarSign, Tag, X, Trash2, Edit } from 'lucide-react';

interface Procedure {
  id: string;
  code?: string;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  insurancePrice?: number;
  durationMinutes: number;
  isActive: boolean;
  requiresAuthorization: boolean;
}

const PROCEDURE_CATEGORIES = [
  'Consulta', 'Diagnóstico', 'Prevenção', 'Restauradora', 'Endodontia',
  'Cirurgia', 'Implantodontia', 'Prótese', 'Ortodontia', 'Estética',
];

export function ProceduresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    defaultPrice: '',
    insurancePrice: '',
    durationMinutes: '30',
    isActive: true,
    requiresAuthorization: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['procedures', search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      return api.get(`/procedures?${params}`).then((r) => r.data);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['procedure-stats'],
    queryFn: () => api.get('/procedures/stats').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/procedures', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-stats'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao criar procedimento'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/procedures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-stats'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar procedimento'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/procedures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure-stats'] });
    },
  });

  function openCreate() {
    setEditingProcedure(null);
    setFormData({
      code: '', name: '', description: '', category: '',
      defaultPrice: '', insurancePrice: '', durationMinutes: '30',
      isActive: true, requiresAuthorization: false,
    });
    setShowModal(true);
  }

  function openEdit(proc: Procedure) {
    setEditingProcedure(proc);
    setFormData({
      code: proc.code || '',
      name: proc.name,
      description: proc.description || '',
      category: proc.category || '',
      defaultPrice: String(proc.defaultPrice),
      insurancePrice: proc.insurancePrice ? String(proc.insurancePrice) : '',
      durationMinutes: String(proc.durationMinutes),
      isActive: proc.isActive,
      requiresAuthorization: proc.requiresAuthorization,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProcedure(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...formData,
      code: formData.code || undefined,
      description: formData.description || undefined,
      category: formData.category || undefined,
      defaultPrice: Number(formData.defaultPrice),
      insurancePrice: formData.insurancePrice ? Number(formData.insurancePrice) : undefined,
      durationMinutes: Number(formData.durationMinutes),
    };

    if (editingProcedure) {
      updateMutation.mutate({ id: editingProcedure.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const procedures: Procedure[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Procedimentos</h1>
          <p className="text-gray-500 dark:text-gray-400">Catálogo de procedimentos odontológicos (CDT)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Novo Procedimento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Categorias</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.byCategory?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Preço Médio</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.byCategory?.length
              ? formatCurrency(
                  stats.byCategory.reduce((sum: number, c: any) => sum + c.avgPrice, 0) / stats.byCategory.length
                )
              : formatCurrency(0)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
        >
          <option value="">Todas as categorias</option>
          {PROCEDURE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Preço</th>
                <th className="px-6 py-3">Duração</th>
                <th className="px-6 py-3">Convênio</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : procedures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum procedimento encontrado
                  </td>
                </tr>
              ) : (
                procedures.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {proc.code || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{proc.name}</div>
                      {proc.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{proc.description}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {proc.category ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {proc.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(proc.defaultPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        {proc.durationMinutes} min
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {proc.insurancePrice ? formatCurrency(proc.insurancePrice) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${proc.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {proc.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(proc)} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-dental-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => { if (window.confirm('Remover este procedimento?')) deleteMutation.mutate(proc.id); }} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <div className="border-t dark:border-gray-700 px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
            {data.meta.total} procedimento(s) encontrado(s)
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Código CDT</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="D0120" className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Selecionar...</option>
                    {PROCEDURE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Preço (R$) *</label>
                  <input type="number" required step="0.01" min="0" value={formData.defaultPrice} onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Preço Convênio</label>
                  <input type="number" step="0.01" min="0" value={formData.insurancePrice} onChange={(e) => setFormData({ ...formData, insurancePrice: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Duração (min) *</label>
                  <input type="number" min="5" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-dental-600 focus:ring-dental-500" />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.requiresAuthorization} onChange={(e) => setFormData({ ...formData, requiresAuthorization: e.target.checked })} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-dental-600 focus:ring-dental-500" />
                  Requer autorização do convênio
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingProcedure ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
