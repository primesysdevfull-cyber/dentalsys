import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, X, Trash2, MessageCircle } from 'lucide-react';

const TOOTH_CONDITIONS: Record<string, { label: string; color: string; bg: string }> = {
  HEALTHY: { label: 'Saudável', color: '#16a34a', bg: '#dcfce7' },
  CARIES: { label: 'Cárie', color: '#dc2626', bg: '#fef2f2' },
  RESTORATION: { label: 'Restauração', color: '#2563eb', bg: '#eff6ff' },
  CROWN: { label: 'Coroa', color: '#9333ea', bg: '#f3e8ff' },
  BRIDGE: { label: 'Ponte', color: '#1e40af', bg: '#dbeafe' },
  IMPLANT: { label: 'Implante', color: '#6b7280', bg: '#f3f4f6' },
  EXTRACTION: { label: 'Extração', color: '#991b1b', bg: '#fef2f2' },
  MISSING: { label: 'Ausente', color: '#a3a3a3', bg: '#f5f5f5' },
  FRACTURE: { label: 'Fratura', color: '#ea580c', bg: '#fff7ed' },
  SENSITIVITY: { label: 'Sensibilidade', color: '#eab308', bg: '#fefce8' },
  ENDODONTICS: { label: 'Endodontia', color: '#7c3aed', bg: '#ede9fe' },
  PROSTHESIS: { label: 'Prótese', color: '#0891b2', bg: '#ecfeff' },
  OTHER: { label: 'Outro', color: '#737373', bg: '#fafafa' },
};

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

function getToothConditions(teeth: any[], toothNumber: number) {
  return teeth.filter((t: any) => t.toothNumber === toothNumber);
}

function getToothColor(teeth: any[], toothNumber: number): string {
  const conditions = getToothConditions(teeth, toothNumber);
  if (conditions.length === 0) return '#ffffff';
  const last = conditions[conditions.length - 1];
  const cond = TOOTH_CONDITIONS[last.condition];
  return cond?.bg || '#ffffff';
}

function getToothBorder(teeth: any[], toothNumber: number): string {
  const conditions = getToothConditions(teeth, toothNumber);
  if (conditions.length === 0) return '#d1d5db';
  const last = conditions[conditions.length - 1];
  const cond = TOOTH_CONDITIONS[last.condition];
  return cond?.color || '#d1d5db';
}

function ToothButton({ number, teeth, onClick }: { number: number; teeth: any[]; onClick: () => void }) {
  const conditions = getToothConditions(teeth, number);
  const mainCondition = conditions.length > 0 ? conditions[conditions.length - 1] : null;
  const label = mainCondition ? TOOTH_CONDITIONS[mainCondition.condition]?.label : 'Saudável';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 group"
      title={`Dente ${number}: ${label}`}
    >
      <div
        className="w-8 h-10 rounded-md border-2 flex items-center justify-center text-[10px] font-bold text-gray-700 transition-all group-hover:scale-110 group-hover:shadow-md cursor-pointer"
        style={{
          backgroundColor: getToothColor(teeth, number),
          borderColor: getToothBorder(teeth, number),
        }}
      >
        {number}
      </div>
    </button>
  );
}

