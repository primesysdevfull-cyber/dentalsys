import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Cpu, Mic, FileText, Loader2, Sparkles, Brain, Volume2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function AiPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'suggest' | 'transcribe' | 'history'>('suggest');
  const [patientId, setPatientId] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestion, setSuggestion] = useState<any>(null);
  const [editableSuggestion, setEditableSuggestion] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { data: patients } = useQuery({ queryKey: ['ai-patients'], queryFn: () => api.get('/patients?limit=500').then((r) => r.data) });
  const { data: transcriptions, isLoading: loadingTranscriptions } = useQuery({ queryKey: ['ai-transcriptions'], queryFn: () => api.get('/ai/transcriptions').then((r) => r.data), enabled: tab === 'history' });

  const suggestMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai/suggest', data),
    onSuccess: (res: any) => {
      setSuggestion(res.data);
      setEditableSuggestion({ ...res.data });
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro'),
  });

  const saveRecordMutation = useMutation({
    mutationFn: (data: any) => api.post('/clinical-records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-records'] });
      toast.success('Registro salvo no prontuário');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar'),
  });

  function handleSaveToRecord() {
    if (!patientId || !editableSuggestion) return;
    saveRecordMutation.mutate({
      patientId,
      diagnosis: editableSuggestion.suggestedDiagnosis,
      treatmentDone: editableSuggestion.suggestedProcedure,
      prescriptions: editableSuggestion.suggestedPrescription,
      observations: editableSuggestion.suggestedObservations,
    });
  }

  async function handleTranscribe() {
    if (!audioUrl) return alert('Informe a URL do áudio');
    setIsTranscribing(true);
    try {
      const res = await api.post('/ai/transcribe', { audioUrl, durationSeconds: 60 });
      alert(`Transcrição concluída! ID: ${res.data.id}`);
      setAudioUrl('');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erro ao transcrever');
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IA / Automação</h1>
        <p className="text-gray-500">Transcrição de voz e sugestão inteligente de prontuário</p>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { key: 'suggest', label: 'Sugestão de Prontuário', icon: Sparkles },
          { key: 'transcribe', label: 'Transcrição de Voz', icon: Mic },
          { key: 'history', label: 'Histórico', icon: FileText },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'suggest' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Gerar Sugestão</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Paciente *</label>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none">
                  <option value="">Selecione...</option>
                  {patients?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Procedimento realizado</label>
                <input type="text" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Ex: Restauração dente 26" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Observações / Sintomas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={4} placeholder="Descreva os sintomas ou observações do paciente..." />
              </div>
              <button onClick={() => { if (patientId) suggestMutation.mutate({ patientId, procedureName, notes }); }} disabled={!patientId || suggestMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                {suggestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {suggestMutation.isPending ? 'Gerando...' : 'Gerar Sugestão com IA'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-dental-600" />
              <h3 className="font-semibold text-gray-900">Sugestão</h3>
              {suggestion?.disclaimer && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Simulado</span>}
            </div>
            {suggestion && editableSuggestion ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Diagnóstico Sugerido</p>
                  <textarea value={editableSuggestion.suggestedDiagnosis} onChange={(e) => setEditableSuggestion({ ...editableSuggestion, suggestedDiagnosis: e.target.value })} className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" rows={2} />
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs font-medium text-green-700 mb-1">Procedimento</p>
                  <textarea value={editableSuggestion.suggestedProcedure} onChange={(e) => setEditableSuggestion({ ...editableSuggestion, suggestedProcedure: e.target.value })} className="w-full rounded border border-green-200 bg-white px-2 py-1 text-sm focus:border-green-500 focus:outline-none" rows={2} />
                </div>
                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-xs font-medium text-orange-700 mb-1">Prescrição</p>
                  <textarea value={editableSuggestion.suggestedPrescription} onChange={(e) => setEditableSuggestion({ ...editableSuggestion, suggestedPrescription: e.target.value })} className="w-full rounded border border-orange-200 bg-white px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" rows={2} />
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Observações</p>
                  <textarea value={editableSuggestion.suggestedObservations} onChange={(e) => setEditableSuggestion({ ...editableSuggestion, suggestedObservations: e.target.value })} className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-500 focus:outline-none" rows={3} />
                </div>
                {suggestion.disclaimer && <p className="text-xs italic text-gray-400">{suggestion.disclaimer}</p>}
                <button onClick={() => { setSuggestion(editableSuggestion); handleSaveToRecord(); }} disabled={saveRecordMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {saveRecordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveRecordMutation.isPending ? 'Salvando...' : 'Salvar no Prontuário'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Brain className="h-12 w-12" />
                <p className="mt-3 text-sm">Selecione um paciente e gere uma sugestão</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'transcribe' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">Transcrever Áudio</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL do Áudio</label>
                <input type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="https://..." />
                <p className="mt-1 text-xs text-gray-400">Link público do arquivo de áudio (MP3, WAV, M4A)</p>
              </div>
              <button onClick={handleTranscribe} disabled={!audioUrl || isTranscribing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {isTranscribing ? 'Transcrevendo...' : 'Transcrever Áudio'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Como funciona</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. Grave o áudio da consulta (celular, gravador)</p>
              <p>2. Faça upload para um serviço de armazenamento (S3, Cloudinary)</p>
              <p>3. Cole a URL pública do arquivo no campo ao lado</p>
              <p>4. A IA transcreve e estrutura o prontuário automaticamente</p>
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-700">Formatos suportados:</p>
                <p className="mt-1 text-xs text-gray-500">MP3, WAV, M4A, OGG — até 25MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl border bg-white shadow-sm">
          {loadingTranscriptions ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" /></div>
          : !transcriptions?.length ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Nenhuma transcrição realizada</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500"><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Resumo</th><th className="px-4 py-3">Duração</th><th className="px-4 py-3">Modelo</th><th className="px-4 py-3">Data</th></tr></thead>
              <tbody className="divide-y">
                {transcriptions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.user?.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.summary || t.originalText?.slice(0, 80)}</td>
                    <td className="px-4 py-3 text-gray-500">{t.durationSeconds ? `${t.durationSeconds}s` : '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.model}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
