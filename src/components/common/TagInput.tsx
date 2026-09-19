import React, { useState, useEffect, useRef } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import { tagService } from '../../services/tagService';
import { TagWithUsageCount } from '../../types/tag';

interface TagInputProps {
  projectId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  projectId,
  tags,
  onChange,
  placeholder = 'Add tag (press Enter)...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<TagWithUsageCount[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      tagService.getTags(projectId).then(setAvailableTags).catch(console.error);
    }
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanTag = (raw: string) =>
    raw.trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-');

  const addTag = (raw: string) => {
    const cleaned = cleanTag(raw);
    if (!cleaned) return;
    if (!tags.map((t) => t.toLowerCase()).includes(cleaned)) {
      onChange([...tags, cleaned]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = availableTags.filter((t) => {
    const notSelected = !tags.map((x) => x.toLowerCase()).includes(t.name.toLowerCase());
    const matchesInput = !inputValue || t.name.toLowerCase().includes(inputValue.toLowerCase());
    return notSelected && matchesInput;
  });

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-[var(--paper-border)] bg-[var(--paper-bg)] min-h-[38px] focus-within:border-[var(--amber-accent)] transition-colors">
        <TagIcon className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0 ml-1" />

        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[var(--amber-soft)] border border-[var(--amber-soft-border)] text-[var(--amber-accent)] text-xs font-mono font-medium"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-[var(--ink-primary)] placeholder-[var(--ink-muted)] focus:outline-hidden"
        />
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-xl shadow-lg max-h-48 overflow-y-auto py-1 text-xs">
          <div className="px-3 py-1 text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
            Project Tags
          </div>
          {filteredSuggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => addTag(s.name)}
              className="w-full text-left px-3 py-1.5 hover:bg-[var(--paper-desk)] flex items-center justify-between transition-colors"
            >
              <span className="font-mono text-[var(--ink-primary)]">#{s.name}</span>
              <span className="text-[10px] text-[var(--ink-muted)]">
                {s.usage_count} uses
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
