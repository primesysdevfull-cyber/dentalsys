import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ShieldCheck, FileText, Download, AlertTriangle, CheckCircle, XCircle, UserX } from 'lucide-react';

export function PrivacyPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'consents' | 'exports' | 'anonymize'>('consents');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [consentType, setConsentType] = useState('TERMS_OF_USE');

  const { data: patients } = useQuery({ queryKey: ['privacy-patients'], queryFn: () => api.get('/patients?limit=500').then((r) => r.data) });
  const { data: consents, isLoading: loadingConsents } = useQuery({ queryKey: ['privacy-consents'], queryFn: () => api.get('/privacy/consents').then((r) => r.data), enabled: tab === 'consents' });
  const { data: exports, isLoading: loadingExports } = useQuery({ queryKey: ['privacy-exports'], queryFn: () => api.get('/privacy/exports').then((r) => r.data), enabled: tab === 'exports' });

  const consentMutation = useMutation({
    mutationFn: (data: any) => api.post('/privacy/consents', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['privacy-consents'] }); setSelectedPatient(''); alert('Consentimento registrado!'); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro'),
  });

  const revokeMutation = useMutation({
    mutationFn: (data: any) => api.post('/privacy/consents/revoke', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['privacy-consents'] }); alert('Consentimento revogado!'); },
  });

  const exportMutation = useMutation({
    mutationFn: (patientId: string) => api.post('/privacy/export', { patientId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['privacy-exports'] }); alert('Exportação solicitada!'); },
  });

  const anonymizeMutation = useMutation({
    mutationFn: (patientId: string) => api.post(`/privacy/anonymize/${patientId}`),
    onSuccess: () => { alert('Dados anonimizados conforme LGPD!'); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">LGPD / Privacidade</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerenciar consentimentos, exportação e anonimização de dados</p>
      </div>

      <div className="flex gap-2 border-b">
        {[{ key: 'consents', label: 'Consentimentos', icon: CheckCircle }, { key: 'exports', label: 'Exportações', icon: Download }, { key: 'anonymize', label: 'Anonimizar', icon: UserX }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'consents' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Registrar Consentimento</h3>
            <div className="flex gap-3">
              <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary">
                <option value="">Selecione o paciente...</option>
                {patients?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={consentType} onChange={(e) => setConsentType(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="TERMS_OF_USE">Termos de Uso</option>
                <option value="PRIVACY_POLICY">Política de Privacidade</option>
                <option value="DATA_PROCESSING">Processamento de Dados</option>
                <option value="MARKETING">Marketing</option>
                <option value="SHARE_WITH_INSURANCE">Compartilhar c/ Convênio</option>
                <option value="SHARE_WITH_LAB">Compartilhar c/ Laboratório</option>
              </select>
              <button onClick={() => { if (selectedPatient) consentMutation.mutate({ patientId: selectedPatient, type: consentType }); }} disabled={!selectedPatient} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700 disabled:opacity-50">Registrar</button>
            </div>
          </div>

          {loadingConsents ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" /></div>
          : !consents?.length ? <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum consentimento registrado</p>
          : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Versão</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Ações</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {consents.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.patient?.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.type}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'GRANTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>{c.status === 'GRANTED' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{c.status === 'GRANTED' ? 'Autorizado' : 'Revogado'}</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.consentVersion || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(c.grantedAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3">{c.status === 'GRANTED' && <button onClick={() => revokeMutation.mutate({ patientId: c.patientId, type: c.type })} className="text-xs font-medium text-red-600 hover:text-red-700">Revogar</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'exports' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Solicitar Exportação de Dados</h3>
            <div className="flex gap-3">
              <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="">Selecione o paciente...</option>
                {patients?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => { if (selectedPatient) exportMutation.mutate(selectedPatient); }} disabled={!selectedPatient} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700 disabled:opacity-50"><Download className="h-4 w-4" /> Exportar</button>
            </div>
          </div>

          {loadingExports ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" /></div>
          : !exports?.length ? <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma exportação solicitada</p>
          : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Solicitado em</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {exports.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{e.patient?.name}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>{e.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'anonymize' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-900/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-400">Anonimização de Dados (LGPD)</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">Esta ação remove todos os dados pessoais do paciente, mantendo apenas registros anonimizados para auditoria. <strong>Não é possível desfazer.</strong></p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex gap-3">
              <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="">Selecione o paciente...</option>
                {patients?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => { if (selectedPatient && window.confirm('TEM CERTEZA? Esta ação é irreversível!')) anonymizeMutation.mutate(selectedPatient); }} disabled={!selectedPatient} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"><UserX className="h-4 w-4" /> Anonimizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
