import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard, CheckCircle, XCircle, ArrowLeft, Copy, QrCode, Barcode, Building2, Loader2,
  ShoppingCart, Trash2, CheckSquare, Square,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'stripe' | 'mercadopago';
type MpTab = 'pix' | 'boleto' | 'checkout';

interface PendingItem {
  id: string;
  treatmentPlanId: string;
  treatmentPlanTitle: string;
  procedureId: string | null;
  procedureName: string;
  description: string | null;
  estimatedPrice: number;
  toothNumber: number | null;
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('mercadopago');
  const [mpTab, setMpTab] = useState<MpTab>('checkout');
  const [processing, setProcessing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [cpf, setCpf] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const paymentStatus = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');

  const { data: patientsData } = useQuery({
    queryKey: ['patients-select'],
    queryFn: () => api.get('/patients?limit=500').then(r => r.data?.data || r.data || []),
  });
  const patients = Array.isArray(patientsData) ? patientsData : [];

  const { data: pendingItems, isLoading: loadingItems } = useQuery({
    queryKey: ['pending-items', selectedPatient],
    queryFn: () => api.get(`/billing/pending-items/${selectedPatient}`).then(r => r.data || []),
    enabled: !!selectedPatient,
  });
  const items: PendingItem[] = Array.isArray(pendingItems) ? pendingItems : [];

  const totalSelected = items
    .filter(i => selectedItems.has(i.id))
    .reduce((sum, i) => sum + i.estimatedPrice, 0);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Pagamento Confirmado!</h2>
          <p className="mt-2 text-[#6B7280]">Pagamento processado com sucesso.</p>
          {sessionId && <p className="mt-1 text-xs text-[#9CA3AF]">ID: {sessionId}</p>}
          <button onClick={() => navigate('/billing')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Financeiro
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'cancel') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Pagamento Cancelado</h2>
          <p className="mt-2 text-[#6B7280]">O pagamento não foi concluído.</p>
          <button onClick={() => navigate('/billing')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Financeiro
          </button>
        </div>
      </div>
    );
  }

  const createTransaction = async () => {
    if (!selectedPatient) { toast.error('Selecione um paciente'); return null; }
    if (selectedItems.size === 0) { toast.error('Selecione ao menos um item para pagamento'); return null; }
    const selected = items.filter(i => selectedItems.has(i.id));
    const description = selected.map(i => i.procedureName).join(', ');
    try {
      const { data } = await api.post('/billing', {
        type: 'INCOME',
        patientId: selectedPatient,
        description: `Pagamento: ${description}`,
        amount: totalSelected,
        discount: 0,
        paymentMethod: 'PIX',
        notes: `Itens: ${selected.map(i => i.id).join(', ')}`,
      });
      return data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar transação');
      return null;
    }
  };

