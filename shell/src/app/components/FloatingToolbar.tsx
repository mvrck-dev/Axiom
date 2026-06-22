import { useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Code, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingToolbarProps {
  position: { x: number; y: number };
  onFormat: (command: string, value?: string) => void;
  onClose: () => void;
}

interface ToolBtn {
  icon: React.ReactNode;
  command: string;
  label: string;
}

const TOOLS: ToolBtn[] = [
  { icon: <Bold size={13} />, command: 'bold', label: 'Bold' },
  { icon: <Italic size={13} />, command: 'italic', label: 'Italic' },
  { icon: <Underline size={13} />, command: 'underline', label: 'Underline' },
  { icon: <Code size={13} />, command: 'formatBlock', label: 'Code' },
  { icon: <AlignLeft size={13} />, command: 'justifyLeft', label: 'Left' },
  { icon: <AlignCenter size={13} />, command: 'justifyCenter', label: 'Center' },
  { icon: <AlignRight size={13} />, command: 'justifyRight', label: 'Right' },
  { icon: <Link2 size={13} />, command: 'createLink', label: 'Link' },
];

export function FloatingToolbar({ position, onFormat, onClose }: FloatingToolbarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const left = Math.min(Math.max(position.x, 220), window.innerWidth - 220);
  const top = Math.max(position.y - 8, 60);

  return (
    <motion.div
      className="fixed z-50"
      style={{ left, top, transform: 'translate(-50%, -100%)' }}
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Tooltip label */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
          >
            {activeTooltip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pill toolbar — image 9 inspired */}
      <div className="flex items-center gap-0.5 bg-card border border-border rounded-full shadow-lg px-2 py-1.5">
        {/* Style selector pill */}
        <select
          className="bg-secondary text-foreground text-[11px] font-medium rounded-full px-2.5 py-1 outline-none cursor-pointer border-0 mr-1"
          onChange={e => onFormat('fontName', e.target.value)}
          defaultValue="default"
        >
          <option value="default" disabled>Style</option>
          <option value="inherit">Default</option>
          <option value="Georgia">Serif</option>
          <option value="Courier New">Mono</option>
        </select>

        <div className="w-px h-4 bg-border mx-0.5" />

        {TOOLS.slice(0, 3).map(tool => (
          <ToolButton
            key={tool.command}
            tool={tool}
            onFormat={onFormat}
            onHover={setActiveTooltip}
          />
        ))}

        <div className="w-px h-4 bg-border mx-0.5" />

        {TOOLS.slice(4, 7).map(tool => (
          <ToolButton
            key={tool.command}
            tool={tool}
            onFormat={onFormat}
            onHover={setActiveTooltip}
          />
        ))}

        <div className="w-px h-4 bg-border mx-0.5" />

        <ToolButton
          tool={TOOLS[3]}
          onFormat={onFormat}
          onHover={setActiveTooltip}
        />
        <ToolButton
          tool={TOOLS[7]}
          onFormat={onFormat}
          onHover={setActiveTooltip}
        />
      </div>
    </motion.div>
  );
}

function ToolButton({
  tool, onFormat, onHover,
}: {
  tool: ToolBtn;
  onFormat: (cmd: string) => void;
  onHover: (label: string | null) => void;
}) {
  return (
    <button
      className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      onMouseDown={e => e.preventDefault()}
      onClick={() => onFormat(tool.command)}
      onMouseEnter={() => onHover(tool.label)}
      onMouseLeave={() => onHover(null)}
      title={tool.label}
    >
      {tool.icon}
    </button>
  );
}
