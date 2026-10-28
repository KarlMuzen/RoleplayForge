import React from 'react';
import {
  Download,
  Trash2,
  Sparkles,
  CheckSquare,
  User,
  GripVertical,
} from 'lucide-react';
import type { StoredCard } from '../../db';
import type { TabType } from '../../store/useCardStore';
import { getCardCoverUrl } from './galleryUtils';
import {
  DndContext,
  closestCenter,
  type SensorDescriptor,
  type SensorOptions,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableCardProps {
  card: StoredCard;
  allCards: StoredCard[];
  isSelected: boolean;
  onSelect: (uuid: string) => void;
  onClick: (uuid: string) => void;
}

export const SortableCard: React.FC<SortableCardProps> = ({
  card,
  allCards,
  isSelected,
  onSelect,
  onClick,
}) => {
  const parentCard = card.variantOf ? allCards.find((c) => c.uuid === card.variantOf) : null;
  const variantCount = allCards.filter((c) => c.variantOf === card.uuid).length;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const previewUri = getCardCoverUrl(card);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest('.select-btn') ||
          (e.target as HTMLElement).closest('.drag-handle')
        )
          return;
        onClick(card.uuid);
      }}
      className={`group relative rounded-2xl overflow-hidden transition-all flex flex-col bg-void-900 touch-none cursor-pointer ${
        isDragging
          ? 'opacity-30 scale-95 border-2 border-dashed border-maroon-400'
          : ''
      } ${
        isSelected && !isDragging
          ? 'ring-2 ring-maroon-400/60 ring-offset-2 ring-offset-void-950 shadow-lg shadow-maroon-400/20'
          : 'hover:shadow-xl hover:shadow-black/50'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-2 left-2 z-20 min-w-10 min-h-10 flex items-center justify-center rounded-full bg-black/50 text-knight-300 hover:text-white hover:bg-black/80 backdrop-blur-md cursor-grab active:cursor-grabbing border border-knight-700/40 opacity-80 group-hover:opacity-100 transition-all shadow-md touch-none"
        title="Drag to reorder card"
      >
        <GripVertical className="w-4 h-4 text-knight-300 group-hover:text-maroon-300" />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(card.uuid);
        }}
        aria-label={isSelected ? `Deselect ${card.name}` : `Select ${card.name}`}
        className="select-btn absolute top-2 right-2 z-20 min-w-10 min-h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md touch-fast active:scale-90 border border-knight-700/40"
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-maroon-400" />
        ) : (
          <div className="w-4 h-4 border-2 border-white/40 rounded-sm" />
        )}
      </button>

      <div className="relative aspect-[2/3] w-full bg-void-900 overflow-hidden">
        {previewUri ? (
          <img
            src={previewUri}
            alt={card.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-knight-700 bg-void-900/50">
            <User className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 pointer-events-none" />

        <div className="absolute bottom-3 left-3 right-3 flex flex-col items-start gap-1.5 pointer-events-none">
          <h4 className="font-semibold text-[15px] truncate leading-tight text-mist-100 drop-shadow-md w-full">
            {card.name || 'Untitled'}
          </h4>
          <div className="flex flex-wrap gap-1">
            {card.variantOf ? (
              <span
                className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 text-[10px] font-medium border border-purple-800/60 backdrop-blur-md truncate max-w-[130px]"
                title={`Variant of ${parentCard?.name || 'parent'}${card.variantLabel ? ` (${card.variantLabel})` : ''}`}
              >
                Variant of {parentCard?.name || 'parent'}
              </span>
            ) : variantCount > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 text-[10px] font-medium border border-indigo-800/60 backdrop-blur-md">
                {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
              </span>
            ) : null}
            {card.tags && card.tags.length > 0 ? (
              card.tags.slice(0, 1).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-knight-300 text-[10px] font-medium border border-knight-700/40"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-knight-400 text-[10px] font-medium border border-knight-700/40">
                {card.cardData.spec_version === '3.0' ? 'CCv3' : 'CCv2'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface GalleryCardsGridProps {
  isLoadingCards: boolean;
  filteredCards: StoredCard[];
  allCards: StoredCard[];
  selectedCardUuids: string[];
  toggleSelectCardUuid: (uuid: string) => void;
  clearCardSelections: () => void;
  bulkDeleteCards: () => void;
  handleBulkExportSelectedZip: (format?: 'png' | 'json' | 'charx') => void;
  handleCardClick: (uuid: string) => void;
  sensors: SensorDescriptor<SensorOptions>[];
  activeId: string | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  createNewCard: (name?: string) => Promise<string>;
  setActiveTab: (tab: TabType) => void;
}

export const GalleryCardsGrid: React.FC<GalleryCardsGridProps> = ({
  isLoadingCards,
  filteredCards,
  allCards,
  selectedCardUuids,
  toggleSelectCardUuid,
  clearCardSelections,
  bulkDeleteCards,
  handleBulkExportSelectedZip,
  handleCardClick,
  sensors,
  activeId,
  handleDragStart,
  handleDragEnd,
  fileInputRef: _fileInputRef,
  createNewCard,
  setActiveTab,
}) => {
  return (
    <>
      {/* Bulk Operations Toolbar */}
      {selectedCardUuids.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-maroon-400/10 border border-maroon-400/20 rounded-xl text-xs text-maroon-200 gap-3 min-w-0">
          <span className="font-semibold">{selectedCardUuids.length} card(s) selected</span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleBulkExportSelectedZip('png')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 hover:to-maroon-500 text-white font-medium rounded-lg touch-fast"
            >
              <Download className="w-3.5 h-3.5" />
              Export ZIP
            </button>
            <button
              onClick={bulkDeleteCards}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/80 hover:bg-red-800 border border-red-800 text-white font-medium rounded-lg touch-fast"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              onClick={clearCardSelections}
              className="text-knight-400 hover:text-mist-100 ml-1 font-medium touch-fast"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoadingCards ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 pb-24 md:pb-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[2/3] bg-void-900/60 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center bg-void-900/80 border border-mist-100/5 rounded-2xl max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-maroon-400/10 text-maroon-400 flex items-center justify-center mx-auto shadow-inner shadow-maroon-400/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-mist-100">No Character Cards Found</h3>
            <p className="text-xs text-knight-400 mt-2 leading-relaxed">
              Import existing <span className="text-maroon-400 font-mono">PNG / JSON / CHARX</span> cards from your collection, or build a new character from scratch.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <button
              onClick={async () => {
                await createNewCard('New Character');
                setActiveTab('editor');
              }}
              className="px-4 py-2.5 bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 hover:to-maroon-500 text-white text-xs font-medium rounded-xl shadow-md shadow-maroon-950/50 touch-fast transition-colors"
            >
              Create Character
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCards.map((c) => c.uuid)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 pb-24 md:pb-0">
              {filteredCards.map((card) => (
                <SortableCard
                  key={card.uuid}
                  card={card}
                  allCards={allCards}
                  isSelected={selectedCardUuids.includes(card.uuid)}
                  onSelect={toggleSelectCardUuid}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <SortableCard
                card={allCards.find((c) => c.uuid === activeId)!}
                allCards={allCards}
                isSelected={selectedCardUuids.includes(activeId)}
                onSelect={() => {}}
                onClick={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
};