export function ClinicalRecordsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'odontogram' | 'records' | 'plans'>('odontogram');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothCondition, setToothCondition] = useState('HEALTHY');
  const [toothNotes, setToothNotes] = useState('');
  const [toothSurface, setToothSurface] = useState('');

  const { data: preselectedPatient } = useQuery({
    queryKey: ['patient-preselect', preselectedPatientId],
    queryFn: () => api.get(`/patients/${preselectedPatientId}`).then((r) => r.data),
    enabled: !!preselectedPatientId && !selectedPatient,
  });

  useEffect(() => {
    if (preselectedPatient && !selectedPatient) {
      setSelectedPatient(preselectedPatient);
    }
  }, [preselectedPatient, selectedPatient]);

  const { data: patientsData } = useQuery({
    queryKey: ['patients-search', search],
    queryFn: () => api.get(`/patients?search=${search}&limit=10`).then((r) => r.data),
    enabled: search.length >= 2 && !selectedPatient,
  });

  const { data: odontogram } = useQuery({
    queryKey: ['odontogram', selectedPatient?.id],
    queryFn: () => api.get(`/odontogram/${selectedPatient.id}`).then((r) => r.data),
    enabled: !!selectedPatient,
  });

  const { data: records } = useQuery({
    queryKey: ['clinical-records', selectedPatient?.id],
    queryFn: () => api.get(`/clinical-records/patient/${selectedPatient.id}`).then((r) => r.data),
    enabled: !!selectedPatient,
  });

  const { data: plans } = useQuery({
    queryKey: ['treatment-plans', selectedPatient?.id],
    queryFn: () => api.get(`/treatment-plans/${selectedPatient.id}`).then((r) => r.data),
    enabled: !!selectedPatient,
  });

  const addToothMutation = useMutation({
    mutationFn: (data: any) => api.post(`/odontogram/${selectedPatient.id}/tooth`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram'] });
      setSelectedTooth(null);
      setToothCondition('HEALTHY');
      setToothNotes('');
      setToothSurface('');
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao salvar condição'),
  });

  const removeToothMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/odontogram/tooth/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['odontogram'] }),
  });

  const patients: any[] = patientsData?.data || [];
  const teeth: any[] = odontogram?.teeth || [];

  function handleSaveTooth() {
    if (!selectedTooth) return;
    addToothMutation.mutate({
      toothNumber: selectedTooth,
      condition: toothCondition,
      notes: toothNotes || undefined,
      surface: toothSurface || undefined,
    });
  }

  function renderToothRow(toothNumbers: number[], label: string) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-8 text-xs text-gray-400 text-right">{label}</span>
        <div className="flex gap-1.5">
          {toothNumbers.map((n) => (
            <ToothButton key={n} number={n} teeth={teeth} onClick={() => setSelectedTooth(n)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prontuário Eletrônico</h1>
        <p className="text-gray-500">Odontograma, registros clínicos e planos de tratamento</p>
      </div>

      {!selectedPatient ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
            />
          </div>
          {search.length >= 2 && (
            <div className="mt-3 divide-y rounded-lg border border-gray-100">
              {patients.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Nenhum paciente encontrado</p>
              ) : (
                patients.map((patient: any) => (
                  <button
                    key={patient.id}
                    onClick={() => { setSelectedPatient(patient); setSearch(''); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dental-100 text-sm font-semibold text-dental-700">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-500">
                        {patient.cpf ? `CPF: ${patient.cpf}` : ''} {patient.phone ? `• Tel: ${patient.phone}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {search.length < 2 && (
            <p className="mt-4 text-center text-sm text-gray-400">Digite pelo menos 2 caracteres para buscar</p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dental-100 text-lg font-bold text-dental-700">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedPatient.cpf ? `CPF: ${selectedPatient.cpf}` : ''}
                    {selectedPatient.phone ? ` • Tel: ${selectedPatient.phone}` : ''}
                    {(selectedPatient.whatsapp || selectedPatient.phone) && (
                      <a
                        href={`https://wa.me/${(selectedPatient.whatsapp || selectedPatient.phone).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedPatient(null); setSelectedTooth(null); }}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Trocar paciente
              </button>
            </div>
          </div>

          <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
            {[
              { key: 'odontogram', label: 'Odontograma' },
              { key: 'records', label: 'Registros Clínicos' },
              { key: 'plans', label: 'Planos de Tratamento' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-white text-dental-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'odontogram' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase">Arcada Superior</h3>
                <div className="space-y-2">
                  {renderToothRow(UPPER_RIGHT, 'Dir.')}
                  {renderToothRow(UPPER_LEFT, 'Esq.')}
                </div>

                <div className="my-4 border-t border-dashed" />

                <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase">Arcada Inferior</h3>
                <div className="space-y-2">
                  {renderToothRow(LOWER_LEFT, 'Esq.')}
                  {renderToothRow(LOWER_RIGHT, 'Dir.')}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {Object.entries(TOOTH_CONDITIONS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: val.bg, borderColor: val.color }} />
                      <span className="text-[11px] text-gray-500">{val.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {selectedTooth ? `Dente ${selectedTooth}` : 'Selecione um dente'}
                </h3>

                {selectedTooth ? (
                  <div className="space-y-4">
                    {getToothConditions(teeth, selectedTooth).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Condições registradas</p>
                        {getToothConditions(teeth, selectedTooth).map((c: any) => {
                          const cond = TOOTH_CONDITIONS[c.condition];
                          return (
                            <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ backgroundColor: cond?.bg }}>
                              <div>
                                <span className="text-sm font-medium" style={{ color: cond?.color }}>{cond?.label}</span>
                                {c.surface && <span className="ml-1 text-xs text-gray-500">({c.surface})</span>}
                                {c.notes && <p className="text-xs text-gray-500">{c.notes}</p>}
                              </div>
                              <button onClick={() => removeToothMutation.mutate(c.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adicionar condição</label>
                      <select value={toothCondition} onChange={(e) => setToothCondition(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                        {Object.entries(TOOTH_CONDITIONS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Face/Superfície</label>
                      <select value={toothSurface} onChange={(e) => setToothSurface(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                        <option value="">Todas</option>
                        <option value="M">Mesial</option>
                        <option value="D">Distal</option>
                        <option value="O">Oclusal</option>
                        <option value="V">Vestibular</option>
                        <option value="L">Lingual</option>
                        <option value="MOD">M-O-D</option>
                        <option value="MO">M-O</option>
                        <option value="DO">D-O</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações</label>
                      <input type="text" value={toothNotes} onChange={(e) => setToothNotes(e.target.value)} placeholder="Nota opcional" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                    </div>
                    <button onClick={handleSaveTooth} disabled={addToothMutation.isPending} className="w-full rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                      {addToothMutation.isPending ? 'Salvando...' : 'Salvar Condição'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Clique em um dente para registrar condição</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="divide-y">
                {!records || records.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Nenhum registro clínico encontrado</div>
                ) : (
                  records.map((record: any) => (
                    <div key={record.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.diagnosis || 'Sem diagnóstico'}</p>
                          <p className="text-xs text-gray-500">
                            {record.procedure?.name && `${record.procedure.name} • `}
                            {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {record.treatmentDone && <p className="mt-1 text-sm text-gray-600">{record.treatmentDone}</p>}
                      {record.observations && <p className="mt-1 text-xs text-gray-400">{record.observations}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4">
              {!plans || plans.length === 0 ? (
                <div className="rounded-xl border bg-white p-8 shadow-sm text-center text-sm text-gray-400">
                  Nenhum plano de tratamento encontrado
                </div>
              ) : (
                plans.map((plan: any) => (
                  <div key={plan.id} className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        plan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {plan.status === 'PROPOSED' ? 'Proposto' : plan.status === 'ACCEPTED' ? 'Aceito' : 'Concluído'}
                      </span>
                    </div>
                    {plan.description && <p className="mt-1 text-sm text-gray-500">{plan.description}</p>}
                    {plan.items && plan.items.length > 0 && (
                      <div className="mt-3 divide-y rounded-lg border">
                        {plan.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <p className="text-sm text-gray-900">{item.procedure?.name || item.description}</p>
                              {item.toothNumber && <p className="text-xs text-gray-500">Dente {item.toothNumber}</p>}
                            </div>
                            {item.estimatedPrice && (
                              <span className="text-sm font-medium text-gray-600">
                                R$ {Number(item.estimatedPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
