import { BookOpen, Columns2, Code, Layout, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import type { ViewMode } from './Editor';

interface ViewSwitcherProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const select = (v: ViewMode) => {
    onViewChange(v);
    setIsOpen(false);
  };

  const getIconForMode = (mode: ViewMode) => {
    switch (mode) {
      case 'two-page': return <Columns2 size={18} />;
      case 'write': return <Layout size={18} />;
      case 'focus': return <BookOpen size={18} />;
      case 'read': return <BookOpen size={18} />;
      case 'dual-code': return <Code size={18} />;
      case 'dual-blocks': return <LayoutGrid size={18} />;
      default: return <Layout size={18} />;
    }
  };

  const R = 100; // Radius of the arc in pixels
  const subButtons = [
    { mode: 'two-page' as const, label: 'Two page', icon: Columns2 },
    { mode: 'write' as const, label: 'Standard', icon: Layout },
    { mode: 'focus' as const, label: 'Focus', icon: BookOpen },
    { mode: 'dual-code' as const, label: 'Code + Page', icon: Code },
    { mode: 'dual-blocks' as const, label: 'Blocks + Page', icon: LayoutGrid },
  ];

  return (
    <div className="fixed right-6 bottom-7 z-50 flex items-center justify-center">
      {/* Radial Sub-Buttons Arc */}
      <AnimatePresence>
        {isOpen &&
          subButtons.map((btn, idx) => {
            // angle from 180 (left) to 270 (up)
            const angle = 180 + idx * 22.5;
            const rad = (angle * Math.PI) / 180;
            const x = R * Math.cos(rad);
            const y = R * Math.sin(rad);

            const IconComponent = btn.icon;
            const isActive = view === btn.mode;

            return (
              <motion.button
                key={btn.mode}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center border shadow-lg transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-foreground border-foreground text-background'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 26,
                  delay: idx * 0.02,
                }}
                onClick={() => select(btn.mode)}
                title={btn.label}
              >
                <IconComponent size={16} />
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
                  {btn.label}
                </div>
              </motion.button>
            );
          })}
      </AnimatePresence>

      {/* Main Layouts Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-card border border-border shadow-xl hover:shadow-2xl transition-all cursor-pointer text-foreground hover:bg-secondary focus:outline-none"
        title="Layouts"
        aria-label="Toggle layouts menu"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex items-center justify-center"
        >
          {getIconForMode(view)}
        </motion.div>
      </button>
    </div>
  );
}
