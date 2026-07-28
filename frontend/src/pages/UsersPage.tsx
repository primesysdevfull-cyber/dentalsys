import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Shield, X, Edit } from 'lucide-react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  DENTIST: 'Dentista',
  ASSISTANT: 'Assistente',
  RECEPTIONIST: 'Recepcionista',
  FINANCIAL: 'Financeiro',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  DENTIST: 'bg-blue-100 text-blue-800',
  ASSISTANT: 'bg-green-100 text-green-800',
  RECEPTIONIST: 'bg-yellow-100 text-yellow-800',
  FINANCIAL: 'bg-gray-100 text-gray-800',
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'RECEPTIONIST', phone: '', isActive: true,
    maxAppointmentsPerDay: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/users', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao criar usuário'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/users/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar usuário'),
  });

  function openCreate() {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'RECEPTIONIST', phone: '', isActive: true, maxAppointmentsPerDay: '' });
    setShowModal(true);
  }

  function openEdit(user: any) {
    setEditingUser(user);
    setFormData({
      name: user.name || '', email: user.email || '', password: '',
      role: user.role || 'RECEPTIONIST', phone: user.phone || '', isActive: user.isActive,
      maxAppointmentsPerDay: user.maxAppointmentsPerDay?.toString() || '',
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingUser(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUser) {
      const payload: any = { name: formData.name, role: formData.role, isActive: formData.isActive };
      if (formData.password) payload.password = formData.password;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.maxAppointmentsPerDay) payload.maxAppointmentsPerDay = Number(formData.maxAppointmentsPerDay);
      else payload.maxAppointmentsPerDay = null;
      updateMutation.mutate({ id: editingUser.id, ...payload });
    } else {
      const payload: any = { name: formData.name, email: formData.email, password: formData.password, role: formData.role };
      if (formData.phone) payload.phone = formData.phone;
      if (formData.maxAppointmentsPerDay) payload.maxAppointmentsPerDay = Number(formData.maxAppointmentsPerDay);
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500">Gerenciar acesso ao sistema</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Perfil</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">2FA</th>
                <th className="px-6 py-3">Último Acesso</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">Carregando...</td>
                </tr>
              ) : (
                users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dental-100 text-sm font-semibold text-dental-700">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || ''}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="ml-2 text-sm text-gray-600">{user.isActive ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {user.twoFactorEnabled ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(user)} className="flex items-center gap-1 text-sm font-medium text-dental-600 hover:text-dental-700">
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">{editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : ''}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                />
                {!editingUser && (
                  <p className="mt-1 text-xs text-gray-400">Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial (@$!%*?&)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Perfil *</label>
                <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              {formData.role === 'DENTIST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Máx. Consultas/Dia
                    <span className="ml-1 text-xs text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 8"
                    value={formData.maxAppointmentsPerDay}
                    onChange={(e) => setFormData({ ...formData, maxAppointmentsPerDay: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Limite máximo de consultas que este dentista pode realizar por dia</p>
                </div>
              )}
              {editingUser && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-dental-600 focus:ring-dental-500" />
                  Ativo
                </label>
              )}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
