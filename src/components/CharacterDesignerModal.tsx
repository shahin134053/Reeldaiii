import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  UserCheck,
  Glasses,
  Crown,
  Bookmark,
  Trash2,
  Check,
  Volume2,
  Lock,
} from 'lucide-react';
import {
  CHARACTER_LABELS,
  CharacterRole,
  EmotionTone,
} from '../lib/storyCompiler';
import { CharacterProfile, CharacterRenderMode } from '../lib/storyIntelligence';
import {
  CustomCharacterDraft,
  DEFAULT_CUSTOM_CHARACTER_DRAFT,
  HAIR_COLOR_SWATCHES,
  HAIR_STYLE_OPTIONS,
  HEADWEAR_OPTIONS,
  OUTFIT_COLOR_SWATCHES,
  PANTS_COLOR_SWATCHES,
  SKIN_TONE_SWATCHES,
  SavedCustomCharacter,
  buildCustomCharacterProfile,
  deleteCustomCharacterPreset,
  listSavedCustomCharacters,
  saveCustomCharacterPreset,
} from '../lib/characterDesigner';
import {
  STUDIO_CHARACTER_ASSETS,
  draftFromCharacterAsset,
} from '../lib/studioAssetLibrary';
import { getLoadedStudioImage, onStudioAssetLoaded } from '../animation/assetCanvasRenderer';
import { drawLifelikeHuman } from '../animation/humanRig';
import { AppLang, L } from '../lib/i18n';

interface CharacterDesignerModalProps {
  lang: AppLang;
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: CustomCharacterDraft | null;
  hasActiveProject: boolean;
  onApplyCharacter: (profile: CharacterProfile, draft: CustomCharacterDraft) => void;
}

const ROLE_OPTIONS: CharacterRole[] = [
  'narrator',
  'father',
  'mother',
  'youth-boy',
  'youth-girl',
  'elder',
  'teacher',
  'professional',
];

const EMOTION_PREVIEW_OPTIONS: Array<{ id: EmotionTone; en: string; bn: string }> = [
  { id: 'calm', en: 'Calm', bn: 'শান্ত' },
  { id: 'happy', en: 'Happy', bn: 'আনন্দিত' },
  { id: 'inspiring', en: 'Proud', bn: 'উদ্দীপ্ত' },
  { id: 'emotional', en: 'Emotional', bn: 'আবেগী' },
];

