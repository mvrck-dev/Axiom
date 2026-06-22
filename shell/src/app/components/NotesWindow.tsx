import { useState } from 'react';
import { Circle, CheckCircle2, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Note {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

interface NotesWindowProps {
  notes: Note[];
  onToggleComplete: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesWindow({ notes, onToggleComplete, onDeleteNote }: NotesWindowProps) {
  const { theme } = useTheme();

  if (notes.length === 0) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-96 max-h-[32rem] overflow-y-auto rounded-2xl shadow-2xl border backdrop-blur-xl ${
        theme === 'dark'
          ? 'bg-neutral-900/95 border-neutral-700'
          : 'bg-white/95 border-neutral-200'
      }`}
      style={{ zIndex: 39 }}
    >
      <div className="p-4 space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded-xl border transition-all ${
              note.completed
                ? theme === 'dark'
                  ? 'bg-neutral-800/50 border-neutral-700 opacity-60'
                  : 'bg-neutral-50/50 border-neutral-300 opacity-60'
                : theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleComplete(note.id)}
                className="mt-0.5 transition-colors"
              >
                {note.completed ? (
                  <CheckCircle2 className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <Circle className={`w-5 h-5 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`} />
                )}
              </button>

              <div className="flex-1">
                <h3 className={`font-medium mb-1 ${
                  note.completed ? 'line-through' : ''
                } ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                  {note.title}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                  {note.content}
                </p>
              </div>

              <button
                onClick={() => onDeleteNote(note.id)}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-neutral-700 text-neutral-500'
                    : 'hover:bg-neutral-200 text-neutral-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
