import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plus, FileText, MoreHorizontal, Trash2,
  BookOpen, Clock, Edit3, ChevronRight, FolderOpen,
} from 'lucide-react';
import { useAppStore, type ProjectDoc } from '../store/appStore';
import { formatDistanceToNow, parseISO } from 'date-fns';

function relativeDate(iso: string) {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); } catch { return ''; }
}

function DocCard({ doc, projectId, delay = 0 }: { doc: ProjectDoc; projectId: string; delay?: number }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const open = () => navigate(`/project/${projectId}/editor/${doc.id}`);

  return (
    <motion.div
      className="group relative w-[196px] shrink-0 cursor-pointer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
    >
      <div
        className="w-full h-[260px] rounded-xl overflow-hidden border border-border bg-white shadow-sm group-hover:shadow-lg transition-shadow duration-200 relative"
        onClick={open}
      >
        <div
          className="w-full h-full overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
          onClick={e => e.stopPropagation()}
          onClickCapture={open}
        >
          <div
            style={{
              zoom: 0.29,
              padding: '48px 52px',
              fontFamily: "'Newsreader', 'Georgia', serif",
              color: '#1a1a1c',
              lineHeight: 1.65,
              minHeight: '100%',
            }}
            dangerouslySetInnerHTML={{ __html: doc.content || `<h1>${doc.title}</h1><p>Empty document</p>` }}
          />
        </div>
        <div className="absolute inset-0 rounded-xl bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
            <BookOpen size={11} className="text-foreground/70" />
            <span className="text-[11px] font-medium text-foreground/70">Open</span>
          </div>
        </div>
      </div>

      <div className="pt-2.5 px-0.5">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-start gap-2 min-w-0">
            <FileText size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">{doc.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{relativeDate(doc.updatedAt)}</p>
            </div>
          </div>
          <div className="relative">
            <button
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            >
              <MoreHorizontal size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 top-7 z-30 w-44 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary"
                    onClick={() => { open(); setMenuOpen(false); }}
                  >
                    <BookOpen size={13} className="text-muted-foreground" /> Open
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => { store.deleteProjectDoc(projectId, doc.id); setMenuOpen(false); }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useAppStore();
  const [editingTitle, setEditingTitle] = useState(false);

  const project = store.getProject(projectId!);

  if (!project) {
    return (
      <div className="flex items-center justify-center size-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Project not found</p>
          <Link to="/home" className="text-accent text-sm hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const handleAddDoc = () => {
    const doc = store.addDocToProject(project.id);
    navigate(`/project/${project.id}/editor/${doc.id}`);
  };

  return (
    <div className="flex flex-col size-full bg-background overflow-y-auto">
      <motion.div
        className="flex items-center gap-2 px-8 h-11 border-b border-border bg-background shrink-0 sticky top-0 z-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <button
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={14} />
        </button>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={12} className="text-border" />
          <span className="text-foreground font-medium">{project.title}</span>
        </nav>
      </motion.div>

      <div className="flex-1 px-10 py-10 max-w-5xl mx-auto w-full">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {editingTitle ? (
                  <input
                    autoFocus
                    className="text-2xl font-semibold text-foreground bg-transparent outline-none border-b-2 border-accent"
                    style={{ fontFamily: "'Newsreader', serif" }}
                    value={project.title}
                    onChange={e => store.updateProject(project.id, { title: e.target.value })}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                  />
                ) : (
                  <h1
                    className="text-2xl font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "'Newsreader', serif" }}
                    onClick={() => setEditingTitle(true)}
                  >
                    {project.title}
                  </h1>
                )}
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  <Edit3 size={14} />
                </button>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <FileText size={11} />
                  {project.documents.length} document{project.documents.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Clock size={11} />
                  Updated {relativeDate(project.updatedAt)}
                </span>
              </div>
            </div>

            <div
              className="w-1.5 h-16 rounded-full opacity-60 shrink-0"
              style={{ background: project.color }}
            />
          </div>
        </motion.div>

        <div className="mb-8 h-px bg-border" />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Documents</h2>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={handleAddDoc}
            >
              <Plus size={13} /> New Document
            </button>
          </div>

          {project.documents.length === 0 ? (
            <motion.div
              className="py-20 flex flex-col items-center gap-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                <FolderOpen size={24} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">No documents yet</p>
                <p className="text-sm text-muted-foreground">Create your first document to get started</p>
              </div>
              <button
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={handleAddDoc}
              >
                <Plus size={14} /> Create Document
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-wrap gap-5">
              {project.documents.map((doc, i) => (
                <DocCard key={doc.id} doc={doc} projectId={project.id} delay={i * 0.05} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
