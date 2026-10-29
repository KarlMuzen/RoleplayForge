import React from 'react';
import type { CharacterCardV3 } from '../../schemas/cardSchema';

export interface MetadataSectionProps {
  cardData: CharacterCardV3['data'];
  updateActiveCardData: (updater: (prev: CharacterCardV3) => CharacterCardV3) => void;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  cardData: d,
  updateActiveCardData,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-mist-100 border-b border-knight-700/40 pb-2">
        Card Info
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-knight-400 mb-1">Creator / Author</label>
          <input
            type="text"
            value={d.creator || ''}
            onChange={(e) =>
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, creator: e.target.value } }))
            }
            placeholder="e.g. StarweaverStudio"
            className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-knight-400 mb-1">Character Version</label>
          <input
            type="text"
            value={d.character_version || ''}
            onChange={(e) =>
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, character_version: e.target.value } }))
            }
            placeholder="e.g. 1.0.0"
            className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-knight-400 mb-1">Nickname</label>
          <input
            type="text"
            value={d.nickname || ''}
            onChange={(e) =>
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, nickname: e.target.value } }))
            }
            placeholder="e.g. Aeli"
            className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-knight-400 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={(d.tags || []).join(', ')}
          onChange={(e) => {
            const tagsArray = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
            updateActiveCardData((c) => ({ ...c, data: { ...c.data, tags: tagsArray } }));
          }}
          placeholder="fantasy, mage, protective, hero"
          className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
        />
      </div>
    </div>
  );
};
