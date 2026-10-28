import type { TabType } from '../store/useCardStore';

export const WORKSPACE_TABS: TabType[] = ['editor', 'lorebook', 'payload', 'assistant'];
export const LAB_TABS: TabType[] = ['crucible', 'enhancer'];

export const isWorkspaceSection = (tab: TabType): boolean => WORKSPACE_TABS.includes(tab);
export const isLabSection = (tab: TabType): boolean => LAB_TABS.includes(tab);
