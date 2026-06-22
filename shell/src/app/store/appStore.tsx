import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { engineService } from '../services/engineService';

export interface AxiomPage {
  id: string;
  type: 'page';
  title: string;
  content: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface ProjectDoc {
  id: string;
  title: string;
  content: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AxiomProject {
  id: string;
  type: 'project';
  title: string;
  description: string;
  color: string;
  documents: ProjectDoc[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  createdAt: string;
}

export interface Reference {
  id: string;
  type: 'pdf' | 'link';
  title: string;
  authors: string;
  description: string;
  notes: string;
  tags: string[];
  highlightCount: number;
  url?: string;
}

export interface OpenTab {
  id: string;       // unique tab id (same as docId for pages, docId for project docs)
  title: string;
  path: string;     // full route path to navigate to
}

interface AppStore {
  pages: AxiomPage[];
  projects: AxiomProject[];
  notes: Note[];
  references: Reference[];
  recentIds: string[];
  openTabs: OpenTab[];
  openTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  updateTabTitle: (id: string, title: string) => void;

  createPage: (title?: string) => AxiomPage;
  updatePage: (id: string, updates: Partial<AxiomPage>) => void;
  deletePage: (id: string) => void;

  createProject: (title?: string) => AxiomProject;
  updateProject: (id: string, updates: Partial<AxiomProject>) => void;
  deleteProject: (id: string) => void;
  addDocToProject: (projectId: string, doc?: Partial<ProjectDoc>) => ProjectDoc;
  updateProjectDoc: (projectId: string, docId: string, updates: Partial<ProjectDoc>) => void;
  deleteProjectDoc: (projectId: string, docId: string) => void;

  getPage: (id: string) => AxiomPage | undefined;
  getProject: (id: string) => AxiomProject | undefined;
  getProjectDoc: (projectId: string, docId: string) => ProjectDoc | undefined;

  addNote: (title: string, content: string) => void;
  toggleNote: (id: string) => void;
  deleteNote: (id: string) => void;

  addReference: (ref: Omit<Reference, 'id'>) => void;
  deleteReference: (id: string) => void;

  markRecent: (id: string) => void;
}

const DEMO_PAGES: AxiomPage[] = [
  {
    id: 'page-1',
    type: 'page',
    title: 'Quantum Entanglement Notes',
    pinned: false,
    createdAt: '2024-11-10T09:00:00Z',
    updatedAt: '2024-11-14T16:22:00Z',
    content: `\\section{Quantum Entanglement}

Quantum entanglement is a phenomenon where particles become correlated such that the quantum state of each cannot be described independently of the others, regardless of the distance separating them.

\\subsection{The EPR Paradox}

In 1935, Einstein, Podolsky, and Rosen proposed a thought experiment challenging whether quantum mechanics provided a complete description of physical reality. They argued that if quantum mechanics were complete, it would imply "spooky action at a distance."

\\subsection{Bell's Theorem (1964)}

John Stewart Bell devised a test --- now called Bell inequalities --- to distinguish between quantum mechanical predictions and local hidden variable theories. Experiments have consistently violated Bell inequalities, confirming the non-local nature of quantum correlations.

\\subsection{Applications}

\\begin{itemize}
  \\item Quantum cryptography (QKD protocols)
  \\item Quantum teleportation
  \\item Quantum computing (entangled qubits)
  \\item Quantum sensing and metrology
\\end{itemize}

The phenomenon remains one of the most philosophically provocative aspects of quantum theory, raising deep questions about locality, realism, and the completeness of physical theories.`,
  },
  {
    id: 'page-2',
    type: 'page',
    title: 'On Solitude and Creative Work',
    pinned: true,
    createdAt: '2024-10-03T11:30:00Z',
    updatedAt: '2024-11-12T10:15:00Z',
    content: `\\section{On Solitude and Creative Work}

The relationship between solitude and the creative act has been a recurring preoccupation of artists, writers, and philosophers since antiquity. In Rilke's \\textit{Letters to a Young Poet}, the counsel is unambiguous: go into yourself.

\\subsection{The Paradox of Productive Isolation}

There is a paradox at the heart of creative solitude. The artist withdraws from the social world in order to make something for it. The more completely one disappears into the work, the more fully one is present to others through the work.

Virginia Woolf understood this acutely. Her diaries document daily rhythms of social engagement and retreat, treating both as necessary to the work. The famous "room of one's own" is not merely spatial --- it is temporal, cognitive, and emotional.

\\subsection{The Role of Boredom}

Contemporary discourse treats boredom as failure --- a problem to be solved by stimulation. But boredom is often a threshold state: the mind clearing itself of accumulated noise before a new clarity can emerge. The creative practitioner learns to wait in that space without flinching.

\\begin{quote}
"One must have chaos within oneself to give birth to a dancing star." --- Nietzsche
\\end{quote}`,
  },
  {
    id: 'page-3',
    type: 'page',
    title: 'Research Methods Overview',
    pinned: false,
    createdAt: '2024-09-15T08:00:00Z',
    updatedAt: '2024-11-08T14:45:00Z',
    content: `\\section{Research Methods Overview}

\\subsection{1. Epistemological Framework}

This study operates within a critical realist framework, accepting that an objective reality exists while acknowledging that our knowledge of it is always mediated and provisional.

\\subsection{2. Data Collection}

Primary data was collected through semi-structured interviews (n=24) conducted between March and June 2024. Interview duration averaged 52 minutes. All sessions were audio-recorded with participant consent and transcribed verbatim.

\\subsection{3. Sampling Strategy}

Participants were recruited via purposive sampling to ensure variation across three key dimensions: institutional affiliation, career stage, and geographic region.

\\subsection{4. Analytical Approach}

Thematic analysis following Braun and Clarke (2006) was employed for qualitative data. NVivo 14 was used for coding. Quantitative survey data (n=187) was analyzed in R using mixed-effects regression models.`,
  },
];

const DEMO_PROJECTS: AxiomProject[] = [
  {
    id: 'proj-1',
    type: 'project',
    title: 'Dissertation',
    description: 'PhD dissertation on distributed cognition and tool-mediated learning',
    color: '#7C6F9F',
    pinned: true,
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-11-14T17:00:00Z',
    documents: [
      {
        id: 'proj-1-doc-1',
        title: 'Chapter 1: Introduction',
        createdAt: '2024-06-01T09:00:00Z',
        updatedAt: '2024-11-14T17:00:00Z',
        content: `\\section{Chapter 1: Introduction}

This dissertation investigates the role of material artifacts in shaping cognitive processes --- a domain known as distributed cognition. Building on Hutchins' foundational work in \\textit{Cognition in the Wild} (1995), I examine how contemporary knowledge workers extend their cognitive capacities through digital tools.

\\subsection{Research Questions}

\\begin{enumerate}
  \\item How do knowledge workers describe the relationship between their tools and their thinking?
  \\item What patterns of tool-mediated cognition emerge across different professional domains?
  \\item How do transitions between tools alter cognitive practices and outcomes?
\\end{enumerate}

\\subsection{Significance}

Understanding tool-mediated cognition has implications for organizational design, educational practice, and the development of cognitive technologies. As AI-assisted work becomes prevalent, these questions acquire new urgency.`,
      },
      {
        id: 'proj-1-doc-2',
        title: 'Chapter 2: Literature Review',
        createdAt: '2024-07-10T10:00:00Z',
        updatedAt: '2024-11-10T11:30:00Z',
        content: `\\section{Chapter 2: Literature Review}

\\subsection{Distributed Cognition}

The distributed cognition framework, introduced by Hutchins (1995) and developed by Hollan, Hutchins, and Kirsh (2000), proposes that cognitive processes extend beyond the individual mind to encompass environmental structures and social interactions.

\\subsection{Extended Mind Theory}

Clark and Chalmers (1998) advanced the bold claim that the mind itself extends into the environment. Their parity principle holds that if an external process functionally mirrors what would be counted as cognitive if it were in the head, it should count as cognitive regardless of its substrate.

\\subsection{Embodied Cognition}

Varela, Thompson, and Rosch (1991) argued that cognition is fundamentally shaped by the nature of having a body. Subsequent work has traced specific ways in which bodily action and perception constitute rather than merely support cognitive processes.`,
      },
      {
        id: 'proj-1-doc-3',
        title: 'Chapter 3: Methodology',
        createdAt: '2024-08-20T09:00:00Z',
        updatedAt: '2024-11-05T16:00:00Z',
        content: `\\section{Chapter 3: Methodology}

This chapter details the epistemological commitments, research design, data collection procedures, and analytical approaches employed in this study.

\\subsection{3.1 Epistemological Position}

The study adopts a critical realist stance (Bhaskar, 1975), which accepts the existence of a mind-independent reality while acknowledging that knowledge of that reality is always theory-laden and fallible.

\\subsection{3.2 Research Design}

A multiple case study design (Yin, 2018) was selected to enable rich description while permitting cross-case comparison. Four professional settings were selected as cases: an architectural firm, a software development team, a hospital intensive care unit, and a scientific research laboratory.`,
      },
    ],
  },
  {
    id: 'proj-2',
    type: 'project',
    title: 'Meeting Notes 2024',
    description: 'Quarterly reviews and planning sessions',
    color: '#5A8A7C',
    pinned: false,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
    documents: [
      {
        id: 'proj-2-doc-1',
        title: 'Q3 Review',
        createdAt: '2024-10-01T14:00:00Z',
        updatedAt: '2024-10-15T16:30:00Z',
        content: `\\section{Q3 Review --- October 2024}

\\subsection{Highlights}

\\begin{itemize}
  \\item Completed Phase 1 of the infrastructure migration --- 3 weeks ahead of schedule
  \\item Onboarded 2 new researchers to the distributed systems team
  \\item Published 2 peer-reviewed papers (UIST, CHI Late-Breaking)
\\end{itemize}

\\subsection{Challenges}

The transition to the new data pipeline introduced unexpected latency issues in the analytics stack. Root cause identified as N+1 query patterns in the ORM layer; fix deployed week of Oct 7.`,
      },
      {
        id: 'proj-2-doc-2',
        title: 'Q4 Planning',
        createdAt: '2024-10-20T10:00:00Z',
        updatedAt: '2024-11-01T10:00:00Z',
        content: `\\section{Q4 Planning --- November 2024}

\\subsection{Objectives}

\\begin{enumerate}
  \\item Complete dissertation Chapters 4 and 5 by December 15
  \\item Submit CHI 2025 paper by November 30 deadline
  \\item Finalize ethics review application for follow-up study
\\end{enumerate}

\\subsection{Resource Allocation}

Writing time: 3 hours minimum per day, mornings. Analysis sessions: Tuesday and Thursday afternoons. Supervisor meetings: biweekly on Mondays.`,
      },
    ],
  },
];

const DEMO_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Read Bell (1964)',
    content: 'Find original paper in CERN archives. Compare with Aspect et al. 1982 experiments.',
    completed: false,
    createdAt: '2024-11-10T09:00:00Z',
  },
  {
    id: 'note-2',
    title: 'Email supervisor re: Chapter 3 draft',
    content: 'Send revised methodology section by Friday',
    completed: true,
    createdAt: '2024-11-08T11:00:00Z',
  },
];

const DEMO_REFERENCES: Reference[] = [
  {
    id: 'ref-1',
    type: 'pdf',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    description: 'Introduces the Transformer architecture for sequence-to-sequence models',
    notes: '',
    tags: ['machine learning', 'NLP', 'transformers'],
    highlightCount: 5,
  },
  {
    id: 'ref-2',
    type: 'link',
    title: 'Cognition in the Wild',
    authors: 'Edwin Hutchins',
    description: 'Foundational work on distributed cognition via ship navigation study',
    notes: 'Key reference for Chapter 2 lit review',
    tags: ['distributed cognition', 'HCI'],
    highlightCount: 12,
    url: 'https://mitpress.mit.edu/books/cognition-wild',
  },
];

// Clear stale data from previous schema versions that had emoji fields
const SCHEMA_VERSION = 'v4';
if (localStorage.getItem('axiom:schema') !== SCHEMA_VERSION) {
  ['axiom:pages', 'axiom:projects', 'axiom:notes', 'axiom:refs', 'axiom:recent'].forEach(k =>
    localStorage.removeItem(k)
  );
  localStorage.setItem('axiom:schema', SCHEMA_VERSION);
}

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function now() {
  return new Date().toISOString();
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<AxiomPage[]>(() =>
    loadState('axiom:pages', DEMO_PAGES)
  );
  const [projects, setProjects] = useState<AxiomProject[]>(() =>
    loadState('axiom:projects', DEMO_PROJECTS)
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    loadState('axiom:notes', DEMO_NOTES)
  );
  const [references, setReferences] = useState<Reference[]>(() =>
    loadState('axiom:refs', DEMO_REFERENCES)
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadState('axiom:recent', ['page-1', 'proj-1', 'page-2'])
  );
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);

