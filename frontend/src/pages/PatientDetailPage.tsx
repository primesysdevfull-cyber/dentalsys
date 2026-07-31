import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency, formatDate, formatCPF, formatPhone, getStatusLabel, getStatusColor } from '../utils';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Shield, Calendar, Stethoscope, FileText, Heart,
  PenSquare, PlusCircle, ClipboardList, Activity, AlertCircle, Clock, DollarSign,
  ChevronRight, Loader2, Baby, Users,
} from 'lucide-react';

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    PROPOSED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    ACCEPTED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

const statusDot = (status: string) => {
  const colors: Record<string, string> = {
    PROPOSED: 'bg-gray-400 dark:bg-gray-500',
    ACCEPTED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-400 dark:bg-gray-500';
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: records } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: () => api.get(`/clinical-records/patient/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => api.get(`/appointments?patientId=${id}&limit=10`).then((r) => r.data),
    enabled: !!id,
  });
  const appointments = appointmentsData?.data || [];

  if (isLoading) return <div className="py-12 text-center text-[#6B7280]">Carregando...</div>;
  if (!patient) return <div className="py-12 text-center text-[#6B7280]">Paciente não encontrado</div>;

  const genderLabel = patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Feminino' : patient.gender || '-';
  const plans = patient.treatmentPlans || [];
  const totalEstimated = plans.reduce((s: number, p: any) => s + Number(p.totalEstimate || 0), 0);
  const totalItems = plans.reduce((s: number, p: any) => s + (p.items?.length || 0), 0);
  const completedPlans = plans.filter((p: any) => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Top bar: Voltar + Ações rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex flex-wrap gap-2">
          <Link to={`/patients/${id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
            <PenSquare className="h-4 w-4" /> Editar
          </Link>
          <Link to="/appointments" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Calendar className="h-4 w-4" /> Novo Agendamento
          </Link>
          <Link to={`/clinical-records?patientId=${id}&newTreatment=true`} className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors">
            <PlusCircle className="h-4 w-4" /> Novo Tratamento
          </Link>
        </div>
      </div>

      {/* Dados do Paciente */}
      <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
        <div className="flex flex-wrap items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700 shrink-0">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#1F2937]">{patient.name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-[#6B7280]">
              {patient.cpf && <span>CPF: {formatCPF(patient.cpf)}</span>}
              {patient.birthDate && <span>Nasc: {formatDate(patient.birthDate)}</span>}
              {patient.gender && <span>Sexo: {genderLabel}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.phone && (
                <span className="flex items-center gap-1 rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#6B7280] border border-[#E5E7EB]">
                  <Phone className="h-3 w-3" /> {formatPhone(patient.phone)}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1 rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#6B7280] border border-[#E5E7EB]">
                  <Mail className="h-3 w-3" /> {patient.email}
                </span>
              )}
              {patient.insurance && (
                <span className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700 border border-primary-100">
                  <Shield className="h-3 w-3" /> {patient.insurance.name}
                  {patient.insuranceNumber && ` (${patient.insuranceNumber})`}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-[#6B7280] shrink-0">
            <p>{patient._count?.appointments || 0} agendamentos</p>
            <p>{patient._count?.clinicalRecords || 0} registros</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Tratamentos */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                <h2 className="text-base font-semibold text-[#1F2937]">Tratamentos</h2>
              </div>
              <Link to={`/clinical-records?patientId=${id}&newTreatment=true`} className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-600 transition-colors">
                <PlusCircle className="h-3.5 w-3.5" /> Novo Tratamento
              </Link>
            </div>

            {plans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left py-2.5 px-2 font-medium text-[#6B7280] text-xs">Descrição</th>
                      <th className="text-left py-2.5 px-2 font-medium text-[#6B7280] text-xs">Status</th>
                      <th className="text-left py-2.5 px-2 font-medium text-[#6B7280] text-xs">Início</th>
                      <th className="text-left py-2.5 px-2 font-medium text-[#6B7280] text-xs">Valor</th>
                      <th className="text-left py-2.5 px-2 font-medium text-[#6B7280] text-xs">Itens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan: any) => (
                      <tr key={plan.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                        <td className="py-3 px-2">
                          <Link to={`/treatment-plans?planId=${plan.id}`} className="font-medium text-[#1F2937] hover:text-primary-600">
                            {plan.title}
                          </Link>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(plan.status)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDot(plan.status)}`} />
                            {getStatusLabel(plan.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#6B7280]">{plan.startDate ? formatDate(plan.startDate) : '-'}</td>
                        <td className="py-3 px-2 font-medium text-[#1F2937]">{plan.totalEstimate ? formatCurrency(Number(plan.totalEstimate)) : '-'}</td>
                        <td className="py-3 px-2 text-[#6B7280]">{plan.items?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="h-8 w-8 text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Nenhum tratamento cadastrado.</p>
                <Link to={`/clinical-records?patientId=${id}&newTreatment=true`} className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
                  <PlusCircle className="h-3.5 w-3.5" /> Clique para criar um novo tratamento
                </Link>
              </div>
            )}
          </div>

          {/* Prontuário */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-[#1F2937]">Prontuário</h2>
            </div>
            {records?.length > 0 ? (
              <div className="space-y-2">
                {records.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">{record.procedure?.name || 'Atendimento'}</p>
                      {record.diagnosis && <p className="text-xs text-[#6B7280] mt-0.5">{record.diagnosis}</p>}
                    </div>
                    <div className="text-right text-xs text-[#6B7280]">{formatDate(record.createdAt)}</div>
                  </div>
                ))}
                <Link to={`/clinical-records?patientId=${id}`} className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
                  Ver Prontuário Completo <ChevronRight className="inline h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Nenhum registro clínico.</p>
                <Link to={`/clinical-records?patientId=${id}`} className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
                  <PlusCircle className="h-3.5 w-3.5" /> Criar Registro
                </Link>
              </div>
            )}
          </div>

          {/* Histórico de Agendamentos */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-[#1F2937]">Histórico de Consultas</h2>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-2">
                {appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="h-4 w-4 text-[#6B7280] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1F2937]">{apt.procedure?.name || 'Consulta'} • {apt.professional?.name}</p>
                        <p className="text-xs text-[#6B7280]">{formatDate(apt.startTime)} às {new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ml-3 ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-[#E5E7EB] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Nenhuma consulta registrada.</p>
                <Link to="/appointments" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mt-2 font-medium">
                  <PlusCircle className="h-3.5 w-3.5" /> Novo Agendamento
                </Link>
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
              <h2 className="text-base font-semibold text-[#1F2937]">Resumo Financeiro</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Total em Tratamentos</span>
                <span className="text-sm font-semibold text-[#1F2937]">{formatCurrency(totalEstimated)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Planos Ativos</span>
                <span className="text-sm font-semibold text-[#1F2937]">{plans.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Concluídos</span>
                <span className="text-sm font-semibold text-success-600">{completedPlans}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Cancelados</span>
                <span className="text-sm font-semibold text-red-600">{plans.filter((p: any) => p.status === 'CANCELLED').length}</span>
              </div>
            </div>
          </div>

          {/* Odontograma */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-[#1F2937]">Odontograma</h2>
            </div>
            <p className="text-sm text-[#6B7280] mb-3">
              {patient.odontogram?.teeth?.length || 0} condições registradas
            </p>
            <Link to={`/clinical-records?patientId=${id}`} className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
              <Activity className="h-4 w-4" /> Abrir Odontograma
            </Link>
          </div>

          {/* Histórico Médico */}
          {patient.medicalHistory && (
            <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-semibold text-[#1F2937]">Histórico Médico</h2>
              </div>
              <div className="space-y-2 text-sm">
                {patient.medicalHistory.allergies && (
                  <p><span className="text-[#6B7280]">Alergias:</span> {patient.medicalHistory.allergies}</p>
                )}
                {patient.medicalHistory.chronicDiseases && (
                  <p><span className="text-[#6B7280]">Doenças Crônicas:</span> {patient.medicalHistory.chronicDiseases}</p>
                )}
                {patient.medicalHistory.currentMedications && (
                  <p><span className="text-[#6B7280]">Medicamentos:</span> {patient.medicalHistory.currentMedications}</p>
                )}
                {!patient.medicalHistory.allergies && !patient.medicalHistory.chronicDiseases && !patient.medicalHistory.currentMedications && (
                  <p className="text-[#9CA3AF]">Nenhuma informação registrada</p>
                )}
              </div>
            </div>
          )}

          {/* Anamnese */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-[#1F2937]">Anamnese</h2>
            </div>
            <Link to={`/anamnesis?patientId=${id}`} className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
              <ClipboardList className="h-4 w-4" /> Acessar Anamnese
            </Link>
          </div>

          {/* Endereço */}
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-[#6B7280]" />
              <h2 className="text-base font-semibold text-[#1F2937]">Endereço</h2>
            </div>
            {patient.address ? (
              <div className="text-sm text-[#6B7280]">
                <p>{patient.address}</p>
                {patient.city && patient.state && <p>{patient.city} - {patient.state}</p>}
                {patient.zipCode && <p className="mt-0.5">CEP: {patient.zipCode}</p>}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">Nenhum endereço cadastrado</p>
            )}
          </div>

          {/* Contato de Emergência */}
          {patient.emergencyContactName && (
            <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-warning-500" />
                <h2 className="text-base font-semibold text-[#1F2937]">Contato de Emergência</h2>
              </div>
              <p className="text-sm font-medium text-[#1F2937]">{patient.emergencyContactName}</p>
              {patient.emergencyContactRelation && <p className="text-xs text-[#6B7280]">{patient.emergencyContactRelation}</p>}
              {patient.emergencyContactPhone && <p className="text-sm text-[#6B7280] mt-1">{formatPhone(patient.emergencyContactPhone)}</p>}
            </div>
          )}

          {/* Responsável (menor de idade) */}
          {patient.legalGuardianName && (
            <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Baby className="h-5 w-5 text-primary-600" />
                <h2 className="text-base font-semibold text-[#1F2937]">Responsável</h2>
              </div>
              <p className="text-sm font-medium text-[#1F2937]">{patient.legalGuardianName}</p>
              {patient.legalGuardianCpf && <p className="text-xs text-[#6B7280]">CPF: {patient.legalGuardianCpf}</p>}
              {patient.legalGuardianPhone && <p className="text-sm text-[#6B7280] mt-1">{formatPhone(patient.legalGuardianPhone)}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
