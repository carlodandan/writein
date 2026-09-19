import { useState } from 'react';
import { X, Plus, BookOpen, Trash2, Target, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject: () => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  onOpenNewProject,
}) => {
  const { projects, currentProject, selectProject, deleteProject } = useProject();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (id: string) => {
    await selectProject(id);
    onClose();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectToDelete === id) {
      await deleteProject(id);
      setProjectToDelete(null);
    } else {
      setProjectToDelete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--paper-border)] flex items-center justify-between bg-[var(--paper-desk)]">
          <div>
            <h2 className="font-serif-novel text-lg font-semibold text-[var(--ink-primary)]">
              Your Writing Projects
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              All stories and novels stored locally on your machine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-desk-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {projects.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
              <p className="text-sm text-[var(--ink-muted)]">No writing projects yet.</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewProject();
                }}
                className="px-4 py-2 text-sm font-medium bg-[var(--amber-accent)] text-white rounded-lg hover:bg-[var(--amber-accent-hover)] transition-colors"
              >
                Create First Novel
              </button>
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = currentProject?.id === proj.id;
              const isDeleting = projectToDelete === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelect(proj.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isCurrent
                      ? 'border-[var(--amber-accent)] bg-[var(--amber-soft)]/20 shadow-xs'
                      : 'border-[var(--paper-border)] bg-[var(--paper-surface)] hover:border-[var(--amber-accent)]/50 hover:bg-[var(--paper-desk)]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-serif-novel text-base font-semibold text-[var(--ink-primary)]">
                        {proj.title}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)] flex items-center space-x-1">
                          <Check className="w-3 h-3 inline" />
                          <span>Active</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-[var(--paper-desk)] border border-[var(--paper-border)] text-[var(--ink-muted)]">
                        {proj.status}
                      </span>
                    </div>

                    {proj.subtitle && (
                      <p className="text-xs text-[var(--ink-secondary)] italic">
                        {proj.subtitle}
                      </p>
                    )}

                    {proj.description && (
                      <p className="text-xs text-[var(--ink-muted)] line-clamp-1">
                        {proj.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-[var(--ink-muted)] pt-1 font-mono">
                      <span className="flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5 text-[var(--amber-accent)]" />
                        <span>
                          {proj.current_word_count.toLocaleString()} / {proj.target_word_count.toLocaleString()} words
                        </span>
                      </span>

                      {proj.genre && (
                        <span>• {proj.genre}</span>
                      )}

                      {proj.author && (
                        <span>• By {proj.author}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        isDeleting
                          ? 'bg-red-600 text-white font-medium px-3'
                          : 'text-[var(--ink-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      }`}
                      title={isDeleting ? 'Click again to confirm deletion' : 'Delete project'}
                    >
                      {isDeleting ? (
                        <span>Confirm Delete?</span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--paper-border)] bg-[var(--paper-desk)] flex items-center justify-between text-xs">
          <span className="text-[var(--ink-muted)]">
            Total Projects: {projects.length}
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenNewProject();
            }}
            className="px-4 py-2 rounded-lg font-medium bg-[var(--amber-accent)] hover:bg-[var(--amber-accent-hover)] text-white transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
