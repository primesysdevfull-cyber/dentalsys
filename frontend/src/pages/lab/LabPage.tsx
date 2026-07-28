import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { formatCurrency } from '../../utils';
import { Plus, Edit, Trash2, FlaskConical, ChevronDown, ChevronUp, Upload, FileText, Download, X } from 'lucide-react';

const STATUS_OPTIONS = ['PENDING', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = { PENDING: 'Pendente', SENT: 'Enviado', IN_PROGRESS: 'Em Andamento', COMPLETED: 'Concluído', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };
const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700', SENT: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700', DELIVERED: 'bg-teal-100 text-teal-700', CANCELLED: 'bg-red-100 text-red-700' };

const EXAM_TYPES = [
  'HEMOGRAMA', 'GLICEMIA', 'COLESTEROL', 'TRIGLICERIDES', 'URINA',
  'RAIO_X', 'ULTRASSOM', 'TOMOGRAFIA', 'RESSONANCIA', 'BIOPSIA', 'OUTRO',
];

export function LabPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'order' | 'import'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ patientId: '', professionalId: '', labName: '', labContact: '', orderNumber: '', deliveryDate: '', notes: '' });
  const [items, setItems] = useState<{ description: string; toothNumber?: number; material?: string; color?: string; quantity: number; unitPrice?: number; notes?: string }[]>([]);

  const [importForm, setImportForm] = useState({ patientId: '', examType: '', labName: '', examDate: '', notes: '' });
  const [importFile, setImportFile] = useState<File | null>(null);

  const queryType = typeFilter === 'all' ? undefined : typeFilter;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['lab-orders', statusFilter, queryType],
    queryFn: () => api.get(`/lab${statusFilter ? `?status=${statusFilter}` : ''}${queryType ? `${statusFilter ? '&' : '?'}type=${queryType}` : ''}`).then((r) => r.data),
  });

  const { data: patientsData } = useQuery({ queryKey: ['lab-patients'], queryFn: () => api.get('/patients?limit=500').then((r) => r.data), enabled: showModal || showImportModal });
  const { data: professionalsData } = useQuery({ queryKey: ['lab-professionals'], queryFn: () => api.get('/professionals?limit=500').then((r) => r.data), enabled: showModal });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editId ? api.put(`/lab/${editId}`, data) : api.post('/lab', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lab-orders'] }); setShowModal(false); setEditId(null); setFormData({ patientId: '', professionalId: '', labName: '', labContact: '', orderNumber: '', deliveryDate: '', notes: '' }); setItems([]); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao salvar'),
  });

  const importMutation = useMutation({
    mutationFn: (form: FormData) => api.post('/lab/import-exam', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lab-orders'] }); setShowImportModal(false); setImportForm({ patientId: '', examType: '', labName: '', examDate: '', notes: '' }); setImportFile(null); },
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao importar exame'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lab/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-orders'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Erro ao excluir'),
  });

  function openEdit(order: any) {
    setEditId(order.id); setFormData({ patientId: order.patientId, professionalId: order.professionalId, labName: order.labName, labContact: order.labContact || '', orderNumber: order.orderNumber || '', deliveryDate: order.deliveryDate ? order.deliveryDate.slice(0, 10) : '', notes: order.notes || '' }); setItems(order.items || []); setShowModal(true);
  }

  function addItem() { setItems([...items, { description: '', quantity: 1 }]); }
  function updateItem(i: number, field: string, value: any) { const updated = [...items]; (updated[i] as any)[field] = value; setItems(updated); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); saveMutation.mutate({ ...formData, items }); }

  function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('patientId', importForm.patientId);
    fd.append('examType', importForm.examType);
    fd.append('labName', importForm.labName);
    if (importForm.examDate) fd.append('examDate', importForm.examDate);
    if (importForm.notes) fd.append('notes', importForm.notes);
    if (importFile) fd.append('file', importFile);
    importMutation.mutate(fd);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratório</h1>
          <p className="text-gray-500">Pedidos de prótese e exames laboratoriais</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImportModal(true); }} className="flex items-center gap-2 rounded-lg border border-dental-600 px-4 py-2 text-sm font-medium text-dental-600 hover:bg-dental-50"><Upload className="h-4 w-4" /> Importar Exame</button>
          <button onClick={() => { setEditId(null); setFormData({ patientId: '', professionalId: '', labName: '', labContact: '', orderNumber: '', deliveryDate: '', notes: '' }); setItems([]); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700"><Plus className="h-4 w-4" /> Novo Pedido</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button onClick={() => setTypeFilter('all')} className={`rounded-md px-3 py-1.5 text-xs font-medium ${typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
          <button onClick={() => setTypeFilter('order')} className={`rounded-md px-3 py-1.5 text-xs font-medium ${typeFilter === 'order' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pedidos</button>
          <button onClick={() => setTypeFilter('import')} className={`rounded-md px-3 py-1.5 text-xs font-medium ${typeFilter === 'import' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Exames</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStatusFilter('')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!statusFilter ? 'bg-dental-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${statusFilter === s ? 'bg-dental-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-dental-600 border-t-transparent" /></div>
      : !orders?.length ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <FlaskConical className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {typeFilter === 'import' ? 'Nenhum exame importado' : typeFilter === 'order' ? 'Nenhum pedido' : 'Nenhum registro'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {typeFilter === 'import' ? 'Importe exames laboratoriais feitos fora da clínica' : 'Crie pedidos de laboratório para próteses e serviços'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="flex items-center gap-4">
                  {order.isImport ? (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Exame</span>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{order.patient?.name}</p>
                    <p className="text-xs text-gray-500">
                      {order.isImport
                        ? `${order.examType || 'Exame'} - ${order.labName}`
                        : `${order.labName}${order.orderNumber ? ` - #${order.orderNumber}` : ''}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!order.isImport && <span className="text-sm font-medium text-gray-700">{formatCurrency(order.totalCost)}</span>}
                  {order.professional?.name && <span className="text-xs text-gray-400">{order.professional.name}</span>}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {order.isImport && order.fileUrl && (
                      <a href={order.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Download"><Download className="h-3.5 w-3.5" /></a>
                    )}
                    <button onClick={() => openEdit(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm('Remover?')) deleteMutation.mutate(order.id); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  {expandedId === order.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
              {expandedId === order.id && (
                <div className="border-t px-6 py-4">
                  {order.isImport ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-gray-700">Tipo:</span> {order.examType}</p>
                      <p><span className="font-medium text-gray-700">Laboratório:</span> {order.labName}</p>
                      {order.examDate && <p><span className="font-medium text-gray-700">Data:</span> {new Date(order.examDate).toLocaleDateString('pt-BR')}</p>}
                      {order.fileName && <p><span className="font-medium text-gray-700">Arquivo:</span> {order.fileName}</p>}
                      {order.notes && <p><span className="font-medium text-gray-700">Obs:</span> {order.notes}</p>}
                    </div>
                  ) : (
                    <>
                      {order.items?.length > 0 && (
                        <table className="mb-3 w-full text-sm">
                          <thead><tr className="border-b text-left text-xs text-gray-500"><th className="pb-1 font-medium">Item</th><th className="pb-1 font-medium">Dente</th><th className="pb-1 font-medium">Material</th><th className="pb-1 font-medium">Qtd</th><th className="pb-1 font-medium text-right">Valor</th></tr></thead>
                          <tbody>{order.items.map((item: any, i: number) => (
                            <tr key={item.id || i} className="border-b border-dashed last:border-0">
                              <td className="py-1 text-gray-900">{item.description}</td>
                              <td className="py-1 text-gray-600">{item.toothNumber || '-'}</td>
                              <td className="py-1 text-gray-600">{item.material || '-'}</td>
                              <td className="py-1 text-gray-600">{item.quantity}</td>
                              <td className="py-1 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      )}
                      {order.notes && <p className="text-sm text-gray-500"><span className="font-medium">Obs:</span> {order.notes}</p>}
                      {order.deliveryDate && <p className="text-sm text-gray-500"><span className="font-medium">Entrega:</span> {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Editar' : 'Novo'} Pedido</h2>
            <form onSubmit={handleSubmit} className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Paciente *</label>
                  <select value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Selecione...</option>
                    {patientsData?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Profissional *</label>
                  <select value={formData.professionalId} onChange={(e) => setFormData({...formData, professionalId: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Selecione...</option>
                    {professionalsData?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Laboratório *</label><input type="text" value={formData.labName} onChange={(e) => setFormData({...formData, labName: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Contato</label><input type="text" value={formData.labContact} onChange={(e) => setFormData({...formData, labContact: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Nº Pedido</label><input type="text" value={formData.orderNumber} onChange={(e) => setFormData({...formData, orderNumber: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Data Entrega</label><input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Itens</label><button type="button" onClick={addItem} className="text-xs text-dental-600 hover:text-dental-700 font-medium">+ Adicionar item</button></div>
                {items.map((item, i) => (
                  <div key={i} className="mb-2 rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-start justify-between mb-2"><span className="text-xs font-medium text-gray-500">Item {i + 1}</span><button type="button" onClick={() => removeItem(i)} className="text-xs text-red-500">Remover</button></div>
                    <div className="grid grid-cols-5 gap-2">
                      <input placeholder="Descrição" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className="col-span-2 rounded border border-gray-200 px-2 py-1 text-xs" />
                      <input placeholder="Dente" type="number" value={item.toothNumber || ''} onChange={(e) => updateItem(i, 'toothNumber', e.target.value ? parseInt(e.target.value) : undefined)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                      <input placeholder="Material" value={item.material || ''} onChange={(e) => updateItem(i, 'material', e.target.value)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                      <input placeholder="Cor" value={item.color || ''} onChange={(e) => updateItem(i, 'color', e.target.value)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input placeholder="Qtd" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                      <input placeholder="Valor unit." type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(i, 'unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                      <input placeholder="Obs" value={item.notes || ''} onChange={(e) => updateItem(i, 'notes', e.target.value)} className="rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Observações</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowImportModal(false)}>
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Importar Exame</h2>
              <button onClick={() => setShowImportModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Paciente *</label>
                <select value={importForm.patientId} onChange={(e) => setImportForm({...importForm, patientId: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                  <option value="">Selecione...</option>
                  {patientsData?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Tipo de Exame *</label>
                  <select value={importForm.examType} onChange={(e) => setImportForm({...importForm, examType: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500">
                    <option value="">Selecione...</option>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Laboratório *</label><input type="text" value={importForm.labName} onChange={(e) => setImportForm({...importForm, labName: e.target.value})} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Data do Exame</label><input type="date" value={importForm.examDate} onChange={(e) => setImportForm({...importForm, examDate: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arquivo (PDF, imagem)</label>
                <div className="mt-1 flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"><Upload className="h-4 w-4" /> Selecionar arquivo</button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                  {importFile && <span className="text-sm text-gray-500">{importFile.name}</span>}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Observações</label><textarea value={importForm.notes} onChange={(e) => setImportForm({...importForm, notes: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowImportModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={importMutation.isPending} className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-700 disabled:opacity-50">{importMutation.isPending ? 'Importando...' : 'Importar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}