export const CharacterDesignerModal: React.FC<CharacterDesignerModalProps> = ({
  lang,
  isOpen,
  onClose,
  initialDraft,
  hasActiveProject,
  onApplyCharacter,
}) => {
  const [draft, setDraft] = useState<CustomCharacterDraft>(
    () => initialDraft ?? DEFAULT_CUSTOM_CHARACTER_DRAFT
  );
  const [previewEmotion, setPreviewEmotion] = useState<EmotionTone>('happy');
  const [previewSpeaking, setPreviewSpeaking] = useState<boolean>(true);
  const [savedCharacters, setSavedCharacters] = useState<SavedCustomCharacter[]>(() =>
    listSavedCustomCharacters()
  );
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && initialDraft) {
      setDraft(initialDraft);
    }
  }, [isOpen, initialDraft]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const liveProfile = useMemo(() => buildCustomCharacterProfile(draft), [draft]);

  // Preload reference sheet image immediately whenever an illustrated character sheet is active
  useEffect(() => {
    if (!isOpen || !draft.referenceSheetUrl) return;
    getLoadedStudioImage(draft.referenceSheetUrl);
    return onStudioAssetLoaded(() => {
      // Live RAF loop picks up newly decoded sprite automatically
    });
  }, [isOpen, draft.referenceSheetUrl]);

  // Live animated 2D Canvas character studio preview
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startMs = performance.now();

    const drawFrame = (now: number) => {
      const t = (now - startMs) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Warm cinema studio cyclorama backdrop
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.36, 16, w * 0.5, h * 0.5, w * 0.72);
      bg.addColorStop(0, '#2B3040');
      bg.addColorStop(0.65, '#191D27');
      bg.addColorStop(1, '#10131A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft studio stage floor & warm keylight ellipse
      ctx.fillStyle = 'rgba(229, 169, 60, 0.08)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.86, w * 0.36, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, h * 0.86);
      ctx.lineTo(w - 28, h * 0.86);
      ctx.stroke();

      const speechWave = previewSpeaking
        ? 0.25 + 0.55 * Math.abs(Math.sin(t * 5.2)) * (0.65 + 0.35 * Math.sin(t * 2.1))
        : 0;

      drawLifelikeHuman(ctx, {
        x: w * 0.5,
        y: h * 0.80,
        scale: 1.18,
        facing: 1,
        role: liveProfile.role,
        emotion: previewEmotion,
        pose: 'standing-speak',
        time: t,
        speechEnergy: speechWave,
        isSpeaking: previewSpeaking,
        rimLightColor: 'rgba(255, 214, 148, 0.45)',
        profile: liveProfile,
      });

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, liveProfile, previewEmotion, previewSpeaking]);

  if (!isOpen) return null;

  const updateDraft = (patch: Partial<CustomCharacterDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSavePreset = () => {
    const next = saveCustomCharacterPreset({
      ...draft,
      id: draft.id || `custom-char-${Date.now()}`,
    });
    setSavedCharacters(next);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleApply = () => {
    const profile = buildCustomCharacterProfile(draft);
    onApplyCharacter(profile, draft);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-designer-title"
      data-testid="character-designer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ck-overlay)] p-3 sm:p-4 backdrop-blur-sm"
    >
      <div className="cinema-scroll flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ck-border-subtle)] px-5 py-4">
          <div>
            <h2
              id="character-designer-title"
              className="text-lg font-semibold text-[var(--ck-text)]"
            >
              {L(lang, 'Custom Character Designer', 'কাস্টম ক্যারেক্টার ডিজাইনার')}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Customize outfit color, hairstyle, glasses, hat/tupi, and name — lock the exact same character across every scene.',
                'চরিত্রের নাম, পোশাকের রঙ, চুলের ধরন, চশমা বা টুপি নিজের মতো সাজিয়ে পুরো গল্পে একই চরিত্র ধরে রাখুন।'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={L(lang, 'Close Character Designer', 'ক্যারেক্টার ডিজাইনার বন্ধ করুন')}
            className="rounded-lg p-2 text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: Live Preview Left + Controls Right */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left: Animated Character Stage */}
          <div className="flex flex-col justify-between gap-3 border-b border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
            <div>
              <div className="relative overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[#10131A]">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={330}
                  data-testid="character-designer-canvas"
                  className="mx-auto block h-[270px] w-full object-contain sm:h-[300px]"
                />
                {/* Character Nameplate Overlay */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <div className="min-w-0">
                    <div
                      data-testid="character-preview-name"
                      className="truncate text-xs font-semibold text-white"
                    >
                      {liveProfile.name}
                    </div>
                    <div className="truncate text-[10px] text-white/70">
                      {liveProfile.accessories.length > 0
                        ? liveProfile.accessories.join(' · ')
                        : L(lang, 'Custom Story Character', 'কাস্টম গল্পের চরিত্র')}
                    </div>
                  </div>
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-white/30"
                    style={{ backgroundColor: liveProfile.outfitColor }}
                    title={liveProfile.outfitColor}
                  />
                </div>
              </div>

              {/* Preview Expression & Speaking Controls */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {EMOTION_PREVIEW_OPTIONS.map((em) => (
                    <button
                      key={em.id}
                      type="button"
                      onClick={() => setPreviewEmotion(em.id)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        previewEmotion === em.id
                          ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                          : 'bg-[var(--ck-surface)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                      }`}
                    >
                      {lang === 'bn' ? em.bn : em.en}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewSpeaking((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                    previewSpeaking
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                      : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-muted)]'
                  }`}
                >
                  <Volume2 className="h-3 w-3" />
                  <span>{L(lang, 'Lip-Sync', 'লিপ-সিঙ্ক')}</span>
                </button>
              </div>

              {/* Stage Render Mode Toggle when an Illustrated 2D Sheet is active */}
              {draft.sourceAssetId && (
                <div className="mt-3 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-2">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--ck-text)]">
                      {L(lang, 'Stage Render Mode', 'স্টেজ রেন্ডার মোড')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          sourceAssetId: undefined,
                          referenceSheetUrl: undefined,
                          renderMode: 'rig-sync',
                        })
                      }
                      className="text-[10px] text-[var(--ck-text-muted)] hover:text-[var(--ck-accent)]"
                    >
                      {L(lang, 'Clear 2D Sheet', 'শিট সরান')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['rig-sync', 'illustrated-cutout'] as CharacterRenderMode[]).map((mode) => {
                      const active = (draft.renderMode ?? 'rig-sync') === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          data-testid={`designer-mode-${mode}`}
                          onClick={() => updateDraft({ renderMode: mode })}
                          className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            active
                              ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                              : 'border-[var(--ck-border)] bg-[var(--ck-inset)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                          }`}
                        >
                          {mode === 'rig-sync'
                            ? L(lang, 'Animated Lip-Sync Rig', 'অ্যানিমেটেড লিপ-সিঙ্ক রিগ')
                            : L(lang, '2D Artwork Cutout', '২ডি আর্টওয়ার্ক কাটআউট')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Saved Characters Shelf */}
            {savedCharacters.length > 0 && (
              <div className="space-y-1.5 border-t border-[var(--ck-border-subtle)] pt-3">
                <div className="text-[11px] font-semibold text-[var(--ck-text-muted)]">
                  {L(lang, 'Saved Characters', 'সংরক্ষিত চরিত্র')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savedCharacters.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] pl-2 pr-1 py-1 text-[11px]"
                    >
                      <button
                        type="button"
                        onClick={() => setDraft(item.draft)}
                        className="flex items-center gap-1.5 font-medium text-[var(--ck-text)] hover:text-[var(--ck-accent)]"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.profile.outfitColor }}
                        />
                        <span>{item.profile.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSavedCharacters(deleteCustomCharacterPreset(item.id))}
                        aria-label={L(lang, 'Delete preset', 'ডিলিট করুন')}
                        className="rounded p-0.5 text-[var(--ck-text-faint)] hover:text-[var(--ck-danger-text)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Customization Controls */}
          <div className="cinema-scroll space-y-5 p-5 lg:col-span-7 lg:max-h-[68vh] lg:overflow-y-auto">
            {/* Quick-Load from 27 Illustrated Character Sheets */}
            <div className="space-y-2 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--ck-text)]">
                  {L(lang, 'Load from 27 Illustrated Character Sheets', '২৭টি ২ডি ক্যারেক্টার শিট থেকে লোড করুন')}
                </span>
                <span className="text-[10px] text-[var(--ck-text-muted)]">
                  {L(lang, 'Scroll horizontally →', 'ডানে স্ক্রল করুন →')}
                </span>
              </div>
              <div
                data-testid="designer-illustrated-strip"
                className="cinema-scroll flex gap-2 overflow-x-auto pb-1.5"
              >
                {STUDIO_CHARACTER_ASSETS.map((asset) => {
                  const isActive = draft.sourceAssetId === asset.id;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      data-testid={`designer-sheet-${asset.id}`}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...draftFromCharacterAsset(
                            asset,
                            prev.renderMode ?? 'illustrated-cutout',
                            prev.lockAcrossAllScenes
                          ),
                          sourceAssetId: asset.id,
                          referenceSheetUrl: asset.url,
                        }))
                      }
                      className={`group flex w-24 shrink-0 flex-col overflow-hidden rounded-lg border text-left transition-all ${
                        isActive
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] ring-1 ring-[var(--ck-accent)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface)] hover:border-[var(--ck-accent)]/70'
                      }`}
                    >
                      <div className="h-14 w-full overflow-hidden bg-[var(--ck-inset)]">
                        <img
                          src={asset.url}
                          alt={lang === 'bn' ? asset.nameBn : asset.nameEn}
                          loading="lazy"
                          className="h-full w-full object-cover object-left-top transition-transform group-hover:scale-105"
                        />
                      </div>
                      <span className="truncate px-1.5 py-1 text-[10px] font-medium text-[var(--ck-text)]">
                        {lang === 'bn' ? asset.nameBn : asset.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + Role */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="custom-char-name"
                  className="mb-1.5 block text-xs font-semibold text-[var(--ck-text)]"
                >
                  {L(lang, 'Character Name', 'চরিত্রের নাম')}
                </label>
                <input
                  id="custom-char-name"
                  data-testid="character-name-input"
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder={L(lang, 'e.g. Rahim Mia / Aarav', 'যেমন: রহিম মিয়া / মিনা')}
                  className="h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-char-role"
                  className="mb-1.5 block text-xs font-semibold text-[var(--ck-text)]"
                >
                  {L(lang, 'Character Role', 'চরিত্রের ভূমিকা')}
                </label>
                <select
                  id="custom-char-role"
                  data-testid="character-role-select"
                  value={draft.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as CharacterRole;
                    const femaleRole = nextRole === 'mother' || nextRole === 'youth-girl';
                    updateDraft({
                      role: nextRole,
                      isFemale: femaleRole,
                      isElder: nextRole === 'elder',
                      hairStyleId: femaleRole
                        ? 'long-flowing'
                        : nextRole === 'elder'
                          ? 'bald-elder'
                          : draft.hairStyleId,
                    });
                  }}
                  className="h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {CHARACTER_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outfit Color + Bottom Color */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ck-text)]">
                  {L(lang, 'Outfit Color', 'পোশাকের রঙ')}
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ck-text-muted)] cursor-pointer">
                  <span>{L(lang, 'Custom Hex', 'কাস্টম রঙ')}</span>
                  <input
                    type="color"
                    data-testid="character-outfit-color-picker"
                    value={draft.outfitColor}
                    onChange={(e) => updateDraft({ outfitColor: e.target.value })}
                    className="h-6 w-8 cursor-pointer rounded border border-[var(--ck-border)] bg-transparent p-0"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {OUTFIT_COLOR_SWATCHES.map((sw) => {
                  const active = draft.outfitColor.toLowerCase() === sw.hex.toLowerCase();
                  return (
                    <button
                      key={sw.hex}
                      type="button"
                      data-testid={`outfit-swatch-${sw.hex.slice(1)}`}
                      onClick={() => updateDraft({ outfitColor: sw.hex })}
                      title={lang === 'bn' ? sw.labelBn : sw.labelEn}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        active
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: sw.hex }}
                      />
                      <span>{lang === 'bn' ? sw.labelBn : sw.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[var(--ck-text-muted)]">
                    {L(lang, 'Lower Wear:', 'নিচের পোশাক:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {PANTS_COLOR_SWATCHES.map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() => updateDraft({ pantsColor: sw.hex })}
                        title={lang === 'bn' ? sw.labelBn : sw.labelEn}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${
                          draft.pantsColor.toLowerCase() === sw.hex.toLowerCase()
                            ? 'scale-110 border-[var(--ck-accent)]'
                            : 'border-[var(--ck-border)]'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[var(--ck-text-muted)]">
                    {L(lang, 'Skin Tone:', 'গায়ের রঙ:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {SKIN_TONE_SWATCHES.map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() => updateDraft({ skinTone: sw.hex })}
                        title={lang === 'bn' ? sw.labelBn : sw.labelEn}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${
                          draft.skinTone.toLowerCase() === sw.hex.toLowerCase()
                            ? 'scale-110 border-[var(--ck-accent)]'
                            : 'border-[var(--ck-border)]'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hair Style & Hair Color */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--ck-text)]">
                  {L(lang, 'Hairstyle & Hair Color', 'চুলের ধরন ও রঙ')}
                </span>
                <div className="flex items-center gap-1.5">
                  {HAIR_COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw.hex}
                      type="button"
                      onClick={() => updateDraft({ hairColor: sw.hex })}
                      title={lang === 'bn' ? sw.labelBn : sw.labelEn}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${
                        draft.hairColor.toLowerCase() === sw.hex.toLowerCase()
                          ? 'scale-110 border-[var(--ck-accent)]'
                          : 'border-[var(--ck-border)]'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {HAIR_STYLE_OPTIONS.map((hs) => {
                  const active = draft.hairStyleId === hs.id;
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      data-testid={`hairstyle-${hs.id}`}
                      onClick={() => updateDraft({ hairStyleId: hs.id })}
                      aria-pressed={active}
                      className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors ${
                        active
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      {lang === 'bn' ? hs.labelBn : hs.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Headwear (Tupi / Cap / Hat / Crown) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ck-text)]">
                <Crown className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>{L(lang, 'Hat, Cap & Tupi', 'টুপি, ক্যাপ ও হ্যাট')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HEADWEAR_OPTIONS.map((hw) => {
                  const active = draft.headwear === hw.id;
                  return (
                    <button
                      key={hw.id}
                      type="button"
                      data-testid={`headwear-${hw.id}`}
                      onClick={() => updateDraft({ headwear: hw.id })}
                      aria-pressed={active}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      {lang === 'bn' ? hw.labelBn : hw.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glasses & Traditional Accessories */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ck-text)]">
                <Glasses className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>{L(lang, 'Glasses & Accessories', 'চশমা ও অন্যান্য অনুষঙ্গ')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['hasGlasses', L(lang, 'Glasses', 'চশমা')],
                    ['hasMustache', L(lang, 'Mustache', 'গোঁফ')],
                    ['hasBeard', L(lang, 'Beard', 'দাড়ি')],
                    ['hasScarf', L(lang, 'Scarf / Orna', 'ওড়না / চাদর')],
                    ['hasGamchha', L(lang, 'Gamchha', 'গামছা')],
                    ['isFemale', L(lang, 'Female Silhouette', 'নারী চরিত্র')],
                  ] as const
                ).map(([key, label]) => {
                  const checked = draft[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      data-testid={`accessory-toggle-${key}`}
                      onClick={() => updateDraft({ [key]: !checked })}
                      aria-pressed={checked}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3 text-[var(--ck-accent)]" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lock Across All Scenes Toggle */}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3">
              <input
                type="checkbox"
                data-testid="lock-character-all-scenes"
                checked={draft.lockAcrossAllScenes}
                onChange={(e) => updateDraft({ lockAcrossAllScenes: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-[var(--ck-accent)]"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--ck-text)]">
                  <Lock className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                  <span>
                    {L(
                      lang,
                      'Keep this exact character across every scene in the story',
                      'পুরো গল্পের প্রতিটি দৃশ্যে এই একই চরিত্র ধরে রাখুন'
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Ensures consistent outfit, hair, glasses, and headwear from opening scene to finale.',
                    'শুরু থেকে শেষ পর্যন্ত প্রতিটি দৃশ্যে একই পোশাক, চুল, চশমা ও টুপি অক্ষুণ্ণ থাকবে।'
                  )}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ck-border-subtle)] bg-[var(--ck-surface)] px-5 py-3.5">
          <button
            type="button"
            data-testid="save-character-preset-btn"
            onClick={handleSavePreset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-3.5 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
          >
            {savedNotice ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--ck-success)]" />
                <span>{L(lang, 'Preset Saved', 'সংরক্ষিত হয়েছে')}</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>{L(lang, 'Save Preset', 'চরিত্র সেভ করুন')}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-[var(--ck-border)] px-3.5 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:text-[var(--ck-text)]"
            >
              {L(lang, 'Cancel', 'বাতিল')}
            </button>
            <button
              type="button"
              data-testid="apply-custom-character-btn"
              onClick={handleApply}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)]"
            >
              <UserCheck className="h-4 w-4" />
              <span>
                {hasActiveProject
                  ? L(lang, 'Apply to Story Now', 'গল্পে এখনই প্রয়োগ করুন')
                  : L(lang, 'Use This Character', 'এই চরিত্র ব্যবহার করুন')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
