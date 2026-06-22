import { motion, AnimatePresence } from 'motion/react';
import {
  Type, Frame, MessageSquare, MoreHorizontal, FileText, Grid3x3, Pencil, Move,
  Heading1, Heading2, Heading3, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Variable, Binary, ArrowLeft
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef } from 'react';

interface RadialContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onInsertMacro?: (macro: string) => void;
}

const RADIUS     = 82;
const ITEM_SIZE  = 32;   // collapsed circle diameter
const EXPANDED_W = 116;  // expanded pill width
const EASE       = [0.22, 1, 0.36, 1] as const;

const menuItems = [
  { icon: Move,           label: 'Move Tool', shortcut: 'V', angle: 0   },
  { icon: Frame,          label: 'Frame',     shortcut: 'F', angle: 45  },
  { icon: Pencil,         label: 'Pen Tool',  shortcut: 'P', angle: 90  },
  { icon: Grid3x3,        label: 'Objects',   shortcut: 'O', angle: 135 },
  { icon: Type,           label: 'Text',      shortcut: 'T', angle: 180 },
  { icon: FileText,       label: 'Actions',   shortcut: '',  angle: 225 },
  { icon: MessageSquare,  label: 'Comment',   shortcut: 'C', angle: 270 },
  { icon: MoreHorizontal, label: 'More',      shortcut: '',  angle: 315 },
];

const macroItems = [
  { icon: Heading1,      label: 'Section',        macro: '\\section{}' },
  { icon: Heading2,      label: 'Subsection',     macro: '\\subsection{}' },
  { icon: Heading3,      label: 'Subsubsection',  macro: '\\subsubsection{}' },
  { icon: Bold,          label: 'Bold Text',      macro: '\\textbf{}' },
  { icon: Italic,        label: 'Italic Text',    macro: '\\textit{}' },
  { icon: Underline,     label: 'Underline',      macro: '\\underline{}' },
  { icon: Strikethrough, label: 'Strikethrough',  macro: '\\sout{}' },
  { icon: List,          label: 'Itemize List',   macro: "\\begin{itemize}\n  \\item \n\\end{itemize}" },
  { icon: ListOrdered,   label: 'Enumerate List', macro: "\\begin{enumerate}\n  \\item \n\\end{enumerate}" },
  { icon: Quote,         label: 'Block Quote',    macro: "\\begin{quote}\n\n\\end{quote}" },
  { icon: Variable,      label: 'Inline Math',    macro: '$ $' },
  { icon: Binary,        label: 'Display Math',   macro: '$$ $$' },
];

