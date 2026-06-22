import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface CreateNoteWindowProps {
  onSubmit: (title: string, content: string) => void;
}

export function CreateNoteWindow({ onSubmit }: CreateNoteWindowProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, content);
    setTitle('');
    setContent('');
  };

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-96 rounded-2xl shadow-2xl border backdrop-blur-xl ${
        theme === 'dark'
          ? 'bg-neutral-900/95 border-neutral-700'
          : 'bg-white/95 border-neutral-200'
      }`}
      style={{ zIndex: 39 }}
    >
      <div className="p-5 space-y-3">
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border outline-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
          autoFocus
        />
        <textarea
          placeholder="Note content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border outline-none resize-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
          rows={4}
        />
        <button
          onClick={handleSubmit}
          className={`w-full px-4 py-3 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Add Note
        </button>
      </div>
    </div>
  );
}
