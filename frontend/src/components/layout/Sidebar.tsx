import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Calendar, ClipboardList, CreditCard,
  Package, BarChart3, Settings, UserCog, Stethoscope, X, Wrench, DoorOpen, Shield, FileText,
  Building2, FlaskConical, Cpu, ShieldCheck, Database,
  ClipboardPen, Receipt, Bell, TrendingUp, CalendarClock, DollarSign,
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
      { name: 'Pagamentos Online', href: '/payments', icon: DollarSign },
      { name: 'Convênios', href: '/insurances', icon: Building2 },
      { name: 'Comissões', href: '/professionals', icon: DollarSign },
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
      { name: 'IA / Transcrição', href: '/ai', icon: Cpu },
      { name: 'LGPD / Privacidade', href: '/privacy', icon: ShieldCheck },
      { name: 'Migração', href: '/migration', icon: Database },
      { name: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];

const roleAccess: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/notifications', '/reports', '/patients', '/appointments', '/scheduling', '/clinical-records', '/anamnesis', '/treatment-plans', '/billing', '/financial-advanced', '/payments', '/insurances', '/settings/nfe', '/lab', '/inventory', '/procedures', '/professionals', '/rooms', '/users', '/ai', '/privacy', '/migration', '/settings'],
  DENTIST: ['/dashboard', '/notifications', '/patients', '/appointments', '/clinical-records', '/insurances', '/lab', '/procedures', '/professionals'],
  ASSISTANT: ['/dashboard', '/patients', '/appointments', '/lab', '/inventory', '/procedures', '/rooms', '/professionals'],
  RECEPTIONIST: ['/dashboard', '/patients', '/appointments', '/scheduling', '/billing', '/payments', '/insurances', '/procedures', '/rooms', '/professionals'],
  FINANCIAL: ['/dashboard', '/billing', '/payments', '/reports', '/insurances', '/settings/nfe'],
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const allowedHrefs = roleAccess[user?.role || 'ADMIN'] || [];

  function isItemAllowed(href: string) {
    return allowedHrefs.includes(href);
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-white dark:bg-gray-900 shadow-lg transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-dental-600" />
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">DentalSys</span>
          </div>
          <button onClick={onToggle} className="lg:hidden">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Navegação por categorias */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {navCategories.map((cat) => {
            const allowed = cat.items.filter((i) => isItemAllowed(i.href));
            if (allowed.length === 0) return null;
            return (
              <div key={cat.label} className="mb-4">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {cat.label}
                </p>
                <ul className="space-y-0.5">
                  {allowed.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-dental-50 dark:bg-dental-900/30 text-dental-700 dark:text-dental-300 font-semibold'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                          }`
                        }
                        onClick={() => {
                          if (window.innerWidth < 1024) onToggle();
                        }}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Perfil no rodapé */}
        <div className="border-t dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dental-100 dark:bg-dental-900 text-xs font-semibold text-dental-700 dark:text-dental-300">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="truncate text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
