import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Building, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { maskPhone } from '../../utils';

export function ClinicDataPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', tradeName: '', cnpj: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', logoUrl: '' });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api.get('/tenants/current').then((r) => r.data),
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name || '', tradeName: tenant.tradeName || '', cnpj: tenant.cnpj || '',
        email: tenant.email || '', phone: tenant.phone || '', address: tenant.address || '',
        city: tenant.city || '', state: tenant.state || '', zipCode: tenant.zipCode || '',
        logoUrl: tenant.logoUrl || '',
      });
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/tenants/current', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tenant'] }); toast.success('Dados atualizados'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(form);
  }

  if (isLoading) return <div className="py-12 text-center text-gray-400 dark:text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dados da Clínica</h1>
          <p className="text-gray-500 dark:text-gray-400">Informações gerais, CNPJ, endereço e logo</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Building className="h-5 w-5 text-dental-500" /> Informações</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome Fantasia *</label><input type="text" required value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Razão Social</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CNPJ</label><input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Telefone</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          </div>
        </div>
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Endereço</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Endereço</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">CEP</label><input type="text" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Cidade</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label><input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
