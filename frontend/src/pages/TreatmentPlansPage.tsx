import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { Plus, Search, X, CheckCircle, XCircle, FileText, Printer, ChevronDown, AlertTriangle } from 'lucide-react';

const statusConfig: Record<string, { color: string; label: string }> = {
  PROPOSED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', label: 'Proposto' },
  ACCEPTED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', label: 'Aceito' },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', label: 'Em Andamento' },
  COMPLETED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Concluído' },
  CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', label: 'Cancelado' },
};

const COMMON_TEETH = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];

function calculateAge(birthDate?: string): string {
  if (!birthDate) return '';
  const diff = Date.now() - new Date(birthDate).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} anos`;
}

export function TreatmentPlansPage() {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    professionalId: '',
    validUntil: '',
    notes: '',
  });

  const [newItems, setNewItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    procedureSearch: '',
    procedureId: '',
    procedureName: '',
    toothNumber: '',
    estimatedPrice: '',
    quantity: '1',
  });

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
    queryKey: ['procedures-search', currentItem.procedureSearch],
    queryFn: () => api.get(`/procedures?search=${currentItem.procedureSearch}&limit=10`).then((r) => r.data),
    enabled: currentItem.procedureSearch.length > 0,
  });

  const { data: professionalsData } = useQuery({
    queryKey: ['professionals-all'],
    queryFn: () => api.get('/professionals').then((r) => r.data),
  });

  const { data: profileData } = useQuery({
    queryKey: ['auth-profile'],
    queryFn: () => api.get('/auth/profile').then((r) => r.data),
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

  const professionals = Array.isArray(professionalsData) ? professionalsData : professionalsData?.data || [];
  const profile = profileData?.user || profileData;

  useEffect(() => {
    if (profile && professionals.length > 0) {
      const matched = professionals.find((p: any) => p.userId === profile.id);
      if (matched && !planForm.professionalId) {
        setPlanForm((prev) => ({ ...prev, professionalId: matched.id }));
      }
    }
  }, [profile, professionals]);

  function selectPatient(patient: any) {
    setSelectedPatientId(patient.id);
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  }

  function clearPatient() {
    setSelectedPatientId(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setExpandedPlanId(null);
  }

  function toggleExpand(planId: string) {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  }

  function openCreateModal() {
    setPlanForm({ title: '', description: '', professionalId: '', validUntil: '', notes: '' });
    setNewItems([]);
    setCurrentItem({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', estimatedPrice: '', quantity: '1' });
    setHasUnsavedChanges(false);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
      return;
    }
    setShowCreateModal(false);
  }

  function confirmClose() {
    setShowConfirmClose(false);
    setHasUnsavedChanges(false);
    setShowCreateModal(false);
  }

  function addCurrentItem() {
    if (!currentItem.estimatedPrice && !currentItem.procedureId) return;
    setNewItems([
      ...newItems,
      {
        procedureId: currentItem.procedureId || undefined,
        procedureName: currentItem.procedureName,
        toothNumber: currentItem.toothNumber ? parseInt(currentItem.toothNumber) : undefined,
        estimatedPrice: parseFloat(currentItem.estimatedPrice || '0'),
        quantity: parseInt(currentItem.quantity || '1'),
      },
    ]);
    setCurrentItem({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', estimatedPrice: '', quantity: '1' });
    setHasUnsavedChanges(true);
  }

  function removeItemFromForm(index: number) {
    setNewItems(newItems.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  }

  function updateItemQuantity(index: number, qty: number) {
    const updated = [...newItems];
    updated[index] = { ...updated[index], quantity: Math.max(1, qty) };
    setNewItems(updated);
    setHasUnsavedChanges(true);
  }

  function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planForm.title || !selectedPatientId) return;
    const totalEstimate = newItems.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
    createPlanMutation.mutate({
      patientId: selectedPatientId,
      title: planForm.title,
      description: planForm.description || undefined,
      professionalId: planForm.professionalId || undefined,
      validUntil: planForm.validUntil || undefined,
      notes: planForm.notes || undefined,
      totalEstimate,
      items: newItems.length > 0 ? newItems.map(({ procedureName, ...item }) => item) : undefined,
    });
  }

  function handleFieldChange(field: string, value: string) {
    setPlanForm((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }

  function selectProcedure(proc: any) {
    setCurrentItem({
      ...currentItem,
      procedureId: proc.id,
      procedureName: proc.name,
      procedureSearch: proc.name,
      estimatedPrice: proc.defaultPrice ? String(proc.defaultPrice) : currentItem.estimatedPrice,
    });
    setHasUnsavedChanges(true);
  }

  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];
  const totalEstimate = newItems.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);

  function handlePrint() {
    document.body.classList.add('printing');
    window.print();
    document.body.classList.remove('printing');
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Planos de Tratamento</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerenciar orçamentos e planos de tratamento</p>
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
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar paciente por nome..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientDropdown(true);
                if (selectedPatientId && e.target.value !== selectedPatient?.name) {
                  clearPatient();
                }
              }}
              onFocus={() => {
                if (patientSearch.length > 0) setShowPatientDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
            />
            {selectedPatientId && (
              <button
                onClick={clearPatient}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showPatientDropdown && patientSearch.length > 0 && !selectedPatientId && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {patientsData?.data?.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Nenhum paciente encontrado</p>
            ) : (
              patientsData?.data?.map((patient: any) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dental-100 text-xs font-semibold text-dental-700">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{patient.name}</p>
                    {patient.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{patient.phone}</p>}
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
                Paciente: <span className="font-semibold">{selectedPatient?.name}</span>
                {selectedPatient?.birthDate && (
                  <span className="ml-2 text-xs text-dental-600">• {calculateAge(selectedPatient.birthDate)}</span>
                )}
              </p>
              <span className="text-xs text-dental-500">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-dental-600">
            <h1 className="text-2xl font-bold text-dental-600">DentalSys</h1>
            <p className="text-gray-500 dark:text-gray-400">Planos de Tratamento</p>
          </div>

          {plansLoading ? (
            <div className="no-print rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
              Carregando...
            </div>
          ) : plans.length === 0 ? (
            <div className="no-print rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
              Nenhum plano de tratamento encontrado para este paciente.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan: any) => {
                const status = statusConfig[plan.status] || statusConfig.PROPOSED;
                const items = plan.items || [];
                const total = (plan.totalEstimate != null ? Number(plan.totalEstimate) : items.reduce((sum: number, i: any) => sum + Number(i.estimatedPrice || 0) * (i.quantity || 1), 0));

                return (
                  <div key={plan.id} className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div
                      className="flex cursor-pointer items-center justify-between px-6 py-4"
                      onClick={() => toggleExpand(plan.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate dark:text-gray-100">{plan.title}</h3>
                          {plan.professional && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {plan.professional.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-bold text-dental-700">{formatCurrency(total)}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform dark:text-gray-500 ${expandedPlanId === plan.id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    <div className={`${expandedPlanId === plan.id ? '' : 'hidden'} print:block border-t`}>
                      {plan.description && (
                        <div className="px-6 py-3 text-sm text-gray-600 border-b bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                          {plan.description}
                        </div>
                      )}
                      <div className="px-6 py-4">
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum item neste plano.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full print:w-full">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dente</th>
                                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Procedimento</th>
                                  <th className="py-2 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Valor Unit.</th>
                                  <th className="py-2 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Qtd</th>
                                  <th className="py-2 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subtotal</th>
                                  {(plan.status === 'PROPOSED' || plan.status === 'ACCEPTED') && (
                                    <th className="no-print py-2 pl-4 w-10" />
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item: any) => {
                                  const qty = item.quantity || 1;
                                  const unitPrice = Number(item.estimatedPrice || 0);
                                  const subtotal = unitPrice * qty;
                                  return (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                                      <td className="py-3 pr-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          {item.toothNumber ? `Dente ${item.toothNumber}` : 'Geral'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {item.procedure?.name || item.description || 'Procedimento'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(unitPrice)}</span>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{qty}</span>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
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
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {items.length > 0 && (
                          <div className="border-t border-gray-200 px-6 py-3 flex justify-end dark:border-gray-700">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                              <p className="text-lg font-bold text-dental-700">{formatCurrency(total)}</p>
                            </div>
                          </div>
                        )}

                        {plan.validUntil && (
                          <div className="px-6 pb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Válido até: {new Date(plan.validUntil).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}

                        {plan.notes && (
                          <div className="px-6 pb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Obs: {plan.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {(plan.status === 'PROPOSED' || plan.status === 'ACCEPTED') && (
                        <div className="no-print mb-4 space-y-3 rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Adicionar Item</p>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar procedimento..."
                              value={currentItem.procedureSearch}
                              onChange={(e) => setCurrentItem({ ...currentItem, procedureSearch: e.target.value, procedureId: '', procedureName: '' })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                            />
                            {currentItem.procedureSearch.length > 0 && !currentItem.procedureId && (
                              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                {proceduresData?.data?.length === 0 ? (
                                  <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Nenhum procedimento encontrado</p>
                                ) : (
                                  proceduresData?.data?.map((proc: any) => (
                                    <button
                                      key={proc.id}
                                      type="button"
                                      onClick={() => {
                                        setCurrentItem({
                                          ...currentItem,
                                          procedureId: proc.id,
                                          procedureName: proc.name,
                                          procedureSearch: proc.name,
                                          estimatedPrice: proc.defaultPrice ? String(proc.defaultPrice) : '',
                                        });
                                      }}
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                      <span className="font-medium text-gray-900 dark:text-gray-100">{proc.name}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {proc.defaultPrice ? formatCurrency(proc.defaultPrice) : ''}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Dente</label>
                              <input
                                type="number"
                                placeholder="Nº"
                                value={currentItem.toothNumber}
                                onChange={(e) => setCurrentItem({ ...currentItem, toothNumber: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Valor Unit.</label>
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={currentItem.estimatedPrice}
                                  onChange={(e) => setCurrentItem({ ...currentItem, estimatedPrice: e.target.value })}
                                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Qtd</label>
                              <input
                                type="number"
                                min="1"
                                value={currentItem.quantity}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                disabled={!currentItem.estimatedPrice && !currentItem.procedureId}
                                onClick={() => {
                                  if (!currentItem.estimatedPrice && !currentItem.procedureId) return;
                                  const payload: any = {
                                    procedureId: currentItem.procedureId || undefined,
                                    toothNumber: currentItem.toothNumber ? parseInt(currentItem.toothNumber) : undefined,
                                    estimatedPrice: parseFloat(currentItem.estimatedPrice || '0'),
                                    quantity: parseInt(currentItem.quantity || '1'),
                                  };
                                  addItemMutation.mutate(
                                    { planId: plan.id, item: payload },
                                    {
                                      onSuccess: () => {
                                        setCurrentItem({ procedureSearch: '', procedureId: '', procedureName: '', toothNumber: '', estimatedPrice: '', quantity: '1' });
                                      },
                                    }
                                  );
                                }}
                                className="w-full rounded-lg bg-dental-600 px-3 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="no-print flex items-center gap-2 border-t pt-4 px-6 pb-4">
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
        <div className="no-print rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Selecione um paciente para ver os planos de tratamento.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div ref={modalRef} className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Novo Plano de Tratamento</h2>
              <button onClick={closeCreateModal} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="px-6 py-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Ex: Restauração + Limpeza"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Descrição</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    placeholder="Descreva os detalhes do plano de tratamento..."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Paciente</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                    <span className="text-base">👤</span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {selectedPatient?.name}
                      {selectedPatient?.birthDate && (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">• {calculateAge(selectedPatient.birthDate)}</span>
                      )}
                    </span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Profissional Responsável</label>
                  <select
                    value={planForm.professionalId}
                    onChange={(e) => handleFieldChange('professionalId', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                  >
                    <option value="">Selecione...</option>
                    {professionals.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Itens do Plano</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Adicione os procedimentos ao orçamento</p>
                </div>

                {newItems.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dente</th>
                          <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Procedimento</th>
                          <th className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Valor Unit.</th>
                          <th className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Qtd</th>
                          <th className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subtotal</th>
                          <th className="py-2 pl-3 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {newItems.map((item, idx) => {
                          const unitPrice = item.estimatedPrice || 0;
                          const qty = item.quantity || 1;
                          const subtotal = unitPrice * qty;
                          return (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                              <td className="py-3 pr-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.toothNumber ? `Dente ${item.toothNumber}` : 'Geral'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.procedureName || 'Procedimento'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(unitPrice)}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={qty}
                                  onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                                  className="w-16 rounded border border-gray-200 px-2 py-1 text-right text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                />
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                              </td>
                              <td className="py-3 pl-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromForm(idx)}
                                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar procedimento..."
                      value={currentItem.procedureSearch}
                      onChange={(e) => {
                        setCurrentItem({ ...currentItem, procedureSearch: e.target.value, procedureId: '', procedureName: '' });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                    />
                    {currentItem.procedureSearch.length > 0 && !currentItem.procedureId && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        {proceduresData?.data?.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Nenhum procedimento encontrado</p>
                        ) : (
                          proceduresData?.data?.map((proc: any) => (
                            <button
                              key={proc.id}
                              type="button"
                              onClick={() => selectProcedure(proc)}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">{proc.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {proc.defaultPrice ? formatCurrency(proc.defaultPrice) : ''}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Dente</label>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <input
                          type="number"
                          placeholder="Nº"
                          value={currentItem.toothNumber}
                          onChange={(e) => {
                            setCurrentItem({ ...currentItem, toothNumber: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                        />
                        <details className="relative w-full">
                          <summary className="mt-1 cursor-pointer text-xs text-dental-600 hover:text-dental-700 dark:text-primary-dark">Dentes...</summary>
                          <div className="absolute z-10 mt-1 grid grid-cols-8 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            {COMMON_TEETH.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setCurrentItem({ ...currentItem, toothNumber: String(t) });
                                  setHasUnsavedChanges(true);
                                }}
                                className={`rounded px-2 py-1 text-xs font-medium hover:bg-dental-100 dark:hover:bg-dental-900 ${currentItem.toothNumber === String(t) ? 'bg-dental-200 text-dental-800 dark:bg-dental-800 dark:text-dental-200' : 'text-gray-700 dark:text-gray-300'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Valor Unit.</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={currentItem.estimatedPrice}
                          onChange={(e) => {
                            setCurrentItem({ ...currentItem, estimatedPrice: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => {
                          setCurrentItem({ ...currentItem, quantity: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={!currentItem.estimatedPrice && !currentItem.procedureId}
                        onClick={addCurrentItem}
                        className="w-full rounded-lg bg-dental-600 px-3 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {newItems.length > 0 && (
                  <div className="mt-4 flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold text-dental-700">{formatCurrency(totalEstimate)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Válido até</label>
                  <input
                    type="date"
                    value={planForm.validUntil}
                    onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Status</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Aguardando aprovação
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Observações</label>
                <textarea
                  value={planForm.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={2}
                  placeholder="Condições de pagamento, materiais especiais, etc."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || !planForm.title}
                  className="rounded-lg bg-dental-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                >
                  {createPlanMutation.isPending ? 'Salvando...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alterações não salvas</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Você tem alterações não salvas. Deseja realmente fechar sem salvar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Continuar Editando
              </button>
              <button
                onClick={confirmClose}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
