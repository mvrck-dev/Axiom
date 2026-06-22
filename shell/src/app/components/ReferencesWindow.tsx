import { FileText, Tag, Highlighter } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Reference {
  id: string;
  type: 'pdf' | 'link';
  title: string;
  authors: string;
  description: string;
  tags: string[];
  highlightCount: number;
}

interface ReferencesWindowProps {
  references: Reference[];
  onOpenReference: (reference: Reference) => void;
}

export function ReferencesWindow({ references, onOpenReference }: ReferencesWindowProps) {
  const { theme } = useTheme();

  if (references.length === 0) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-[32rem] max-h-[36rem] overflow-y-auto rounded-2xl shadow-2xl border backdrop-blur-xl ${
        theme === 'dark'
          ? 'bg-neutral-900/95 border-neutral-700'
          : 'bg-white/95 border-neutral-200'
      }`}
      style={{ zIndex: 39 }}
    >
      <div className="p-4 space-y-3">
        {references.map((ref) => (
          <div
            key={ref.id}
            onClick={() => onOpenReference(ref)}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <FileText className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="flex-1">
                <h3 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                  {ref.title}
                </h3>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {ref.authors}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  {ref.description}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${theme === 'dark' ? 'border-neutral-700' : 'border-neutral-200'}`}>
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
