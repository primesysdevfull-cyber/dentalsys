import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Search, User, ChevronDown, Save, X, Phone, Mail, MapPin, Heart, Shield, Baby, AlertTriangle, Loader2 } from 'lucide-react';
import { maskPhone } from '../utils';

export function AnamnesisPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', cpf: '', rg: '', birthDate: '', gender: '',
    email: '', phone: '', whatsapp: '',
    address: '', city: '', state: '', zipCode: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    allergies: '', chronicDiseases: '', currentMedications: '',
    pastSurgeries: '', familyHistory: '', dentalHistory: '',
    smokingAlcohol: '', pregnancy: false, pregnancyMonth: '', specialConditions: '',
    insuranceId: '', insuranceNumber: '', insuranceValidUntil: '',
    legalGuardianName: '', legalGuardianCpf: '', legalGuardianPhone: '', legalGuardianRelation: '',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['patients-search', searchTerm],
    queryFn: () => api.get(`/patients?search=${searchTerm}&limit=10`).then((r) => r.data),
    enabled: searchTerm.length >= 2,
  });

  const { data: insurances } = useQuery({
    queryKey: ['insurances'],
    queryFn: () => api.get('/insurances').then((r) => r.data),
  });

  const { data: patientData } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => api.get(`/patients/${selectedPatientId}`).then((r) => r.data),
    enabled: !!selectedPatientId,
  });

  useEffect(() => {
    if (patientData) {
      const p = patientData;
      const mh = p.medicalHistory || {};
      setForm({
        name: p.name || '',
        cpf: p.cpf || '',
        rg: p.rg || '',
        birthDate: p.birthDate ? p.birthDate.split('T')[0] : '',
        gender: p.gender || '',
        email: p.email || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        zipCode: p.zipCode || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergencyContactRelation || '',
        allergies: mh.allergies || '',
        chronicDiseases: mh.chronicDiseases || '',
        currentMedications: mh.currentMedications || '',
        pastSurgeries: mh.pastSurgeries || '',
        familyHistory: mh.familyHistory || '',
        dentalHistory: mh.dentalHistory || '',
        smokingAlcohol: mh.smokingAlcohol || '',
        pregnancy: mh.pregnancy || false,
        pregnancyMonth: mh.pregnancyMonth ? String(mh.pregnancyMonth) : '',
        specialConditions: mh.specialConditions || '',
        insuranceId: p.insuranceId || '',
        insuranceNumber: p.insuranceNumber || '',
        insuranceValidUntil: p.insuranceValidUntil ? p.insuranceValidUntil.split('T')[0] : '',
        legalGuardianName: p.legalGuardianName || '',
        legalGuardianCpf: p.legalGuardianCpf || '',
        legalGuardianPhone: p.legalGuardianPhone || '',
        legalGuardianRelation: p.legalGuardianRelation || '',
      });
    }
  }, [patientData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/patients/${selectedPatientId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', selectedPatientId] });
      setSaving(false);
    },
    onError: (e: any) => {
      setSaving(false);
      alert(e?.response?.data?.message || 'Erro ao salvar anamnese');
    },
  });

  function handleSelectPatient(patient: any) {
    setSelectedPatientId(patient.id);
    setShowResults(false);
    setSearchTerm(patient.name);
  }

  function clearSelection() {
    setSelectedPatientId(null);
    setSearchTerm('');
    setForm({
      name: '', cpf: '', rg: '', birthDate: '', gender: '',
      email: '', phone: '', whatsapp: '',
      address: '', city: '', state: '', zipCode: '',
      emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
      allergies: '', chronicDiseases: '', currentMedications: '',
      pastSurgeries: '', familyHistory: '', dentalHistory: '',
      smokingAlcohol: '', pregnancy: false, pregnancyMonth: '', specialConditions: '',
      insuranceId: '', insuranceNumber: '', insuranceValidUntil: '',
      legalGuardianName: '', legalGuardianCpf: '', legalGuardianPhone: '', legalGuardianRelation: '',
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) return;
    setSaving(true);

    const payload: any = {
      name: form.name,
      cpf: form.cpf || undefined,
      rg: form.rg || undefined,
      birthDate: form.birthDate || undefined,
      gender: form.gender || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zipCode: form.zipCode || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      emergencyContactRelation: form.emergencyContactRelation || undefined,
      insuranceId: form.insuranceId || undefined,
      insuranceNumber: form.insuranceNumber || undefined,
      insuranceValidUntil: form.insuranceValidUntil || undefined,
      legalGuardianName: form.legalGuardianName || undefined,
      legalGuardianCpf: form.legalGuardianCpf || undefined,
      legalGuardianPhone: form.legalGuardianPhone || undefined,
      legalGuardianRelation: form.legalGuardianRelation || undefined,
      medicalHistory: {
        allergies: form.allergies || undefined,
        chronicDiseases: form.chronicDiseases || undefined,
        currentMedications: form.currentMedications || undefined,
        pastSurgeries: form.pastSurgeries || undefined,
        familyHistory: form.familyHistory || undefined,
        dentalHistory: form.dentalHistory || undefined,
        smokingAlcohol: form.smokingAlcohol || undefined,
        pregnancy: form.pregnancy,
        pregnancyMonth: form.pregnancyMonth ? Number(form.pregnancyMonth) : undefined,
        specialConditions: form.specialConditions || undefined,
      },
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    if (payload.medicalHistory) {
      Object.keys(payload.medicalHistory).forEach((k) => {
        if (payload.medicalHistory[k] === undefined) delete payload.medicalHistory[k];
      });
    }

    updateMutation.mutate(payload);
  }

  const patients = searchResults?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Anamnese</h1>
          <p className="text-gray-500 dark:text-gray-400">Histórico médico do paciente</p>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar paciente por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary"
            />
            {selectedPatientId && (
              <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showResults && searchTerm.length >= 2 && patients.length > 0 && !selectedPatientId && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {patients.map((patient: any) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 dark:hover:bg-gray-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dental-100 text-sm font-semibold text-dental-700">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {patient.cpf && `CPF: ${patient.cpf}`}
                    {patient.phone && ` | Tel: ${patient.phone}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchTerm.length >= 2 && patients.length === 0 && !selectedPatientId && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
            Nenhum paciente encontrado
          </div>
        )}
      </div>

      {selectedPatientId && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <User className="h-5 w-5 text-dental-500" />
                Informações Pessoais
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CPF</label>
                  <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">RG</label>
                  <input type="text" value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Data de Nascimento</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Gênero</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary">
                    <option value="">Selecionar...</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">WhatsApp</label>
                  <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                Endereço
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Logradouro</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CEP</label>
                  <input type="text" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Cidade</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Phone className="h-5 w-5 text-orange-400" />
                Contato de Emergência
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome</label>
                  <input type="text" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefone</label>
                  <input type="text" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: maskPhone(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Parentesco</label>
                  <input type="text" value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Heart className="h-5 w-5 text-red-500" />
                Histórico Médico
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Alergias</label>
                  <textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Doenças Crônicas</label>
                  <textarea value={form.chronicDiseases} onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Medicações em Uso</label>
                  <textarea value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Cirurgias Passadas</label>
                  <textarea value={form.pastSurgeries} onChange={(e) => setForm({ ...form, pastSurgeries: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Histórico Familiar</label>
                  <textarea value={form.familyHistory} onChange={(e) => setForm({ ...form, familyHistory: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Histórico Odontológico</label>
                  <textarea value={form.dentalHistory} onChange={(e) => setForm({ ...form, dentalHistory: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Tabagismo / Alcoolismo</label>
                  <textarea value={form.smokingAlcohol} onChange={(e) => setForm({ ...form, smokingAlcohol: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Condições Especiais</label>
                  <textarea value={form.specialConditions} onChange={(e) => setForm({ ...form, specialConditions: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.pregnancy} onChange={(e) => setForm({ ...form, pregnancy: e.target.checked, pregnancyMonth: e.target.checked ? form.pregnancyMonth : '' })} className="h-4 w-4 rounded border-gray-300 text-dental-600 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Gestante</span>
                </label>
                {form.pregnancy && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Mês de gestação:</label>
                    <input type="number" min={1} max={9} value={form.pregnancyMonth} onChange={(e) => setForm({ ...form, pregnancyMonth: e.target.value })} className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Shield className="h-5 w-5 text-blue-500" />
                Convênio
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Convênio</label>
                  <select value={form.insuranceId} onChange={(e) => setForm({ ...form, insuranceId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary">
                    <option value="">Particular / Sem convênio</option>
                    {(insurances || []).map((ins: any) => (
                      <option key={ins.id} value={ins.id}>{ins.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Número da Carteirinha</label>
                  <input type="text" value={form.insuranceNumber} onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Validade</label>
                  <input type="date" value={form.insuranceValidUntil} onChange={(e) => setForm({ ...form, insuranceValidUntil: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Baby className="h-5 w-5 text-purple-500" />
                Responsável Legal (para menores)
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome</label>
                  <input type="text" value={form.legalGuardianName} onChange={(e) => setForm({ ...form, legalGuardianName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CPF</label>
                  <input type="text" value={form.legalGuardianCpf} onChange={(e) => setForm({ ...form, legalGuardianCpf: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefone</label>
                  <input type="text" value={form.legalGuardianPhone} onChange={(e) => setForm({ ...form, legalGuardianPhone: maskPhone(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Parentesco</label>
                  <input type="text" value={form.legalGuardianRelation} onChange={(e) => setForm({ ...form, legalGuardianRelation: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
              >
                {saving || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving || updateMutation.isPending ? 'Salvando...' : 'Salvar Anamnese'}
              </button>
            </div>
          </div>
        </form>
      )}

      {!selectedPatientId && (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <User className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Selecione um paciente</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Busque por nome, CPF ou telefone para iniciar o preenchimento da anamnese</p>
        </div>
      )}
    </div>
  );
}
