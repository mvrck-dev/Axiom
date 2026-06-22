import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, type MotionValue, type AnimationPlaybackControls } from 'motion/react';
import { ArrowLeft, ChevronRight, Plus, FileText, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Editor, type ViewMode } from '../components/Editor';
import { ToolRibbon } from '../components/ToolRibbon';
import { ViewSwitcher } from '../components/ViewSwitcher';
import { NotesWindow } from '../components/NotesWindow';
import { CreateNoteWindow } from '../components/CreateNoteWindow';
import { ReferencesWindow } from '../components/ReferencesWindow';
import { UploadReferenceWindow } from '../components/UploadReferenceWindow';
import { ReferenceViewer } from '../components/ReferenceViewer';
import { DocumentOutlineNavigator } from '../components/DocumentOutlineNavigator';
import { useTheme } from '../components/ThemeProvider';
import type { Reference } from '../store/appStore';
import { engineService } from '../services/engineService';

type ActivePanel = 'none' | 'notes' | 'references';
type NotesView  = 'list' | 'create';
type RefsView   = 'list' | 'upload';

const OUTLINE_WIDTH = 220;
const SLIDER_W = 176;
const SLIDER_H = 18;
const SLIDER_R = SLIDER_H / 2;
const TICKS    = 20;

// ── ZoomSlider ────────────────────────────────────────────────────────────────

const tickXs = Array.from({ length: TICKS }, (_, i) =>
  SLIDER_R + (i + 0.5) / TICKS * (SLIDER_W - SLIDER_R * 2)
);

