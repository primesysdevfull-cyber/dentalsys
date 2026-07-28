import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { Plus, Search, X, CheckCircle, XCircle, FileText, Printer } from 'lucide-react';

const statusConfig: Record<string, { color: string; label: string }> = {
  PROPOSED: { color: 'bg-blue-100 text-blue-800', label: 'Proposto' },
  ACCEPTED: { color: 'bg-green-100 text-green-800', label: 'Aceito' },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', label: 'Em Andamento' },
  COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Concluído' },
  CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
};

export function TreatmentPlansPage() {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  function handlePrint() {
    document.body.classList.add('printing');
    window.print();
    document.body.classList.remove('printing');
  }

  const [planForm, setPlanForm] = useState({ title: '', description: '' });
  const [newItems, setNewItems] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', description: '', estimatedPrice: '' });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => api.get(`/patients?search=${patientSearch}&limit=10`).then((r) => r.data),
    enabled: patientSearch.length > 0,
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['treatment-plans', selectedPatientId],
    queryFn: () => api.get(`/treatment-plans/${selectedPatientId}`).then((r) => r.data),
    enabled: !!selectedPatientId,
  });

  const { data: proceduresData } = useQuery({
    queryKey: ['procedures-search', itemForm.procedureSearch],
    queryFn: () => api.get(`/procedures?search=${itemForm.procedureSearch}&limit=10`).then((r) => r.data),
    enabled: itemForm.procedureSearch.length > 0,
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: any) => api.post('/treatment-plan', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] });
      closeCreateModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao criar plano'),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ planId, item }: { planId: string; item: any }) => api.post(`/treatment-plan/${planId}/items`, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] });
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao adicionar item'),
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ planId, itemId }: { planId: string; itemId: string }) => api.delete(`/treatment-plan/${planId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] });
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao remover item'),
  });

  function selectPatient(patient: any) {
    setSelectedPatientId(patient.id);
    setSelectedPatientName(patient.name);
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  }

  function clearPatient() {
    setSelectedPatientId(null);
    setSelectedPatientName('');
    setPatientSearch('');
    setExpandedPlanId(null);
  }

  function toggleExpand(planId: string) {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  }

  function openCreateModal() {
    setPlanForm({ title: '', description: '' });
    setNewItems([]);
    setItemForm({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', description: '', estimatedPrice: '' });
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
  }

  function addItemToForm() {
    if (!itemForm.estimatedPrice) return;
    setNewItems([
      ...newItems,
      {
        procedureId: itemForm.procedureId || undefined,
        procedureName: itemForm.procedureName,
        toothNumber: itemForm.toothNumber ? parseInt(itemForm.toothNumber) : undefined,
        description: itemForm.description || undefined,
        estimatedPrice: parseFloat(itemForm.estimatedPrice),
      },
    ]);
    setItemForm({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', description: '', estimatedPrice: '' });
  }

  function removeItemFromForm(index: number) {
    setNewItems(newItems.filter((_, i) => i !== index));
  }

  function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planForm.title || !selectedPatientId) return;
    createPlanMutation.mutate({
      patientId: selectedPatientId,
      title: planForm.title,
      description: planForm.description || undefined,
      items: newItems.length > 0 ? newItems.map(({ procedureName, ...item }) => item) : undefined,
    });
  }

  const totalEstimate = newItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Tratamento</h1>
          <p className="text-gray-500">Gerenciar orçamentos e planos de tratamento</p>
        </div>
        <div className="flex gap-2">
          {selectedPatientId && (
            <>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700"
              >
                <Plus className="h-4 w-4" />
                Novo Plano
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="no-print relative">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nome..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientDropdown(true);
                if (selectedPatientId && e.target.value !== selectedPatientName) {
                  clearPatient();
                }
              }}
              onFocus={() => {
                if (patientSearch.length > 0) setShowPatientDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
            />
            {selectedPatientId && (
              <button
                onClick={clearPatient}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showPatientDropdown && patientSearch.length > 0 && !selectedPatientId && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg">
            {patientsData?.data?.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">Nenhum paciente encontrado</p>
            ) : (
              patientsData?.data?.map((patient: any) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dental-100 text-xs font-semibold text-dental-700">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    {patient.phone && <p className="text-xs text-gray-500">{patient.phone}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPatientId && (
        <div className="print-area">
          <div className="mb-4 rounded-xl border border-dental-200 bg-dental-50 px-5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-dental-800">
                Paciente: <span className="font-semibold">{selectedPatientName}</span>
              </p>
              <span className="text-xs text-dental-500">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-dental-600">
            <h1 className="text-2xl font-bold text-dental-600">DentalSys</h1>
            <p className="text-gray-500">Planos de Tratamento</p>
          </div>

          {plansLoading ? (
            <div className="no-print rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Carregando...
            </div>
          ) : plans.length === 0 ? (
            <div className="no-print rounded-xl border bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Nenhum plano de tratamento encontrado para este paciente.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan: any) => {
                const status = statusConfig[plan.status] || statusConfig.PROPOSED;
                const items = plan.items || [];
                const total = (plan.totalEstimate != null ? Number(plan.totalEstimate) : items.reduce((sum: number, i: any) => sum + Number(i.estimatedPrice || 0), 0));

                return (
                  <div key={plan.id} className="rounded-xl border bg-white shadow-sm">
                    <div
                      className="flex cursor-pointer items-center justify-between px-6 py-4"
                      onClick={() => toggleExpand(plan.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{plan.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-bold text-dental-700">{formatCurrency(total)}</span>
                        <svg
                          className={`h-5 w-5 text-gray-400 transition-transform ${expandedPlanId === plan.id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className={`${expandedPlanId === plan.id ? '' : 'hidden'} print:block border-t`}>
                        {plan.description && (
                          <div className="px-6 py-3 text-sm text-gray-600 border-b bg-gray-50">
                            {plan.description}
                          </div>
                        )}
                        <div className="px-6 py-4">
                          {items.length === 0 ? (
                            <p className="text-sm text-gray-400">Nenhum item neste plano.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full print:w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Procedimento</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Dente/Região</th>
                                    <th className="py-2 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Valor</th>
                                    {(plan.status === 'PROPOSED' || plan.status === 'ACCEPTED') && (
                                      <th className="no-print py-2 pl-4 w-10" />
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                      <td className="py-3 pr-4">
                                        <span className="text-sm font-medium text-gray-900">
                                          {item.procedure?.name || item.description || 'Procedimento'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="text-sm text-gray-600">
                                          {item.toothNumber ? `Dente ${item.toothNumber}` : 'Geral'}
                                        </span>
                                      </td>
                                      <td className="py-3 pl-4 text-right">
                                        <span className="text-sm font-semibold text-gray-900">
                                          {item.estimatedPrice ? formatCurrency(item.estimatedPrice) : '-'}
                                        </span>
                                      </td>
                                      {(plan.status === 'PROPOSED' || plan.status === 'ACCEPTED') && (
                                        <td className="no-print py-3 pl-4 text-right">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm('Remover este item?')) {
                                                removeItemMutation.mutate({ planId: plan.id, itemId: item.id });
                                              }
                                            }}
                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {items.length > 0 && (
                            <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-bold text-dental-700">{formatCurrency(total)}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {(plan.status === 'PROPOSED' || plan.status === 'ACCEPTED') && (
                          <div className="no-print mb-4 space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
                            <p className="text-sm font-medium text-gray-700">Adicionar Item</p>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Buscar procedimento..."
                                value={itemForm.procedureSearch}
                                onChange={(e) => setItemForm({ ...itemForm, procedureSearch: e.target.value, procedureId: '', procedureName: '' })}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                              />
                              {itemForm.procedureSearch.length > 0 && !itemForm.procedureId && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                                  {proceduresData?.data?.length === 0 ? (
                                    <p className="px-3 py-2 text-sm text-gray-400">Nenhum procedimento encontrado</p>
                                  ) : (
                                    proceduresData?.data?.map((proc: any) => (
                                      <button
                                        key={proc.id}
                                        type="button"
                                        onClick={() => {
                                          setItemForm({
                                            ...itemForm,
                                            procedureId: proc.id,
                                            procedureName: proc.name,
                                            procedureSearch: proc.name,
                                            estimatedPrice: proc.defaultPrice ? String(proc.defaultPrice) : '',
                                          });
                                        }}
                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                                      >
                                        <span className="font-medium text-gray-900">{proc.name}</span>
                                        <span className="text-xs text-gray-500">
                                          {proc.defaultPrice ? formatCurrency(proc.defaultPrice) : ''}
                                        </span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Dente</label>
                                <input
                                  type="number"
                                  placeholder="Nº"
                                  value={itemForm.toothNumber}
                                  onChange={(e) => setItemForm({ ...itemForm, toothNumber: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-600">Descrição</label>
                                <input
                                  type="text"
                                  placeholder="Descrição"
                                  value={itemForm.description}
                                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Valor Estimado</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={itemForm.estimatedPrice}
                                  onChange={(e) => setItemForm({ ...itemForm, estimatedPrice: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={!itemForm.estimatedPrice}
                                onClick={() => {
                                  if (!itemForm.estimatedPrice) return;
                                  const payload: any = {
                                    procedureId: itemForm.procedureId || undefined,
                                    toothNumber: itemForm.toothNumber ? parseInt(itemForm.toothNumber) : undefined,
                                    description: itemForm.description || undefined,
                                    estimatedPrice: parseFloat(itemForm.estimatedPrice),
                                  };
                                  addItemMutation.mutate(
                                    { planId: plan.id, item: payload },
                                    {
                                      onSuccess: () => {
                                        setItemForm({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', description: '', estimatedPrice: '' });
                                      },
                                    }
                                  );
                                }}
                                className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="no-print flex items-center gap-2 border-t pt-4">
                          {plan.status === 'PROPOSED' && (
                            <>
                              <button
                                onClick={() => api.patch(`/treatment-plan/${plan.id}/accept`).then(() => queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] })).catch((e) => alert(e?.response?.data?.message || 'Erro ao aceitar'))}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Aceitar
                              </button>
                              <button
                                onClick={() => api.patch(`/treatment-plan/${plan.id}/cancel`).then(() => queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] })).catch((e) => alert(e?.response?.data?.message || 'Erro ao cancelar'))}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancelar
                              </button>
                            </>
                          )}
                          {plan.status === 'ACCEPTED' && (
                            <>
                              <button
                                onClick={() => api.patch(`/treatment-plan/${plan.id}/start`).then(() => queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] })).catch((e) => alert(e?.response?.data?.message || 'Erro ao iniciar'))}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                              >
                                Iniciar
                              </button>
                              <button
                                onClick={() => api.patch(`/treatment-plan/${plan.id}/cancel`).then(() => queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] })).catch((e) => alert(e?.response?.data?.message || 'Erro ao cancelar'))}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancelar
                              </button>
                            </>
                          )}
                          {plan.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => api.patch(`/treatment-plan/${plan.id}/complete`).then(() => queryClient.invalidateQueries({ queryKey: ['treatment-plans', selectedPatientId] })).catch((e) => alert(e?.response?.data?.message || 'Erro ao concluir'))}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedPatientId && (
        <div className="no-print rounded-xl border bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Selecione um paciente para ver os planos de tratamento.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Novo Plano de Tratamento</h2>
              <button onClick={closeCreateModal} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  required
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  placeholder="Ex: Plano de Restauração"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                  placeholder="Descrição do plano..."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Paciente</label>
                <input
                  type="text"
                  disabled
                  value={selectedPatientName}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
              </div>

              <div className="border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Itens do Plano</h3>
                </div>

                {newItems.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {item.procedureName || item.description || 'Procedimento'}
                            </span>
                            {item.toothNumber && (
                              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                                Dente {item.toothNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.estimatedPrice ? formatCurrency(item.estimatedPrice) : '-'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItemFromForm(idx)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar procedimento..."
                      value={itemForm.procedureSearch}
                      onChange={(e) => setItemForm({ ...itemForm, procedureSearch: e.target.value, procedureId: '', procedureName: '' })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                    />
                    {itemForm.procedureSearch.length > 0 && !itemForm.procedureId && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                        {proceduresData?.data?.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-400">Nenhum procedimento encontrado</p>
                        ) : (
                          proceduresData?.data?.map((proc: any) => (
                            <button
                              key={proc.id}
                              type="button"
                              onClick={() => {
                                setItemForm({
                                  ...itemForm,
                                  procedureId: proc.id,
                                  procedureName: proc.name,
                                  procedureSearch: proc.name,
                                  estimatedPrice: proc.defaultPrice ? String(proc.defaultPrice) : '',
                                });
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <span className="font-medium text-gray-900">{proc.name}</span>
                              <span className="text-xs text-gray-500">
                                {proc.defaultPrice ? formatCurrency(proc.defaultPrice) : ''}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Dente</label>
                      <input
                        type="number"
                        placeholder="Nº"
                        value={itemForm.toothNumber}
                        onChange={(e) => setItemForm({ ...itemForm, toothNumber: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-600">Descrição</label>
                      <input
                        type="text"
                        placeholder="Descrição"
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={itemForm.estimatedPrice}
                        onChange={(e) => setItemForm({ ...itemForm, estimatedPrice: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!itemForm.estimatedPrice}
                      onClick={addItemToForm}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Item
                    </button>
                  </div>
                </div>

                {totalEstimate > 0 && (
                  <div className="mt-4 flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Estimado</p>
                      <p className="text-xl font-bold text-dental-700">{formatCurrency(totalEstimate)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || !planForm.title}
                  className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                >
                  {createPlanMutation.isPending ? 'Salvando...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
