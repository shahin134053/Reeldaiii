import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { AppLang, L } from '../lib/i18n';
import { CharacterRenderMode } from '../lib/storyIntelligence';
import {
  STUDIO_ASSET_CATEGORIES,
  STUDIO_CHARACTER_ASSETS,
  STUDIO_ENVIRONMENT_ASSETS,
  StudioAssetCategory,
  StudioCharacterAsset,
  StudioEnvironmentAsset,
} from '../lib/studioAssetLibrary';

export type AssetPickerTab = 'characters' | 'environments';

interface StudioAssetPickerModalProps {
  lang: AppLang;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AssetPickerTab;
  contextMode: 'create' | 'studio';
  activeSceneNumber?: string;
  selectedCharacterId?: string | null;
  selectedSecondaryCharacterId?: string | null;
  selectedEnvironmentId?: string | null;
  renderMode: CharacterRenderMode;
  onChangeRenderMode: (mode: CharacterRenderMode) => void;
  onSelectCharacter: (
    asset: StudioCharacterAsset | null,
    options: {
      slot: 'primary' | 'secondary';
      scope: 'all' | 'scene';
      renderMode: CharacterRenderMode;
    }
  ) => void;
  onSelectEnvironment: (
    asset: StudioEnvironmentAsset | null,
    options: { scope: 'all' | 'scene' }
  ) => void;
}

