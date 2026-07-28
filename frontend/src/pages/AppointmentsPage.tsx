import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { getStatusLabel, getStatusColor } from '../utils';
import { Plus, Calendar as CalendarIcon, List, X, MessageCircle, ChevronLeft, ChevronRight, Pencil, Trash2, Clock, RotateCcw, CheckCircle2, Play } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type ModalMode = 'create' | 'edit' | 'reschedule';

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: '', professionalId: '', roomId: '', procedureId: '',
    date: '', startTime: '', endTime: '', notes: '',
  });

  const calStart = useMemo(() => new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).toISOString(), [calendarDate]);
  const calEnd = useMemo(() => new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0, 23, 59, 59).toISOString(), [calendarDate]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', calStart, calEnd, statusFilter],
    queryFn: () =>
      api
        .get(`/appointments?startDate=${calStart}&endDate=${calEnd}${statusFilter ? `&status=${statusFilter}` : ''}`)
        .then((r) => r.data),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { limit: 500 }],
    queryFn: () => api.get('/patients?limit=500').then((r) => r.data),
  });

  const { data: professionalsData } = useQuery({
    queryKey: ['professionals', { limit: 500 }],
    queryFn: () => api.get('/professionals?limit=500').then((r) => r.data),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then((r) => r.data),
  });

  const { data: proceduresData } = useQuery({
    queryKey: ['procedures', { limit: 500 }],
    queryFn: () => api.get('/procedures?limit=500').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/appointments', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); closeModal(); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao criar agendamento'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/appointments/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); closeModal(); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar agendamento'),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.post(`/appointments/${id}/reschedule`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); closeModal(); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao remarcar agendamento'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowCancelModal(false);
      setCancelReason('');
      setCancelTargetId(null);
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao cancelar agendamento'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/appointments/${id}/${action}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao alterar status'),
  });

  function openCreate(dateStr?: string) {
    setModalMode('create');
    setSelectedAppointment(null);
    setFormData({ patientId: '', professionalId: '', roomId: '', procedureId: '', date: dateStr || '', startTime: '', endTime: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(apt: any) {
    setModalMode('edit');
    setSelectedAppointment(apt);
    const startDate = new Date(apt.startTime);
    const endDate = new Date(apt.endTime);
    setFormData({
      patientId: apt.patientId || '',
      professionalId: apt.professionalId || '',
      roomId: apt.roomId || '',
      procedureId: apt.procedureId || '',
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toISOString().slice(11, 16),
      endTime: endDate.toISOString().slice(11, 16),
      notes: apt.notes || '',
    });
    setShowModal(true);
  }

  function openReschedule(apt: any) {
    setModalMode('reschedule');
    setSelectedAppointment(apt);
    const startDate = new Date(apt.startTime);
    const endDate = new Date(apt.endTime);
    setFormData({
      patientId: apt.patientId || '',
      professionalId: apt.professionalId || '',
      roomId: apt.roomId || '',
      procedureId: apt.procedureId || '',
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toISOString().slice(11, 16),
      endTime: endDate.toISOString().slice(11, 16),
      notes: apt.notes || '',
    });
    setShowModal(true);
  }

  function openCancel(aptId: string) {
    setCancelTargetId(aptId);
    setCancelReason('');
    setShowCancelModal(true);
  }

  function closeModal() { setShowModal(false); setSelectedAppointment(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startIso = `${formData.date}T${formData.startTime}:00`;
    const endIso = `${formData.date}T${formData.endTime}:00`;
    const payload: any = {
      patientId: formData.patientId,
      professionalId: formData.professionalId,
      startTime: startIso,
      endTime: endIso,
    };
    if (formData.roomId) payload.roomId = formData.roomId;
    if (formData.procedureId) payload.procedureId = formData.procedureId;
    if (formData.notes) payload.notes = formData.notes;

    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else if (modalMode === 'edit') {
      updateMutation.mutate({ id: selectedAppointment.id, ...payload });
    } else if (modalMode === 'reschedule') {
      rescheduleMutation.mutate({ id: selectedAppointment.id, ...payload });
    }
  }

  function handleCancelConfirm() {
    if (cancelTargetId) {
      cancelMutation.mutate({ id: cancelTargetId, reason: cancelReason || undefined });
    }
  }

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'SCHEDULED', label: 'Agendados' },
    { value: 'CONFIRMED', label: 'Confirmados' },
    { value: 'IN_PROGRESS', label: 'Em atendimento' },
    { value: 'COMPLETED', label: 'Concluídos' },
    { value: 'CANCELLED', label: 'Cancelados' },
  ];

  const patients: any[] = patientsData?.data || [];
  const professionals: any[] = professionalsData?.data || [];
  const rooms: any[] = roomsData?.data || [];
  const procedures: any[] = proceduresData?.data || [];
  const appointments: any[] = data?.data || [];

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; date: string; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, -firstDay + i + 1);
      days.push({ day: d.getDate(), date: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ day: i, date: d.toISOString().split('T')[0], isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ day: d.getDate(), date: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    return days;
  }, [calendarDate]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((apt: any) => {
      const dateKey = new Date(apt.startTime).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(apt);
    });
    return map;
  }, [appointments]);

  function prevMonth() { setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)); }
  function nextMonth() { setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)); }
  function goToday() { setCalendarDate(new Date()); }

  const todayStr = new Date().toISOString().split('T')[0];

  function getStatusActions(apt: any) {
    const actions: { label: string; action: string; icon: any; color: string }[] = [];
    switch (apt.status) {
      case 'SCHEDULED':
        actions.push({ label: 'Confirmar', action: 'confirm', icon: CheckCircle2, color: 'text-green-600 hover:bg-green-50' });
        break;
      case 'CONFIRMED':
        actions.push({ label: 'Iniciar', action: 'start', icon: Play, color: 'text-blue-600 hover:bg-blue-50' });
        break;
      case 'IN_PROGRESS':
        actions.push({ label: 'Concluir', action: 'complete', icon: CheckCircle2, color: 'text-emerald-600 hover:bg-emerald-50' });
        break;
    }
    return actions;
  }

  const modalTitle = modalMode === 'create' ? 'Novo Agendamento' : modalMode === 'edit' ? 'Editar Agendamento' : 'Remarcar Agendamento';
  const modalButton = modalMode === 'create' ? 'Agendar' : modalMode === 'edit' ? 'Salvar' : 'Remarcar';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500">Gerenciar agenda da clínica</p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                statusFilter === opt.value
                  ? 'bg-dental-100 text-dental-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={`rounded-lg p-2 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`rounded-lg p-2 ${view === 'calendar' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Carregando...</div>
        ) : view === 'list' ? (
          <div className="divide-y">
            {appointments.map((apt: any) => {
              const statusActions = getStatusActions(apt);
              const isCancellable = apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';
              return (
                <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-1 rounded-full"
                      style={{ backgroundColor: apt.professional?.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                        {(apt.patient?.whatsapp || apt.patient?.phone) && (
                          <a
                            href={`https://wa.me/${(apt.patient.whatsapp || apt.patient.phone).replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {apt.professional?.name} • {apt.procedure?.name || 'Consulta'}
                        {apt.room && ` • Sala: ${apt.room.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(apt.startTime).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(apt.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                    <div className="flex items-center gap-1">
                      {statusActions.map((sa) => (
                        <button
                          key={sa.action}
                          onClick={() => statusMutation.mutate({ id: apt.id, action: sa.action })}
                          className={`rounded-lg p-1.5 text-xs font-medium ${sa.color}`}
                          title={sa.label}
                        >
                          <sa.icon className="h-4 w-4" />
                        </button>
                      ))}
                      {apt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openEdit(apt)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {apt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openReschedule(apt)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Remarcar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {isCancellable && (
                        <button
                          onClick={() => openCancel(apt.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Cancelar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {appointments.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum agendamento encontrado
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b px-6 py-3">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-base font-semibold text-gray-900">
                  {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button onClick={goToday} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Hoje
              </button>
            </div>
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-xs font-semibold uppercase text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((dayInfo, idx) => {
                const dayAppts = appointmentsByDate[dayInfo.date] || [];
                const isToday = dayInfo.date === todayStr;
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r p-1.5 ${
                      !dayInfo.isCurrentMonth ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? 'bg-dental-600 text-white'
                            : dayInfo.isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {dayInfo.day}
                      </span>
                      {dayInfo.isCurrentMonth && (
                        <button
                          onClick={() => openCreate(dayInfo.date)}
                          className="hidden h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 group-hover:flex"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 3).map((apt: any) => (
                        <button
                          key={apt.id}
                          onClick={() => openEdit(apt)}
                          className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight hover:opacity-80 ${getStatusColor(apt.status)}`}
                          title={`${apt.patient?.name} - ${new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {apt.patient?.name?.split(' ')[0]}
                        </button>
                      ))}
                      {dayAppts.length > 3 && (
                        <p className="px-1 text-[10px] text-gray-500">+{dayAppts.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalMode === 'reschedule' && selectedAppointment && (
              <div className="mx-6 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                O agendamento atual será cancelado e um novo será criado com a nova data/horário.
              </div>
            )}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Paciente *</label>
                <select required value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  <option value="">Selecionar paciente...</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profissional *</label>
                <select required value={formData.professionalId} onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  <option value="">Selecionar profissional...</option>
                  {professionals.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data *</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horário Início *</label>
                  <input type="time" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horário Fim *</label>
                  <input type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sala</label>
                  <select value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Nenhuma</option>
                    {rooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Procedimento</label>
                  <select value={formData.procedureId} onChange={(e) => setFormData({ ...formData, procedureId: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Nenhum</option>
                    {procedures.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
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
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending || rescheduleMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending || rescheduleMutation.isPending) ? 'Salvando...' : modalButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Cancelar Agendamento</h2>
              <button onClick={() => { setShowCancelModal(false); setCancelTargetId(null); setCancelReason(''); }} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">Tem certeza que deseja cancelar este agendamento?</p>
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo (opcional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Informe o motivo do cancelamento..."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelTargetId(null); setCancelReason(''); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancelMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
