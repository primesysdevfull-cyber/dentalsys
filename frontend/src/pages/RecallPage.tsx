import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Play, Power, PowerOff, Eye, Trash2, Loader2, MessageCircle, Calendar, Clock, CheckCircle, XCircle, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface Campaign {
  id: string;
  name: string;
  type: 'ABSENT' | 'BIRTHDAY' | 'INCOMPLETE_TREATMENT' | 'CUSTOM';
  config: Record<string, any>;
  message: string;
  channel: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastRunAt: string | null;
  createdAt: string;
  _count: { logs: number };
}

export function RecallPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', type: 'ABSENT' as string, message: '', channel: 'WHATSAPP',
    monthsAbsent: 3,
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await api.get('/recall');
      setCampaigns(data);
    } catch {
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const config: Record<string, any> = {};
      if (form.type === 'ABSENT') config.monthsAbsent = form.monthsAbsent;
      await api.post('/recall', {
        name: form.name, type: form.type, config, message: form.message, channel: form.channel,
      });
      toast.success('Campanha criada');
      setShowForm(false);
      setForm({ name: '', type: 'ABSENT', message: '', channel: 'WHATSAPP', monthsAbsent: 3 });
      fetchCampaigns();
    } catch { toast.error('Erro ao criar'); }
  }

  async function handleToggle(id: string) {
    try {
      await api.put(`/recall/${id}/toggle`);
      fetchCampaigns();
    } catch { toast.error('Erro ao alterar status'); }
  }

  async function handleExecute(id: string) {
    setExecuting(id);
    try {
      const { data } = await api.post(`/recall/${id}/execute`);
      toast.success(`Campanha executada: ${data.sent} enviados, ${data.failed} falhas, ${data.skipped} ignorados`);
      fetchCampaigns();
    } catch { toast.error('Erro ao executar'); }
    finally { setExecuting(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta campanha?')) return;
    try {
      await api.delete(`/recall/${id}`);
      toast.success('Campanha excluída');
      if (selected?.id === id) setSelected(null);
      fetchCampaigns();
    } catch { toast.error('Erro ao excluir'); }
  }

  async function viewLogs(id: string) {
    try {
      const { data } = await api.get(`/recall/${id}/logs`);
      setLogs(data);
      setSelected(campaigns.find(c => c.id === id) || null);
    } catch { toast.error('Erro ao carregar logs'); }
  }

  const typeLabel: Record<string, string> = {
    ABSENT: 'Ausência prolongada',
    BIRTHDAY: 'Aniversário',
    INCOMPLETE_TREATMENT: 'Tratamento incompleto',
    CUSTOM: 'Personalizada',
  };

  const typeIcon: Record<string, any> = {
    ABSENT: Calendar,
    BIRTHDAY: MessageCircle,
    INCOMPLETE_TREATMENT: Clock,
    CUSTOM: Megaphone,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recall / Campanhas</h1>
          <p className="text-gray-500 dark:text-gray-400">Disparo automático de lembretes para pacientes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Nova Campanha
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nova Campanha de Recall</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Ex: Recall de 3 meses" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="ABSENT">Ausência prolongada</option>
                <option value="BIRTHDAY">Aniversário</option>
                <option value="INCOMPLETE_TREATMENT">Tratamento incompleto</option>
                <option value="CUSTOM">Personalizada</option>
              </select>
            </div>
            {form.type === 'ABSENT' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Meses sem consulta</label>
                <input type="number" min={1} value={form.monthsAbsent} onChange={e => setForm({ ...form, monthsAbsent: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Canal</label>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">E-mail</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mensagem</label>
            <p className="text-xs text-gray-400 mb-1">Use {'{{nome}}'} ou {'{{paciente}}'} para personalizar</p>
            <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Olá {{nome}}, notamos que faz tempo que você não nos visita..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Criar Campanha</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="lg:col-span-3 flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : campaigns.length === 0 ? (
          <div className="lg:col-span-3 text-center py-12 text-gray-500">Nenhuma campanha criada</div>
        ) : campaigns.map((c) => {
          const Icon = typeIcon[c.type] || Megaphone;
          return (
            <div key={c.id} className={`rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-sm transition-all ${
              c.status === 'ACTIVE' ? 'border-primary-200 dark:border-primary-800' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${c.status === 'ACTIVE' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon className={`h-4 w-4 ${c.status === 'ACTIVE' ? 'text-primary' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.name}</h3>
                    <p className="text-xs text-gray-500">{typeLabel[c.type]} • {c._count.logs} disparos</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(c.id)} className={`rounded-lg p-1.5 ${c.status === 'ACTIVE' ? 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} title={c.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}>
                  {c.status === 'ACTIVE' ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{c.message.replace('{{nome}}', '...')}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{c.lastRunAt ? `Último: ${new Date(c.lastRunAt).toLocaleDateString('pt-BR')}` : 'Nunca executado'}</span>
                <div className="flex gap-1">
                  <button onClick={() => viewLogs(c.id)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800" title="Ver logs"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleExecute(c.id)} disabled={executing === c.id} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50" title="Executar agora">
                    {executing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Logs: {selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Fechar</button>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Paciente</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Canal</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum log</td></tr>
                ) : logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{log.patient.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{log.channel}</td>
                    <td className="px-4 py-2 text-center">
                      {log.status === 'SENT' ? <span className="inline-flex items-center gap-1 text-xs text-success-600"><CheckCircle className="h-3 w-3" /> Enviado</span>
                      : log.status === 'FAILED' ? <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Falha</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><SkipForward className="h-3 w-3" /> Ignorado</span>}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500">{new Date(log.sentAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
