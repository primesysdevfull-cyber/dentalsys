import { useState } from 'react';
import { Bell, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function NotificationsConfigPage() {
  const [settings, setSettings] = useState([
    { label: 'Lembrete de consulta (24h antes)', desc: 'Envia WhatsApp automático 24h antes do horário agendado', enabled: true },
    { label: 'Confirmação de agendamento', desc: 'Confirmação imediata quando paciente agenda online', enabled: true },
    { label: 'Lembrete de pagamento', desc: 'Aviso de fatura próximo do vencimento', enabled: false },
    { label: 'Confirmação de presença', desc: 'Solicita confirmação 2h antes da consulta', enabled: true },
  ]);

  function toggle(index: number) {
    setSettings(settings.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  }

  function handleSave() {
    toast.success('Configurações salvas');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-500">Configurar lembretes por WhatsApp, email e SMS</p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Bell className="h-5 w-5 text-dental-500" /> Notificações Automáticas</h3>
        <div className="space-y-3">
          {settings.map((item, idx) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={item.enabled} onChange={() => toggle(idx)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700"><Save className="h-4 w-4" /> Salvar</button>
        </div>
      </div>
    </div>
  );
}
