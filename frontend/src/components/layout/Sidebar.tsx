import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Calendar, ClipboardList, CreditCard,
  Package, BarChart3, Settings, UserCog, Stethoscope, X, Wrench, DoorOpen, Shield, FileText,
  Building2, FlaskConical, Cpu, ShieldCheck, Database,
  ClipboardPen, Receipt, Bell, TrendingUp, CalendarClock, DollarSign,
  LogOut, ChevronRight,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const allowedHrefs = roleAccess[user?.role || 'ADMIN'] || [];

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
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-white shadow-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 rounded-lg p-1.5">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-[#1F2937]">DentalSys</span>
          </div>
          <button onClick={onToggle} className="lg:hidden">
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navCategories.map((cat, catIdx) => {
            const allowed = cat.items.filter((i) => isItemAllowed(i.href));
            if (allowed.length === 0) return null;
            return (
              <div key={cat.label} className={catIdx > 0 ? 'mt-2 pt-2 border-t border-[#E5E7EB]' : ''}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
                  {cat.label}
                </p>
                <ul className="space-y-0.5">
                  {allowed.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 font-semibold border-l-[3px] border-primary-600 pl-[9px]'
                              : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937]'
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
            );
          })}
        </nav>

        {/* Perfil no rodapé */}
        <div className="border-t border-[#E5E7EB] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[#1F2937]">{user?.name}</p>
              <p className="truncate text-[10px] text-[#6B7280] uppercase tracking-wide">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-red-500 transition-colors" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
