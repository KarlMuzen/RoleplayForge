import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ChevronDown,
  RefreshCw,
  Edit3,
  ListFilter,
  Check,
  AlertCircle,
  Coins,
  Cpu,
  X,
} from 'lucide-react';
import {
  fetchOpenRouterModels,
  formatOpenRouterPricing,
  type OpenRouterModelItem,
} from '../services/openrouterModels';

interface OpenRouterModelPickerProps {
  value: string;
  onChange: (modelId: string) => void;
}

export const OpenRouterModelPicker: React.FC<OpenRouterModelPickerProps> = ({
  value,
  onChange,
}) => {
  const [models, setModels] = useState<OpenRouterModelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load OpenRouter models
  const loadModels = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOpenRouterModels(force);
      setModels(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch model catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchOpenRouterModels(false)
      .then((data) => {
        if (isMounted) {
          setModels(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch model catalog');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Currently selected model info
  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === value);
  }, [models, value]);

  // Filtered models
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return models;
    const term = searchTerm.toLowerCase().trim();
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(term) ||
        m.name.toLowerCase().includes(term) ||
        (m.description && m.description.toLowerCase().includes(term))
    );
  }, [models, searchTerm]);

  // Limit rendering to 60 items for performance
  const displayedModels = useMemo(() => {
    return filteredModels.slice(0, 60);
  }, [filteredModels]);

  const handleSelectModel = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // If fetch failed completely and no cached models, fall back to plain input with inline note
  if (error && models.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-medium text-knight-300">Model String</label>
          <button
            type="button"
            onClick={() => loadModels(true)}
            disabled={loading}
            className="text-[10px] text-maroon-400 hover:text-maroon-300 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Retry Catalog
          </button>
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. deepseek/deepseek-r1, anthropic/claude-3.7-sonnet"
          className="w-full px-3 py-2 bg-void-800 border border-knight-700 rounded-xl text-mist-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
        />
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Couldn&apos;t load model list — enter manually</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-knight-300">
          Model {manualMode ? 'String (Manual Entry)' : 'Selection (OpenRouter)'}
        </label>
        <div className="flex items-center gap-2">
          {!manualMode && (
            <button
              type="button"
              onClick={() => loadModels(true)}
              disabled={loading}
              title="Refresh models catalog from OpenRouter"
              className="text-[10px] text-knight-400 hover:text-mist-100 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setManualMode(!manualMode);
              setIsOpen(false);
            }}
            className="text-[10px] text-maroon-400 hover:text-maroon-300 flex items-center gap-1 transition-colors"
          >
            {manualMode ? (
              <>
                <ListFilter className="w-3 h-3" />
                Select from model list
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                Enter model ID manually
              </>
            )}
          </button>
        </div>
      </div>

      {manualMode ? (
        <div className="space-y-1">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. deepseek/deepseek-r1, mistralai/mistral-large-2411"
            className="w-full px-3 py-2 bg-void-800 border border-knight-700 rounded-xl text-mist-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
          />
          <p className="text-[10px] text-knight-400">
            Manual input mode active. Type any valid OpenRouter model identifier string.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Main Combobox Display / Trigger */}
          <div
            onClick={() => {
              setIsOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 bg-void-800 border ${
              isOpen ? 'border-maroon-500/80 ring-2 ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50' : 'border-knight-700 hover:border-knight-600'
            } rounded-xl text-mist-100 text-xs cursor-pointer transition-all`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <Cpu className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
              {value ? (
                <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-semibold text-mist-100 truncate">
                    {selectedModel?.name || value}
                  </span>
                  <span className="font-mono text-[10px] text-knight-400 truncate bg-void-950 px-1.5 py-0.5 rounded border border-knight-800">
                    {value}
                  </span>
                </div>
              ) : (
                <span className="text-knight-400">Select an OpenRouter model...</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-knight-400">
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-maroon-400" />}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Inline Pricing & Context Pill when a model is selected */}
          {selectedModel && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-knight-400 px-1">
              <span className="flex items-center gap-1 text-amber-300/90 font-mono">
                <Coins className="w-3 h-3 text-amber-400" />
                {formatOpenRouterPricing(
                  selectedModel.promptPricePer1K,
                  selectedModel.completionPricePer1K
                )}
              </span>
              {selectedModel.contextLength && (
                <span className="px-1.5 py-0.2 bg-void-900 border border-knight-800 rounded text-knight-300 font-mono">
                  {Math.round(selectedModel.contextLength / 1024)}k ctx
                </span>
              )}
            </div>
          )}

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-void-900 border border-knight-700/90 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Search Bar Header */}
              <div className="p-2 border-b border-knight-800 bg-void-950/80 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-knight-400 shrink-0 ml-1" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by name or ID (e.g. dolphin, sonnet, r1, llama)..."
                  className="w-full bg-transparent text-xs text-mist-100 placeholder:text-knight-500 focus:outline-none"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    className="p-2 min-w-9 min-h-9 flex items-center justify-center text-knight-400 hover:text-mist-100 touch-fast active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Models List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-knight-800/40 p-1 custom-scrollbar">
                {displayedModels.length === 0 ? (
                  <div className="p-4 text-center text-xs text-knight-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-maroon-400" />
                        <span>Loading models from OpenRouter...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p>No matching models found for &ldquo;{searchTerm}&rdquo;</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (searchTerm.trim()) {
                              onChange(searchTerm.trim());
                              setIsOpen(false);
                            }
                          }}
                          className="text-[11px] text-maroon-400 hover:underline font-mono"
                        >
                          Use &ldquo;{searchTerm.trim()}&rdquo; as custom model ID
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  displayedModels.map((m) => {
                    const isSelected = m.id === value;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m.id)}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 group ${
                          isSelected
                            ? 'bg-maroon-950/60 border border-maroon-800/50 text-white'
                            : 'hover:bg-void-800 text-mist-100'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs truncate group-hover:text-maroon-300 transition-colors">
                              {m.name}
                            </span>
                            {m.contextLength && (
                              <span className="shrink-0 text-[10px] text-knight-400 font-mono bg-void-950 px-1 rounded border border-knight-800">
                                {Math.round(m.contextLength / 1024)}k
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-knight-400 font-mono truncate">
                            <span className="truncate">{m.id}</span>
                            <span className="text-knight-600 shrink-0">•</span>
                            <span className="shrink-0 text-amber-300/80 font-sans">
                              {formatOpenRouterPricing(m.promptPricePer1K, m.completionPricePer1K)}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-maroon-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer info & manual toggle */}
              <div className="p-2 border-t border-knight-800 bg-void-950/90 text-[10px] text-knight-400 flex items-center justify-between">
                <span>
                  Showing {displayedModels.length} of {filteredModels.length} models
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(true);
                    setIsOpen(false);
                  }}
                  className="text-maroon-400 hover:underline"
                >
                  Type custom ID
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
