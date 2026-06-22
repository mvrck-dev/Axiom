import { X, Plus, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Document {
  id: string;
  title: string;
  content: string;
}

interface DocumentTabsProps {
  documents: Document[];
  activeDocumentId: string;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  onNewDocument: () => void;
}

export function DocumentTabs({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onNewDocument,
}: DocumentTabsProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 border-b ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
              activeDocumentId === doc.id
                ? theme === 'dark'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-100 text-neutral-900'
                : theme === 'dark'
                ? 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            onClick={() => onSelectDocument(doc.id)}
          >
            {activeDocumentId === doc.id && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
            <span className="text-sm">{doc.title}</span>
            {documents.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseDocument(doc.id);
                }}
                className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                  activeDocumentId === doc.id ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={onNewDocument}
          className={`p-1.5 rounded-full transition-colors ${
            theme === 'dark'
              ? 'text-neutral-500 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            : 'hover:bg-neutral-100 text-neutral-600'
        }`}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
}
