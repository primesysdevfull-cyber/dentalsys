import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatDate, formatCPF, formatPhone, getStatusLabel, getStatusColor } from '../utils';
import {
  User, Phone, Mail, MapPin, Shield, Heart,
  FileText, Calendar, Stethoscope,
} from 'lucide-react';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

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

  if (isLoading) {
    return <div className="py-12 text-center text-gray-400">Carregando...</div>;
  }

  if (!patient) {
    return <div className="py-12 text-center text-gray-400">Paciente não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dental-100 text-2xl font-bold text-dental-700">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              {patient.cpf && <span>CPF: {formatCPF(patient.cpf)}</span>}
              {patient.birthDate && <span>Nascimento: {formatDate(patient.birthDate)}</span>}
              {patient.gender && <span>{patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Feminino' : 'Outro'}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {patient.phone && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  <Phone className="h-3 w-3" /> {formatPhone(patient.phone)}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  <Mail className="h-3 w-3" /> {patient.email}
                </span>
              )}
              {patient.insurance && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  <Shield className="h-3 w-3" /> {patient.insurance.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{patient._count?.appointments || 0} agendamentos</p>
            <p>{patient._count?.clinicalRecords || 0} registros clínicos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {patient.medicalHistory && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Heart className="h-5 w-5 text-red-500" />
                Histórico Médico
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                {patient.medicalHistory.allergies && (
                  <div>
                    <p className="font-medium text-gray-700">Alergias</p>
                    <p className="text-gray-600">{patient.medicalHistory.allergies}</p>
                  </div>
                )}
                {patient.medicalHistory.chronicDiseases && (
                  <div>
                    <p className="font-medium text-gray-700">Doenças Crônicas</p>
                    <p className="text-gray-600">{patient.medicalHistory.chronicDiseases}</p>
                  </div>
                )}
                {patient.medicalHistory.currentMedications && (
                  <div>
                    <p className="font-medium text-gray-700">Medicamentos em Uso</p>
                    <p className="text-gray-600">{patient.medicalHistory.currentMedications}</p>
                  </div>
                )}
                {patient.medicalHistory.dentalHistory && (
                  <div>
                    <p className="font-medium text-gray-700">Histórico Odontológico</p>
                    <p className="text-gray-600">{patient.medicalHistory.dentalHistory}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 text-blue-500" />
              Prontuário
            </h3>
            {records?.length > 0 ? (
              <div className="space-y-3">
                {records.slice(0, 10).map((record: any) => (
                  <div key={record.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{record.procedure?.name || 'Atendimento'}</p>
                      <p className="text-xs text-gray-400">{formatDate(record.createdAt)}</p>
                    </div>
                    {record.diagnosis && (
                      <p className="mt-1 text-sm text-gray-600">Diagnóstico: {record.diagnosis}</p>
                    )}
                    {record.treatmentDone && (
                      <p className="mt-1 text-sm text-gray-600">Tratamento: {record.treatmentDone}</p>
                    )}
                  </div>
                ))}
                <Link to="/clinical-records" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dental-200 bg-dental-50 py-2.5 text-sm font-medium text-dental-700 hover:bg-dental-100">
                  Ver Prontuário Completo
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="py-4 text-sm text-gray-400">Nenhum registro clínico</p>
                <Link to="/clinical-records" className="inline-flex items-center gap-2 rounded-lg border border-dental-200 bg-dental-50 px-4 py-2 text-sm font-medium text-dental-700 hover:bg-dental-100">
                  Criar Registro
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {patient.address && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5 text-gray-400" />
                Endereço
              </h3>
              <p className="text-sm text-gray-600">{patient.address}</p>
              {patient.city && patient.state && (
                <p className="text-sm text-gray-600">
                  {patient.city} - {patient.state}
                </p>
              )}
              {patient.zipCode && (
                <p className="text-sm text-gray-500">CEP: {patient.zipCode}</p>
              )}
            </div>
          )}

          {patient.emergencyContactName && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Contato de Emergência</h3>
              <p className="text-sm font-medium">{patient.emergencyContactName}</p>
              <p className="text-sm text-gray-500">{patient.emergencyContactRelation}</p>
              <p className="text-sm text-gray-600">{formatPhone(patient.emergencyContactPhone)}</p>
            </div>
          )}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Stethoscope className="h-5 w-5 text-dental-500" />
              Odontograma
            </h3>
            <p className="text-sm text-gray-500">
              {patient.odontogram?.teeth?.length || 0} condições registradas
            </p>
            <Link
              to={`/clinical-records?patientId=${id}`}
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-dental-200 bg-dental-50 py-2 text-sm font-medium text-dental-700 hover:bg-dental-100"
            >
              Abrir Odontograma
            </Link>
          </div>

          {patient.treatmentPlans?.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Planos de Tratamento</h3>
              {patient.treatmentPlans.map((plan: any) => (
                <div key={plan.id} className="mb-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">{plan.title}</p>
                  <p className="text-xs text-gray-500">
                    {plan.items?.length || 0} etapas •{' '}
                    <span className={`font-medium ${getStatusColor(plan.status)}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
