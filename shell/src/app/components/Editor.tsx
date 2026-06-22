import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from './ThemeProvider';
import { FloatingToolbar } from './FloatingToolbar';
import { RadialContextMenu } from './RadialContextMenu';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { MotionValue } from 'motion/react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { engineService } from '../services/engineService';

export type ViewMode = 'write' | 'read' | 'focus' | 'two-page' | 'dual-code' | 'dual-blocks';

interface EditorProps {
  documentId: string;
  content: string;
  onContentChange: (content: string) => void;
  onFormat: (command: string, value?: string) => void;
  editorRef?: React.RefObject<HTMLDivElement>;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  zoomMotionValue?: MotionValue<number>;
  viewMode?: ViewMode;
  label?: string;
  onLabelChange?: (label: string) => void;
  pageNumber?: number;
}

export function Editor({
  documentId,
  content,
  onContentChange,
  onFormat: parentOnFormat,
  editorRef: externalEditorRef,
  scrollContainerRef: externalScrollRef,
  zoomMotionValue,
  viewMode = 'write',
  label = '',
  onLabelChange,
  pageNumber = 1,
}: EditorProps) {
  const { theme } = useTheme();
  const internalEditorRef = useRef<HTMLDivElement>(null);
  const editorRef = externalEditorRef ?? internalEditorRef;

  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalScrollRef ?? internalScrollRef;
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Direct DOM zoom update — bypasses React re-renders for smooth spring animation
  useEffect(() => {
    if (!zoomMotionValue) return;
    const apply = (v: number) => {
      if (zoomWrapperRef.current) zoomWrapperRef.current.style.zoom = `${v}%`;
    };
    apply(zoomMotionValue.get());
    return zoomMotionValue.on('change', apply);
  }, [zoomMotionValue]);

  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [labelFocused, setLabelFocused] = useState(false);

  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      const html = engineService.toHTML(documentId);
      if (el.innerHTML !== html) {
        el.innerHTML = html;
      }
    }
  }, [documentId, content, viewMode]);

  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [content, viewMode]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Round-trip through WASM: parse the DOM HTML, then export clean LaTeX body
      engineService.parseHTML(documentId, html);
      const latex = engineService.toLaTeXBody(documentId);
      onContentChange(latex);
    }
  }, [editorRef, documentId, onContentChange]);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (sel.toString().trim().length > 0) {
        savedRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        setToolbarPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  useEffect(() => {
    if (!showContextMenu) return;
    const close = () => setShowContextMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showContextMenu]);

  const formatText = (command: string, value?: string) => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // WASM round-trip: capture formatted HTML, parse, export LaTeX
      const html = editorRef.current.innerHTML;
      engineService.parseHTML(documentId, html);
      const latex = engineService.toLaTeXBody(documentId);
      onContentChange(latex);
    }
    parentOnFormat(command, value);
  };

  const handleInsertMacro = (macro: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    
    if (macro === '\\textbf{}') {
      document.execCommand('bold', false);
    } else if (macro === '\\textit{}') {
      document.execCommand('italic', false);
    } else if (macro === '\\underline{}') {
      document.execCommand('underline', false);
    } else if (macro === '\\sout{}') {
      document.execCommand('strikeThrough', false);
    } else {
      let html = '';
      if (macro === '\\section{}') html = '<h1>Heading</h1>';
      else if (macro === '\\subsection{}') html = '<h2>Subheading</h2>';
      else if (macro === '\\subsubsection{}') html = '<h3>Subsubsection</h3>';
      else if (macro === "\\begin{itemize}\n  \\item \n\\end{itemize}") html = '<ul><li>Item</li></ul>';
      else if (macro === "\\begin{enumerate}\n  \\item \n\\end{enumerate}") html = '<ol><li>Item</li></ol>';
      else if (macro === "\\begin{quote}\n\n\\end{quote}") html = '<blockquote>Quote</blockquote>';
      else if (macro === '$ $') html = '$Equation$';
      else if (macro === '$$ $$') html = '<div class="math-block">$$Equation$$</div>';
      
      if (html) {
        const el = document.createElement('div');
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
    handleInput();
  };

  const insertMacroAtCaret = (macro: string) => {
    if (viewMode === 'dual-code') {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newContent = before + macro + after;
        onContentChange(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + macro.length;
        }, 0);
      }
    } else {
      handleInsertMacro(macro);
    }
  };

  if (viewMode === 'dual-code') {
    return (
      <DualCodeView
        documentId={documentId}
        content={content}
        onContentChange={onContentChange}
        theme={theme}
        onContextMenu={handleContextMenu}
      />
    );
  }

  if (viewMode === 'dual-blocks') {
    return (
      <DualBlocksView
        documentId={documentId}
        content={content}
        onContentChange={onContentChange}
        editorRef={editorRef}
        theme={theme}
        formatText={formatText}
        handleSelection={handleSelection}
        handleContextMenu={handleContextMenu}
        showToolbar={showToolbar}
        toolbarPosition={toolbarPosition}
        setShowToolbar={setShowToolbar}
        showContextMenu={showContextMenu}
        setShowContextMenu={setShowContextMenu}
        contextMenuPosition={contextMenuPosition}
      />
    );
  }

  const isReadOnly = viewMode === 'read';
  const pageBg  = theme === 'dark' ? '#1E1E1C' : '#FFFFFF';
  const editorBg = theme === 'dark' ? '#0e0e0c' : '#d4d2cf';
  const subtle  = theme === 'dark' ? 'rgba(238,236,234,0.22)' : 'rgba(26,26,24,0.22)';
  const headerTextColor = theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const MARGIN = 96; // must match padding below

  return (
    <div
      ref={scrollContainerRef}
      id="axiom-scroll-container"
      className="overflow-y-auto h-full"
      style={{ background: editorBg }}
    >
      <div className="py-14 flex flex-col items-center">
        <div ref={zoomWrapperRef}>
          {viewMode === 'two-page' ? (
            /* Two Page Layout */
            <div style={{ width: 1696, minHeight: 1056, position: 'relative' }}>
              {/* Background sheets */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 64, pointerEvents: 'none' }}>
                <div style={{ width: 816, minHeight: 1056, background: pageBg, boxShadow: '0 2px 24px rgba(0,0,0,0.13)' }} />
                <div style={{ width: 816, minHeight: 1056, background: pageBg, boxShadow: '0 2px 24px rgba(0,0,0,0.13)' }} />
              </div>

              {/* Page 1 Header (floated above page) */}
              <div style={{
                position: 'absolute',
                top: -22,
                left: 0,
                width: 816,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: isReadOnly ? 'none' : 'auto',
                zIndex: 2,
              }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    value={label}
                    onChange={e => onLabelChange?.(e.target.value.slice(0, 32))}
                    onFocus={() => setLabelFocused(true)}
                    onBlur={() => setLabelFocused(false)}
                    onMouseDown={e => e.stopPropagation()}
                    placeholder="Label"
                    readOnly={isReadOnly}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: headerTextColor,
                      fontFamily: 'inherit',
                      width: labelFocused ? 140 : label ? Math.max(40, label.length * 7) : 60,
                      transition: 'width 0.2s, opacity 0.15s',
                      opacity: labelFocused ? 0.9 : 1,
                      cursor: isReadOnly ? 'default' : 'text',
                    }}
                  />
                  {labelFocused && (
                    <span style={{ fontSize: 9, color: headerTextColor, opacity: 0.55, letterSpacing: '0.02em', userSelect: 'none' }}>
                      {label.length}/32
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, letterSpacing: '0.06em', color: headerTextColor, userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
                  {pageNumber}
                </span>
              </div>

              {/* Page 2 Header (floated above page) */}
              <div style={{
                position: 'absolute',
                top: -22,
                left: 816 + 64,
                width: 816,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: isReadOnly ? 'none' : 'auto',
                zIndex: 2,
              }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    value={label}
                    onChange={e => onLabelChange?.(e.target.value.slice(0, 32))}
                    onFocus={() => setLabelFocused(true)}
                    onBlur={() => setLabelFocused(false)}
                    onMouseDown={e => e.stopPropagation()}
                    placeholder="Label"
                    readOnly={isReadOnly}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: headerTextColor,
                      fontFamily: 'inherit',
                      width: labelFocused ? 140 : label ? Math.max(40, label.length * 7) : 60,
                      transition: 'width 0.2s, opacity 0.15s',
                      opacity: labelFocused ? 0.9 : 1,
                      cursor: isReadOnly ? 'default' : 'text',
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, letterSpacing: '0.06em', color: headerTextColor, userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
                  {pageNumber + 1}
                </span>
              </div>

              {/* Content */}
              <div
                ref={editorRef}
                id="axiom-editor-area"
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onMouseUp={isReadOnly ? undefined : handleSelection}
                onKeyUp={isReadOnly ? undefined : handleSelection}
                onContextMenu={isReadOnly ? undefined : handleContextMenu}
                className={`outline-none ${theme === 'dark' ? 'prose-invert' : ''}`}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: 1696,
                  minHeight: 1056,
                  columnCount: 2,
                  columnGap: 64 + MARGIN * 2,
                  padding: '96px 96px',
                  lineHeight: 1.75,
                  fontSize: 16,
                  color: theme === 'dark' ? '#EEECEA' : '#1A1A18',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ) : (
            /* Single Page Layout */
            <div style={{ width: 816, minHeight: 1056, background: pageBg, boxShadow: '0 2px 24px rgba(0,0,0,0.13)', position: 'relative' }}>
              {/* ── Page header: label left, number right (floated above page) ── */}
              <div style={{
                position: 'absolute',
                top: -22,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: isReadOnly ? 'none' : 'auto',
              }}>
                {/* Label */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    value={label}
                    onChange={e => onLabelChange?.(e.target.value.slice(0, 32))}
                    onFocus={() => setLabelFocused(true)}
                    onBlur={() => setLabelFocused(false)}
                    onMouseDown={e => e.stopPropagation()}
                    placeholder="Label"
                    readOnly={isReadOnly}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: headerTextColor,
                      fontFamily: 'inherit',
                      width: labelFocused ? 140 : label ? Math.max(40, label.length * 7) : 60,
                      transition: 'width 0.2s, opacity 0.15s',
                      opacity: labelFocused ? 0.9 : 1,
                      cursor: isReadOnly ? 'default' : 'text',
                    }}
                  />
                  {labelFocused && (
                    <span style={{
                      fontSize: 9,
                      color: headerTextColor,
                      opacity: 0.55,
                      letterSpacing: '0.02em',
                      userSelect: 'none',
                    }}>
                      {label.length}/32
                    </span>
                  )}
                </div>

                {/* Page number */}
                <span style={{
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: headerTextColor,
                  userSelect: 'none',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pageNumber}
                </span>
              </div>

              {/* Content */}
              <div
                ref={editorRef}
                id="axiom-editor-area"
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onMouseUp={isReadOnly ? undefined : handleSelection}
                onKeyUp={isReadOnly ? undefined : handleSelection}
                onContextMenu={isReadOnly ? undefined : handleContextMenu}
                className={`w-full outline-none ${theme === 'dark' ? 'prose-invert' : ''}`}
                style={{
                  padding: '96px 96px',
                  minHeight: 1056,
                  lineHeight: 1.75,
                  fontSize: 16,
                  color: theme === 'dark' ? '#EEECEA' : '#1A1A18',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}
          {/* Bottom margin */}
          <div style={{ height: 80 }} />
        </div>
      </div>

      {!isReadOnly && showToolbar && (
        <FloatingToolbar
          position={toolbarPosition}
          onFormat={formatText}
          onClose={() => setShowToolbar(false)}
        />
      )}
      <AnimatePresence>
        {!isReadOnly && showContextMenu && (
          <RadialContextMenu
            position={contextMenuPosition}
            onClose={() => setShowContextMenu(false)}
            onInsertMacro={insertMacroAtCaret}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DualCodeView({
  documentId,
  content,
  onContentChange,
  theme,
  onContextMenu,
}: {
  documentId: string;
  content: string;
  onContentChange: (v: string) => void;
  theme: string;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const pageBg = theme === 'dark' ? '#1E1E1C' : '#FFFFFF';
  const editorBg = theme === 'dark' ? '#0e0e0c' : '#d4d2cf';
  const previewRef = useRef<HTMLDivElement>(null);

  // Content IS LaTeX now — pass directly to the textarea
  const compiledHtml = engineService.toHTML(documentId);

  useEffect(() => {
    if (previewRef.current) {
      renderMathInElement(previewRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [compiledHtml]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newLatex = e.target.value;
    onContentChange(newLatex);
  };

  return (
    <div className="flex h-full">
      {/* Left: LaTeX source — editable, shows REAL LaTeX */}
      <div className="w-1/2 flex flex-col border-r border-border overflow-hidden">
        <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border shrink-0 bg-background">
          LaTeX Source
        </div>
        <textarea
          className="flex-1 p-5 font-mono text-[12px] bg-background text-foreground outline-none resize-none leading-relaxed"
          value={content}
          onChange={handleCodeChange}
          spellCheck={false}
          onContextMenu={onContextMenu}
        />
      </div>

      {/* Right: compiled HTML preview */}
      <div className="w-1/2 overflow-y-auto" style={{ background: editorBg }}>
        <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border shrink-0 bg-background">
          Preview
        </div>
        <div className="py-10 flex justify-center">
          <div
            ref={previewRef}
            id="axiom-editor-area"
            style={{
              width: 560,
              minHeight: 720,
              background: pageBg,
              boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
              padding: '64px 64px',
              lineHeight: 1.75,
              fontSize: 14,
              color: theme === 'dark' ? '#EEECEA' : '#1A1A18',
            }}
            dangerouslySetInnerHTML={{ __html: compiledHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Dual Blocks View ──────────────────────────────────────────────────────────

function DualBlocksView({
  documentId,
  content,
  onContentChange,
  editorRef,
  theme,
  formatText,
  handleSelection,
  handleContextMenu,
  showToolbar,
  toolbarPosition,
  setShowToolbar,
  showContextMenu,
  setShowContextMenu,
  contextMenuPosition,
}: {
  documentId: string;
  content: string;
  onContentChange: (v: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  theme: string;
  formatText: (cmd: string, val?: string) => void;
  handleSelection: () => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  showToolbar: boolean;
  toolbarPosition: { x: number; y: number };
  setShowToolbar: (v: boolean) => void;
  showContextMenu: boolean;
  setShowContextMenu: (v: boolean) => void;
  contextMenuPosition: { x: number; y: number };
}) {
  const pageBg = theme === 'dark' ? '#1E1E1C' : '#FFFFFF';
  const editorBg = theme === 'dark' ? '#0e0e0c' : '#d4d2cf';
  const previewRef = useRef<HTMLDivElement>(null);

  const compiledHtml = engineService.toHTML(documentId);

  // Sync initial editor HTML
  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      if (el.innerHTML !== compiledHtml) {
        el.innerHTML = compiledHtml;
      }
    }
  }, [documentId]);

  // Typeset math in editor column
  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [content]);

  // Typeset math in preview column
  useEffect(() => {
    if (previewRef.current) {
      renderMathInElement(previewRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [compiledHtml]);

  return (
    <div className="flex h-full relative">
      {/* Left: editable blocks */}
      <div className="w-1/2 flex flex-col border-r border-border overflow-hidden">
        <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border shrink-0 bg-background">
          Editor
        </div>
        <div className="flex-1 overflow-y-auto" id="axiom-scroll-container" style={{ background: editorBg }}>
          <div className="py-10 flex justify-center">
            <div
              ref={editorRef}
              id="axiom-editor-area"
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                if (editorRef.current) {
                  const html = editorRef.current.innerHTML;
                  engineService.parseHTML(documentId, html);
                  const latex = engineService.toLaTeXBody(documentId);
                  onContentChange(latex);
                }
              }}
              onMouseUp={handleSelection}
              onKeyUp={handleSelection}
              onContextMenu={handleContextMenu}
              style={{
                width: 480,
                minHeight: 640,
                background: pageBg,
                boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
                padding: '48px 56px',
                lineHeight: 1.75,
                fontSize: 14,
                outline: 'none',
                color: theme === 'dark' ? '#EEECEA' : '#1A1A18',
              }}
            />
          </div>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="w-1/2 overflow-y-auto" style={{ background: editorBg }}>
        <div className="py-10 flex justify-center">
          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground absolute top-0 right-0 left-1/2">
          </div>
          <div
            ref={previewRef}
            style={{
              width: 480,
              minHeight: 640,
              background: pageBg,
              boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
              padding: '48px 56px',
              lineHeight: 1.75,
              fontSize: 14,
              color: theme === 'dark' ? '#EEECEA' : '#1A1A18',
            }}
            dangerouslySetInnerHTML={{ __html: compiledHtml }}
          />
        </div>
      </div>

      {showToolbar && (
        <FloatingToolbar
          position={toolbarPosition}
          onFormat={formatText}
          onClose={() => setShowToolbar(false)}
        />
      )}
      <AnimatePresence>
        {showContextMenu && (
          <RadialContextMenu
            position={contextMenuPosition}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