function ZoomSlider({
  zoomMv,
  zoomTargetRef,
  setTarget,
}: {
  zoomMv: MotionValue<number>;
  zoomTargetRef: React.RefObject<number>;
  setTarget: (v: number) => void;
}) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);

  const dark        = theme === 'dark';
  const fillColor   = dark ? '#EEECEA'                : '#1A1A18';
  const bgColor     = dark ? '#272724'                : '#E4E2DF';
  const tickOnFill  = dark ? 'rgba(20,20,18,0.4)'    : 'rgba(255,255,255,0.45)';
  const tickOffFill = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';
  const thumbColor  = dark ? '#141412'                : '#ffffff';

  // Thumb position derived directly from animated MotionValue — zero React renders
  const thumbLeftMv = useTransform(zoomMv, v => {
    const pct = (Math.max(50, Math.min(150, v)) - 50) / 100;
    return pct * SLIDER_W;
  });

  // SVG fill + ticks updated via direct DOM mutation on every animation frame
  useEffect(() => {
    return zoomMv.on('change', v => {
      const fillW = ((Math.max(50, Math.min(150, v)) - 50) / 100) * SLIDER_W;
      const clipRect = svgRef.current?.querySelector<SVGRectElement>('[data-fill-clip]');
      if (clipRect) clipRect.setAttribute('width', String(Math.max(0, fillW)));
      svgRef.current?.querySelectorAll<SVGLineElement>('[data-tick]').forEach((line, i) => {
        line.setAttribute('stroke', tickXs[i] <= fillW ? tickOnFill : tickOffFill);
      });
    });
  }, [zoomMv, tickOnFill, tickOffFill]);

  // Non-passive wheel — nonlinear scaling: fast scroll = coarse, slow scroll = fine
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalise deltaMode (lines → pixels)
      const raw = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      // Nonlinear: power curve so velocity is preserved but small inputs stay precise
      const scaled = Math.sign(raw) * Math.pow(Math.abs(raw), 0.72) * 0.13;
      if (zoomTargetRef.current !== null) {
        setTarget(zoomTargetRef.current - scaled);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setTarget, zoomTargetRef]);

  // Drag / click
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const calc = (clientX: number) => {
      const x = Math.max(0, Math.min(SLIDER_W, clientX - rect.left));
      setTarget(50 + (x / SLIDER_W) * 100);
    };
    calc(e.clientX);
    const onMove = (ev: PointerEvent) => calc(ev.clientX);
    const onUp   = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }, [setTarget]);

  const initFill = ((Math.max(50, Math.min(150, zoomMv.get())) - 50) / 100) * SLIDER_W;

  return (
    <div
      ref={containerRef}
      style={{ width: SLIDER_W, height: SLIDER_H, position: 'relative', flexShrink: 0, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
    >
      <svg ref={svgRef} width={SLIDER_W} height={SLIDER_H} style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <clipPath id="zs-fill-clip">
            <rect data-fill-clip x={0} y={0} width={initFill} height={SLIDER_H} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={SLIDER_W} height={SLIDER_H} rx={SLIDER_R} fill={bgColor} />
        <rect x={0} y={0} width={SLIDER_W} height={SLIDER_H} rx={SLIDER_R} fill={fillColor} clipPath="url(#zs-fill-clip)" />
        {tickXs.map((x, i) => (
          <line data-tick key={i}
            x1={x} y1={3.5} x2={x} y2={SLIDER_H - 3.5}
            stroke={x <= initFill ? tickOnFill : tickOffFill}
            strokeWidth={1.5} strokeLinecap="round"
          />
        ))}
      </svg>

      <motion.div
        style={{
          position: 'absolute', top: '50%',
          left: thumbLeftMv,
          translateX: '-50%', translateY: '-50%',
          borderRadius: '50%',
          background: thumbColor,
          boxShadow: dark
            ? '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
            : '0 1px 3px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          pointerEvents: 'none',
        }}
        animate={{ width: hovered ? 15 : 11, height: hovered ? 15 : 11 }}
        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      />
    </div>
  );
}

// ── EditorPage ────────────────────────────────────────────────────────────────

export function EditorPage() {
  const { docId, projectId } = useParams<{ docId: string; projectId?: string }>();
  const navigate = useNavigate();
  const store    = useAppStore();

  const editorRef          = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [outlineOpen, setOutlineOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [notesView,   setNotesView]   = useState<NotesView>('list');
  const [refsView,    setRefsView]    = useState<RefsView>('list');
  const [viewingRef,  setViewingRef]  = useState<Reference | null>(null);
  const [view, setView]               = useState<ViewMode>('write');

  // Bezier-eased zoom — no spring oscillation, smooth cubic ease-out
  const zoomMv         = useMotionValue(100);
  const zoomTargetRef  = useRef(100);
  const zoomAnimRef    = useRef<AnimationPlaybackControls | null>(null);

  const setZoomTarget = useCallback((v: number) => {
    const clamped = Math.max(50, Math.min(150, v));
    zoomTargetRef.current = clamped;
    zoomAnimRef.current?.stop();
    zoomAnimRef.current = animate(zoomMv, clamped, {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1], // expo ease-out — fast start, silky deceleration
    });
  }, [zoomMv]);

  const page       = !projectId ? store.getPage(docId!)                  : undefined;
  const project    = projectId  ? store.getProject(projectId)            : undefined;
  const projectDoc = projectId  ? store.getProjectDoc(projectId, docId!) : undefined;
  const doc        = page ?? projectDoc;

  useEffect(() => {
    if (project) store.markRecent(project.id);
    else if (page) store.markRecent(page.id);
  }, [docId, projectId]);

  // Synchronize active document state with the Rust WASM engine
  useEffect(() => {
    if (!doc) return;
    engineService.parseLaTeX(docId!, doc.content);
  }, [docId, doc?.content]);

  useEffect(() => {
    if (!doc) return;
    const path = projectId
      ? `/project/${projectId}/editor/${docId}`
      : `/editor/${docId}`;
    store.openTab({ id: docId!, title: doc.title, path });
  }, [docId, projectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setOutlineOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Trackpad pinch-to-zoom handler: maps pinch events to the smooth locomotive slider target
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Browser pinches: expanding fingers generates negative deltaY, pinching positive
        const factor = -e.deltaY * 0.42;
        setZoomTarget(zoomTargetRef.current + factor);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [setZoomTarget]);

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center size-full gap-3">
        <p className="text-base font-medium text-foreground">Document not found</p>
        <Link to="/home" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          Back to home
        </Link>
      </div>
    );
  }

  const handleContent = (content: string) => {
    if (projectId) store.updateProjectDoc(projectId, docId!, { content });
    else store.updatePage(docId!, { content });
  };

  const handleTitle = (title: string) => {
    if (projectId) store.updateProjectDoc(projectId, docId!, { title });
    else store.updatePage(docId!, { title });
    store.updateTabTitle(docId!, title);
  };

  const handleLabel = (label: string) => {
    if (projectId) store.updateProjectDoc(projectId, docId!, { label });
    else store.updatePage(docId!, { label });
  };

  const handleFormat = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    const el = document.getElementById('axiom-editor-area');
    if (el) {
      engineService.parseHTML(docId!, el.innerHTML);
      const latex = engineService.toLaTeXBody(docId!);
      handleContent(latex);
    }
  };

  const isDualView = view === 'dual-code' || view === 'dual-blocks';

  return (
    <div className="flex flex-col size-full overflow-hidden bg-background">

      {/* ── Top nav ── */}
      {view !== 'focus' && (
        <div className="flex items-center gap-0 px-3 h-7 bg-background shrink-0">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 mr-0.5"
            onClick={() => navigate(projectId ? `/project/${projectId}` : '/home')}
          >
            <ArrowLeft size={13} />
          </button>

          <button
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0 mr-2 ${
              outlineOpen
                ? 'text-foreground bg-secondary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            onClick={() => setOutlineOpen(v => !v)}
            title="Toggle outline (⌘⇧O)"
          >
            {outlineOpen ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-[12px] min-w-0 flex-1">
            <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              Home
            </Link>
            {project && (
              <>
                <ChevronRight size={10} className="text-muted-foreground/40 shrink-0" />
                <Link
                  to={`/project/${project.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[110px]"
                >
                  {project.title}
                </Link>
              </>
            )}
            <ChevronRight size={10} className="text-muted-foreground/40 shrink-0" />
            <input
              className="text-foreground bg-transparent outline-none border-b border-transparent focus:border-border transition-colors truncate min-w-0 max-w-[240px] text-[12px]"
              value={doc.title}
              onChange={e => handleTitle(e.target.value)}
            />
          </nav>

          {/* Zoom slider — inline, far right, only in write/read mode */}
          {!isDualView && (
            <div className="ml-3 flex items-center shrink-0">
              <ZoomSlider zoomMv={zoomMv} zoomTargetRef={zoomTargetRef} setTarget={setZoomTarget} />
            </div>
          )}
        </div>
      )}

      {/* ── Content: editor with floating navigator ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor & Floating Navigator Workspace */}
        <div className="flex-1 overflow-hidden relative">
          <Editor
            key={doc.id}
            documentId={doc.id}
            content={doc.content}
            onContentChange={handleContent}
            onFormat={handleFormat}
            editorRef={editorRef}
            scrollContainerRef={scrollContainerRef}
            viewMode={view}
            zoomMotionValue={zoomMv}
            label={doc.label ?? ''}
            onLabelChange={handleLabel}
            pageNumber={1}
          />

          {/* Floating Navigator */}
          <AnimatePresence>
            {outlineOpen && view !== 'focus' && (
              <motion.div
                className="absolute left-8 bottom-8 z-30 w-[240px] max-h-[380px] p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 shadow-2xl flex flex-col overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              >
                <div className="flex-1 overflow-hidden">
                  <DocumentOutlineNavigator
                    content={doc.content}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ViewSwitcher view={view} onViewChange={setView} />

      {view !== 'focus' && (
        <>
          <ToolRibbon
            onFormat={handleFormat}
            activePanel={activePanel}
            onNotesClick={() => { setActivePanel(p => p === 'notes' ? 'none' : 'notes'); setNotesView('list'); }}
            onReferencesClick={() => { setActivePanel(p => p === 'references' ? 'none' : 'references'); setRefsView('list'); }}
            onCreateNote={() => setNotesView('create')}
            onUploadReference={() => setRefsView('upload')}
          />

          {activePanel === 'notes' && notesView === 'list' && (
            <NotesWindow notes={store.notes} onToggleComplete={store.toggleNote} onDeleteNote={store.deleteNote} />
          )}
          {activePanel === 'notes' && notesView === 'create' && (
            <CreateNoteWindow onSubmit={(t, c) => { store.addNote(t, c); setNotesView('list'); }} />
          )}
          {activePanel === 'references' && refsView === 'list' && (
            <ReferencesWindow
              references={store.references}
              onOpenReference={ref => { setActivePanel('none'); setViewingRef(ref as Reference); }}
            />
          )}
          {activePanel === 'references' && refsView === 'upload' && (
            <UploadReferenceWindow
              onSubmit={(title, authors, description, type, url) => {
                store.addReference({ title, authors, description, type, url, notes: '', tags: [], highlightCount: 0 });
                setRefsView('list');
              }}
            />
          )}
          {viewingRef && (
            <ReferenceViewer reference={viewingRef} onClose={() => setViewingRef(null)} />
          )}
        </>
      )}
    </div>
  );
}
