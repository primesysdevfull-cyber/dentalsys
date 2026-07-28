import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { Shield, Key, Smartphone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/change-password', data),
    onSuccess: () => { toast.success('Senha alterada'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao alterar senha'),
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Senhas não conferem'); return; }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Segurança</h1>
        <p className="text-gray-500">Autenticação de dois fatores e senhas</p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Key className="h-5 w-5 text-dental-500" /> Alterar Senha</h2>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">Senha Atual</label><input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Nova Senha</label><input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label><input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          <button type="submit" disabled={changePasswordMutation.isPending} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
            {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Smartphone className="h-5 w-5 text-dental-500" /> Autenticação em Dois Fatores (2FA)</h2>
        <p className="mb-4 text-sm text-gray-500">Configure a autenticação de dois fatores para aumentar a segurança da sua conta.</p>
        <button className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700">Configurar 2FA</button>
      </div>
    </div>
  );
}