  const handleMpCheckout = async () => {
    const transaction = await createTransaction();
    if (!transaction) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/mercadopago/preference', {
        patientId: selectedPatient,
        amount: totalSelected * 100,
        description: `Pagamento de ${items.filter(i => selectedItems.has(i.id)).map(i => i.procedureName).join(', ')}`,
        cpf: cpf || undefined,
      });
      if (data.initPoint) window.open(data.initPoint, '_blank');
      setPaymentResult(data);
    } catch { toast.error('Erro ao criar preferência'); }
    finally { setProcessing(false); }
  };

  const handleMpPix = async () => {
    if (!cpf) { toast.error('CPF é obrigatório para PIX'); return; }
    const transaction = await createTransaction();
    if (!transaction) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/mercadopago/payment', {
        patientId: selectedPatient,
        amount: totalSelected,
        description: `Pagamento: ${items.filter(i => selectedItems.has(i.id)).map(i => i.procedureName).join(', ')}`,
        paymentMethod: 'PIX',
        cpf,
        transactionId: transaction.id,
      });
      setPaymentResult(data);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao gerar PIX'); }
    finally { setProcessing(false); }
  };

  const handleMpBoleto = async () => {
    if (!cpf) { toast.error('CPF é obrigatório para Boleto'); return; }
    const transaction = await createTransaction();
    if (!transaction) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/mercadopago/payment', {
        patientId: selectedPatient,
        amount: totalSelected,
        description: `Pagamento: ${items.filter(i => selectedItems.has(i.id)).map(i => i.procedureName).join(', ')}`,
        paymentMethod: 'BOLETO',
        cpf,
        transactionId: transaction.id,
      });
      setPaymentResult(data);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao gerar Boleto'); }
    finally { setProcessing(false); }
  };

  const handleStripeCheckout = async () => {
    const transaction = await createTransaction();
    if (!transaction) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/payments/checkout', {
        patientId: selectedPatient,
        amount: totalSelected * 100,
        description: `Pagamento: ${items.filter(i => selectedItems.has(i.id)).map(i => i.procedureName).join(', ')}`,
        transactionId: transaction.id,
        successUrl: `${window.location.origin}/payments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payments?payment=cancel`,
      });
      if (data.url) window.location.href = data.url;
    } catch { toast.error('Erro ao criar sessão'); }
    finally { setProcessing(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Pagamentos Online</h1>
        <p className="text-sm text-[#6B7280]">Selecione os serviços que o paciente deseja pagar</p>
      </div>

      {/* Seleção de paciente */}
      <div className="rounded-xl bg-white p-6 shadow-card">
        <label className="block text-sm font-medium text-[#1F2937] mb-2">Paciente</label>
        <select
          value={selectedPatient}
          onChange={e => { setSelectedPatient(e.target.value); setSelectedItems(new Set()); setPaymentResult(null); }}
          className="w-full max-w-lg rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Selecione um paciente</option>
          {patients.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name} {p.cpf ? `(${p.cpf})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Itens pendentes */}
      {selectedPatient && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-[#1F2937]">Serviços Pendentes</h2>
            </div>
            {loadingItems && <Loader2 className="h-4 w-4 text-[#6B7280] animate-spin" />}
          </div>

          {!loadingItems && items.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-success-500 mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">Nenhum serviço pendente para este paciente.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Crie um plano de tratamento com serviços para gerar cobranças.</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              {items.length > 0 && (
                <button onClick={selectAll} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-3">
                  {selectedItems.size === items.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {selectedItems.size === items.length ? 'Desmarcar todos' : `Selecionar todos (${items.length})`}
                </button>
              )}

              {/* Lista de itens agrupados por plano */}
              {(() => {
                const grouped: Record<string, { title: string; items: PendingItem[] }> = {};
                for (const item of items) {
                  if (!grouped[item.treatmentPlanId]) {
                    grouped[item.treatmentPlanId] = { title: item.treatmentPlanTitle, items: [] };
                  }
                  grouped[item.treatmentPlanId].items.push(item);
                }
                return Object.entries(grouped).map(([planId, group]) => (
                  <div key={planId} className="mb-4">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">{group.title}</p>
                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                            selectedItems.has(item.id)
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="h-4 w-4 rounded border-[#D1D5DB] text-primary-600 focus:ring-primary-500"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1F2937]">{item.procedureName}</p>
                              <p className="text-xs text-[#6B7280]">
                                {item.description || ''}
                                {item.toothNumber ? ` • Dente ${item.toothNumber}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[#1F2937] shrink-0 ml-3">
                            {formatCurrency(item.estimatedPrice)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {/* Total */}
              {totalSelected > 0 && (
                <div className="border-t border-[#E5E7EB] pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-[#1F2937]">Total selecionado</span>
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(totalSelected)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Métodos de pagamento */}
      {selectedPatient && totalSelected > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <div className="flex gap-2 border-b border-[#E5E7EB] mb-4">
            <button onClick={() => setActiveTab('mercadopago')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mercadopago' ? 'border-primary-600 text-primary-600' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'}`}>
              Mercado Pago
            </button>
            <button onClick={() => setActiveTab('stripe')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stripe' ? 'border-primary-600 text-primary-600' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'}`}>
              Stripe
            </button>
          </div>

          {activeTab === 'mercadopago' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1">CPF do paciente</label>
                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="123.456.789-00" className="w-full max-w-xs rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleMpCheckout} disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                  <Building2 className="h-4 w-4" /> {processing ? 'Processando...' : `Checkout Pro - ${formatCurrency(totalSelected)}`}
                </button>
                <button onClick={handleMpPix} disabled={processing || !cpf} className="inline-flex items-center gap-2 rounded-lg bg-success-500 px-6 py-3 text-sm font-semibold text-white hover:bg-success-600 disabled:opacity-50">
                  <QrCode className="h-4 w-4" /> PIX
                </button>
                <button onClick={handleMpBoleto} disabled={processing || !cpf} className="inline-flex items-center gap-2 rounded-lg bg-warning-500 px-6 py-3 text-sm font-semibold text-white hover:bg-warning-600 disabled:opacity-50">
                  <Barcode className="h-4 w-4" /> Boleto
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stripe' && (
            <div>
              <p className="text-sm text-[#6B7280] mb-4">Pagamento via Stripe com cartão internacional ou PIX.</p>
              <button onClick={handleStripeCheckout} disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                <CreditCard className="h-4 w-4" /> {processing ? 'Processando...' : `Pagar ${formatCurrency(totalSelected)} com Stripe`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resultado do pagamento (PIX) */}
      {paymentResult?.qrCodeImage && (
        <div className="rounded-xl bg-white p-6 shadow-card space-y-4">
          <h3 className="text-base font-semibold text-[#1F2937] flex items-center gap-2">
            <QrCode className="h-5 w-5 text-success-500" /> Pagamento PIX Gerado
          </h3>
          <div className="flex justify-center">
            <img src={paymentResult.qrCodeImage} alt="QR Code PIX" className="w-48 h-48" />
          </div>
          {paymentResult.qrCode && (
            <div className="p-3 bg-[#F9FAFB] rounded-lg">
              <p className="text-xs font-medium text-[#6B7280] mb-1">Código PIX (copia e cola):</p>
              <div className="flex gap-2">
                <input readOnly value={paymentResult.qrCode} className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 bg-white" />
                <button onClick={() => copyToClipboard(paymentResult.qrCode)} className="flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700">
                  <Copy className="h-3 w-3" /> {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
          <div className={`p-3 rounded-lg text-sm ${paymentResult.status === 'approved' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
            Status: <strong>{paymentResult.status === 'approved' ? 'PAGO' : paymentResult.status === 'pending' ? 'AGUARDANDO PAGAMENTO' : paymentResult.status}</strong>
          </div>
        </div>
      )}

      {/* Resultado do pagamento (Boleto) */}
      {paymentResult?.boletoUrl && (
        <div className="rounded-xl bg-white p-6 shadow-card space-y-4">
          <h3 className="text-base font-semibold text-[#1F2937] flex items-center gap-2">
            <Barcode className="h-5 w-5 text-warning-500" /> Boleto Gerado
          </h3>
          <a href={paymentResult.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-warning-500 px-6 py-3 text-sm font-semibold text-white hover:bg-warning-600">
            <Barcode className="h-4 w-4" /> Visualizar Boleto
          </a>
          {paymentResult.boletoBarcode && (
            <div className="p-3 bg-[#F9FAFB] rounded-lg">
              <p className="text-xs font-medium text-[#6B7280]">Código de barras:</p>
              <p className="text-sm font-mono mt-1 text-[#1F2937]">{paymentResult.boletoBarcode}</p>
            </div>
          )}
        </div>
      )}

      {/* Resultado preferência (Checkout Pro) */}
      {paymentResult?.initPoint && !paymentResult?.qrCodeImage && !paymentResult?.boletoUrl && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <p className="text-sm text-primary-700">Preferência criada. ID: {paymentResult.preferenceId}</p>
          <a href={paymentResult.initPoint} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">Abrir página de pagamento</a>
        </div>
      )}
    </div>
  );
}
