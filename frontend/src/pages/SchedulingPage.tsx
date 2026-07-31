import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Calendar, Clock, Search, X, UserCheck, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusLabel, getStatusColor } from '../utils';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

export function SchedulingPage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookProcedureId, setBookProcedureId] = useState('');

  const { data: professionalsData } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => api.get('/professionals').then((r) => r.data),
  });

  const { data: slotsData, isFetching: slotsLoading } = useQuery({
    queryKey: ['available-slots', selectedProfId, selectedDate],
    queryFn: () =>
      api
        .get(`/appointments/available-slots?professionalId=${selectedProfId}&date=${selectedDate}`)
        .then((r) => r.data),
    enabled: !!selectedProfId,
  });

  const { data: dayApptsData } = useQuery({
    queryKey: ['appointments-day', selectedProfId, selectedDate],
    queryFn: () =>
      api
        .get(
          `/appointments?professionalId=${selectedProfId}&startDate=${selectedDate}T00:00:00&endDate=${selectedDate}T23:59:59`,
        )
        .then((r) => r.data),
    enabled: !!selectedProfId,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { limit: 500 }],
    queryFn: () => api.get('/patients?limit=500').then((r) => r.data),
  });

  const { data: proceduresData } = useQuery({
    queryKey: ['procedures', { limit: 500 }],
    queryFn: () => api.get('/procedures?limit=500').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/appointments', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-day'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao agendar'),
  });

  const professionals: any[] = professionalsData?.data || [];
  const dentists = professionals.filter((p: any) => p.user?.role === 'DENTIST' || !p.user?.role);
  const patients: any[] = patientsData?.data || [];
  const procedures: any[] = proceduresData?.data || [];
  const slots: string[] = slotsData?.slots || [];
  const dayAppointments: any[] = dayApptsData?.data || [];

  const filteredPatients = searchTerm
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cpf?.includes(searchTerm),
      )
    : patients;

  const appointmentsByHour = useMemo(() => {
    const map: Record<number, any[]> = {};
    dayAppointments.forEach((apt: any) => {
      const hour = new Date(apt.startTime).getHours();
      if (!map[hour]) map[hour] = [];
      map[hour].push(apt);
    });
    return map;
  }, [dayAppointments]);

  function openBooking(slotIso: string) {
    setSelectedSlot(slotIso);
    setBookPatientId('');
    setBookProcedureId('');
    setSearchTerm('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedSlot('');
  }

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!bookPatientId || !selectedProfId || !selectedSlot) return;

    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    createMutation.mutate({
      patientId: bookPatientId,
      professionalId: selectedProfId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      procedureId: bookProcedureId || undefined,
      source: 'PHONE',
    });
  }

  function formatSlotTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function prevDate() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  }

  function nextDate() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  }

  function isSlotAtHour(slotIso: string, hour: number) {
    const d = new Date(slotIso);
    return d.getHours() === hour;
  }

  function getSlotsForHour(hour: number) {
    return slots.filter((s) => isSlotAtHour(s, hour));
  }

  const displayDate = selectedDate
    ? format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  const selectedProf = dentists.find((d: any) => d.id === selectedProfId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda de Consultas</h1>
        <p className="text-gray-500 dark:text-gray-400">Consulte a disponibilidade dos profissionais e agende horários</p>
      </div>

      {/* Seletor de profissional */}
      <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
<div className="border-b dark:border-gray-700 px-6 py-4">
           <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
             Selecione o Profissional
           </h2>
         </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {dentists.map((prof: any) => {
            const isSelected = prof.id === selectedProfId;
            const maxDay = prof.user?.maxAppointmentsPerDay;
            return (
              <button
                key={prof.id}
                onClick={() => setSelectedProfId(prof.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-dental-500 bg-dental-50'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: prof.color || '#3b82f6' }}
                >
                  {prof.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{prof.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{prof.specialty || 'Dentista'}</p>
                </div>
                {maxDay && (
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    Máx. {maxDay}/dia
                  </span>
                )}
              </button>
            );
          })}
          {dentists.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Nenhum profissional cadastrado
            </p>
          )}
        </div>
      </div>

      {selectedProfId && (
        <>
          {/* Cabeçalho data + resumo */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-dental-600" />
              <div className="flex items-center gap-2">
                <button
                  onClick={prevDate}
                  className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-dental-500 dark:focus:border-primary focus:outline-none"
                />
                <button
                  onClick={nextDate}
                  className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {slotsData && (
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-gray-500 dark:text-gray-400">
                  {dayAppointments.length} consulta(s) agendada(s)
                </span>
                {slotsData.maxAppointmentsPerDay && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {' '}/ {slotsData.maxAppointmentsPerDay} limite
                  </span>
                )}
                <span className="text-dental-600 font-medium">
                  {slots.length} vaga(s) disponível(is)
                </span>
                {slotsData.limitReached && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Limite diário atingido
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timeline do dia */}
          <div className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
<div className="border-b dark:border-gray-700 px-6 py-3">
               <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400">
                Agenda de {selectedProf?.name} — {displayDate}
              </h3>
            </div>

            {slotsLoading ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">Carregando...</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {HOURS.map((hour) => {
                  const apts = appointmentsByHour[hour] || [];
                  const freeSlots = getSlotsForHour(hour);
                  const hasContent = apts.length > 0 || freeSlots.length > 0;

                  return (
                    <div
                      key={hour}
                      className={`flex ${hasContent ? '' : 'opacity-40'}`}
                    >
                      {/* Rótulo da hora */}
                      <div className="flex w-20 flex-shrink-0 items-start justify-center border-r border-gray-200 dark:border-gray-700 py-3">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                      </div>

                      {/* Conteúdo da hora */}
                      <div className="flex flex-1 flex-wrap gap-1.5 p-2">
                        {apts.map((apt: any) => (
                          <div
                            key={apt.id}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${getStatusColor(apt.status)}`}
                            title={`${apt.patient?.name} - ${getStatusLabel(apt.status)}`}
                          >
                            <span className="font-medium">
                              {new Date(apt.startTime).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>{apt.patient?.name}</span>
                          </div>
                        ))}
                        {freeSlots.map((slot: string) => (
                          <button
                            key={slot}
                            onClick={() => openBooking(slot)}
                            className="flex items-center gap-1 rounded-lg border border-dashed border-dental-300 bg-dental-50 px-3 py-1.5 text-xs font-medium text-dental-600 transition-all hover:border-solid hover:bg-dental-100"
                          >
                            <Clock className="h-3 w-3" />
                            {formatSlotTime(slot)}
                            <span className="text-dental-400">Livre</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de agendamento rápido */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
<div className="flex items-center justify-between border-b dark:border-gray-700 px-6 py-4">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agendar Consulta</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBook} className="space-y-4 px-6 py-4">
              <div className="rounded-lg border border-dental-100 bg-dental-50 px-4 py-3 text-sm text-dental-700">
                <p>
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(selectedSlot).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  <span className="font-medium">Horário:</span>{' '}
                  {new Date(selectedSlot).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Paciente *</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 pl-9 pr-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary"
                  />
                </div>
                <select
                  required
                  size={4}
                  value={bookPatientId}
                  onChange={(e) => setBookPatientId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary"
                >
                  <option value="">Selecionar paciente...</option>
                  {filteredPatients.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.cpf ? `- ${p.cpf}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Procedimento</label>
                <select
                  value={bookProcedureId}
                  onChange={(e) => setBookProcedureId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-dental-500 dark:focus:ring-primary"
                >
                  <option value="">Nenhum (consulta padrão)</option>
                  {procedures.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!bookPatientId || createMutation.isPending}
                  className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
