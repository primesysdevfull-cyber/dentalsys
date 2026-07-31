import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Calendar, ClipboardList, CreditCard,
  Package, BarChart3, Settings, UserCog, Stethoscope, X, Wrench, DoorOpen, Shield, FileText,
  Building2, FlaskConical, Cpu, ShieldCheck, Database,
  ClipboardPen, Receipt, Bell, TrendingUp, CalendarClock, DollarSign, Megaphone,
  LogOut, ChevronDown,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavCategory {
  label: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    label: 'GERAL',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Notificações', href: '/notifications', icon: Bell },
      { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'ATENDIMENTO',
    items: [
      { name: 'Pacientes', href: '/patients', icon: Users },
      { name: 'Agendamentos', href: '/appointments', icon: Calendar },
      { name: 'Agenda', href: '/scheduling', icon: CalendarClock },
      { name: 'Prontuário', href: '/clinical-records', icon: ClipboardList },
      { name: 'Anamnese', href: '/anamnesis', icon: ClipboardPen },
      { name: 'Planos de Tratamento', href: '/treatment-plans', icon: Receipt },
    ],
  },
  {
    label: 'FINANCEIRO',
    items: [
      { name: 'Financeiro', href: '/billing', icon: CreditCard },
      { name: 'Financeiro Avançado', href: '/financial-advanced', icon: TrendingUp },
      { name: 'Fluxo de Caixa', href: '/cash-flow', icon: DollarSign },
      { name: 'Pagamentos Online', href: '/payments', icon: DollarSign },
      { name: 'Convênios', href: '/insurances', icon: Building2 },
      { name: 'Comissões', href: '/commissions', icon: DollarSign },
      { name: 'NF-e / NFS-e', href: '/settings/nfe', icon: FileText },
    ],
  },
  {
    label: 'OPERAÇÃO',
    items: [
      { name: 'Laboratório', href: '/lab', icon: FlaskConical },
      { name: 'Estoque', href: '/inventory', icon: Package },
      { name: 'Procedimentos', href: '/procedures', icon: Wrench },
      { name: 'Profissionais', href: '/professionals', icon: UserCog },
      { name: 'Salas', href: '/rooms', icon: DoorOpen },
    ],
  },
  {
    label: 'ADMINISTRAÇÃO',
    items: [
      { name: 'Usuários', href: '/users', icon: Shield },
      { name: 'Recall / Campanhas', href: '/recall', icon: Megaphone },
      { name: 'IA / Transcrição', href: '/ai', icon: Cpu },
      { name: 'LGPD / Privacidade', href: '/privacy', icon: ShieldCheck },
      { name: 'Migração', href: '/migration', icon: Database },
      { name: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];

const roleAccess: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/notifications', '/reports', '/patients', '/appointments', '/scheduling', '/clinical-records', '/anamnesis', '/treatment-plans', '/billing', '/financial-advanced', '/cash-flow', '/payments', '/commissions', '/insurances', '/settings/nfe', '/lab', '/inventory', '/procedures', '/professionals', '/rooms', '/users', '/recall', '/ai', '/privacy', '/migration', '/settings'],
  DENTIST: ['/dashboard', '/notifications', '/patients', '/appointments', '/clinical-records', '/insurances', '/lab', '/procedures', '/professionals'],
  ASSISTANT: ['/dashboard', '/patients', '/appointments', '/lab', '/inventory', '/procedures', '/rooms', '/professionals'],
  RECEPTIONIST: ['/dashboard', '/patients', '/appointments', '/scheduling', '/billing', '/payments', '/insurances', '/procedures', '/rooms', '/professionals'],
  FINANCIAL: ['/dashboard', '/billing', '/cash-flow', '/payments', '/commissions', '/reports', '/insurances', '/settings/nfe'],
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const allowedHrefs = roleAccess[user?.role || 'ADMIN'] || [];
  const storageKey = 'sidebar-expanded';

  const [expanded, setExpanded] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    const activeCat = navCategories.find((cat) =>
      cat.items.some((item) => location.pathname.startsWith(item.href))
    );
    return activeCat ? [activeCat.label] : ['GERAL'];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expanded));
  }, [expanded]);

  useEffect(() => {
    const activeCat = navCategories.find((cat) =>
      cat.items.some((item) => location.pathname.startsWith(item.href))
    );
    if (activeCat && !expanded.includes(activeCat.label)) {
      setExpanded((prev) => [...prev, activeCat.label]);
    }
  }, [location.pathname]);

  function toggleCategory(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function isItemAllowed(href: string) {
    return allowedHrefs.includes(href);
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-white dark:bg-gray-900 shadow-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">DentalSys</span>
          </div>
          <button onClick={onToggle} className="lg:hidden">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Navegação com categorias recolhíveis */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navCategories.map((cat, catIdx) => {
            const allowed = cat.items.filter((i) => isItemAllowed(i.href));
            if (allowed.length === 0) return null;
            const isExpanded = expanded.includes(cat.label);
            const hasActive = allowed.some((item) => location.pathname.startsWith(item.href));

            return (
              <div key={cat.label} className={catIdx > 0 ? 'mt-1' : ''}>
                <button
                  onClick={() => toggleCategory(cat.label)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    hasActive
                      ? 'text-primary dark:text-primary-300'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="space-y-0.5 pb-1">
                    {allowed.map((item) => (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold border-l-[3px] border-primary pl-[9px]'
                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                            }`
                          }
                          onClick={() => {
                            if (window.innerWidth < 1024) onToggle();
                          }}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Perfil no rodapé */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="truncate text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 transition-colors" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
