import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate, formatCPF, formatPhone, maskCPF } from '../utils';
import { Plus, Search, Phone, Mail, Filter, X, MessageCircle, FileText, MapPin, Loader2 } from 'lucide-react';

export function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', cpf: '', phone: '', email: '', gender: '', birthDate: '',
    address: '', city: '', state: '', zipCode: '', insuranceNumber: '',
    notes: '',
  });
  const [fetchingCep, setFetchingCep] = useState(false);

  async function handleCepLookup(cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          zipCode: cep,
        }));
      }
    } catch {
      // silencioso
    } finally {
      setFetchingCep(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () =>
      api
        .get(`/patients?search=${search}&page=${page}&limit=20`)
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/patients', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao cadastrar paciente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/patients/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar paciente'),
  });

  function openCreate() {
    setEditingPatient(null);
    setFormData({ name: '', cpf: '', phone: '', email: '', gender: '', birthDate: '', address: '', city: '', state: '', zipCode: '', insuranceNumber: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(patient: any) {
    setEditingPatient(patient);
    setFormData({
      name: patient.name || '',
      cpf: patient.cpf || '',
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender || '',
      birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      insuranceNumber: patient.insuranceNumber || '',
      notes: patient.notes || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPatient(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { name: formData.name };
    if (formData.cpf) payload.cpf = formData.cpf;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.email) payload.email = formData.email;
    if (formData.gender) payload.gender = formData.gender;
    if (formData.birthDate) payload.birthDate = formData.birthDate;
    if (formData.address) payload.address = formData.address;
    if (formData.city) payload.city = formData.city;
    if (formData.state) payload.state = formData.state;
    if (formData.zipCode) payload.zipCode = formData.zipCode;
    if (formData.insuranceNumber) payload.insuranceNumber = formData.insuranceNumber;
    if (formData.notes) payload.notes = formData.notes;

    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500">Gerenciar cadastro de pacientes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, email ou telefone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">CPF</th>
                <th className="px-6 py-3">Contato</th>
                <th className="px-6 py-3">Convênio</th>
                <th className="px-6 py-3">Prontuário</th>
                <th className="px-6 py-3">Cadastro</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                data?.data?.map((patient: any) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dental-100 text-sm font-semibold text-dental-700">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-500">
                            {patient._count?.appointments || 0} agendamentos
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.cpf ? formatCPF(patient.cpf) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {patient.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {formatPhone(patient.phone)}
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                      )}
                      {(patient.whatsapp || patient.phone) && (
                        <a
                          href={`https://wa.me/${(patient.whatsapp || patient.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.insurance?.name || 'Particular'}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/clinical-records`} className="inline-flex items-center gap-1.5 text-sm font-medium text-dental-600 hover:text-dental-700">
                        <FileText className="h-3.5 w-3.5" />
                        {patient._count?.clinicalRecords || 0} registro(s)
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(patient.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(patient)} className="text-sm font-medium text-dental-600 hover:text-dental-700">
                          Editar
                        </button>
                        <Link to={`/patients/${patient.id}`} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                          Detalhes
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <p className="text-sm text-gray-500">
              Mostrando {data.data.length} de {data.meta.total} pacientes
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm">
                {page} / {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gênero</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Selecionar...</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">UF</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} maxLength={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      onBlur={(e) => handleCepLookup(e.target.value)}
                      placeholder="00000-000"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                    />
                    {fetchingCep && (
                      <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-dental-500" />
                    )}
                    {!fetchingCep && formData.zipCode.replace(/\D/g, '').length === 8 && (
                      <MapPin className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingPatient ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
