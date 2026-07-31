import { useState, useEffect } from 'react';
import { Bell, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface NotificationSetting {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

export function NotificationsConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { key: 'reminder', label: 'Lembrete de consulta (24h antes)', desc: 'Envia WhatsApp automático 24h antes do horário agendado', enabled: true },
    { key: 'confirmation', label: 'Confirmação de agendamento', desc: 'Confirmação imediata quando paciente agenda online', enabled: true },
    { key: 'paymentReminder', label: 'Lembrete de pagamento', desc: 'Aviso de fatura próximo do vencimento', enabled: false },
    { key: 'attendanceConfirmation', label: 'Confirmação de presença', desc: 'Solicita confirmação 2h antes da consulta', enabled: true },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/tenants/current');
        const notifConfig = data.settings?.notifications || {};
        setSettings(prev => prev.map(s => ({
          ...s,
          enabled: notifConfig[s.key] ?? s.enabled,
        })));
      } catch {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggle(index: number) {
    setSettings(settings.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const notifConfig: Record<string, boolean> = {};
      settings.forEach(s => { notifConfig[s.key] = s.enabled; });
      await api.put('/tenants/current/settings', { notifications: notifConfig });
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notificações</h1>
        <p className="text-gray-500 dark:text-gray-400">Configurar lembretes por WhatsApp, email e SMS</p>
      </div>
      <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"><Bell className="h-5 w-5 text-primary" /> Notificações Automáticas</h3>
        <div className="space-y-3">
          {settings.map((item, idx) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={item.enabled} onChange={() => toggle(idx)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
