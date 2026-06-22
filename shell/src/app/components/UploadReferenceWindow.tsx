import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface UploadReferenceWindowProps {
  onSubmit: (title: string, authors: string, description: string, type: 'pdf' | 'link', url?: string) => void;
}

export function UploadReferenceWindow({ onSubmit }: UploadReferenceWindowProps) {
  const { theme } = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [description, setDescription] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    // Handle file drop
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http')) {
        // Handle URL paste
        console.log('Pasted URL:', text);
      }
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, authors, description, 'pdf');
    setTitle('');
    setAuthors('');
    setDescription('');
  };

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-[28rem] rounded-2xl shadow-2xl border backdrop-blur-xl ${
        theme === 'dark'
          ? 'bg-neutral-900/95 border-neutral-700'
          : 'bg-white/95 border-neutral-200'
      }`}
      style={{ zIndex: 39 }}
    >
      <div className="p-5 space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsHovering(true);
          }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={handleDrop}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
            isHovering
              ? theme === 'dark'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-blue-500 bg-blue-500/5'
              : theme === 'dark'
              ? 'border-neutral-700 hover:border-neutral-600'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
          onClick={handlePaste}
        >
          <div className="flex flex-col items-center gap-3">
            <Upload className={`w-8 h-8 ${
              isHovering
                ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                : theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
            }`} />
            <div className="text-center">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                {isHovering ? 'or paste URL from clipboard' : 'Drag it here!'}
              </p>
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'
              }`}>
                PDF or URL
              </p>
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
        />

        <input
          type="text"
          placeholder="Authors"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border outline-none resize-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
          rows={3}
        />

        <button
          onClick={handleSubmit}
          className={`w-full px-4 py-3 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Add Reference
        </button>
      </div>
    </div>
  );
}
