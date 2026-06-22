import { useState } from 'react';
import { X, Plus, Upload, Link as LinkIcon, FileText, Tag, Highlighter } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Reference {
  id: string;
  type: 'pdf' | 'link';
  title: string;
  authors: string;
  description: string;
  notes: string;
  tags: string[];
  highlightCount: number;
  url?: string;
  pdfData?: string;
}

interface ReferencesPanelProps {
  onClose: () => void;
  onOpenReference: (reference: Reference) => void;
}

export function ReferencesPanel({ onClose, onOpenReference }: ReferencesPanelProps) {
  const { theme } = useTheme();
  const [references, setReferences] = useState<Reference[]>([
    {
      id: '1',
      type: 'pdf',
      title: 'Attention Is All You Need',
      authors: 'Vaswani et al.',
      description: 'Introduces the Transformer architecture for neural networks',
      notes: '',
      tags: ['machine learning', 'nlp'],
      highlightCount: 3,
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReference, setNewReference] = useState({
    title: '',
    authors: '',
    description: '',
    url: '',
    type: 'link' as 'pdf' | 'link',
  });

  const handleAddReference = () => {
    if (!newReference.title.trim()) return;

    const ref: Reference = {
      id: Date.now().toString(),
      type: newReference.type,
      title: newReference.title,
      authors: newReference.authors,
      description: newReference.description,
      notes: '',
      tags: [],
      highlightCount: 0,
      url: newReference.url,
    };

    setReferences([ref, ...references]);
    setNewReference({ title: '', authors: '', description: '', url: '', type: 'link' });
    setShowAddForm(false);
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-[32rem] shadow-2xl border-l flex flex-col ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-white border-neutral-200'
      }`}
      style={{ zIndex: 50 }}
    >
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
      }`}>
        <h2 className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
          References
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-neutral-800 text-neutral-400'
                : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
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
      </div>

      {showAddForm && (
        <div className={`px-6 py-4 border-b space-y-3 ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <div className="flex gap-2">
            <button
              onClick={() => setNewReference({ ...newReference, type: 'link' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                newReference.type === 'link'
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-neutral-800 text-neutral-400'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Link
            </button>
            <button
              onClick={() => setNewReference({ ...newReference, type: 'pdf' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                newReference.type === 'pdf'
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-neutral-800 text-neutral-400'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              <Upload className="w-4 h-4" />
              PDF
            </button>
          </div>

          <input
            type="text"
            placeholder="Title"
            value={newReference.title}
            onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
            }`}
          />

          <input
            type="text"
            placeholder="Authors"
            value={newReference.authors}
            onChange={(e) => setNewReference({ ...newReference, authors: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
            }`}
          />

          <textarea
            placeholder="Description"
            value={newReference.description}
            onChange={(e) => setNewReference({ ...newReference, description: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border outline-none resize-none ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
            }`}
            rows={2}
          />

          {newReference.type === 'link' && (
            <input
              type="url"
              placeholder="URL"
              value={newReference.url}
              onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border outline-none ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          )}

          <button
            onClick={handleAddReference}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Add Reference
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {references.map((ref) => (
          <div
            key={ref.id}
            onClick={() => onOpenReference(ref)}
            className={`p-5 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="flex-1">
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                  {ref.title}
                </h3>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {ref.authors}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  {ref.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}">
              <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <Tag className="w-3.5 h-3.5" />
                {ref.tags.length} tags
              </div>
              <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <Highlighter className="w-3.5 h-3.5" />
                {ref.highlightCount} highlights
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