  useEffect(() => { localStorage.setItem('axiom:pages', JSON.stringify(pages)); }, [pages]);
  useEffect(() => { localStorage.setItem('axiom:projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('axiom:notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('axiom:refs', JSON.stringify(references)); }, [references]);
  useEffect(() => { localStorage.setItem('axiom:recent', JSON.stringify(recentIds)); }, [recentIds]);

  const createPage = useCallback((title = 'Untitled') => {
    const latexContent = `\\section{${title}}`;
    const page: AxiomPage = {
      id: `page-${Date.now()}`,
      type: 'page',
      title,
      content: latexContent,
      createdAt: now(),
      updatedAt: now(),
      pinned: false,
    };
    // Initialize Rust WASM engine with the LaTeX content
    engineService.parseLaTeX(page.id, latexContent);
    setPages(prev => [page, ...prev]);
    return page;
  }, []);

  const updatePage = useCallback((id: string, updates: Partial<AxiomPage>) => {
    setPages(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updates, updatedAt: now() };
          if (updates.content !== undefined) {
            // Log node count & serialize tree from WASM engine to verify sync
            const count = engineService.getNodeCount(id);
            const ver = engineService.getEngineVersion(id);
            console.log(`[WASM State Sync] Page ${id} updated. Rust engine version: ${ver}, Node Count: ${count}`);
          }
          return updated;
        }
        return p;
      })
    );
  }, []);

  const deletePage = useCallback((id: string) => {
    engineService.destroyInstance(id);
    setPages(prev => prev.filter(p => p.id !== id));
    setRecentIds(prev => prev.filter(r => r !== id));
  }, []);

  const createProject = useCallback((title = 'Untitled Project') => {
    const project: AxiomProject = {
      id: `proj-${Date.now()}`,
      type: 'project',
      title,
      description: '',
      color: '#6366F1',
      documents: [],
      createdAt: now(),
      updatedAt: now(),
      pinned: false,
    };
    setProjects(prev => [project, ...prev]);
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<AxiomProject>) => {
    setProjects(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: now() } : p)
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setRecentIds(prev => prev.filter(r => r !== id));
  }, []);

  const addDocToProject = useCallback((projectId: string, partial?: Partial<ProjectDoc>) => {
    const docTitle = partial?.title || 'Untitled';
    const latexContent = partial?.content || `\\section{${docTitle}}`;
    const doc: ProjectDoc = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      content: latexContent,
      createdAt: now(),
      updatedAt: now(),
    };
    // Initialize Rust WASM engine with the LaTeX content
    engineService.parseLaTeX(doc.id, latexContent);
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, documents: [doc, ...p.documents], updatedAt: now() }
          : p
      )
    );
    return doc;
  }, []);

  const updateProjectDoc = useCallback((projectId: string, docId: string, updates: Partial<ProjectDoc>) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              updatedAt: now(),
              documents: p.documents.map(d => {
                if (d.id === docId) {
                  const updated = { ...d, ...updates, updatedAt: now() };
                  if (updates.content !== undefined) {
                    // Log node count & serialize tree from WASM engine to verify sync
                    const count = engineService.getNodeCount(docId);
                    const ver = engineService.getEngineVersion(docId);
                    console.log(`[WASM State Sync] Project Doc ${docId} updated. Rust engine version: ${ver}, Node Count: ${count}`);
                  }
                  return updated;
                }
                return d;
              }),
            }
          : p
      )
    );
  }, []);

  const deleteProjectDoc = useCallback((projectId: string, docId: string) => {
    engineService.destroyInstance(docId);
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, documents: p.documents.filter(d => d.id !== docId) }
          : p
      )
    );
  }, []);

  const getPage = useCallback((id: string) => pages.find(p => p.id === id), [pages]);
  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getProjectDoc = useCallback((projectId: string, docId: string) =>
    projects.find(p => p.id === projectId)?.documents.find(d => d.id === docId),
    [projects]
  );

  const addNote = useCallback((title: string, content: string) => {
    setNotes(prev => [{
      id: `note-${Date.now()}`,
      title,
      content,
      completed: false,
      createdAt: now(),
    }, ...prev]);
  }, []);

  const toggleNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const addReference = useCallback((ref: Omit<Reference, 'id'>) => {
    setReferences(prev => [{ ...ref, id: `ref-${Date.now()}` }, ...prev]);
  }, []);

  const deleteReference = useCallback((id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id));
  }, []);

  const markRecent = useCallback((id: string) => {
    setRecentIds(prev => [id, ...prev.filter(r => r !== id)].slice(0, 12));
  }, []);

  const openTab = useCallback((tab: OpenTab) => {
    setOpenTabs(prev => {
      if (prev.some(t => t.id === tab.id)) {
        return prev.map(t => t.id === tab.id ? { ...t, title: tab.title, path: tab.path } : t);
      }
      return [...prev, tab];
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTabTitle = useCallback((id: string, title: string) => {
    setOpenTabs(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }, []);

  return (
    <AppStoreContext.Provider value={{
      pages, projects, notes, references, recentIds, openTabs,
      createPage, updatePage, deletePage,
      createProject, updateProject, deleteProject,
      addDocToProject, updateProjectDoc, deleteProjectDoc,
      getPage, getProject, getProjectDoc,
      addNote, toggleNote, deleteNote,
      addReference, deleteReference,
      markRecent, openTab, closeTab, updateTabTitle,
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
