import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  Link2, Code2,
  StickyNote, BookMarked,
  Plus, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ActivePanel = 'none' | 'notes' | 'references';

interface ToolRibbonProps {
  onFormat: (command: string, value?: string) => void;
  activePanel: ActivePanel;
  onNotesClick: () => void;
  onReferencesClick: () => void;
  onCreateNote: () => void;
  onUploadReference: () => void;
}

const FORMAT_GROUPS = [
  [
    { icon: Bold,        command: 'bold',                label: 'Bold (⌘B)' },
    { icon: Italic,      command: 'italic',              label: 'Italic (⌘I)' },
    { icon: Underline,   command: 'underline',           label: 'Underline (⌘U)' },
  ],
  [
    { icon: AlignLeft,   command: 'justifyLeft',         label: 'Align left' },
    { icon: AlignCenter, command: 'justifyCenter',       label: 'Align center' },
    { icon: AlignRight,  command: 'justifyRight',        label: 'Align right' },
  ],
  [
    { icon: List,        command: 'insertUnorderedList',  label: 'Bullet list' },
    { icon: ListOrdered, command: 'insertOrderedList',   label: 'Numbered list' },
  ],
  [
    { icon: Link2,       command: 'createLink',          label: 'Insert link' },
    { icon: Code2,       command: 'formatBlock',         label: 'Code block' },
  ],
];

export function ToolRibbon({
  onFormat,
  activePanel,
  onNotesClick,
  onReferencesClick,
  onCreateNote,
  onUploadReference,
}: ToolRibbonProps) {
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        className="flex items-center bg-card border border-border rounded-full shadow-sm px-1.5 py-1"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* ── Formatting groups ── */}
        {FORMAT_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center">
            {gi > 0 && <div className="w-px h-4 bg-border mx-1.5" />}
            {group.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.command}
                  title={tool.label}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onFormat(tool.command)}
                  className="w-8 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Icon size={13} strokeWidth={1.8} />
                </button>
              );
            })}
          </div>
        ))}

        {/* ── Divider between formatting and panel tools ── */}
        <div className="w-px h-4 bg-border mx-1.5" />

        {/* ── Contextual action (slides in when panel is open) ── */}
        <AnimatePresence mode="popLayout">
          {activePanel === 'notes' && (
            <motion.div
              key="note-action"
              className="flex items-center"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={onCreateNote}
                className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-85 transition-opacity whitespace-nowrap mr-1"
              >
                <Plus size={11} strokeWidth={2} />
                New note
              </button>
            </motion.div>
          )}
          {activePanel === 'references' && (
            <motion.div
              key="ref-action"
              className="flex items-center"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={onUploadReference}
                className="flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-85 transition-opacity whitespace-nowrap mr-1"
              >
                <Upload size={11} strokeWidth={2} />
                Upload
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Notes ── */}
        <PanelBtn
          icon={<StickyNote size={13} strokeWidth={1.8} />}
          active={activePanel === 'notes'}
          onClick={onNotesClick}
          label="Notes"
        />

        {/* ── Divider ── */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* ── References ── */}
        <PanelBtn
          icon={<BookMarked size={13} strokeWidth={1.8} />}
          active={activePanel === 'references'}
          onClick={onReferencesClick}
          label="References"
        />
      </motion.div>
    </div>
  );
}

function PanelBtn({
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
