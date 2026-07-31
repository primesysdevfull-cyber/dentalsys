import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate, getStatusLabel } from '../utils';
import {
  Search, X, Trash2, MessageCircle, ArrowLeft, PlusCircle,
  FileText, ClipboardList, DollarSign, Activity, Eye,
  RotateCcw, ChevronRight, AlertTriangle, CheckCircle, Loader2,
  Clock, User, Calendar, Stethoscope, Pill,
} from 'lucide-react';

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
  PERIODONTICS: { label: 'Periodontia', color: '#be123c', bg: '#ffe4e6' },
  WHITENING: { label: 'Clareamento', color: '#0d9488', bg: '#ccfbf1' },
  OTHER: { label: 'Outro', color: '#737373', bg: '#fafafa' },
};

const MOST_USED = ['CARIES', 'RESTORATION', 'HEALTHY', 'EXTRACTION', 'CROWN', 'IMPLANT', 'MISSING', 'FRACTURE'];

const PLAN_STATUS: Record<string, { label: string; dot: string; bg: string }> = {
  PROPOSED: { label: 'Proposto', dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  ACCEPTED: { label: 'Aceito', dot: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'Em Andamento', dot: 'bg-yellow-500', bg: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Concluído', dot: 'bg-green-500', bg: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', dot: 'bg-red-500', bg: 'bg-red-100 text-red-700' },
};

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];
const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];

function getToothConditions(teeth: any[], toothNumber: number) {
  return teeth.filter((t: any) => t.toothNumber === toothNumber);
}

function getToothStyle(teeth: any[], toothNumber: number) {
  const conditions = getToothConditions(teeth, toothNumber);
  if (conditions.length === 0) return { bg: '#ffffff', border: '#d1d5db' };
  const last = conditions[conditions.length - 1];
  const cond = TOOTH_CONDITIONS[last.condition];
  return { bg: cond?.bg || '#ffffff', border: cond?.color || '#d1d5db' };
}

function ToothButton({ number, teeth, isSelected, isMultiSelected, onClick, onHover }: {
  number: number; teeth: any[]; isSelected: boolean; isMultiSelected: boolean; onClick: () => void; onHover: (n: number | null) => void;
}) {
  const conditions = getToothConditions(teeth, number);
  const style = getToothStyle(teeth, number);
  const last = conditions[conditions.length - 1];
  const label = last ? TOOTH_CONDITIONS[last.condition]?.label : 'Saudável';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(number)}
      onMouseLeave={() => onHover(null)}
      className="flex flex-col items-center gap-0.5 group relative"
      title={`Dente ${number}: ${label}${last?.notes ? ` (${last.notes})` : ''}`}
    >
      <div
        className={`w-8 h-10 rounded-md border-2 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-400 transition-all cursor-pointer ${
          isSelected ? 'scale-110 shadow-md ring-2 ring-primary' : ''
        } ${isMultiSelected ? 'ring-2 ring-warning-400 shadow-lg scale-105' : ''} ${
          !isSelected && !isMultiSelected ? 'group-hover:scale-105 group-hover:shadow-sm' : ''
        }`}
        style={{
          backgroundColor: isMultiSelected ? '#fef3c7' : style.bg,
          borderColor: isSelected ? '#2563EB' : isMultiSelected ? '#F59E0B' : style.border,
          borderWidth: isSelected || isMultiSelected ? '3px' : '2px',
        }}
      >
        {number}
      </div>
    </button>
  );
}

