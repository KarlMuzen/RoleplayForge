import React from 'react';
import { Tag } from 'lucide-react';

export interface GalleryFilterBarProps {
  allTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  selectedRatingFilter: 'all' | 'sfw' | 'nsfw' | 'unrated';
  setSelectedRatingFilter: (rating: 'all' | 'sfw' | 'nsfw' | 'unrated') => void;
}

export const GalleryFilterBar: React.FC<GalleryFilterBarProps> = ({
  allTags,
  selectedTag,
  setSelectedTag,
  selectedRatingFilter,
  setSelectedRatingFilter,
}) => {
  const ratingOptions: { value: 'all' | 'sfw' | 'nsfw' | 'unrated'; label: string; selectedClass: string }[] = [
    { value: 'all', label: 'All Ratings', selectedClass: 'bg-knight-700 text-mist-100' },
    { value: 'sfw', label: 'SFW', selectedClass: 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' },
    { value: 'nsfw', label: 'NSFW', selectedClass: 'bg-rose-950 text-rose-300 border border-rose-800/80' },
    { value: 'unrated', label: 'Unrated', selectedClass: 'bg-amber-950 text-amber-300 border border-amber-800/80' },
  ];
  const targetClass = 'min-h-11 px-3 py-2 rounded-full text-xs font-semibold transition-colors shrink-0 touch-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon-400';

  return (
    <div className="w-full min-w-0 space-y-3">
      <div role="group" aria-label="Rating filter" className="flex flex-wrap items-center gap-1 bg-void-900 border border-knight-800 rounded-full p-1 w-fit max-w-full">
        {ratingOptions.map((option) => {
          const selected = selectedRatingFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`filter-rating-${option.value}`}
              aria-pressed={selected}
              onClick={() => setSelectedRatingFilter(option.value)}
              className={`${targetClass} ${selected ? option.selectedClass : 'text-knight-400 hover:text-mist-200'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-knight-400 shrink-0">
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            Tags
          </span>
          <div role="group" aria-label="Tag filter" tabIndex={0} className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              aria-pressed={selectedTag === null}
              onClick={() => setSelectedTag(null)}
              className={`${targetClass} ${selectedTag === null ? 'bg-zinc-200 text-zinc-900' : 'bg-void-900 border border-mist-100/5 text-knight-400 hover:text-mist-100'}`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                aria-pressed={selectedTag === tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`${targetClass} ${selectedTag === tag ? 'bg-zinc-200 text-zinc-900' : 'bg-void-900 border border-mist-100/5 text-knight-400 hover:text-mist-100'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
