import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export function MercadoPagoSettings() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadCurrentToken();
  }, []);

  const loadCurrentToken = async () => {
    try {
      const { data } = await api.get('/tenants/current');
      const currentToken = data.mercadopagoAccessToken || '';
      setToken(currentToken);
      setSavedToken(currentToken);
    } catch {
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await api.put('/tenants/current/mercadopago-token', { mercadopagoAccessToken: token });
      setSavedToken(token);
      toast.success('Token salvo com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar token');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.get('/tenants/current');
      if (!data.mercadopagoAccessToken) {
        setTestResult({ success: false, message: 'Nenhum token configurado.' });
        return;
      }
      setTestResult({ success: true, message: 'Token configurado. Crie um pagamento na página de Pagamentos Online para testar.' });
    } catch {
      setTestResult({ success: false, message: 'Erro ao verificar token.' });
    } finally {
      setTesting(false);
    }
  };

  const hasChanges = token !== savedToken;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mercado Pago</h1>
        <p className="text-gray-500">Configure a integração de pagamentos online</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-blue-50 p-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Token de Acesso</h2>
            <p className="text-sm text-gray-500">Insira o Access Token do Mercado Pago para receber pagamentos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => { setToken(e.target.value); setTestResult(null); }}
                placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm font-mono focus:border-dental-500 focus:outline-none"
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Começa com <code className="bg-gray-100 px-1 rounded">APP_USR-</code> (produção) ou <code className="bg-gray-100 px-1 rounded">TEST-</code> (sandbox). Obtenha em{' '}
              <a href="https://mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-dental-600 hover:underline">
                mercadopago.com.br/developers <ExternalLink className="inline h-3 w-3" />
              </a>
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !hasChanges} className="rounded-lg bg-dental-600 px-6 py-2 text-sm font-semibold text-white hover:bg-dental-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={handleTest} disabled={testing} className="rounded-lg border border-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {testing ? 'Verificando...' : 'Verificar token'}
            </button>
          </div>

          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Como configurar</h2>
        <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
          <li>Crie uma conta no <a href="https://mercadopago.com.br" target="_blank" rel="noopener noreferrer" className="text-dental-600 hover:underline">Mercado Pago</a></li>
          <li>Acesse <a href="https://mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-dental-600 hover:underline">Developers</a></li>
          <li>Vá em <strong>Credenciais</strong> e copie o <strong>Access Token</strong></li>
          <li>Cole no campo acima e clique em Salvar</li>
          <li>Vá em <strong>Pagamentos Online</strong> no menu e cobre seus pacientes</li>
        </ol>
      </div>
    </div>
  );
}
