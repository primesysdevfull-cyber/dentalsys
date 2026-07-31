import { useState, useEffect } from 'react';
import { MessageCircle, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState('evolution');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/tenants/current');
        const whats = data.settings?.whatsapp || {};
        setProvider(whats.provider || 'evolution');
        setApiUrl(whats.apiUrl || '');
        setApiKey(whats.apiKey || '');
        setInstanceName(whats.instanceName || '');
      } catch {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/tenants/current/settings', {
        whatsapp: { provider, apiUrl, apiKey, instanceName },
      });
      toast.success('Configurações salvas');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">WhatsApp</h1>
        <p className="text-gray-500 dark:text-gray-400">Configurar Evolution API / Z-API para disparo automático</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"><MessageCircle className="h-5 w-5 text-green-500" /> Provedor</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provedor</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="evolution">Evolution API</option>
                <option value="zapi">Z-API</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL da API</label>
              <input type="url" required value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.evolution.com" className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chave da API</label>
              <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Instância</label>
              <input type="text" required value={instanceName} onChange={(e) => setInstanceName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