export function ClinicalRecordsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'odontogram' | 'records' | 'plans'>('overview');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [multiSelectedTeeth, setMultiSelectedTeeth] = useState<number[]>([]);
  const [toothCondition, setToothCondition] = useState('CARIES');
  const [toothNotes, setToothNotes] = useState('');
  const [toothSurface, setToothSurface] = useState('');
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

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

  const { data: patientFull } = useQuery({
    queryKey: ['patient-full', selectedPatient?.id],
    queryFn: () => api.get(`/patients/${selectedPatient.id}`).then((r) => r.data),
    enabled: !!selectedPatient,
  });

  const addToothMutation = useMutation({
    mutationFn: (data: any) => api.post(`/odontogram/${selectedPatient.id}/tooth`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontogram'] });
      setHasChanges(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao salvar condição'),
  });

  const removeToothMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/odontogram/tooth/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['odontogram'] }),
  });

  const patients: any[] = patientsData?.data || [];
  const teeth: any[] = odontogram?.teeth || [];
  const planList: any[] = plans || [];
  const patientData = patientFull || selectedPatient || {};
  const medicalHistory = patientData.medicalHistory;

  const lastAppointment = records && records.length > 0
    ? records.reduce((latest: any, r: any) => new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest, records[0])
    : null;

  const lastTreatment = planList.length > 0
    ? planList.filter((p: any) => p.status === 'COMPLETED').sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0]
    : null;

  const hasActivePlan = planList.some((p: any) => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED');
  const patientStatus = hasActivePlan ? 'Em tratamento odontológico' : planList.some((p: any) => p.status === 'COMPLETED') ? 'Acompanhamento' : 'Sem tratamentos';

  function handleSaveTooth(toothNumbers?: number[]) {
    const targets = toothNumbers || (multiSelectedTeeth.length > 0 ? multiSelectedTeeth : selectedTooth ? [selectedTooth] : []);
    if (targets.length === 0) return;
    targets.forEach((n) => {
      addToothMutation.mutate({
        toothNumber: n,
        condition: toothCondition,
        notes: toothNotes || undefined,
        surface: toothSurface || undefined,
      });
    });
    setHasChanges(false);
  }

  function handleSelectTooth(n: number) {
    if (multiSelectedTeeth.length > 0) {
      const idx = multiSelectedTeeth.indexOf(n);
      if (idx >= 0) {
        setMultiSelectedTeeth(multiSelectedTeeth.filter((t) => t !== n));
      } else {
        setMultiSelectedTeeth([...multiSelectedTeeth, n]);
      }
      return;
    }
    if (selectedTooth === n) {
      setSelectedTooth(null);
      return;
    }
    setSelectedTooth(n);
    const existing = getToothConditions(teeth, n);
    if (existing.length > 0) {
      const last = existing[existing.length - 1];
      setToothCondition(last.condition);
      setToothNotes(last.notes || '');
      setToothSurface(last.surface || '');
    } else {
      setToothCondition('CARIES');
      setToothNotes('');
      setToothSurface('');
    }
    setHasChanges(true);
  }

  function handleMultiSelectMode() {
    if (multiSelectedTeeth.length > 0) {
      setMultiSelectedTeeth([]);
    } else {
      setMultiSelectedTeeth(selectedTooth ? [selectedTooth] : []);
      setSelectedTooth(null);
    }
    setHasChanges(false);
  }

  function applyConditionToAll() {
    if (multiSelectedTeeth.length === 0) return;
    if (!confirm(`Aplicar "${TOOTH_CONDITIONS[toothCondition]?.label}" em ${multiSelectedTeeth.length} dentes?`)) return;
    handleSaveTooth(multiSelectedTeeth);
  }

  function clearSelection() {
    setSelectedTooth(null);
    setMultiSelectedTeeth([]);
    setToothCondition('CARIES');
    setToothNotes('');
    setToothSurface('');
    setHasChanges(false);
  }

  function handleBack() {
    if (hasChanges) {
      if (!confirm('Há alterações não salvas. Deseja sair mesmo assim?')) return;
    }
    setSelectedPatient(null);
    setSelectedTooth(null);
    setMultiSelectedTeeth([]);
    setHasChanges(false);
  }

  function renderToothRow(toothNumbers: number[], label: string) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-8 text-xs text-gray-400 dark:text-gray-500 text-right">{label}</span>
        <div className="flex gap-1.5">
          {toothNumbers.map((n) => (
            <ToothButton
              key={n} number={n} teeth={teeth}
              isSelected={selectedTooth === n}
              isMultiSelected={multiSelectedTeeth.includes(n)}
              onClick={() => handleSelectTooth(n)}
              onHover={setHoveredTooth}
            />
          ))}
        </div>
      </div>
    );
  }

  const plansStats = {
    total: planList.reduce((s: number, p: any) => s + Number(p.totalEstimate || 0), 0),
    completed: planList.filter((p: any) => p.status === 'COMPLETED').length,
    active: planList.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED').length,
  };

  function getPatientAge(birthDate: string) {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} anos`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prontuário Eletrônico</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Odontograma, registros clínicos e planos de tratamento</p>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Buscar paciente por nome ou CPF..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {search.length >= 2 && (
            <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-100 dark:border-gray-700">
              {patients.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Nenhum paciente encontrado</p>
              ) : (
                patients.map((patient: any) => (
                  <button key={patient.id} onClick={() => { setSelectedPatient(patient); setSearch(''); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{patient.cpf ? `CPF: ${patient.cpf}` : ''} {patient.phone ? `• Tel: ${patient.phone}` : ''}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {search.length < 2 && (
            <p className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">Digite pelo menos 2 caracteres para buscar</p>
          )}
        </div>
      ) : (
        <>
          {/* Header paciente + info complementar */}
          <div className="rounded-xl bg-white dark:bg-gray-900 shadow-card overflow-hidden">
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <div className="flex items-center gap-3 ml-2">
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-bold text-primary-700 dark:text-primary-300">
                      {selectedPatient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPatient.name}</h2>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          hasActivePlan ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                          'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${hasActivePlan ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          {patientStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedPatient.cpf ? `CPF: ${selectedPatient.cpf}` : ''}
                        {selectedPatient.birthDate ? ` • ${getPatientAge(selectedPatient.birthDate)}` : ''}
                        {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPatient.whatsapp && (
                    <a href={`https://wa.me/${selectedPatient.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-green-200 dark:border-green-800 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                  <Link to={`/patients/${selectedPatient.id}`}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Eye className="h-3.5 w-3.5" /> Ficha completa
                  </Link>
                  <button onClick={handleBack}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <X className="h-3.5 w-3.5" /> Trocar paciente
                  </button>
                </div>
              </div>

              {/* Info complementar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Última consulta</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lastAppointment ? formatDate(lastAppointment.createdAt) : 'Nenhuma'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Último tratamento</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lastTreatment ? `${lastTreatment.title} • ${formatDate(lastTreatment.updatedAt || lastTreatment.createdAt)}` : 'Nenhum'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-warning-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Alergias / Restrições</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{medicalHistory?.allergies || medicalHistory?.chronicDiseases ? (medicalHistory.allergies || medicalHistory.chronicDiseases) : 'Nenhuma'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <Pill className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">Medicações</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{medicalHistory?.currentMedications || 'Nenhuma'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 px-4 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              {[
                { key: 'overview', label: 'Visão Geral', icon: ClipboardList },
                { key: 'odontogram', label: 'Odontograma', icon: Activity },
                { key: 'records', label: 'Registros', icon: FileText },
                { key: 'plans', label: 'Planos', icon: DollarSign },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-5">
                {/* Histórico de Tratamentos */}
                <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Histórico de Tratamentos e Orçamentos</h2>
                    </div>
                    <Link to={`/treatment-plans`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                      <PlusCircle className="h-3.5 w-3.5" /> Iniciar Novo Tratamento
                    </Link>
                  </div>
                  {planList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Tipo de Tratamento</th>
                            <th className="text-left py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Status</th>
                            <th className="text-left py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Data Início</th>
                            <th className="text-left py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Dentista Resp.</th>
                            <th className="text-right py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Valor Total</th>
                            <th className="text-center py-2.5 px-2 font-medium text-gray-500 dark:text-gray-400 text-xs">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planList.map((plan: any) => {
                            const ps = PLAN_STATUS[plan.status] || PLAN_STATUS.PROPOSED;
                            return (
                              <tr key={plan.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{plan.title}</td>
                                <td className="py-3 px-2">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ps.bg}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} /> {ps.label}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{plan.startDate ? formatDate(plan.startDate) : '-'}</td>
                                <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{plan.professional?.name || '-'}</td>
                                <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-gray-100">{plan.totalEstimate ? formatCurrency(Number(plan.totalEstimate)) : '-'}</td>
                                <td className="py-3 px-2 text-center">
                                  <button onClick={() => setActiveTab('plans')} className="text-primary hover:text-primary-700 text-xs font-medium">Ver Detalhes</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ClipboardList className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum tratamento registrado.</p>
                      <Link to={`/treatment-plans`} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-700 mt-2 font-medium">
                        <PlusCircle className="h-3.5 w-3.5" /> Clique para iniciar um novo tratamento
                      </Link>
                    </div>
                  )}
                </div>

                {/* Prontuário */}
                <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Prontuário Clínico</h2>
                    </div>
                    <button onClick={() => setActiveTab('records')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Ver todos <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  {records && records.length > 0 ? (
                    <div className="space-y-2">
                      {records.slice(0, 5).map((rec: any) => (
                        <div key={rec.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rec.diagnosis || rec.procedure?.name || 'Atendimento'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{rec.professional?.name ? `${rec.professional.name} • ` : ''}{formatDate(rec.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum registro clínico.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar direita */}
              <div className="space-y-5">
                {/* Resumo Financeiro */}
                <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-success-500" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Resumo Financeiro</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Total em Tratamentos</span><span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(plansStats.total)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Em Andamento</span><span className="text-sm font-semibold text-yellow-600">{plansStats.active}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Concluídos</span><span className="text-sm font-semibold text-success-600">{plansStats.completed}</span></div>
                  </div>
                  <Link to={`/billing`} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
                    <DollarSign className="h-4 w-4" /> Ver Financeiro
                  </Link>
                </div>

                {/* Odontograma resumo */}
                <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Odontograma</h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{teeth.length} condições registradas</p>
                  <button onClick={() => setActiveTab('odontogram')} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 w-full">
                    <Activity className="h-4 w-4" /> Abrir Odontograma
                  </button>
                </div>

                {/* Informações do paciente */}
                <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-500" /> Alertas Médicos
                  </h2>
                  {medicalHistory ? (
                    <div className="space-y-2">
                      {medicalHistory.allergies && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5">
                          <p className="text-xs font-medium text-red-700 dark:text-red-400">Alergias</p>
                          <p className="text-sm text-red-600 dark:text-red-300">{medicalHistory.allergies}</p>
                        </div>
                      )}
                      {medicalHistory.chronicDiseases && (
                        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2.5">
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Condições crônicas</p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">{medicalHistory.chronicDiseases}</p>
                        </div>
                      )}
                      {medicalHistory.currentMedications && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Medicações</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">{medicalHistory.currentMedications}</p>
                        </div>
                      )}
                      {medicalHistory.surgeryHistory && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cirurgias</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{medicalHistory.surgeryHistory}</p>
                        </div>
                      )}
                      {!medicalHistory.allergies && !medicalHistory.chronicDiseases && !medicalHistory.currentMedications && !medicalHistory.surgeryHistory && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma condição registrada</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma condição registrada</p>
                  )}
                  <Link to={`/anamnesis`} className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
                    <FileText className="h-4 w-4" /> Ver Anamnese
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Odontograma */}
          {activeTab === 'odontogram' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Clique em um dente para selecioná-lo e informar sua condição</p>
                  <div className="flex items-center gap-2">
                    {multiSelectedTeeth.length > 0 && (
                      <span className="text-xs font-medium text-warning-600 bg-warning-50 dark:bg-warning-900/20 px-2 py-1 rounded-full">
                        {multiSelectedTeeth.length} selecionados
                      </span>
                    )}
                    <button onClick={handleMultiSelectMode}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        multiSelectedTeeth.length > 0
                          ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 border border-warning-300'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {multiSelectedTeeth.length > 0 ? 'Sair Multi-Seleção' : 'Seleção Múltipla'}
                    </button>
                    <button onClick={clearSelection} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RotateCcw className="h-3 w-3" /> Limpar Seleção
                    </button>
                  </div>
                </div>

                <h3 className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Arcada Superior</h3>
                <div className="space-y-2">{renderToothRow(UPPER_RIGHT, 'Dir.')}{renderToothRow(UPPER_LEFT, 'Esq.')}</div>
                <div className="my-4 border-t border-dashed dark:border-gray-700" />
                <h3 className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Arcada Inferior</h3>
                <div className="space-y-2">{renderToothRow(LOWER_LEFT, 'Esq.')}{renderToothRow(LOWER_RIGHT, 'Dir.')}</div>

                {/* Legenda */}
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {Object.entries(TOOTH_CONDITIONS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: val.bg, borderColor: val.color }} />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{val.label}</span>
                    </div>
                  ))}
                </div>

                {/* Hover tooltip */}
                {hoveredTooth && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-gray-900 dark:text-gray-100">Dente {hoveredTooth}</strong>
                      {getToothConditions(teeth, hoveredTooth).length > 0 && (
                        <span className="text-xs text-gray-400">({getToothConditions(teeth, hoveredTooth).length} registro(s))</span>
                      )}
                    </div>
                    {getToothConditions(teeth, hoveredTooth).length > 0 ? (
                      <ul className="space-y-0.5">
                        {getToothConditions(teeth, hoveredTooth).map((c: any, i: number) => {
                          const cond = TOOTH_CONDITIONS[c.condition];
                          return (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium" style={{ color: cond?.color }}>{cond?.label}</span>
                              {c.surface && <span> ({c.surface})</span>}
                              {c.notes && <span> — {c.notes}</span>}
                              {c.createdAt && <span className="text-gray-400"> • {formatDate(c.createdAt)}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">Saudável</span>
                    )}
                  </div>
                )}
              </div>

              {/* Painel lateral */}
              <div className="rounded-xl bg-white dark:bg-gray-900 p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {multiSelectedTeeth.length > 0
                      ? `${multiSelectedTeeth.length} dentes selecionados`
                      : selectedTooth
                      ? `Dente ${selectedTooth}`
                      : 'Nenhum dente selecionado'}
                  </h3>
                  {(selectedTooth || multiSelectedTeeth.length > 0) && (
                    <button onClick={clearSelection} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> Limpar
                    </button>
                  )}
                </div>

                {(selectedTooth || multiSelectedTeeth.length > 0) ? (
                  <div className="space-y-4">
                    {selectedTooth && getToothConditions(teeth, selectedTooth).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">Condições atuais</p>
                        {getToothConditions(teeth, selectedTooth).map((c: any) => {
                          const cond = TOOTH_CONDITIONS[c.condition];
                          return (
                            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2" style={{ backgroundColor: cond?.bg }}>
                              <div>
                                <span className="text-sm font-medium" style={{ color: cond?.color }}>{cond?.label}</span>
                                {c.surface && <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({c.surface})</span>}
                                {c.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{c.notes}</p>}
                              </div>
                              <button onClick={() => removeToothMutation.mutate(c.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Condição</label>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {MOST_USED.map((key) => {
                          const val = TOOTH_CONDITIONS[key];
                          const isActive = toothCondition === key;
                          return (
                            <button key={key} onClick={() => { setToothCondition(key); setHasChanges(true); }}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium border transition-all ${
                                isActive ? 'ring-2 ring-primary shadow-sm' : 'hover:shadow-sm'
                              }`}
                              style={{
                                backgroundColor: isActive ? val.bg : 'transparent',
                                borderColor: isActive ? val.color : '#e5e7eb',
                                color: val.color,
                              }}
                            >
                              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: val.color }} />
                              {val.label}
                            </button>
                          );
                        })}
                      </div>
                      <select value={toothCondition} onChange={(e) => { setToothCondition(e.target.value); setHasChanges(true); }}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none">
                        <optgroup label="Mais usadas">
                          {MOST_USED.map((key) => <option key={key} value={key}>{TOOTH_CONDITIONS[key].label}</option>)}
                        </optgroup>
                        <optgroup label="Outras">
                          {Object.entries(TOOTH_CONDITIONS).filter(([k]) => !MOST_USED.includes(k)).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Face</label>
                      <select value={toothSurface} onChange={(e) => { setToothSurface(e.target.value); setHasChanges(true); }}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none">
                        <option value="">Todas</option>
                        <option value="M">Mesial</option><option value="D">Distal</option><option value="O">Oclusal</option>
                        <option value="V">Vestibular</option><option value="L">Lingual</option>
                        <option value="MOD">M-O-D</option><option value="MO">M-O</option><option value="DO">D-O</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                      <input type="text" value={toothNotes} onChange={(e) => { setToothNotes(e.target.value); setHasChanges(true); }}
                        placeholder="Ex: cárie profunda, sensível ao frio..." className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    </div>

                    {savedOk && (
                      <div className="flex items-center gap-2 rounded-lg bg-success-50 dark:bg-success-900/20 px-3 py-2 text-sm text-success-600 dark:text-success-400">
                        <CheckCircle className="h-4 w-4" /> Condição salva com sucesso
                      </div>
                    )}

                    {multiSelectedTeeth.length > 0 ? (
                      <button onClick={applyConditionToAll} disabled={addToothMutation.isPending}
                        className="w-full rounded-lg bg-warning-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-warning-600 disabled:opacity-50">
                        {addToothMutation.isPending ? 'Salvando...' : `Aplicar em ${multiSelectedTeeth.length} dentes`}
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSaveTooth()} disabled={addToothMutation.isPending}
                          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                          {addToothMutation.isPending ? 'Salvando...' : 'Salvar Condição'}
                        </button>
                        <button onClick={() => { handleSaveTooth(); navigate('/treatment-plans'); }}
                          className="w-full rounded-lg border border-success-500 px-4 py-2 text-sm font-medium text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20">
                          Salvar e Vincular a Orçamento
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Clique em um dente para registrar condição</p>
                    <p className="text-xs text-gray-400 mt-1">Use "Seleção Múltipla" para aplicar a mesma condição em vários dentes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registros */}
          {activeTab === 'records' && (
            <div className="rounded-xl bg-white dark:bg-gray-900 shadow-card">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Registros Clínicos</h3>
                <Link to={`/clinical-records`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                  <PlusCircle className="h-3.5 w-3.5" /> Novo Registro
                </Link>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {!records || records.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum registro clínico encontrado</div>
                ) : (
                  records.map((record: any) => (
                    <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.diagnosis || 'Sem diagnóstico'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{record.procedure?.name && `${record.procedure.name} • `}{formatDate(record.createdAt)}</p>
                        </div>
                      </div>
                      {record.treatmentDone && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{record.treatmentDone}</p>}
                      {record.observations && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{record.observations}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Planos */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Planos de Tratamento</h3>
                <Link to={`/treatment-plans`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">
                  <PlusCircle className="h-3.5 w-3.5" /> Novo Plano
                </Link>
              </div>
              {!planList || planList.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-card text-center text-sm text-gray-400 dark:text-gray-500">Nenhum plano de tratamento encontrado</div>
              ) : (
                planList.map((plan: any) => {
                  const ps = PLAN_STATUS[plan.status] || PLAN_STATUS.PROPOSED;
                  return (
                    <div key={plan.id} className="rounded-xl bg-white dark:bg-gray-900 p-5 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ps.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} /> {ps.label}
                        </span>
                      </div>
                      {plan.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{plan.description}</p>}
                      {plan.items && plan.items.length > 0 && (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                          {plan.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between px-3 py-2">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-gray-100">{item.procedure?.name || item.description}</p>
                                {item.toothNumber && <p className="text-xs text-gray-500 dark:text-gray-400">Dente {item.toothNumber}</p>}
                              </div>
                              {item.estimatedPrice && <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number(item.estimatedPrice))}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
