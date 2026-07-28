import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { Stethoscope, Calendar, Clock, User, Phone, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

export function OnlineBookingPage() {
  const [step, setStep] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({ patientName: '', patientPhone: '', patientEmail: '', notes: '' });
  const [success, setSuccess] = useState(false);

  const { data: professionals } = useQuery({
    queryKey: ['public-professionals'],
    queryFn: () => api.get('/public/booking/professionals').then((r) => r.data),
  });

  const { data: slots, isFetching: loadingSlots } = useQuery({
    queryKey: ['public-slots', selectedProfessional, selectedDate],
    queryFn: () => api.get(`/public/booking/slots/${selectedProfessional}?date=${selectedDate}`).then((r) => r.data),
    enabled: !!selectedProfessional && !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: () => api.post('/public/booking', {
      ...formData,
      professionalId: selectedProfessional,
      startTime: selectedSlot,
    }),
    onSuccess: () => setSuccess(true),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao agendar'),
  });

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Agendamento Confirmado!</h2>
          <p className="mt-2 text-gray-500">Sua consulta foi agendada com sucesso. Em breve você receberá a confirmação.</p>
          <button onClick={() => { setStep(1); setSelectedProfessional(''); setSelectedSlot(''); setFormData({ patientName: '', patientPhone: '', patientEmail: '', notes: '' }); setSuccess(false); }} className="mt-6 rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700">Novo Agendamento</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-600">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Agende sua Consulta</h1>
          <p className="mt-1 text-gray-500">Escolha o profissional, data e horário ideal para você</p>
        </div>

        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'font-medium text-teal-600' : 'text-gray-400'}`}>{s === 1 ? 'Profissional' : s === 2 ? 'Horário' : 'Dados'}</span>
              {s < 3 && <ChevronRight className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Escolha o Profissional</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {professionals?.map((p: any) => (
                  <button key={p.id} onClick={() => { setSelectedProfessional(p.id); setStep(2); }} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-teal-300 hover:shadow-md ${selectedProfessional === p.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">{p.name.charAt(0)}</div>
                    <div><p className="font-medium text-gray-900">{p.name}</p><p className="text-sm text-gray-500">{p.specialty || 'Clínico Geral'}</p></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Escolha a Data e Horário</h2>
                <button onClick={() => setStep(1)} className="text-sm text-teal-600 hover:text-teal-700">Voltar</button>
              </div>
              <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }} min={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm" />
              {loadingSlots ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots?.availableSlots?.map((slot: string) => {
                    const time = new Date(slot).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button key={slot} onClick={() => { setSelectedSlot(slot); setStep(3); }} className={`rounded-lg border p-2 text-center text-sm transition-all hover:border-teal-500 ${selectedSlot === slot ? 'border-teal-500 bg-teal-50 font-medium text-teal-700' : 'border-gray-200 text-gray-700'}`}>{time}</button>
                    );
                  })}
                  {!loadingSlots && (!slots?.availableSlots || slots.availableSlots.length === 0) && <p className="col-span-full py-8 text-center text-sm text-gray-500">Nenhum horário disponível nesta data</p>}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Seus Dados</h2>
                <button onClick={() => setStep(2)} className="text-sm text-teal-600 hover:text-teal-700">Voltar</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome completo *</label>
                <div className="relative mt-1"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} required className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone (WhatsApp) *</label>
                <div className="relative mt-1"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="tel" value={formData.patientPhone} onChange={(e) => setFormData({...formData, patientPhone: e.target.value})} required className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none" placeholder="(11) 99999-8888" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1"><input type="email" value={formData.patientEmail} onChange={(e) => setFormData({...formData, patientEmail: e.target.value})} className="w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-teal-500 focus:outline-none" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} placeholder="Motivo da consulta, desconfortos, etc." />
              </div>
              <button onClick={() => bookingMutation.mutate()} disabled={!formData.patientName || !formData.patientPhone || bookingMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                {bookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                {bookingMutation.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">Ao agendar, você concorda com nossos termos de uso e política de privacidade.</p>
      </div>
    </div>
  );
}
