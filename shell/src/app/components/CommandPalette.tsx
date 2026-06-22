import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, FileText, FolderOpen, Plus, Moon, Sun, Keyboard,
  ArrowRight, Hash, Eye,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useTheme } from './ThemeProvider';

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'recent' | 'pages' | 'projects' | 'actions';
  kbd?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const store = useAppStore();
  const { theme, toggleTheme } = useTheme();

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const recentItems: CommandItem[] = store.recentIds
    .slice(0, 3)
    .map(id => {
      const page = store.getPage(id);
      if (page) return {
        id: page.id,
        label: page.title,
        subtitle: 'Page',
        icon: <FileText size={13} />,
        action: () => { store.markRecent(page.id); go(`/editor/${page.id}`); },
        category: 'recent' as const,
      };
      const proj = store.getProject(id);
      if (proj) return {
        id: proj.id,
        label: proj.title,
        subtitle: `Project · ${proj.documents.length} docs`,
        icon: <FolderOpen size={13} />,
        action: () => { store.markRecent(proj.id); go(`/project/${proj.id}`); },
        category: 'recent' as const,
      };
      return null;
    })
    .filter(Boolean) as CommandItem[];

  const pageItems: CommandItem[] = store.pages.map(p => ({
    id: p.id,
    label: p.title,
    subtitle: 'Page',
    icon: <FileText size={13} />,
    action: () => { store.markRecent(p.id); go(`/editor/${p.id}`); },
    category: 'pages' as const,
  }));

  const projectItems: CommandItem[] = store.projects.map(p => ({
    id: p.id,
    label: p.title,
    subtitle: `Project · ${p.documents.length} docs`,
    icon: <FileText size={13} />,
    action: () => { store.markRecent(p.id); go(`/project/${p.id}`); },
    category: 'projects' as const,
  }));

  const actionItems: CommandItem[] = [
    {
      id: 'new-page',
      label: 'New Page',
      subtitle: 'Create a blank page',
      icon: <Plus size={14} />,
      action: () => {
        const page = store.createPage();
        store.markRecent(page.id);
        go(`/editor/${page.id}`);
      },
      category: 'actions',
      kbd: '⌘N',
    },
    {
      id: 'new-project',
      label: 'New Project',
      subtitle: 'Create a project with multiple docs',
      icon: <FolderOpen size={14} />,
      action: () => {
        const proj = store.createProject();
        store.markRecent(proj.id);
        go(`/project/${proj.id}`);
      },
      category: 'actions',
      kbd: '⌘⇧N',
    },
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
      action: () => { toggleTheme(); onClose(); },
      category: 'actions',
      kbd: '⌘⇧T',
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Keyboard size={14} />,
      action: () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('axiom:shortcuts')), 50); },
      category: 'actions',
      kbd: '⌘/',
    },
    {
      id: 'go-home',
      label: 'Go to Home',
      icon: <Hash size={14} />,
      action: () => go('/'),
      category: 'actions',
      kbd: '⌘H',
    },
    {
      id: 'accessibility-settings',
      label: 'Accessibility Settings',
      subtitle: 'Customize motion, contrast, fonts, and text scaling',
      icon: <Eye size={14} />,
      action: () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('axiom:accessibility-settings')), 50); },
      category: 'actions',
      kbd: '⌥A',
    },
  ];

  const q = query.toLowerCase().trim();
  const allItems = q
    ? [...pageItems, ...projectItems, ...actionItems].filter(
        item => item.label.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q)
      )
    : [...recentItems, ...actionItems];

  const sections: { label: string; items: CommandItem[] }[] = q
    ? [{ label: 'Results', items: allItems }]
    : [
        { label: 'Recent', items: recentItems },
        { label: 'Actions', items: actionItems },
      ];

  const flatItems = sections.flatMap(s => s.items);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, flatItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        flatItems[selected]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatItems, selected, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-transparent" />

          <motion.div
            className="relative w-full max-w-xl mx-4 border border-border rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card)' }}
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages, projects, or run a command..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2" data-lenis-prevent>
              {flatItems.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results for "{query}"
                </div>
              )}
              {sections.map(section => (
                section.items.length > 0 && (
                  <div key={section.label}>
                    <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      {section.label}
                    </div>
                    {section.items.map(item => {
                      const idx = flatIndex++;
                      const isSelected = idx === selected;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? 'bg-accent/10 text-foreground'
                              : 'text-foreground hover:bg-secondary'
                          }`}
                          onMouseEnter={() => setSelected(idx)}
                          onClick={item.action}
                        >
                          <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded text-sm ${
                            isSelected ? 'text-accent' : 'text-muted-foreground'
                          }`}>
                            {item.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">{item.label}</span>
                            {item.subtitle && (
                              <span className="block text-xs text-muted-foreground truncate">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          {item.kbd && (
                            <kbd className="shrink-0 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">
                              {item.kbd}
                            </kbd>
                          )}
                          {isSelected && (
                            <ArrowRight size={12} className="shrink-0 text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↑↓</kbd> navigate
              </span>
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↵</kbd> open
              </span>
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <kbd className="border border-border rounded px-1">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