// ── Main Scene Item component ────────────────────────
function Item({
  item, index, total, onClose, onTransitionToText,
  bg, bgHover, border, text, chipBg, chipText,
}: {
  item: typeof menuItems[0];
  index: number;
  total: number;
  onClose: () => void;
  onTransitionToText: () => void;
  bg: string; bgHover: string; border: string;
  text: string; chipBg: string; chipText: string;
}) {
  const [hovered, setHovered] = useState(false);

  const rad = (item.angle * Math.PI) / 180;
  const x   = Math.cos(rad) * RADIUS;
  const y   = Math.sin(rad) * RADIUS;

  return (
    <div style={{
      position: 'absolute',
      left: x - ITEM_SIZE / 2,
      top:  y - ITEM_SIZE / 2,
    }}>
      <motion.div
        custom={index}
        variants={{
          hidden: { opacity: 0, scale: 0.5,  x: -x * 0.6, y: -y * 0.6 },
          visible: (i: number) => ({
            opacity: 1, scale: 1, x: 0, y: 0,
            transition: { delay: i * 0.018, duration: 0.3, ease: EASE },
          }),
          exit: (i: number) => ({
            opacity: 0, scale: 0.5, x: -x * 0.6, y: -y * 0.6,
            transition: { delay: (total - 1 - i) * 0.015, duration: 0.22, ease: EASE },
          }),
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.button
          animate={{ width: hovered ? EXPANDED_W : ITEM_SIZE }}
          transition={{ duration: 0.2, ease: EASE }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={e => {
            e.stopPropagation();
            if (item.label === 'Text') {
              onTransitionToText();
            } else {
              onClose();
            }
          }}
          style={{
            height: ITEM_SIZE,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 999,
            background: hovered ? bgHover : bg,
            border: `1px solid ${border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <div style={{
            width: ITEM_SIZE, height: ITEM_SIZE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: text,
          }}>
            <item.icon size={13} />
          </div>

          <span style={{
            fontSize: 11.5,
            whiteSpace: 'nowrap',
            color: text,
            paddingRight: item.shortcut ? 6 : 10,
            letterSpacing: '-0.01em',
          }}>
            {item.label}
          </span>

          {item.shortcut && (
            <span style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 4,
              background: chipBg,
              color: chipText,
              marginRight: 8,
              flexShrink: 0,
            }}>
              {item.shortcut}
            </span>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Text Macro Sub-Menu Item component ────────────────────────
function MacroItem({
  item, idx, selectedIndex, onSelect,
  bg, bgHover, border, text,
}: {
  item: typeof macroItems[0];
  idx: number;
  selectedIndex: number;
  onSelect: () => void;
  bg: string; bgHover: string; border: string;
  text: string;
}) {
  const isSelected = idx === selectedIndex;
  
  // Calculate relative angle centered around pointing right (0 degrees)
  const angleDeg = (idx - selectedIndex) * 26;
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.cos(rad) * RADIUS;
  const y = Math.sin(rad) * RADIUS;

  // We want to fade items that rotate too far behind
  const distance = Math.abs(idx - selectedIndex);
  const opacity = distance > 3 ? 0 : distance === 3 ? 0.25 : 1.0;

  return (
    <div style={{
      position: 'absolute',
      left: x - ITEM_SIZE / 2,
      top: y - ITEM_SIZE / 2,
      transition: 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1), top 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
      zIndex: isSelected ? 20 : 10,
      opacity: opacity,
      pointerEvents: opacity === 0 ? 'none' : 'auto',
    }}>
      <motion.button
        animate={{ width: isSelected ? EXPANDED_W + 16 : ITEM_SIZE }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          height: ITEM_SIZE,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 999,
          background: isSelected ? bgHover : bg,
          border: `1.5px solid ${isSelected ? text : border}`,
          boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.16)' : '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div style={{
          width: ITEM_SIZE, height: ITEM_SIZE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: text,
        }}>
          <item.icon size={13} />
        </div>
        
        <span style={{
          fontSize: 11,
          whiteSpace: 'nowrap',
          color: text,
          paddingRight: 10,
          letterSpacing: '-0.01em',
          fontWeight: isSelected ? 600 : 400,
        }}>
          {item.label}
        </span>
      </motion.button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RadialContextMenu({ position, onClose, onInsertMacro }: RadialContextMenuProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);

  const [scene, setScene] = useState<'main' | 'text'>('main');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const bg       = dark ? '#1E1E1C'                    : '#ffffff';
  const bgHover  = dark ? '#272724'                    : '#f5f4f2';
  const border   = dark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.07)';
  const text     = dark ? '#EEECEA'                    : '#1A1A18';
  const chipBg   = dark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.05)';
  const chipText = dark ? '#8A8880'                    : '#8A8880';

  // Stepped scrolling listener (wheel delta shifts index by exactly one option per notch)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || scene !== 'text') return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const direction = e.deltaY > 0 ? 1 : -1;
      setSelectedIndex(prev => (prev + direction + macroItems.length) % macroItems.length);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [scene]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      {/* Zero-size radial origin */}
      <div style={{ width: 0, height: 0, position: 'relative' }}>

        {/* Centre disc */}
        <motion.button
          layout
          onClick={e => {
            e.stopPropagation();
            if (scene === 'text') {
              setScene('main');
            }
          }}
          style={{
            position: 'absolute',
            left: -ITEM_SIZE / 2, top: -ITEM_SIZE / 2,
            width: ITEM_SIZE, height: ITEM_SIZE,
            borderRadius: '50%',
            background: bg,
            border: `1.5px solid ${border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 30,
            cursor: scene === 'text' ? 'pointer' : 'default',
            pointerEvents: scene === 'text' ? 'auto' : 'none',
          }}
        >
          {scene === 'text' ? (
            <ArrowLeft size={12} style={{ color: text }} />
          ) : (
            <Move size={12} style={{ color: text, opacity: 0.4 }} />
          )}
        </motion.button>

        {/* Radial items matching scene */}
        <AnimatePresence mode="wait">
          {scene === 'main' ? (
            <motion.div
              key="main-scene"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              {menuItems.map((item, i) => (
                <Item
                  key={item.label}
                  item={item}
                  index={i}
                  total={menuItems.length}
                  onClose={onClose}
                  onTransitionToText={() => setScene('text')}
                  bg={bg} bgHover={bgHover} border={border}
                  text={text} chipBg={chipBg} chipText={chipText}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="text-scene"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              {macroItems.map((item, i) => (
                <MacroItem
                  key={item.label}
                  item={item}
                  idx={i}
                  selectedIndex={selectedIndex}
                  onSelect={() => {
                    onInsertMacro?.(item.macro);
                    onClose();
                  }}
                  bg={bg} bgHover={bgHover} border={border}
                  text={text}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
