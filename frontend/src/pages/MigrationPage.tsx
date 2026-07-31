import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { Download, Upload, Database, FileDown, FileUp, History, AlertCircle, CheckCircle, XCircle, FileJson } from 'lucide-react';

export function MigrationPage() {
  const [tab, setTab] = useState<'export' | 'import' | 'history'>('export');
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState('patients');
  const [importResult, setImportResult] = useState<any>(null);

  const { data: history } = useQuery({ queryKey: ['migration-history'], queryFn: () => api.get('/migration/history').then((r) => r.data), enabled: tab === 'history' });

  const exportMutation = useMutation({
    mutationFn: () => api.get('/migration/export/all').then((r) => r.data),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `dentalclinic-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro na exportação'),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const data = JSON.parse(importData);
      return api.post(`/migration/import/${importType}`, data);
    },
    onSuccess: (res) => setImportResult(res.data),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro na importação'),
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImportData(event.target?.result as string);
    reader.readAsText(file);
  }

  function handleExport(type: string) {
    if (type === 'patients') {
      api.get('/migration/export/patients').then((r) => {
        const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `pacientes-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        URL.revokeObjectURL(url);
      });
    } else if (type === 'appointments') {
      api.get('/migration/export/appointments').then((r) => {
        const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `agendamentos-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      exportMutation.mutate();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Migração de Dados</h1>
        <p className="text-gray-500 dark:text-gray-400">Exportar dados do sistema ou importar de sistemas legados</p>
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700">
        {[
          { key: 'export', label: 'Exportar Dados', icon: FileDown },
          { key: 'import', label: 'Importar Dados', icon: FileUp },
          { key: 'history', label: 'Histórico', icon: History },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={() => handleExport('all')} disabled={exportMutation.isPending} className="flex flex-col items-center gap-3 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:border-dental-300 hover:shadow-md disabled:opacity-50">
            <Database className="h-10 w-10 text-dental-600" />
            <div className="text-center"><p className="font-semibold text-gray-900 dark:text-gray-100">Exportar Tudo</p><p className="text-xs text-gray-500 dark:text-gray-400">Pacientes, agendamentos, procedimentos, financeiro</p></div>
          </button>
          <button onClick={() => handleExport('patients')} className="flex flex-col items-center gap-3 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:border-dental-300 hover:shadow-md">
            <Download className="h-10 w-10 text-blue-600" />
            <div className="text-center"><p className="font-semibold text-gray-900 dark:text-gray-100">Apenas Pacientes</p><p className="text-xs text-gray-500 dark:text-gray-400">Lista completa de pacientes cadastrados</p></div>
          </button>
          <button onClick={() => handleExport('appointments')} className="flex flex-col items-center gap-3 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:border-dental-300 hover:shadow-md">
            <Download className="h-10 w-10 text-purple-600" />
            <div className="text-center"><p className="font-semibold text-gray-900 dark:text-gray-100">Apenas Agendamentos</p><p className="text-xs text-gray-500 dark:text-gray-400">Histórico completo de agendamentos</p></div>
          </button>
          <button onClick={() => handleExport('all')} className="flex flex-col items-center gap-3 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:border-dental-300 hover:shadow-md">
            <FileJson className="h-10 w-10 text-green-600" />
            <div className="text-center"><p className="font-semibold text-gray-900 dark:text-gray-100">Formato JSON</p><p className="text-xs text-gray-500 dark:text-gray-400">Compatível com importação futura</p></div>
          </button>
        </div>
      )}

      {tab === 'import' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Importar Dados</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Tipo de dados</label>
                <select value={importType} onChange={(e) => { setImportType(e.target.value); setImportResult(null); }} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100">
                  <option value="patients">Pacientes</option>
                  <option value="procedures">Procedimentos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Arquivo JSON</label>
                <input type="file" accept=".json" onChange={handleFileUpload} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 file:mr-3 file:rounded file:border-0 file:bg-dental-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-dental-700 hover:file:bg-dental-100" />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Formato: array de objetos ou {`{ "patients": [...] }`}</p>
              </div>
              {importData && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">JSON carregado: {importData.length} caracteres</p>
                </div>
              )}
              <button onClick={() => { setImportResult(null); importMutation.mutate(); }} disabled={!importData || importMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-dental-600 py-2 text-sm font-medium text-white hover:bg-dental-700 disabled:opacity-50">
                <Upload className="h-4 w-4" /> {importMutation.isPending ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Resultado</h3>
            {importResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {importResult.hasErrors ? <AlertCircle className="h-5 w-5 text-yellow-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                  <span className={`font-medium ${importResult.hasErrors ? 'text-yellow-700' : 'text-green-700'}`}>
                    {importResult.success} de {importResult.total} registros importados
                  </span>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    {importResult.errors.map((e: any, i: number) => (
                      <p key={i}>Linha {e.row}: {e.name} — {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <Upload className="h-12 w-12" />
                <p className="mt-3 text-sm">Carregue um arquivo e clique em Importar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          {!history?.length ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <History className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm">Nenhuma migração registrada</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400"><th className="px-4 py-3">Direção</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Arquivo</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Sucesso</th><th className="px-4 py-3 text-right">Erros</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Data</th></tr></thead>
              <tbody className="divide-y dark:divide-gray-700">
                {history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.direction === 'EXPORT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{h.direction}</span></td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{h.entityType || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{h.fileName || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{h.totalRows ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-green-600">{h.successRows ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-red-600">{h.errorRows ?? '-'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : h.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(h.createdAt).toLocaleDateString('pt-BR')}</td>
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
