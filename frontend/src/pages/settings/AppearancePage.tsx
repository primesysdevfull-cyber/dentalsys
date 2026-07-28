import { useState } from 'react';
import { Palette, Save, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../hooks/useTheme';

export function AppearancePage() {
  const { theme, toggleTheme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [sidebarColor, setSidebarColor] = useState('#1e293b');
  const [logo, setLogo] = useState('');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Aparência salva');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Aparência</h1>
        <p className="text-gray-500 dark:text-gray-400">Personalizar cores e temas do sistema</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"><Palette className="h-5 w-5 text-dental-500" /> Tema</h2>
          <div className="max-w-md space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Modo Escuro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-dental-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}>
                  {theme === 'dark' ? <Moon className="h-3 w-3 text-dental-600" /> : <Sun className="h-3 w-3 text-amber-500" />}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"><Palette className="h-5 w-5 text-dental-500" /> Cores</h2>
          <div className="max-w-md space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor Primária</label>
              <div className="mt-1 flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded border dark:border-gray-600" />
                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor da Sidebar</label>
              <div className="mt-1 flex items-center gap-3">
                <input type="color" value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded border dark:border-gray-600" />
                <input type="text" value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-dental-500 focus:outline-none focus:ring-1 focus:ring-dental-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-dental-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-dental-700"><Save className="h-4 w-4" /> Salvar</button>
        </div>
      </form>
    </div>
  );
}
