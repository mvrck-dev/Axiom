import { useState } from 'react';
import { X, Highlighter, Tag, StickyNote } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Highlight {
  id: string;
  text: string;
  color: string;
  notes: string;
  tags: string[];
  page: number;
}

interface ReferenceViewerProps {
  reference: {
    id: string;
    title: string;
    authors: string;
  };
  onClose: () => void;
}

export function ReferenceViewer({ reference, onClose }: ReferenceViewerProps) {
  const { theme } = useTheme();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 });
  const [highlightForm, setHighlightForm] = useState({
    color: '#fef08a',
    notes: '',
    tags: '',
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setHighlightMenuPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  const handleAddHighlight = () => {
    if (!selectedText) return;

    const highlight: Highlight = {
      id: Date.now().toString(),
      text: selectedText,
      color: highlightForm.color,
      notes: highlightForm.notes,
      tags: highlightForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      page: 1,
    };

    setHighlights([...highlights, highlight]);
    setShowHighlightMenu(false);
    setHighlightForm({ color: '#fef08a', notes: '', tags: '' });
    setSelectedText('');
  };

  const highlightColors = [
    { color: '#fef08a', label: 'Yellow' },
    { color: '#bfdbfe', label: 'Blue' },
    { color: '#bbf7d0', label: 'Green' },
    { color: '#fecaca', label: 'Red' },
    { color: '#e9d5ff', label: 'Purple' },
  ];

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`} style={{ zIndex: 60 }}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
      }`}>
        <div>
          <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
            {reference.title}
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {reference.authors}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'hover:bg-neutral-800 text-neutral-400'
              : 'hover:bg-neutral-100 text-neutral-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        <div
          className={`flex-1 overflow-y-auto px-12 py-8 border-r ${
            theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
          }`}
        >
          <div className="max-w-3xl">
            <h1 className={`text-2xl font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              Your Document
            </h1>
            <p className={`mb-4 ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Continue writing your document here while referencing the PDF on the right.
            </p>
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto px-8 py-8 relative">
          <div
            onMouseUp={handleTextSelection}
            className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-50'}`}
          >
            <h2 className={`text-xl font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              Reference PDF Preview
            </h2>
            <p className={`mb-4 leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
              This is a sample text from the PDF. In a real implementation, this would render the actual PDF content.
              Select any text to highlight it and add notes or tags.
            </p>
            <p className={`mb-4 leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
              The Transformer architecture revolutionized natural language processing by introducing the self-attention mechanism,
              which allows the model to weigh the importance of different words in a sequence when making predictions.
            </p>
            <p className={`leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Unlike recurrent neural networks, Transformers can process all tokens in parallel, making them significantly
              more efficient for training on large datasets.
            </p>
          </div>

          {showHighlightMenu && (
            <div
              className={`fixed z-50 p-4 rounded-xl shadow-2xl border ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700'
                  : 'bg-white border-neutral-200'
              }`}
              style={{
                left: `${Math.min(highlightMenuPosition.x, window.innerWidth - 350)}px`,
                top: `${highlightMenuPosition.y}px`,
                transform: 'translate(-50%, -100%)',
                width: '320px',
              }}
            >
              <div className="space-y-3">
                <div>
                  <label className={`text-xs mb-2 block ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Highlight Color
                  </label>
                  <div className="flex gap-2">
                    {highlightColors.map((hc) => (
                      <button
                        key={hc.color}
                        onClick={() => setHighlightForm({ ...highlightForm, color: hc.color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          highlightForm.color === hc.color ? 'border-neutral-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hc.color }}
                        title={hc.label}
                      />
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Add tags (comma separated)"
                  value={highlightForm.tags}
                  onChange={(e) => setHighlightForm({ ...highlightForm, tags: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    theme === 'dark'
                      ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                />

                <textarea
                  placeholder="Add notes..."
                  value={highlightForm.notes}
                  onChange={(e) => setHighlightForm({ ...highlightForm, notes: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none ${
                    theme === 'dark'
                      ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                  rows={2}
                />

                <button
                  onClick={handleAddHighlight}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Highlighter className="w-4 h-4" />
                  Add Highlight
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              Highlights ({highlights.length})
            </h3>
            <div className="space-y-2">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                  }`}
                >
                  <div
                    className="px-2 py-1 rounded mb-2 text-sm"
                    style={{ backgroundColor: highlight.color }}
                  >
                    "{highlight.text}"
                  </div>
                  {highlight.notes && (
                    <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {highlight.notes}
                    </p>
                  )}
                  {highlight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {highlight.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            theme === 'dark' ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
