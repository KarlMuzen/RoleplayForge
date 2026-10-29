import React from 'react';
import { CheckCircle2, DownloadCloud, Globe, Smartphone } from 'lucide-react';

export interface PwaSectionProps {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
}

export const PwaSection: React.FC<PwaSectionProps> = ({
  isInstallable,
  isInstalled,
  promptInstall,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm min-w-0">
      <div className="flex flex-wrap items-center justify-between border-b border-knight-700/40 pb-3 gap-2">
        <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
          <img
            src="/forge-mark.svg"
            alt="Roleplay Forge logo"
            className="w-5 h-5 rounded-md object-cover border border-maroon-500/40"
            referrerPolicy="no-referrer"
          />
          Progressive Web App (PWA) & Offline Access
        </h3>
        {isInstalled ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 rounded-lg text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            App Installed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-maroon-950/80 border border-maroon-800/80 text-maroon-300 rounded-lg text-xs font-medium">
            <DownloadCloud className="w-3.5 h-3.5 text-maroon-400" />
            Offline Ready
          </span>
        )}
      </div>

      <p className="text-xs text-knight-400 leading-relaxed">
        Roleplay Forge can be installed directly onto your desktop, Android, or iOS device for full offline access, standalone window mode, and faster load times without requiring an app store download.
      </p>

      {isInstallable && (
        <div className="pt-1">
          <button
            onClick={promptInstall}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-800 hover:from-maroon-500 hover:to-maroon-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-maroon-950 transition-all active:scale-95"
          >
            <DownloadCloud className="w-4 h-4" />
            Install Roleplay Forge
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-void-950/60 border border-knight-800/60 rounded-xl space-y-1">
          <h4 className="text-xs font-medium text-mist-100 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-maroon-400" /> Chrome / Edge / Desktop
          </h4>
          <p className="text-[11px] text-knight-400">
            Click the install icon in your browser URL address bar or click the button above to install as a native desktop application.
          </p>
        </div>

        <div className="p-3 bg-void-950/60 border border-knight-800/60 rounded-xl space-y-1">
          <h4 className="text-xs font-medium text-mist-100 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-maroon-400" /> iOS / Safari / Mobile
          </h4>
          <p className="text-[11px] text-knight-400">
            Tap the <span className="font-semibold text-mist-200">Share</span> button in Safari, then scroll down and select <span className="font-semibold text-mist-200">"Add to Home Screen"</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
