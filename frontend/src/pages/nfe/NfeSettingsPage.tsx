import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';

export function NfeSettingsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ provider: 'BLING', apiKey: '', apiUrl: '', seriesNumber: '', environment: 'production' });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['nfe-configs'],
    queryFn: () => api.get('/nfe/config').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editId ? api.put(`/nfe/config/${editId}`, data) : api.post('/nfe/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfe-configs'] });
      setShowModal(false);
      setEditId(null);
      setFormData({ provider: 'BLING', apiKey: '', apiUrl: '', seriesNumber: '', environment: 'production' });
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/nfe/config/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nfe-configs'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao excluir'),
  });

  function openEdit(config: any) {
    setEditId(config.id);
    setFormData({
      provider: config.provider,
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || '',
      seriesNumber: config.seriesNumber || '',
      environment: config.environment || 'production',
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...formData };
    if (!payload.apiUrl) delete payload.apiUrl;
    if (!payload.seriesNumber) delete payload.seriesNumber;
    saveMutation.mutate(payload);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NF-e / NFS-e</h1>
          <p className="text-gray-500">Configure integração com Bling ou Tiny para emissão de notas fiscais</p>
        </div>
        <button
          onClick={() => { setEditId(null); setFormData({ provider: 'BLING', apiKey: '', apiUrl: '', seriesNumber: '', environment: 'production' }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700"
        >
          <Plus className="h-4 w-4" /> Nova Configuração
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" />
        </div>
      ) : !configs?.length ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma configuração</h3>
          <p className="mt-2 text-sm text-gray-500">Adicione uma integração com Bling ou Tiny para emitir NF-e</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {configs.map((config: any) => (
            <div key={config.id} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.provider === 'BLING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {config.provider === 'BLING' ? 'Bling' : 'Tiny'}
                  </span>
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {config.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.environment === 'test' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                    {config.environment === 'test' ? 'Teste' : 'Produção'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(config)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Editar">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if (confirm('Remover configuração?')) deleteMutation.mutate(config.id); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">API Key:</span> {config.apiKey ? `${config.apiKey.slice(0, 8)}...` : '---'}</p>
                {config.apiUrl && <p><span className="font-medium">URL:</span> {config.apiUrl}</p>}
                {config.seriesNumber && <p><span className="font-medium">Série:</span> {config.seriesNumber}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Editar' : 'Nova'} Configuração NF-e</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Provedor</label>
                <select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  <option value="BLING">Bling</option>
                  <option value="TINY">Tiny</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key / Token</label>
                <input type="text" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" placeholder="Chave de API do provedor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API URL (opcional)</label>
                <input type="text" value={formData.apiUrl} onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Série (opcional)</label>
                  <input type="text" value={formData.seriesNumber} onChange={(e) => setFormData({ ...formData, seriesNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ambiente</label>
                  <select value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="production">Produção</option>
                    <option value="test">Teste</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
