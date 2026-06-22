import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <h1 className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
          Axiom
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'hover:bg-neutral-800 text-neutral-300'
              : 'hover:bg-neutral-100 text-neutral-600'
          }`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
