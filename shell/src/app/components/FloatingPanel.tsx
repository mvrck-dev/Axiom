import { StickyNote, BookMarked, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ActivePanel = 'none' | 'notes' | 'references';

interface FloatingPanelProps {
  activePanel: ActivePanel;
  onNotesClick: () => void;
  onReferencesClick: () => void;
  onCreateNote: () => void;
  onUploadReference: () => void;
}

export function FloatingPanel({
  activePanel,
  onNotesClick,
  onReferencesClick,
  onCreateNote,
  onUploadReference,
}: FloatingPanelProps) {
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        className="flex items-center bg-card border border-border rounded-full shadow-sm px-1.5 py-1"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence mode="popLayout">
          {/* Contextual action — appears left of divider when panel is open */}
          {activePanel === 'notes' && (
            <motion.div
              key="notes-action"
              className="flex items-center"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-85 transition-opacity whitespace-nowrap"
                onClick={onCreateNote}
              >
                <Plus size={11} strokeWidth={2} />
                New note
              </button>
              <div className="w-px h-4 bg-border mx-1.5" />
            </motion.div>
          )}

          {activePanel === 'references' && (
            <motion.div
              key="refs-action"
              className="flex items-center"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-85 transition-opacity whitespace-nowrap"
                onClick={onUploadReference}
              >
                <Upload size={11} strokeWidth={2} />
                Upload
              </button>
              <div className="w-px h-4 bg-border mx-1.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <PillBtn
          icon={<StickyNote size={13} strokeWidth={1.8} />}
          active={activePanel === 'notes'}
          onClick={onNotesClick}
          label="Notes"
        />

        {/* Divider */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* References */}
        <PillBtn
          icon={<BookMarked size={13} strokeWidth={1.8} />}
          active={activePanel === 'references'}
          onClick={onReferencesClick}
          label="References"
        />
      </motion.div>
    </div>
  );
}

function PillBtn({
  icon, active, onClick, label,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`w-8 h-7 flex items-center justify-center rounded-full transition-colors ${
        active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
    >
      {icon}
    </button>
  );
}
