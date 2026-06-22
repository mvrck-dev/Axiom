import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, FolderPlus, Search, FileText, FolderOpen,
  Clock, Pin, MoreHorizontal, Trash2, BookOpen,
  Moon, Sun, Keyboard, Home, ChevronRight, Eye,
} from 'lucide-react';
import { useAppStore, type AxiomPage, type AxiomProject } from '../store/appStore';
import { useTheme } from '../components/ThemeProvider';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// ─── Utilities ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function relativeDate(iso: string) {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); }
  catch { return ''; }
}

const CARD_W = 188;
const ZOOM = 0.28;

// ─── Document Preview ─────────────────────────────────────────────────────────

function DocPreview({ content, title }: { content: string; title: string }) {
  const html = content || `<h1>${title}</h1><p>Empty document</p>`;
  return (
    <div
      className="w-full bg-white overflow-hidden"
      style={{ height: 220, position: 'relative' }}
    >
      {/* Clipping outer */}
      <div style={{ width: CARD_W, height: 220, overflow: 'hidden', position: 'absolute', inset: 0 }}>
        {/* Zoomed inner — fills the card width at ZOOM scale */}
        <div
          style={{
            zoom: ZOOM,
            width: Math.round(CARD_W / ZOOM),
            padding: '52px 56px',
            fontFamily: "'Newsreader', Georgia, serif",
            color: '#1a1a18',
            lineHeight: 1.65,
            fontSize: 16,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

// ─── Card context menu ────────────────────────────────────────────────────────

function CardMenu({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute right-0 top-full mt-1 z-30 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1"
      initial={{ opacity: 0, scale: 0.94, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.11 }}
    >
      {children}
    </motion.div>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-secondary'
      }`}
      onClick={onClick}
    >
      <span className="opacity-60">{icon}</span>
      {label}
    </button>
  );
}

// ─── Page Card ────────────────────────────────────────────────────────────────

function PageCard({ page, delay = 0 }: { page: AxiomPage; delay?: number }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const open = () => { store.markRecent(page.id); navigate(`/editor/${page.id}`); };

  return (
    <motion.article
      className="group relative shrink-0 cursor-pointer"
      style={{ width: CARD_W }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -3 }}
    >
      {/* Preview card */}
      <div
        className="rounded-2xl overflow-hidden border border-border bg-white transition-shadow duration-200 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        onClick={open}
      >
        <DocPreview content={page.content} title={page.title} />

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/[0.04]">
          <div className="bg-white/95 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
            <BookOpen size={11} className="text-foreground/60" />
            <span className="text-[11px] font-medium text-foreground/60">Open</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 px-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-start gap-1.5 min-w-0">
            <FileText size={12} className="shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground leading-tight truncate">{page.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{relativeDate(page.updatedAt)}</p>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            >
              <MoreHorizontal size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <CardMenu>
                  <MenuItem icon={<BookOpen size={13} />} label="Open" onClick={() => { open(); setMenuOpen(false); }} />
                  <MenuItem icon={<Pin size={13} />} label={page.pinned ? 'Unpin' : 'Pin'} onClick={() => { store.updatePage(page.id, { pinned: !page.pinned }); setMenuOpen(false); }} />
                  <div className="my-1 h-px bg-border" />
                  <MenuItem icon={<Trash2 size={13} />} label="Delete" onClick={() => { store.deletePage(page.id); setMenuOpen(false); }} danger />
                </CardMenu>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, delay = 0 }: { project: AxiomProject; delay?: number }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const open = () => { store.markRecent(project.id); navigate(`/project/${project.id}`); };
  const docs = project.documents || [];
  const firstDoc = docs[0];

  return (
    <motion.article
      className="group relative shrink-0 cursor-pointer"
      style={{ width: CARD_W }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -3 }}
    >
      {/* Stacked back shadows */}
      {docs.length > 2 && (
        <div className="absolute inset-x-3 top-2 h-[220px] rounded-2xl border border-border bg-secondary/60" style={{ transform: 'rotate(2deg)' }} />
      )}
      {docs.length > 1 && (
        <div className="absolute inset-x-1.5 top-1 h-[220px] rounded-2xl border border-border bg-secondary/80" style={{ transform: 'rotate(1deg)' }} />
      )}

      {/* Main card */}
      <div
        className="relative rounded-2xl overflow-hidden border transition-shadow duration-200 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        style={{
          borderColor: `${project.color}28`,
          background: `linear-gradient(160deg, ${project.color}12 0%, ${project.color}06 100%)`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onClick={open}
      >
        {firstDoc ? (
          <DocPreview content={firstDoc.content} title={firstDoc.title} />
        ) : (
          <div
            className="flex flex-col items-center justify-center bg-white/60"
            style={{ height: 220 }}
          >
            <FolderOpen size={24} className="text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No documents</p>
          </div>
        )}

        {/* Doc count badge */}
        <div className="absolute top-2.5 left-2.5">
          <div
            className="text-white text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: project.color }}
          >
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/[0.04]">
          <div className="bg-white/95 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
            <FolderOpen size={11} className="text-foreground/60" />
            <span className="text-[11px] font-medium text-foreground/60">Open project</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 px-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-start gap-1.5 min-w-0">
            <FolderOpen size={12} className="shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground leading-tight truncate">{project.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {project.description || `${docs.length} documents`}
              </p>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            >
              <MoreHorizontal size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <CardMenu>
                  <MenuItem icon={<FolderOpen size={13} />} label="Open" onClick={() => { open(); setMenuOpen(false); }} />
                  <div className="my-1 h-px bg-border" />
                  <MenuItem icon={<Trash2 size={13} />} label="Delete" onClick={() => { store.deleteProject(project.id); setMenuOpen(false); }} danger />
                </CardMenu>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-4">
      {label}
    </p>
  );
}

// ─── All Documents tabs section ───────────────────────────────────────────────

function AllDocuments() {
  const [tab, setTab] = useState<'pages' | 'projects'>('pages');
  const store = useAppStore();
  const navigate = useNavigate();

  const createAndOpen = () => {
    if (tab === 'pages') {
      const p = store.createPage();
      store.markRecent(p.id);
      navigate(`/editor/${p.id}`);
    } else {
      const p = store.createProject();
      store.markRecent(p.id);
      navigate(`/project/${p.id}`);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-0 border-b border-border">
          {(['pages', 'projects'] as const).map(t => (
            <button
              key={t}
              className={`relative px-3 py-1.5 text-sm capitalize transition-colors pb-2 ${
                tab === t ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
              {tab === t && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full"
                  layoutId="tab-line"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-85 transition-opacity"
          onClick={createAndOpen}
        >
          <Plus size={12} />
          New {tab === 'pages' ? 'Page' : 'Project'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="flex flex-wrap gap-4"
        >
          {tab === 'pages' && (
            store.pages.length === 0
              ? <EmptySlate type="pages" />
              : store.pages.map((p, i) => <PageCard key={p.id} page={p} delay={i * 0.03} />)
          )}
          {tab === 'projects' && (
            store.projects.length === 0
              ? <EmptySlate type="projects" />
              : store.projects.map((p, i) => <ProjectCard key={p.id} project={p} delay={i * 0.03} />)
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function EmptySlate({ type }: { type: 'pages' | 'projects' }) {
  const store = useAppStore();
  const navigate = useNavigate();
  return (
    <div className="w-full py-14 flex flex-col items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center">
        {type === 'pages'
          ? <FileText size={18} className="text-muted-foreground" />
          : <FolderOpen size={18} className="text-muted-foreground" />
        }
      </div>
      <p className="text-sm font-medium text-foreground">No {type} yet</p>
      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-85 transition-opacity"
        onClick={() => {
          const item = type === 'pages' ? store.createPage() : store.createProject();
          navigate(type === 'pages' ? `/editor/${item.id}` : `/project/${item.id}`);
        }}
      >
        <Plus size={12} />
        Create {type === 'pages' ? 'page' : 'project'}
      </button>
    </div>
  );
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────

function NavItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12.5px] transition-colors truncate ${
        active
          ? 'bg-sidebar-accent text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
      }`}
      onClick={onClick}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const store = useAppStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const recentItems = store.recentIds
    .slice(0, 8)
    .map(id => {
      const p = store.getPage(id);
      if (p) return { kind: 'page' as const, data: p };
      const proj = store.getProject(id);
      if (proj) return { kind: 'project' as const, data: proj };
      return null;
    })
    .filter(Boolean) as Array<
      { kind: 'page'; data: AxiomPage } | { kind: 'project'; data: AxiomProject }
    >;

  const pinnedPages = store.pages.filter(p => p.pinned);

  return (
    <div className="flex size-full bg-background overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-sidebar h-full overflow-y-auto">

        {/* Logo */}
        <div className="px-4 pt-5 pb-3">
          <span
            className="text-[15px] font-medium text-foreground"
            style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}
          >
            Axiom
          </span>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <button
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-[12.5px] transition-colors"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          >
            <Search size={12} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[9px] border border-border rounded px-1 font-mono opacity-60">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2.5 flex-1 space-y-0.5">
          <NavItem icon={<Home size={13} />} label="Home" active onClick={() => { navigate('/home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <NavItem icon={<Clock size={13} />} label="Recent" onClick={() => scrollToSection('recent-section')} />
          {pinnedPages.length > 0 && (
            <NavItem icon={<Pin size={13} />} label="Pinned" onClick={() => scrollToSection('pinned-section')} />
          )}

          <div className="pt-3 pb-1 px-2.5 text-[9px] uppercase tracking-widest text-muted-foreground font-mono">
            Pages
          </div>
          {store.pages.slice(0, 6).map(p => (
            <NavItem
              key={p.id}
              icon={<FileText size={12} />}
              label={p.title}
              onClick={() => { store.markRecent(p.id); navigate(`/editor/${p.id}`); }}
            />
          ))}
          <button
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={() => { const p = store.createPage(); store.markRecent(p.id); navigate(`/editor/${p.id}`); }}
          >
            <Plus size={12} />
            New page
          </button>

          <div className="pt-3 pb-1 px-2.5 text-[9px] uppercase tracking-widest text-muted-foreground font-mono">
            Projects
          </div>
          {store.projects.slice(0, 5).map(p => (
            <NavItem
              key={p.id}
              icon={<FolderOpen size={12} />}
              label={p.title}
              onClick={() => { store.markRecent(p.id); navigate(`/project/${p.id}`); }}
            />
          ))}
          <button
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={() => { const p = store.createProject(); store.markRecent(p.id); navigate(`/project/${p.id}`); }}
          >
            <Plus size={12} />
            New project
          </button>
        </nav>

        {/* Bottom bar */}
        <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-1">
          <button
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (⌘⇧T)`}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button
            title="Keyboard shortcuts (⌘/)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('axiom:shortcuts'))}
          >
            <Keyboard size={13} />
          </button>
          <button
            title="Accessibility settings (⌥A)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('axiom:accessibility-settings'))}
          >
            <Eye size={13} />
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-10 py-10">

          {/* Greeting */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
          >
            <h1
              className="text-[28px] font-medium text-foreground mb-0.5"
              style={{ fontFamily: "'Newsreader', serif" }}
            >
              {greeting()}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </motion.div>

          {/* Quick create */}
          <motion.div
            className="flex gap-2.5 mb-10"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.06 }}
          >
            <CreateBtn
              icon={<Plus size={14} />}
              label="New Page"
              kbd="⌘N"
              onClick={() => { const p = store.createPage(); store.markRecent(p.id); navigate(`/editor/${p.id}`); }}
              primary
            />
            <CreateBtn
              icon={<FolderPlus size={14} />}
              label="New Project"
              kbd="⌘⇧N"
              onClick={() => { const p = store.createProject(); store.markRecent(p.id); navigate(`/project/${p.id}`); }}
            />
          </motion.div>

          {/* Recent */}
          {recentItems.length > 0 && (
            <motion.section
              id="recent-section"
              className="mb-10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.1 }}
            >
              <SectionLabel label="Recent" />
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {recentItems.map((item, i) =>
                  item.kind === 'page'
                    ? <PageCard key={item.data.id} page={item.data} delay={i * 0.03} />
                    : <ProjectCard key={item.data.id} project={item.data} delay={i * 0.03} />
                )}
              </div>
            </motion.section>
          )}

          {/* Pinned */}
          {pinnedPages.length > 0 && (
            <motion.section
              id="pinned-section"
              className="mb-10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.14 }}
            >
              <SectionLabel label="Pinned" />
              <div className="flex flex-wrap gap-4">
                {pinnedPages.map((p, i) => <PageCard key={p.id} page={p} delay={i * 0.03} />)}
              </div>
            </motion.section>
          )}

          {/* All documents */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.16 }}
          >
            <AllDocuments />
          </motion.div>

        </div>
      </main>
    </div>
  );
}

function CreateBtn({
  icon, label, kbd, onClick, primary,
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <motion.button
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
        primary
          ? 'bg-foreground text-background hover:opacity-85'
          : 'bg-card border border-border text-foreground hover:bg-secondary'
      }`}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {icon}
      {label}
      <kbd
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ml-1 ${
          primary
            ? 'border-white/20 text-white/50'
            : 'border-border text-muted-foreground'
        }`}
      >
        {kbd}
      </kbd>
    </motion.button>
  );
}
