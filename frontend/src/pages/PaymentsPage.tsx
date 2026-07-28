import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../utils';
import { CreditCard, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface CheckoutSession {
  sessionId: string;
  url: string;
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async (amount: number, description: string) => {
    setProcessing(true);
    try {
      const { data } = await api.post('/payments/checkout', {
        amount,
        description,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Erro ao criar sessão de pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus === 'success') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pagamento Confirmado!</h2>
          <p className="mt-2 text-gray-500">
            Seu pagamento foi processado com sucesso.
          </p>
          {sessionId && (
            <p className="mt-1 text-xs text-gray-400">
              ID da sessão: {sessionId}
            </p>
          )}
          <button
            onClick={() => navigate('/billing')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-3 text-sm font-semibold text-white hover:bg-dental-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Financeiro
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
          <p className="mt-2 text-gray-500">
            O pagamento não foi concluído. Você pode tentar novamente.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-3 text-sm font-semibold text-white hover:bg-dental-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Financeiro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos Online</h1>
        <p className="text-gray-500">Realize pagamentos de forma segura via Stripe</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { amount: 120, label: 'Consulta de Rotina', description: 'Consulta odontológica de rotina' },
          { amount: 180, label: 'Limpeza', description: 'Limpeza e profilaxia dental' },
          { amount: 200, label: 'Restauração', description: 'Restauração dentária' },
          { amount: 300, label: 'Extração', description: 'Extração dentária simples' },
          { amount: 800, label: 'Canal', description: 'Tratamento endodôntico' },
          { amount: 1200, label: 'Clareamento', description: 'Clareamento dental profissional' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-dental-50">
              <CreditCard className="h-6 w-6 text-dental-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-dental-600">
                {formatCurrency(item.amount)}
              </span>
              <button
                onClick={() => handleCheckout(item.amount, item.description)}
                disabled={processing}
                className="rounded-lg bg-dental-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Pagar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-gray-50 p-4">
        <p className="text-center text-sm text-gray-500">
          Pagamentos processados de forma segura pelo Stripe. Seus dados de cartão não são armazenados.
        </p>
      </div>
    </div>
  );
}
