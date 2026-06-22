import { useState } from 'react';
import { X, Plus, Circle, CheckCircle2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Note {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  createdAt: Date;
}

interface NotesPanelProps {
  onClose: () => void;
}

export function NotesPanel({ onClose }: NotesPanelProps) {
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Research Todo',
      content: 'Review latest papers on quantum computing',
      completed: false,
      createdAt: new Date(),
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      completed: false,
      createdAt: new Date(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const toggleComplete = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, completed: !note.completed } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-96 shadow-2xl border-l flex flex-col ${
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
          Notes & Reminders
        </h2>
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

      <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <input
          type="text"
          placeholder="Note title..."
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border outline-none mb-2 ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
        />
        <textarea
          placeholder="Note content..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border outline-none resize-none mb-2 ${
            theme === 'dark'
              ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500'
              : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
          }`}
          rows={3}
        />
        <button
          onClick={handleAddNote}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded-xl border transition-all ${
              note.completed
                ? theme === 'dark'
                  ? 'bg-neutral-800/50 border-neutral-700 opacity-60'
                  : 'bg-neutral-100/50 border-neutral-300 opacity-60'
                : theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleComplete(note.id)}
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
                onClick={() => deleteNote(note.id)}
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
