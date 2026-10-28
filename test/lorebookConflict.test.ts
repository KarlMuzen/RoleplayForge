import { describe, it, expect } from 'vitest';
import { analyzeLorebookConflicts, mergeLorebookLayers, type LorebookLayer } from '../src/utils/lorebookConflict';

describe('Lorebook Conflict Analyzer', () => {
  it('detects keyword collisions across multiple layers', () => {
    const layer1: LorebookLayer = {
      id: 'l1',
      name: 'Card Lore',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [
          { keys: ['Excalibur', 'Sword'], content: 'Excalibur is a holy sword.', enabled: true, insertion_order: 10, extensions: {}, use_regex: false },
        ],
      },
    };

    const layer2: LorebookLayer = {
      id: 'l2',
      name: 'World Codex',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [
          { keys: ['Excalibur', 'King Arthur'], content: 'Excalibur rests in Camelot.', enabled: true, insertion_order: 20, extensions: {}, use_regex: false },
        ],
      },
    };

    const result = analyzeLorebookConflicts([layer1, layer2]);
    expect(result.collisions.length).toBeGreaterThan(0);
    expect(result.collisions[0].key).toBe('excalibur');
    expect(result.collisions[0].entries.length).toBe(2);
  });

  it('detects priority shadowing when weights differ', () => {
    const layer1: LorebookLayer = {
      id: 'l1',
      name: 'Card Lore',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [
          { keys: ['Eldoria'], content: '@@weight 100\nEldoria is a realm.', enabled: true, insertion_order: 10, extensions: {}, use_regex: false },
        ],
      },
    };

    const layer2: LorebookLayer = {
      id: 'l2',
      name: 'World Lore',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [
          { keys: ['Eldoria'], content: '@@weight 50\nEldoria description in world book.', enabled: true, insertion_order: 20, extensions: {}, use_regex: false },
        ],
      },
    };

    const result = analyzeLorebookConflicts([layer1, layer2]);
    expect(result.shadowedEntries.some((s) => s.reason === 'priority_shadowed')).toBe(true);
  });

  it('merges layers into a single lorebook cleanly', () => {
    const layer1: LorebookLayer = {
      id: 'l1',
      name: 'Layer A',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [{ keys: ['KeyA'], content: 'Content A', enabled: true, insertion_order: 10, extensions: {}, use_regex: false }],
      },
    };

    const layer2: LorebookLayer = {
      id: 'l2',
      name: 'Layer B',
      enabled: true,
      lorebook: {
        extensions: {},
        entries: [{ keys: ['KeyB'], content: 'Content B', enabled: true, insertion_order: 20, extensions: {}, use_regex: false }],
      },
    };

    const merged = mergeLorebookLayers([layer1, layer2], 'Test Combined');
    expect(merged.name).toBe('Test Combined');
    expect(merged.entries.length).toBe(2);
  });
});
