import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils';
import { CreditCard, CheckCircle, XCircle, ArrowLeft, Copy, QrCode, Barcode, Building2, Smartphone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

type TabType = 'stripe' | 'mercadopago';
type MpTab = 'pix' | 'boleto' | 'card' | 'checkout';

interface CheckoutSession {
  sessionId: string;
  url: string;
}

interface MpPaymentResult {
  id: string;
  status: string;
  statusDetail: string;
  transactionId: string;
  qrCode?: string;
  qrCodeImage?: string;
  ticketUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  transactionStatus?: string;
}

interface MpPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  transactionId: string;
}

const services = [
  { amount: 120, label: 'Consulta de Rotina', description: 'Consulta odontológica de rotina' },
  { amount: 180, label: 'Limpeza', description: 'Limpeza e profilaxia dental' },
  { amount: 200, label: 'Restauração', description: 'Restauração dentária' },
  { amount: 300, label: 'Extração', description: 'Extração dentária simples' },
  { amount: 800, label: 'Canal', description: 'Tratamento endodôntico' },
  { amount: 1200, label: 'Clareamento', description: 'Clareamento dental profissional' },
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('mercadopago');
  const [mpTab, setMpTab] = useState<MpTab>('checkout');
  const [processing, setProcessing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedService, setSelectedService] = useState(services[0]);
  const [cpf, setCpf] = useState('');
  const [paymentResult, setPaymentResult] = useState<MpPaymentResult | null>(null);
  const [preferenceResult, setPreferenceResult] = useState<MpPreferenceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const paymentStatus = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');

  const { data: patientsData } = useQuery({
    queryKey: ['patients-select'],
    queryFn: () => api.get('/patients?limit=500').then(r => r.data?.data || r.data || []),
  });

  const patients = Array.isArray(patientsData) ? patientsData : [];

  if (paymentStatus === 'success' && activeTab === 'stripe') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pagamento Confirmado!</h2>
          <p className="mt-2 text-gray-500">Seu pagamento foi processado com sucesso.</p>
          {sessionId && <p className="mt-1 text-xs text-gray-400">ID da sessão: {sessionId}</p>}
          <button onClick={() => navigate('/billing')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-3 text-sm font-semibold text-white hover:bg-dental-700">
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
          <h2 className="text-2xl font-bold text-gray-900">Pagamento Cancelado</h2>
          <p className="mt-2 text-gray-500">O pagamento não foi concluído. Você pode tentar novamente.</p>
          <button onClick={() => navigate('/billing')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-3 text-sm font-semibold text-white hover:bg-dental-700">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Financeiro
          </button>
        </div>
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    if (!selectedPatient) { toast.error('Selecione um paciente'); return; }
    setProcessing(true);
    try {
      const { data } = await api.post('/payments/checkout', {
        patientId: selectedPatient,
        amount: selectedService.amount * 100,
        description: selectedService.description,
        successUrl: `${window.location.origin}/payments?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payments?payment=cancel`,
      });
      if (data.url) window.location.href = data.url;
    } catch { toast.error('Erro ao criar sessão de pagamento'); }
    finally { setProcessing(false); }
  };

  const handleMpCheckoutPro = async () => {
    if (!selectedPatient) { toast.error('Selecione um paciente'); return; }
    setProcessing(true);
    try {
      const { data } = await api.post('/mercadopago/preference', {
        patientId: selectedPatient,
        amount: selectedService.amount * 100,
        description: selectedService.description,
        cpf: cpf || undefined,
      });
      setPreferenceResult(data);
      if (data.initPoint) window.open(data.initPoint, '_blank');
    } catch { toast.error('Erro ao criar preferência'); }
    finally { setProcessing(false); }
  };

  const handleMpDirectPayment = async () => {
    if (!selectedPatient) { toast.error('Selecione um paciente'); return; }
    if (mpTab !== 'card' && !cpf) { toast.error('CPF é obrigatório para PIX e Boleto'); return; }
    setProcessing(true);
    setPaymentResult(null);
    try {
      const methodMap: Record<string, string> = { pix: 'PIX', boleto: 'BOLETO', card: 'CREDIT_CARD' };
      const payload: any = {
        patientId: selectedPatient,
        amount: selectedService.amount,
        description: selectedService.description,
        paymentMethod: methodMap[mpTab],
        cpf: cpf || undefined,
      };
      const { data } = await api.post('/mercadopago/payment', payload);
      setPaymentResult(data);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao processar pagamento'); }
    finally { setProcessing(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos Online</h1>
        <p className="text-gray-500">Processe pagamentos de forma segura</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('mercadopago')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mercadopago' ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Mercado Pago
        </button>
        <button onClick={() => setActiveTab('stripe')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stripe' ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Stripe
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none">
              <option value="">Selecione um paciente</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} {p.cpf ? `(${p.cpf})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
            <select value={selectedService.label} onChange={e => setSelectedService(services.find(s => s.label === e.target.value) || services[0])} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none">
              {services.map(s => (
                <option key={s.label} value={s.label}>{s.label} - {formatCurrency(s.amount)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-2xl font-bold text-dental-600">{formatCurrency(selectedService.amount)}</div>
          </div>
        </div>
        {activeTab === 'mercadopago' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF do paciente (obrigatório para PIX/Boleto)</label>
            <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="123.456.789-00" className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none" />
          </div>
        )}
      </div>

      {activeTab === 'stripe' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-dental-600" />
            <h2 className="text-lg font-semibold">Pagar com Stripe</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Redireciona para o ambiente seguro do Stripe (cartão internacional, PIX)</p>
          <button onClick={handleStripeCheckout} disabled={processing || !selectedPatient} className="rounded-lg bg-dental-600 px-6 py-3 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
            {processing ? 'Processando...' : `Pagar ${formatCurrency(selectedService.amount)} com Stripe`}
          </button>
        </div>
      )}

      {activeTab === 'mercadopago' && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-200">
            {([
              { key: 'checkout', label: 'Checkout Pro', icon: Building2 },
              { key: 'pix', label: 'PIX', icon: QrCode },
              { key: 'boleto', label: 'Boleto', icon: Barcode },
              { key: 'card', label: 'Cartão', icon: CreditCard },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setMpTab(key as MpTab); setPaymentResult(null); setPreferenceResult(null); }} className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mpTab === key ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {mpTab === 'checkout' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Checkout Pro Mercado Pago</h2>
              <p className="text-sm text-gray-500 mb-4">Redireciona para o ambiente Mercado Pago. Aceita PIX, boleto e cartão de crédito parcelado.</p>
              <button onClick={handleMpCheckoutPro} disabled={processing || !selectedPatient} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {processing ? 'Processando...' : `Pagar ${formatCurrency(selectedService.amount)} com Mercado Pago`}
              </button>
              {preferenceResult && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-800">Preferência criada! ID: {preferenceResult.preferenceId}</p>
                  <a href={preferenceResult.initPoint} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Abrir página de pagamento</a>
                </div>
              )}
            </div>
          )}

          {mpTab === 'pix' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Pagamento PIX</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Gere um QR Code PIX. O paciente paga escaneando com qualquer banco.</p>
              {!paymentResult ? (
                <button onClick={handleMpDirectPayment} disabled={processing || !selectedPatient || !cpf} className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  {processing ? 'Gerando PIX...' : `Gerar QR Code PIX - ${formatCurrency(selectedService.amount)}`}
                </button>
              ) : (
                <div className="space-y-4">
                  {paymentResult.qrCodeImage && (
                    <div className="flex justify-center">
                      <img src={paymentResult.qrCodeImage} alt="QR Code PIX" className="w-48 h-48" />
                    </div>
                  )}
                  {paymentResult.qrCode && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Código PIX (copia e cola):</p>
                      <div className="flex gap-2">
                        <input readOnly value={paymentResult.qrCode} className="flex-1 text-xs border rounded px-2 py-1 bg-white" />
                        <button onClick={() => copyToClipboard(paymentResult.qrCode!)} className="flex items-center gap-1 px-3 py-1 bg-dental-600 text-white text-xs rounded hover:bg-dental-700">
                          <Copy className="h-3 w-3" /> {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg text-sm ${paymentResult.status === 'approved' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                    Status: <strong>{paymentResult.status === 'approved' ? 'APROVADO' : paymentResult.status === 'pending' ? 'AGUARDANDO PAGAMENTO' : paymentResult.status}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {mpTab === 'boleto' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Barcode className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold">Boleto Bancário</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Gera um boleto bancário. Vence em 3 dias úteis.</p>
              {!paymentResult ? (
                <button onClick={handleMpDirectPayment} disabled={processing || !selectedPatient || !cpf} className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                  {processing ? 'Gerando Boleto...' : `Gerar Boleto - ${formatCurrency(selectedService.amount)}`}
                </button>
              ) : (
                <div className="space-y-4">
                  {paymentResult.boletoUrl && (
                    <a href={paymentResult.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">
                      <Barcode className="h-4 w-4" /> Visualizar Boleto
                    </a>
                  )}
                  {paymentResult.boletoBarcode && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700">Código de barras:</p>
                      <p className="text-sm font-mono mt-1">{paymentResult.boletoBarcode}</p>
                    </div>
                  )}
                  <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                    Status: <strong>AGUARDANDO PAGAMENTO</strong> — Boletos podem levar até 3 dias úteis para compensar.
                  </div>
                </div>
              )}
            </div>
          )}

          {mpTab === 'card' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Cartão de Crédito</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Pagamento com cartão de crédito via Mercado Pago (parcelado).</p>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Para pagamento com cartão, o frontend precisa integrar o Mercado Pago.js para gerar o card token.
                  Use o <strong>Checkout Pro</strong> (aba ao lado) que já gerencia cartão, PIX e boleto automaticamente.
                </p>
              </div>
              <button onClick={handleMpDirectPayment} disabled={processing || !selectedPatient} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {processing ? 'Processando...' : `Pagar ${formatCurrency(selectedService.amount)} no Cartão`}
              </button>
              {paymentResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${paymentResult.transactionStatus === 'PAID' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  Status: <strong>{paymentResult.transactionStatus === 'PAID' ? 'APROVADO' : paymentResult.status}</strong>
                  {paymentResult.statusDetail && <p className="text-xs mt-1">Detalhe: {paymentResult.statusDetail}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
