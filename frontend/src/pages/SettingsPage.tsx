import { useNavigate } from 'react-router-dom';
import { Settings, Building, Shield, Bell, Palette, FileText, Smartphone, MessageCircle, CreditCard } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();

  const sections = [
    { title: 'Dados da Clínica', description: 'Informações gerais, CNPJ, endereço e logo', icon: Building, href: '/settings/clinic-data', },
    { title: 'Segurança', description: 'Autenticação de dois fatores e senhas', icon: Shield, href: '/settings/security', },
    { title: 'Notificações', description: 'Configurar lembretes por WhatsApp, email e SMS', icon: Bell, href: '/settings/notifications', },
    { title: 'WhatsApp', description: 'Configurar Evolution API / Z-API para disparo automático', icon: MessageCircle, href: '/settings/whatsapp', },
    { title: 'Aparência', description: 'Personalizar cores e temas do sistema', icon: Palette, href: '/settings/appearance', },
    { title: 'NF-e / NFS-e', description: 'Configurar Bling ou Tiny para emissão de notas fiscais', icon: FileText, href: '/settings/nfe', },
    { title: 'Mercado Pago', description: 'Configurar token de pagamento online', icon: CreditCard, href: '/settings/mercadopago', },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerenciar configurações da clínica e do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <button
            key={section.title}
            onClick={() => navigate(section.href)}
            className="flex items-start gap-4 rounded-xl border bg-white p-6 text-left shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="rounded-lg bg-dental-50 p-3">
              <section.icon className="h-5 w-5 text-dental-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Notificações Automáticas</h3>
        <div className="space-y-3">
          {[
            { label: 'Lembrete de consulta (24h antes)', desc: 'Envia WhatsApp automático 24h antes do horário agendado', enabled: true },
            { label: 'Confirmação de agendamento', desc: 'Confirmação imediata quando paciente agenda online', enabled: true },
            { label: 'Lembrete de pagamento', desc: 'Aviso de fatura próximo do vencimento', enabled: false },
            { label: 'Confirmação de presença', desc: 'Solicita confirmação 2h antes da consulta', enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">IA e Automação</h3>
        <div className="space-y-3">
          {[
            { label: 'Sugestão automática de prontuário', desc: 'IA sugere diagnóstico e procedimentos baseados no histórico', enabled: true },
            { label: 'Transcrição de voz', desc: 'Transcrever áudio da consulta para texto automaticamente', enabled: false },
            { label: 'Reconhecimento de padrões', desc: 'Identificar padrões de tratamento e sugerir fluxos otimizados', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Assinatura</h3>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Plano Atual</p>
              <p className="text-sm text-gray-500">Acesso a todas as funcionalidades</p>
            </div>
            <span className="rounded-full bg-dental-100 px-3 py-1 text-sm font-medium text-dental-700">Profissional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
