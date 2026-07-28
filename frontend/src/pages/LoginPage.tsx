import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, CheckCircle, Stethoscope, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const features = [
  'Gestão de Pacientes', 'Agendamento Inteligente', 'Prontuário Eletrônico',
  'Odontograma Digital', 'Controle Financeiro', 'Gestão de Estoque',
  'Relatórios Avançados', 'Acesso Seguro (LGPD)',
];

export function LoginPage() {
  const [email, setEmail] = useState('admin@clinica.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha');
      return;
    }
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success('Login realizado com sucesso!');
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED') {
        toast('Autenticação 2FA necessária', { icon: '🔐' });
      } else {
        setError('Email ou senha incorretos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Lado Esquerdo - Apresentação */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-blue-800 p-8 md:w-1/2 md:p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 max-w-md text-center text-white">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Stethoscope className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-[clamp(1.8rem,3vw,2.2rem)] font-bold">DentalSys</h1>
          <p className="mb-8 text-[clamp(0.95rem,2vw,1.1rem)] text-white/90">Sistema de Gestão para Clínica Odontológica</p>

          <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-300" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex w-full items-center justify-center bg-white dark:bg-gray-900 p-6 md:w-1/2 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <Stethoscope className="h-7 w-7 text-teal-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">DentalSys</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Bem-vindo de volta</h2>
          <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">Entre com suas credenciais para acessar o sistema</p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 py-2.5 pl-10 pr-4 text-sm transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 py-2.5 pl-10 pr-10 text-sm transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                Lembrar de mim
              </label>
              <a href="#" className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700">Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition-all duration-200 hover:bg-teal-700 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Demo: <span className="font-medium text-gray-600 dark:text-gray-300">admin@clinica.com</span> / <span className="font-medium text-gray-600 dark:text-gray-300">Admin@123</span>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem uma conta?{' '}
            <a href="#" className="font-medium text-teal-600 transition-colors hover:text-teal-700">Solicitar acesso</a>
          </p>
        </div>
      </div>
    </div>
  );
}
