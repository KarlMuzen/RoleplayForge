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
  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none py-0.5">
        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1 bg-void-900 border border-knight-800 rounded-full p-1 text-xs shrink-0">
          <button
            data-testid="filter-rating-all"
            onClick={() => setSelectedRatingFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              selectedRatingFilter === 'all'
                ? 'bg-knight-700 text-mist-100'
                : 'text-knight-400 hover:text-mist-200'
            }`}
          >
            All Ratings
          </button>
          <button
            data-testid="filter-rating-sfw"
            onClick={() => setSelectedRatingFilter('sfw')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              selectedRatingFilter === 'sfw'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : 'text-knight-400 hover:text-mist-200'
            }`}
          >
            SFW
          </button>
          <button
            data-testid="filter-rating-nsfw"
            onClick={() => setSelectedRatingFilter('nsfw')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              selectedRatingFilter === 'nsfw'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                : 'text-knight-400 hover:text-mist-200'
            }`}
          >
            NSFW
          </button>
          <button
            data-testid="filter-rating-unrated"
            onClick={() => setSelectedRatingFilter('unrated')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              selectedRatingFilter === 'unrated'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                : 'text-knight-400 hover:text-mist-200'
            }`}
          >
            Unrated
          </button>
        </div>

        <div className="w-px h-4 bg-knight-800 mx-1 shrink-0" />

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Tag className="w-3.5 h-3.5 text-knight-500 shrink-0" />
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 touch-fast ${
                selectedTag === null
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'bg-void-900 border border-mist-100/5 text-knight-400 hover:text-mist-100'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 touch-fast ${
                  selectedTag === tag
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'bg-void-900 border border-mist-100/5 text-knight-400 hover:text-mist-100'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Visual scroll fade affordance on right edge for narrow screens */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-8 bg-gradient-to-l from-void-950 to-transparent sm:hidden" />
    </div>
  );
};
