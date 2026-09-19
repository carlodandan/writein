import { useState } from 'react';
import { X, Book } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRE_PRESETS = [
  'Literary Fiction',
  'Fantasy',
  'Science Fiction',
  'Mystery / Crime',
  'Thriller / Suspense',
  'Historical Fiction',
  'Romance',
  'Horror',
  'Young Adult',
  'Memoir / Creative Nonfiction',
  'Other',
];

const TARGET_PRESETS = [
  { label: 'Novella (20,000)', words: 20000 },
  { label: 'Standard Novel (50,000)', words: 50000 },
  { label: 'Full Novel (80,000)', words: 80000 },
  { label: 'Epic Novel (100,000)', words: 100000 },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createProject } = useProject();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Literary Fiction');
  const [targetWords, setTargetWords] = useState(50000);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a project title.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await createProject({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        author: author.trim() || null,
        genre: genre || null,
        target_word_count: targetWords,
        description: description.trim() || null,
      });
      onClose();
      // Reset form
      setTitle('');
      setSubtitle('');
      setAuthor('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--paper-border)] flex items-center justify-between bg-[var(--paper-desk)]">
          <div className="flex items-center space-x-2 text-[var(--ink-primary)]">
            <Book className="w-5 h-5 text-[var(--amber-accent)]" />
            <h2 className="font-serif-novel text-lg font-semibold">New Novel Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Summer"
              className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Tale of Two Cities"
                className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)]"
              >
                {GENRE_PRESETS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Target Word Count
              </label>
              <input
                type="number"
                min={1000}
                step={5000}
                value={targetWords}
                onChange={(e) => setTargetWords(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)] font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {TARGET_PRESETS.map((p) => (
                  <button
                    key={p.words}
                    type="button"
                    onClick={() => setTargetWords(p.words)}
                    className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                      targetWords === p.words
                        ? 'bg-[var(--amber-soft)] border-[var(--amber-soft-border)] text-[var(--amber-accent)] font-semibold'
                        : 'bg-[var(--paper-desk)] border-[var(--paper-border)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
              Logline / Story Premise
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your novel about? Introduce the protagonist, central conflict, and world..."
              className="w-full px-3 py-2 bg-[var(--paper-bg)] border border-[var(--paper-border)] rounded-lg text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--amber-accent)] resize-none text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--paper-border)] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[var(--ink-secondary)] hover:bg-[var(--paper-desk)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
