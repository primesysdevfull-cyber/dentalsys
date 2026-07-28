import { useState } from 'react';
import { MessageCircle, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function WhatsAppPage() {
  const [provider, setProvider] = useState('evolution');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Configurações salvas');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-gray-500">Configurar Evolution API / Z-API para disparo automático</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><MessageCircle className="h-5 w-5 text-green-500" /> Provedor</h2>
          <div className="space-y-4 max-w-md">
            <div><label className="block text-sm font-medium text-gray-700">Provedor</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                <option value="evolution">Evolution API</option>
                <option value="zapi">Z-API</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">URL da API</label><input type="url" required value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.evolution.com" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Chave da API</label><input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Nome da Instância</label><input type="text" required value={instanceName} onChange={(e) => setInstanceName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-dental-700"><Save className="h-4 w-4" /> Salvar</button>
        </div>
      </form>
    </div>
  );
}