export const StudioAssetPickerModal: React.FC<StudioAssetPickerModalProps> = ({
  lang,
  isOpen,
  onClose,
  initialTab = 'characters',
  contextMode,
  activeSceneNumber = '01',
  selectedCharacterId = null,
  selectedSecondaryCharacterId = null,
  selectedEnvironmentId = null,
  renderMode,
  onChangeRenderMode,
  onSelectCharacter,
  onSelectEnvironment,
}) => {
  const [activeTab, setActiveTab] = useState<AssetPickerTab>(initialTab);
  const [category, setCategory] = useState<'all' | StudioAssetCategory>('all');
  const [query, setQuery] = useState<string>('');
  const [actorSlot, setActorSlot] = useState<'primary' | 'secondary'>('primary');
  const [applyScope, setApplyScope] = useState<'all' | 'scene'>(
    contextMode === 'studio' ? 'scene' : 'all'
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setApplyScope(contextMode === 'studio' ? 'scene' : 'all');
    }
  }, [isOpen, initialTab, contextMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCharacters = useMemo(() => {
    return STUDIO_CHARACTER_ASSETS.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (!normalizedQuery) return true;
      return (
        c.nameEn.toLowerCase().includes(normalizedQuery) ||
        c.nameBn.toLowerCase().includes(normalizedQuery) ||
        c.clothingDesc.toLowerCase().includes(normalizedQuery) ||
        c.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [category, normalizedQuery]);

  const filteredEnvironments = useMemo(() => {
    return STUDIO_ENVIRONMENT_ASSETS.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!normalizedQuery) return true;
      return (
        e.nameEn.toLowerCase().includes(normalizedQuery) ||
        e.nameBn.toLowerCase().includes(normalizedQuery) ||
        e.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [category, normalizedQuery]);

  if (!isOpen) return null;

  const effectiveCharScope: 'all' | 'scene' = contextMode === 'create' ? 'all' : applyScope;
  const effectiveEnvScope: 'all' | 'scene' = contextMode === 'create' ? 'all' : applyScope;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-asset-picker-title"
      data-testid="studio-asset-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ck-overlay)] p-2.5 sm:p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ck-border-subtle)] px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="studio-asset-picker-title"
              className="text-base font-semibold text-[var(--ck-text)] sm:text-lg"
            >
              {L(
                lang,
                '2D Animation Characters & Environments (54 Pack)',
                '২ডি অ্যানিমেশন ক্যারেক্টার ও এনভায়রনমেন্ট লাইব্রেরি (৫৪টি)'
              )}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Mix & match any of the 27 2D characters with any of the 27 illustrated backgrounds—use Animated Lip-Sync Rig or crisp 2D Artwork Cutout.',
                '২৭টি ২ডি ক্যারেক্টার ও ২৭টি এনভায়রনমেন্ট যেকোনো গল্পে ব্যবহার করুন — অ্যানিমেটেড লিপ-সিঙ্ক রিগ অথবা ২ডি আর্টওয়ার্ক কাটআউট মোডে।'
              )}
            </p>
          </div>
          <button
            type="button"
            data-testid="asset-picker-close-btn"
            onClick={onClose}
            aria-label={L(lang, 'Close 2D Asset Library', '২ডি অ্যাসেট লাইব্রেরি বন্ধ করুন')}
            className="rounded-lg p-2 text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)] shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs + Search + Category Filter Strip */}
        <div className="space-y-3 border-b border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs: Characters vs Environments */}
            <div
              role="tablist"
              aria-label={L(lang, '2D Asset Library Tabs', '২ডি অ্যাসেট ট্যাব')}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1 self-start"
            >
              <button
                type="button"
                role="tab"
                data-testid="asset-tab-characters"
                aria-selected={activeTab === 'characters'}
                onClick={() => setActiveTab('characters')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'characters'
                    ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                    : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{L(lang, '2D Characters (27)', '২ডি ক্যারেক্টার (২৭)')}</span>
              </button>
              <button
                type="button"
                role="tab"
                data-testid="asset-tab-environments"
                aria-selected={activeTab === 'environments'}
                onClick={() => setActiveTab('environments')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'environments'
                    ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                    : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{L(lang, '2D Environments (27)', '২ডি এনভায়রনমেন্ট (২৭)')}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ck-text-faint)]" />
              <label htmlFor="asset-picker-search" className="sr-only">
                {L(lang, 'Search characters or environments', 'ক্যারেক্টার বা পরিবেশ খুঁজুন')}
              </label>
              <input
                id="asset-picker-search"
                data-testid="asset-picker-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L(
                  lang,
                  'Search doctor, tea, village, robot…',
                  'খুঁজুন: ডাক্তার, চা, গ্রাম, রোবট…'
                )}
                className="h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] pl-8 pr-3 text-xs text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="asset-cat-all"
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                category === 'all'
                  ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'All Categories (27)', 'সবগুলো (২৭)')}
            </button>
            {STUDIO_ASSET_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`asset-cat-${cat.id}`}
                  aria-pressed={active}
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                      : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                  }`}
                >
                  {lang === 'bn' ? cat.labelBn : cat.labelEn}
                </button>
              );
            })}
          </div>

          {/* Context Options Strip: Render Mode / Slot / Scope */}
          {activeTab === 'characters' ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[var(--ck-text-secondary)]">
                  {L(lang, 'Animation Mode:', 'মোড:')}
                </span>
                <button
                  type="button"
                  data-testid="picker-mode-rig-sync"
                  aria-pressed={renderMode === 'rig-sync'}
                  onClick={() => onChangeRenderMode('rig-sync')}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    renderMode === 'rig-sync'
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                      : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{L(lang, 'Animated Lip-Sync Rig', 'লিপ-সিঙ্ক অ্যানিমেটেড রিগ')}</span>
                </button>
                <button
                  type="button"
                  data-testid="picker-mode-illustrated-cutout"
                  aria-pressed={renderMode === 'illustrated-cutout'}
                  onClick={() => onChangeRenderMode('illustrated-cutout')}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    renderMode === 'illustrated-cutout'
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                      : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  <span>{L(lang, '2D Artwork Cutout', '২ডি আর্টওয়ার্ক কাটআউট')}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {contextMode === 'studio' && (
                  <>
                    <div className="inline-flex items-center rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] p-0.5 text-[11px]">
                      <button
                        type="button"
                        data-testid="picker-slot-primary"
                        onClick={() => setActorSlot('primary')}
                        className={`rounded px-2 py-0.5 font-medium transition-colors ${
                          actorSlot === 'primary'
                            ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                            : 'text-[var(--ck-text-muted)]'
                        }`}
                      >
                        {L(lang, 'Primary Lead', 'প্রধান চরিত্র')}
                      </button>
                      <button
                        type="button"
                        data-testid="picker-slot-secondary"
                        onClick={() => setActorSlot('secondary')}
                        className={`rounded px-2 py-0.5 font-medium transition-colors ${
                          actorSlot === 'secondary'
                            ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                            : 'text-[var(--ck-text-muted)]'
                        }`}
                      >
                        {L(lang, 'Co-Star #2', 'সহ-চরিত্র #২')}
                      </button>
                    </div>

                    <div className="inline-flex items-center rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] p-0.5 text-[11px]">
                      <button
                        type="button"
                        data-testid="picker-scope-scene"
                        onClick={() => setApplyScope('scene')}
                        className={`rounded px-2 py-0.5 font-medium transition-colors ${
                          applyScope === 'scene'
                            ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                            : 'text-[var(--ck-text-muted)]'
                        }`}
                      >
                        {L(lang, `Ch ${activeSceneNumber} Only`, `শুধু দৃশ্য ${activeSceneNumber}`)}
                      </button>
                      <button
                        type="button"
                        data-testid="picker-scope-all"
                        onClick={() => setApplyScope('all')}
                        className={`rounded px-2 py-0.5 font-medium transition-colors ${
                          applyScope === 'all'
                            ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                            : 'text-[var(--ck-text-muted)]'
                        }`}
                      >
                        {L(lang, 'All Scenes', 'সব দৃশ্য')}
                      </button>
                    </div>
                  </>
                )}

                {(selectedCharacterId || (actorSlot === 'secondary' && selectedSecondaryCharacterId)) && (
                  <button
                    type="button"
                    data-testid="picker-clear-character"
                    onClick={() => {
                      onSelectCharacter(null, {
                        slot: actorSlot,
                        scope: effectiveCharScope,
                        renderMode,
                      });
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] px-2.5 py-1 text-[11px] text-[var(--ck-text-muted)] hover:border-[var(--ck-danger)] hover:text-[var(--ck-danger-text)]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{L(lang, 'Reset Slot', 'রিসেট')}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2">
              <span className="text-[11px] text-[var(--ck-text-secondary)]">
                {contextMode === 'studio'
                  ? L(
                      lang,
                      'Click any background to apply immediately, or switch back to Procedural 2D Worlds.',
                      'যেকোনো ব্যাকগ্রাউন্ডে ক্লিক করে সাথে সাথে দৃশ্যে সেট করুন, অথবা প্রসিডিউরাল ২ডি জগতে ফিরে যান।'
                    )
                  : L(
                      lang,
                      'Pick a default 2D background for your story (you can override per scene later in Director).',
                      'আপনার গল্পের জন্য একটি ২ডি ব্যাকগ্রাউন্ড বেছে নিন (পরে প্রতিটি দৃশ্যে আলাদা সেট করা যাবে)।'
                    )}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {contextMode === 'studio' && (
                  <div className="inline-flex items-center rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] p-0.5 text-[11px]">
                    <button
                      type="button"
                      data-testid="picker-env-scope-scene"
                      onClick={() => setApplyScope('scene')}
                      className={`rounded px-2 py-0.5 font-medium transition-colors ${
                        applyScope === 'scene'
                          ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                          : 'text-[var(--ck-text-muted)]'
                      }`}
                    >
                      {L(lang, `Ch ${activeSceneNumber} Only`, `শুধু দৃশ্য ${activeSceneNumber}`)}
                    </button>
                    <button
                      type="button"
                      data-testid="picker-env-scope-all"
                      onClick={() => setApplyScope('all')}
                      className={`rounded px-2 py-0.5 font-medium transition-colors ${
                        applyScope === 'all'
                          ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                          : 'text-[var(--ck-text-muted)]'
                      }`}
                    >
                      {L(lang, 'All Scenes', 'সব দৃশ্য')}
                    </button>
                  </div>
                )}

                {selectedEnvironmentId && (
                  <button
                    type="button"
                    data-testid="picker-clear-environment"
                    onClick={() => {
                      onSelectEnvironment(null, { scope: effectiveEnvScope });
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--ck-text-muted)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{L(lang, 'Use Procedural World', 'প্রসিডিউরাল জগৎ ফিরিয়ে আনুন')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Gallery Grid */}
        <div className="cinema-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'characters' ? (
            filteredCharacters.length > 0 ? (
              <div
                data-testid="asset-characters-grid"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              >
                {filteredCharacters.map((char) => {
                  const isPrimary = selectedCharacterId === char.id;
                  const isSecondary = selectedSecondaryCharacterId === char.id;
                  const isActive = isPrimary || isSecondary;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      data-testid={`asset-card-${char.id}`}
                      onClick={() => {
                        onSelectCharacter(char, {
                          slot: actorSlot,
                          scope: effectiveCharScope,
                          renderMode,
                        });
                        onClose();
                      }}
                      className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                        isActive
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] hover:border-[var(--ck-accent)]/70'
                      }`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-[#141720]">
                        <img
                          src={char.url}
                          alt={lang === 'bn' ? char.nameBn : char.nameEn}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isActive && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-[var(--ck-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ck-accent-fg)] shadow">
                            <Check className="h-3 w-3" />
                            <span>
                              {isPrimary
                                ? L(lang, 'Lead', 'প্রধান')
                                : L(lang, 'Co-Star', 'সহ-চরিত্র')}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                              style={{ backgroundColor: char.outfitColor }}
                            />
                            <span className="truncate text-xs font-semibold text-[var(--ck-text)]">
                              {lang === 'bn' ? char.nameBn : char.nameEn}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--ck-text-muted)]">
                            {lang === 'bn' ? char.nameEn : char.nameBn}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--ck-text-faint)]">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            <span>{char.role}</span>
                          </span>
                          <span className="font-medium text-[var(--ck-accent)] group-hover:underline">
                            {L(lang, 'Use Character →', 'ব্যবহার করুন →')}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--ck-text-muted)]">
                {L(
                  lang,
                  'No characters match your search. Try clearing the search box or category filter.',
                  'আপনার খোঁজের সাথে কোনো চরিত্র মেলেনি। সার্চ বা ক্যাটাগরি পরিবর্তন করে দেখুন।'
                )}
              </div>
            )
          ) : filteredEnvironments.length > 0 ? (
            <div
              data-testid="asset-environments-grid"
              className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredEnvironments.map((env) => {
                const isSelected = selectedEnvironmentId === env.id;
                return (
                  <button
                    key={env.id}
                    type="button"
                    data-testid={`asset-card-${env.id}`}
                    onClick={() => {
                      onSelectEnvironment(env, { scope: effectiveEnvScope });
                      onClose();
                    }}
                    className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                      isSelected
                        ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                        : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] hover:border-[var(--ck-accent)]/70'
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-[#141720]">
                      <img
                        src={env.url}
                        alt={lang === 'bn' ? env.nameBn : env.nameEn}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-[var(--ck-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--ck-accent-fg)] shadow">
                          <Check className="h-3 w-3" />
                          <span>{L(lang, 'Selected', 'নির্বাচিত')}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-1 p-3">
                      <div className="text-xs font-semibold text-[var(--ck-text)]">
                        {lang === 'bn' ? env.nameBn : env.nameEn}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--ck-text-muted)]">
                        <span className="truncate">{lang === 'bn' ? env.nameEn : env.nameBn}</span>
                        <span className="shrink-0 font-medium text-[var(--ck-accent)] group-hover:underline">
                          {L(lang, 'Select Scene →', 'দৃশ্য বেছে নিন →')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'No environments match your search. Try another keyword or category.',
                'আপনার খোঁজের সাথে কোনো এনভায়রনমেন্ট মেলেনি।'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
