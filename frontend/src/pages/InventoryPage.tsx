import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { Plus, Package, AlertTriangle, Search, X, Edit, Minus, ArrowDown } from 'lucide-react';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [movementItem, setMovementItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', category: '', sku: '', unit: 'un',
    currentStock: '', minStock: '', maxStock: '', unitCost: '', unitPrice: '',
    expiryDate: '', supplierName: '',
  });

  const [moveData, setMoveData] = useState({
    type: 'EXIT', quantity: '', unitCost: '', totalCost: '', invoiceNumber: '', reason: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return api.get(`/inventory?${params}`).then((r) => r.data);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.get('/inventory/stats').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/inventory', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      closeCreateModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao cadastrar item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/inventory/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      closeCreateModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao atualizar item'),
  });

  const movementMutation = useMutation({
    mutationFn: ({ itemId, ...d }: any) => api.post(`/inventory/${itemId}/movements`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      closeMovementModal();
    },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao registrar movimentação'),
  });

  function openCreate() {
    setEditingItem(null);
    setFormData({ name: '', description: '', category: '', sku: '', unit: 'un', currentStock: '', minStock: '', maxStock: '', unitCost: '', unitPrice: '', expiryDate: '', supplierName: '' });
    setShowCreateModal(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setFormData({
      name: item.name || '', description: item.description || '', category: item.category || '',
      sku: item.sku || '', unit: item.unit || 'un',
      currentStock: String(item.currentStock ?? ''), minStock: String(item.minStock ?? ''),
      maxStock: String(item.maxStock ?? ''), unitCost: item.unitCost ? String(item.unitCost) : '',
      unitPrice: item.unitPrice ? String(item.unitPrice) : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      supplierName: item.supplierName || '',
    });
    setShowCreateModal(true);
  }

  function closeCreateModal() { setShowCreateModal(false); setEditingItem(null); }

  function openMovement(item: any) {
    setMovementItem(item);
    setMoveData({ type: 'EXIT', quantity: '', unitCost: '', totalCost: '', invoiceNumber: '', reason: '' });
  }

  function closeMovementModal() { setMovementItem(null); }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { name: formData.name };
    if (formData.description) payload.description = formData.description;
    if (formData.category) payload.category = formData.category;
    if (formData.sku) payload.sku = formData.sku;
    if (formData.unit) payload.unit = formData.unit;
    if (formData.currentStock) payload.currentStock = Number(formData.currentStock);
    if (formData.minStock) payload.minStock = Number(formData.minStock);
    if (formData.maxStock) payload.maxStock = Number(formData.maxStock);
    if (formData.unitCost) payload.unitCost = Number(formData.unitCost);
    if (formData.unitPrice) payload.unitPrice = Number(formData.unitPrice);
    if (formData.expiryDate) payload.expiryDate = formData.expiryDate;
    if (formData.supplierName) payload.supplierName = formData.supplierName;

    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...payload });
    else createMutation.mutate(payload);
  }

  function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      type: moveData.type,
      quantity: Number(moveData.quantity),
    };
    if (moveData.unitCost) payload.unitCost = Number(moveData.unitCost);
    if (moveData.totalCost) payload.totalCost = Number(moveData.totalCost);
    if (moveData.invoiceNumber) payload.invoiceNumber = moveData.invoiceNumber;
    if (moveData.reason) payload.reason = moveData.reason;
    movementMutation.mutate({ itemId: movementItem.id, ...payload });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500">Controle de materiais e medicamentos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dental-700">
          <Plus className="h-4 w-4" />
          Novo Item
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de Itens</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalItems || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-gray-500">Estoque Baixo</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats?.lowStockCount || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Valor em Estoque</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalValue || 0)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Estoque</th>
                <th className="px-6 py-3">Custo Unit.</th>
                <th className="px-6 py-3">Validade</th>
                <th className="px-6 py-3">Fornecedor</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">Carregando...</td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Nenhum item encontrado
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        item.currentStock <= item.minStock ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.currentStock} {item.unit}
                      </span>
                      {item.currentStock <= item.minStock && (
                        <span className="ml-2 text-xs text-red-500">(mín: {item.minStock})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.unitCost ? formatCurrency(Number(item.unitCost)) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.supplierName || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} title="Editar" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-dental-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => openMovement(item)} title="Movimentar Estoque" className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingItem ? 'Editar Item' : 'Novo Item'}</h2>
              <button onClick={closeCreateModal} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Medicamento, Material" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidade</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="un">Unidade</option>
                    <option value="kg">Quilograma</option>
                    <option value="g">Grama</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="cx">Caixa</option>
                    <option value="pct">Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                  <input type="number" min="0" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque Mín.</label>
                  <input type="number" min="0" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custo Unitário (R$)</label>
                  <input type="number" step="0.01" min="0" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço Venda (R$)</label>
                  <input type="number" step="0.01" min="0" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Validade</label>
                  <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                  <input type="text" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeCreateModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingItem ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {movementItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Movimentar Estoque</h2>
              <button onClick={closeMovementModal} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 pt-4">
              <p className="text-sm text-gray-500">Item: <span className="font-medium text-gray-900">{movementItem.name}</span></p>
              <p className="text-sm text-gray-500">Estoque atual: <span className="font-medium text-gray-900">{movementItem.currentStock} {movementItem.unit}</span></p>
            </div>
            <form onSubmit={handleMovementSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Movimentação *</label>
                <select required value={moveData.type} onChange={(e) => setMoveData({ ...moveData, type: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  <option value="ENTRY">Entrada (compra/reposição)</option>
                  <option value="EXIT">Saída (baixa/consumo)</option>
                  <option value="ADJUSTMENT">Ajuste de estoque</option>
                  <option value="RETURN">Devolução</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade *</label>
                <input type="number" required min="1" value={moveData.quantity} onChange={(e) => setMoveData({ ...moveData, quantity: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              {(moveData.type === 'ENTRY' || moveData.type === 'RETURN') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Custo Unitário (R$)</label>
                    <input type="number" step="0.01" min="0" value={moveData.unitCost} onChange={(e) => setMoveData({ ...moveData, unitCost: e.target.value })} placeholder="0,00" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                    <input type="number" step="0.01" min="0" value={moveData.totalCost} onChange={(e) => setMoveData({ ...moveData, totalCost: e.target.value })} placeholder="0,00" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nº Nota Fiscal</label>
                    <input type="text" value={moveData.invoiceNumber} onChange={(e) => setMoveData({ ...moveData, invoiceNumber: e.target.value })} placeholder="NF-e 000.000.001" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo</label>
                <input type="text" value={moveData.reason} onChange={(e) => setMoveData({ ...moveData, reason: e.target.value })} placeholder="Ex: Reposição de estoque" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeMovementModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={movementMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
                  {movementMutation.isPending ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
