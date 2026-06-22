import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['⌘', 'H'], label: 'Go to home' },
      { keys: ['⌘', 'N'], label: 'New page' },
      { keys: ['⌘', '⇧', 'N'], label: 'New project' },
      { keys: ['⌘', '/'], label: 'Show keyboard shortcuts' },
    ],
  },
  {
    label: 'Editor',
    shortcuts: [
      { keys: ['⌘', 'B'], label: 'Bold' },
      { keys: ['⌘', 'I'], label: 'Italic' },
      { keys: ['⌘', 'U'], label: 'Underline' },
      { keys: ['⌘', 'Z'], label: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
      { keys: ['⌘', 'A'], label: 'Select all' },
      { keys: ['⌘', 'C'], label: 'Copy' },
      { keys: ['⌘', 'V'], label: 'Paste' },
      { keys: ['⌘', 'X'], label: 'Cut' },
    ],
  },
  {
    label: 'Interface',
    shortcuts: [
      { keys: ['⌘', '⇧', 'T'], label: 'Toggle dark / light mode' },
      { keys: ['⌘', '⇧', 'O'], label: 'Toggle document outline' },
      { keys: ['Esc'], label: 'Close panel / overlay' },
      { keys: ['⌘', '⇧', 'F'], label: 'Find in document' },
      { keys: ['⌘', '⇧', 'E'], label: 'Export document' },
    ],
  },
  {
    label: 'LaTeX',
    shortcuts: [
      { keys: ['$', '$'], label: 'Inline math block' },
      { keys: ['\\', '\\', '['], label: 'Display math block' },
      { keys: ['⌘', 'E'], label: 'Toggle LaTeX editor' },
    ],
  },
];

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-0.5">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-mono font-medium text-foreground bg-secondary border border-border rounded shadow-sm"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/10 dark:bg-black/50 backdrop-blur-[2px]" />

          <motion.div
            className="relative w-full max-w-2xl border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card)' }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Newsreader', serif" }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-0 max-h-[70vh] overflow-y-auto" data-lenis-prevent>
              {SHORTCUT_GROUPS.map((group, gi) => (
                <div key={group.label} className={`p-5 ${gi % 2 === 0 ? 'border-r border-border' : ''}`}>
                  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
                    {group.label}
                  </h3>
                  <div className="space-y-2.5">
                    {group.shortcuts.map(s => (
                      <div key={s.label} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-foreground/80">{s.label}</span>
                        <Kbd keys={s.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-mono">
                On Windows/Linux, replace ⌘ with Ctrl
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
