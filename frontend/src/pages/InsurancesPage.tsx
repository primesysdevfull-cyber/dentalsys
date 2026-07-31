import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Edit, Trash2, Building2, Users } from 'lucide-react';
import { maskPhone } from '../utils';

export function InsurancesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', cnpj: '', isActive: true });

  const { data: insurances, isLoading } = useQuery({
    queryKey: ['insurances'],
    queryFn: () => api.get('/insurances').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editId ? api.put(`/insurances/${editId}`, data) : api.post('/insurances', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['insurances'] }); setShowModal(false); setEditId(null); setFormData({ name: '', email: '', phone: '', address: '', cnpj: '', isActive: true }); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/insurances/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurances'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao excluir'),
  });

  function openEdit(ins: any) {
    setEditId(ins.id); setFormData({ name: ins.name, email: ins.email || '', phone: ins.phone || '', address: ins.address || '', cnpj: ins.cnpj || '', isActive: ins.isActive }); setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); saveMutation.mutate(formData); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Convênios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerenciar planos de saúde e convênios odontológicos</p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ name: '', email: '', phone: '', address: '', cnpj: '', isActive: true }); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700"><Plus className="h-4 w-4" /> Novo Convênio</button>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" /></div>
      : !insurances?.length ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum convênio cadastrado</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Adicione convênios para vincular aos pacientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">CNPJ</th>
                <th className="px-6 py-3">Telefone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-center">Pacientes</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {insurances.map((ins: any) => (
                <tr key={ins.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{ins.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ins.cnpj || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ins.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ins.email || '-'}</td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400"><Users className="h-3.5 w-3.5" />{ins._count?.patients || 0}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ins.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{ins.isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(ins)} className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm('Remover convênio?')) deleteMutation.mutate(ins.id); }} className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editId ? 'Editar' : 'Novo'} Convênio</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CNPJ</label><input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Endereço</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-dental-600" /><label className="text-sm text-gray-700 dark:text-gray-400">Ativo</label></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
