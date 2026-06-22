import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Sparkles, Move, ZoomIn } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilitySettingsProps {
  open: boolean;
  onClose: () => void;
}

export function AccessibilitySettings({ open, onClose }: AccessibilitySettingsProps) {
  const { options, setOption } = useAccessibility();

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
            className="relative w-full max-w-md border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card)' }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-secondary text-foreground">
                  <Eye size={16} />
                </span>
                <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Newsreader', serif" }}>
                  Accessibility Settings
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6" data-lenis-prevent>
              
              {/* Reduce Motion */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Move size={14} className="text-muted-foreground" />
                    Reduce Motion
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disables non-essential transitions and interface animations.
                  </p>
                </div>
                <button
                  onClick={() => setOption('reduceMotion', !options.reduceMotion)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    options.reduceMotion ? 'bg-primary' : 'bg-switch-background'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      options.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles size={14} className="text-muted-foreground" />
                    High Contrast
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Increases readability with AAA-standard colors and outlines.
                  </p>
                </div>
                <button
                  onClick={() => setOption('highContrast', !options.highContrast)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    options.highContrast ? 'bg-primary' : 'bg-switch-background'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      options.highContrast ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Dyslexic Friendly Font */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <EyeOff size={14} className="text-muted-foreground" />
                    Dyslexic Font
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses OpenDyslexic font designed to improve text readability.
                  </p>
                </div>
                <button
                  onClick={() => setOption('dyslexicFont', !options.dyslexicFont)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    options.dyslexicFont ? 'bg-primary' : 'bg-switch-background'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      options.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Text Scaling */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ZoomIn size={14} className="text-muted-foreground" />
                  Text Scaling
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust default text sizing across the application.
                </p>
                <div className="flex gap-2 pt-1">
                  {([100, 115, 130] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setOption('textScale', scale)}
                      className={`flex-1 py-1.5 text-xs border rounded-lg transition-all ${
                        options.textScale === scale
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow'
                          : 'bg-card text-foreground border-border hover:bg-secondary'
                      }`}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
