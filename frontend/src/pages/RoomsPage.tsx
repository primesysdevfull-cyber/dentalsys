import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Search, DoorOpen, X, Trash2, Edit, Calendar } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  number?: number;
  isActive: boolean;
  _count?: { appointments: number; assignments: number };
}

export function RoomsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({ name: '', number: '', isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', search],
    queryFn: () => api.get('/rooms').then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['room-stats'],
    queryFn: () => api.get('/rooms/stats').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/rooms', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/rooms/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  function openCreate() {
    setEditingRoom(null);
    setFormData({ name: '', number: '', isActive: true });
    setShowModal(true);
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setFormData({ name: room.name, number: room.number ? String(room.number) : '', isActive: room.isActive });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditingRoom(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData, number: formData.number ? Number(formData.number) : undefined };
    if (editingRoom) updateMutation.mutate({ id: editingRoom.id, ...payload });
    else createMutation.mutate(payload);
  }

  const rooms: Room[] = data?.data || data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Salas e Consultórios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestão de salas de atendimento</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" /> Nova Sala
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ativas</p>
          <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inativas</p>
          <p className="text-2xl font-bold text-red-500">{stats?.inactive || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Ocupadas Hoje</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats?.busyToday || 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <th className="px-6 py-3">Sala</th>
                <th className="px-6 py-3">Número</th>
                <th className="px-6 py-3">Agendamentos</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Carregando...</td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma sala encontrada</td></tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dental-100">
                          <DoorOpen className="h-5 w-5 text-dental-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{room.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.number ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room._count?.appointments || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${room.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {room.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(room)} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-dental-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm('Remover esta sala?')) deleteMutation.mutate(room.id); }} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
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
          <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold">{editingRoom ? 'Editar Sala' : 'Nova Sala'}</h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Número</label>
                <input type="number" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-100 focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-dental-600 focus:ring-dental-500" />
                Ativa
              </label>
              <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {editingRoom ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
