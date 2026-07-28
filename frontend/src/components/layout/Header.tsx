import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Menu, LogOut, Bell, Search, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes, agendamentos..."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2 pl-10 pr-4 text-sm focus:border-dental-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-dental-500 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
