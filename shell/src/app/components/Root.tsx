import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Lenis from 'lenis';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { AccessibilityProvider, useAccessibility } from './AccessibilityProvider';
import { AccessibilitySettings } from './AccessibilitySettings';
import { AppStoreProvider, useAppStore } from '../store/appStore';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { DocumentTabs } from './DocumentTabs';
import { MotionConfig } from 'motion/react';

function RootInner() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const store = useAppStore();
  const { toggleTheme } = useTheme();

  const isEditorRoute = location.pathname.includes('/editor/');
  const activeTabId = isEditorRoute
    ? location.pathname.split('/editor/')[1]?.split('/')[0]
    : '';

  // Lenis — disabled on editor routes to preserve contenteditable scroll
  useEffect(() => {
    if (isEditorRoute) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isEditorRoute]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;

      if (meta && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v); return; }
      if (meta && e.key === '/') { e.preventDefault(); setShortcutsOpen(v => !v); return; }
      if (meta && !shift && e.key === 'n') {
        e.preventDefault();
        const page = store.createPage();
        store.markRecent(page.id);
        store.openTab({ id: page.id, title: page.title, path: `/editor/${page.id}` });
        navigate(`/editor/${page.id}`);
        return;
      }
      if (meta && shift && e.key === 'N') {
        e.preventDefault();
        const proj = store.createProject();
        store.markRecent(proj.id);
        navigate(`/project/${proj.id}`);
        return;
      }
      if (meta && e.key === 'h') { e.preventDefault(); navigate('/home'); return; }
      if (meta && shift && e.key === 'T') { e.preventDefault(); toggleTheme(); return; }
      if (e.altKey && e.key === 'a') { e.preventDefault(); setAccessibilityOpen(v => !v); return; }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store, navigate, toggleTheme]);

  // Custom event bridge for shortcuts overlay
  useEffect(() => {
    const handler = () => setShortcutsOpen(true);
    window.addEventListener('axiom:shortcuts', handler);
    return () => window.removeEventListener('axiom:shortcuts', handler);
  }, []);

  // Custom event bridge for accessibility overlay
  useEffect(() => {
    const handler = () => setAccessibilityOpen(true);
    window.addEventListener('axiom:accessibility-settings', handler);
    return () => window.removeEventListener('axiom:accessibility-settings', handler);
  }, []);

  const handleCloseTab = (id: string) => {
    const tabs = store.openTabs;
    store.closeTab(id);
    if (id === activeTabId) {
      const remaining = tabs.filter(t => t.id !== id);
      if (remaining.length > 0) {
        const idx = tabs.findIndex(t => t.id === id);
        const next = remaining[Math.min(idx, remaining.length - 1)];
        navigate(next.path);
      } else {
        navigate('/home');
      }
    }
  };

  const handleNewTab = () => {
    const page = store.createPage();
    store.markRecent(page.id);
    store.openTab({ id: page.id, title: page.title, path: `/editor/${page.id}` });
    navigate(`/editor/${page.id}`);
  };

  const { options } = useAccessibility();
  const reduceMotion = options.reduceMotion;

  return (
    <MotionConfig transition={reduceMotion ? { duration: 0 } : undefined}>
      <div className="flex flex-col size-full overflow-hidden">
        {store.openTabs.length > 0 && (
          <DocumentTabs
            documents={store.openTabs.map(t => ({ id: t.id, title: t.title, content: '' }))}
            activeDocumentId={activeTabId}
            onSelectDocument={(id) => {
              const tab = store.openTabs.find(t => t.id === id);
              if (tab) navigate(tab.path);
            }}
            onCloseDocument={handleCloseTab}
            onNewDocument={handleNewTab}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <AccessibilitySettings open={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} />
      </div>
    </MotionConfig>
  );
}

export function Root() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AppStoreProvider>
          <RootInner />
        </AppStoreProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}
