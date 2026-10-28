import { create } from 'zustand';
import { db, type ConnectionProfile } from '../db';
import { calculateModelCost } from '../constants/models';

export interface ProfileTokenStats {
  profileUuid: string;
  profileName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface TokenTrackerState {
  stats: Record<string, ProfileTokenStats>;
  loaded: boolean;
  loadStats: () => Promise<void>;
  recordUsage: (
    profileUuid: string,
    profileName: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ) => Promise<void>;
  resetStats: () => Promise<void>;
  getTotalEstimatedCost: (profiles?: ConnectionProfile[]) => number;
  getTotalTokens: () => number;
}

export const SETTINGS_COST_TRACKER_KEY = 'cost_tracker_usage';

export const useTokenTracker = create<TokenTrackerState>((set, get) => ({
  stats: {},
  loaded: false,

  loadStats: async () => {
    try {
      const record = await db.settings.get(SETTINGS_COST_TRACKER_KEY);
      if (record && record.value && typeof record.value === 'object') {
        set({ stats: record.value, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (err) {
      console.error('Failed to load token usage stats:', err);
      set({ loaded: true });
    }
  },

  recordUsage: async (profileUuid, profileName, model, promptTokens, completionTokens) => {
    // Make sure stats are loaded first if not loaded yet
    if (!get().loaded) {
      await get().loadStats();
    }

    const current = { ...get().stats };
    const existing = current[profileUuid] || {
      profileUuid,
      profileName,
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    const updatedProfileStats: ProfileTokenStats = {
      profileUuid,
      profileName: profileName || existing.profileName || 'Unknown Profile',
      model: model || existing.model || 'Unknown Model',
      promptTokens: (existing.promptTokens || 0) + promptTokens,
      completionTokens: (existing.completionTokens || 0) + completionTokens,
      totalTokens: (existing.totalTokens || 0) + promptTokens + completionTokens,
    };

    current[profileUuid] = updatedProfileStats;
    set({ stats: current });

    try {
      await db.settings.put({ key: SETTINGS_COST_TRACKER_KEY, value: current });
    } catch (err) {
      console.error('Failed to save token usage stats:', err);
    }
  },

  resetStats: async () => {
    set({ stats: {} });
    try {
      await db.settings.put({ key: SETTINGS_COST_TRACKER_KEY, value: {} });
    } catch (err) {
      console.error('Failed to reset token usage stats:', err);
    }
  },

  getTotalEstimatedCost: (profiles?: ConnectionProfile[]) => {
    const { stats } = get();
    const profileMap = profiles ? new Map(profiles.map((p) => [p.uuid, p])) : undefined;
    return Object.values(stats).reduce((acc, profileStats) => {
      const matchedProfile = profileMap?.get(profileStats.profileUuid);
      return (
        acc +
        calculateModelCost(
          profileStats.model,
          profileStats.promptTokens || 0,
          profileStats.completionTokens || 0,
          matchedProfile
        )
      );
    }, 0);
  },

  getTotalTokens: () => {
    const { stats } = get();
    return Object.values(stats).reduce(
      (acc, profileStats) => acc + (profileStats.totalTokens || 0),
      0
    );
  },
}));
