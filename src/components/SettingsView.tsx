import React, { useEffect } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useTokenTracker } from '../store/useTokenTracker';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SecuritySection } from './settings/SecuritySection';
import { ConnectionProfilesSection } from './settings/ConnectionProfilesSection';
import { CostTrackerSection } from './settings/CostTrackerSection';
import { PwaSection } from './settings/PwaSection';
import { BackupRestoreSection } from './settings/BackupRestoreSection';
import { Settings, Sun, Moon } from 'lucide-react';
import { getBuildLabel } from '../utils/appInfo';

export const SettingsView: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const {
    profiles,
    activeProfileUuid,
    loadProfilesFromDb,
    saveProfile,
    deleteProfile,
    setActiveProfileUuid,
    isPassphraseSet,
    setupPassphrase,
    clearPassphrase,
    isUnlocked,
    lockSession,
    isPasskeySupported,
    isPasskeyEnrolled,
    enrollPasskeyUnlock,
    removePasskeyUnlock,
    theme,
    setTheme,
    loadCardsFromDb,
  } = useCardStore();

  const { stats, loadStats, resetStats, getTotalEstimatedCost } = useTokenTracker();

  useEffect(() => {
    loadProfilesFromDb();
    loadStats();
  }, [loadProfilesFromDb, loadStats]);

  return (
    <div className="subview-container p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Master Passphrase & Encryption Security Card */}
      <SecuritySection
        isPassphraseSet={isPassphraseSet}
        isUnlocked={isUnlocked}
        lockSession={lockSession}
        clearPassphrase={clearPassphrase}
        setupPassphrase={setupPassphrase}
        isPasskeySupported={isPasskeySupported}
        isPasskeyEnrolled={isPasskeyEnrolled}
        enrollPasskeyUnlock={enrollPasskeyUnlock}
        removePasskeyUnlock={removePasskeyUnlock}
        profiles={profiles}
      />

      {/* Header */}
      <div className="bg-void-900 border border-knight-700/40 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-mist-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-maroon-400" />
            App Settings & Organized API Configurations
          </h2>
          <p className="text-xs text-knight-400">
            Configure BYOK model parameters, connection profiles, and local database backups
          </p>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 px-3 py-1.5 bg-void-800 border border-knight-700 rounded-xl text-xs text-knight-300 hover:text-mist-100 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-maroon-400" />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
      </div>

      {/* Connection Profiles List & Add/Edit Form */}
      <ConnectionProfilesSection
        profiles={profiles}
        activeProfileUuid={activeProfileUuid}
        setActiveProfileUuid={setActiveProfileUuid}
        saveProfile={saveProfile}
        deleteProfile={deleteProfile}
        isPassphraseSet={isPassphraseSet}
      />

      {/* Running Cost Estimate Tracker */}
      <CostTrackerSection
        profiles={profiles}
        stats={stats}
        resetStats={resetStats}
        getTotalEstimatedCost={getTotalEstimatedCost}
      />

      {/* Progressive Web App (PWA) & Offline Access */}
      <PwaSection
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        promptInstall={promptInstall}
      />

      {/* Database Backup & Restore */}
      <BackupRestoreSection
        profiles={profiles}
        loadCardsFromDb={loadCardsFromDb}
        loadProfilesFromDb={loadProfilesFromDb}
      />

      {/* Build info footer - include this in bug reports so we know which build you're on */}
      <p className="text-center text-[10px] font-mono text-knight-600 pt-2 select-text">
        {getBuildLabel()}
      </p>
    </div>
  );
};
