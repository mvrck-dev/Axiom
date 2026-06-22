import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

interface OutlineNode {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

interface DocumentOutlineNavigatorProps {
  content: string;
}

export function DocumentOutlineNavigator({
  content,
}: DocumentOutlineNavigatorProps) {
  const [nodes, setNodes] = useState<OutlineNode[]>([]);
  const [activeId, setActiveId] = useState('');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const parse = useCallback(() => {
    const el = document.getElementById('axiom-editor-area');
    if (!el) return;
    const tags = el.querySelectorAll('h1, h2, h3');
    const next: OutlineNode[] = [];
    tags.forEach((tag, i) => {
      if (!tag.id) tag.id = `heading-${i}`;
      const level = Number(tag.tagName[1]) as 1 | 2 | 3;
      const text = tag.textContent?.trim() || '';
      if (text) next.push({ id: tag.id, level, text });
    });
    setNodes(next);
    if (next.length && !activeId) setActiveId(next[0].id);
  }, [activeId]);

  useEffect(() => {
    const t = setTimeout(parse, 120);
    return () => clearTimeout(t);
  }, [content, parse]);

  // Recalculate SVG path node coordinate centerpoints
  const recalculatePoints = useCallback(() => {
    if (!nodes.length) return;
    
    // Wait for DOM layout
    requestAnimationFrame(() => {
      const nextPoints = nodes.map((node, index) => {
        const itemEl = itemRefs.current[index];
        if (!itemEl) return { x: 0, y: 0 };
        
        const y = itemEl.offsetTop + itemEl.offsetHeight / 2;
        const indent = node.level === 1 ? 8 : node.level === 2 ? 20 : 32;
        return { x: indent, y };
      });
      setPoints(nextPoints);
    });
  }, [nodes]);

  useEffect(() => {
    recalculatePoints();
    window.addEventListener('resize', recalculatePoints);
    return () => window.removeEventListener('resize', recalculatePoints);
  }, [nodes, recalculatePoints]);

  useEffect(() => {
    observerRef.current?.disconnect();
    const el = document.getElementById('axiom-editor-area');
    if (!el || !nodes.length) return;

    const root = document.getElementById('axiom-scroll-container') ?? null;

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { root, rootMargin: '-5% 0px -60% 0px', threshold: 0 },
    );

    nodes.forEach(n => {
      const h = el.querySelector(`#${n.id}`);
      if (h) io.observe(h);
    });

    observerRef.current = io;
    return () => io.disconnect();
  }, [nodes]);

  const scrollTo = (id: string) => {
    const el = document.getElementById('axiom-editor-area');
    if (!el) return;
    const heading = el.querySelector(`#${id}`) as HTMLElement | null;
    if (!heading) return;

    setActiveId(id);

    const container = document.getElementById('axiom-scroll-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const offset = headingRect.top - containerRect.top + container.scrollTop - 80;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-3">
        <FileText size={14} className="text-muted-foreground/20" />
        <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
          Add headings to build navigation
        </p>
      </div>
    );
  }

  // Draw background track path
  let trackD = '';
  if (points.length > 0) {
    trackD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (prev.x === curr.x) {
        trackD += ` L ${curr.x} ${curr.y}`;
      } else {
        const midY = (prev.y + curr.y) / 2;
        trackD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
      }
    }
  }

  // Draw active tracking line path up to active element
  let activeD = '';
  const activeIndex = nodes.findIndex(n => n.id === activeId);
  if (activeIndex !== -1 && points.length > activeIndex) {
    activeD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i <= activeIndex; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (prev.x === curr.x) {
        activeD += ` L ${curr.x} ${curr.y}`;
      } else {
        const midY = (prev.y + curr.y) / 2;
        activeD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-h-[360px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }} data-lenis-prevent>
      
      {/* Curved SVG indicator track overlay */}
      <svg className="absolute left-0 top-0 w-full h-full pointer-events-none" style={{ minHeight: '100%' }}>
        {trackD && (
          <path
            d={trackD}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ opacity: 0.45 }}
          />
        )}
        {activeD && (
          <motion.path
            d={activeD}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          />
        )}
        {activeIndex !== -1 && points[activeIndex] && (
          <motion.circle
            cx={points[activeIndex].x}
            cy={points[activeIndex].y}
            r="3"
            fill="var(--foreground)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </svg>

      {/* Navigation list items */}
      <div className="flex flex-col gap-1.5 py-1">
        {nodes.map((node, i) => {
          const isActive = node.id === activeId;
          const textPadding = node.level === 1 ? 24 : node.level === 2 ? 36 : 48;

          return (
            <button
              key={node.id}
              ref={el => { itemRefs.current[i] = el; }}
              onClick={() => scrollTo(node.id)}
              className="w-full text-left flex items-start py-[3px] pr-2 transition-all duration-200 select-none bg-transparent hover:opacity-100 outline-none"
              style={{
                paddingLeft: textPadding,
                opacity: isActive ? 1 : 0.45,
              }}
            >
              <span
                className="leading-tight text-foreground transition-all duration-200"
                style={{
                  fontSize: node.level === 1 ? 12.5 : node.level === 2 ? 11.5 : 10.5,
                  fontWeight: isActive ? 600 : node.level === 1 ? 500 : 400,
                  fontFamily: 'inherit',
                }}
              >
                {node.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
