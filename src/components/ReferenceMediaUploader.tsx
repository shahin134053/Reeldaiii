import React, { useRef, useState } from 'react';
import {
  Check,
  Film,
  Image as ImageIcon,
  Layers,
  Palette,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  ReferenceApplyMode,
  ReferenceMediaProfile,
  analyzeReferenceMediaFile,
  createSampleReferenceProfile,
} from '../lib/referenceMediaAnalyzer';
import { getWatermarkImage } from '../animation/renderer';
import { AppLang, L } from '../lib/i18n';

interface ReferenceMediaUploaderProps {
  lang: AppLang;
  referenceMedia: ReferenceMediaProfile | null;
  onChangeReference: (profile: ReferenceMediaProfile | null) => void;
  compact?: boolean;
}

export const ReferenceMediaUploader: React.FC<ReferenceMediaUploaderProps> = ({
  lang,
  referenceMedia,
  onChangeReference,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applyMode, setApplyMode] = useState<ReferenceApplyMode>(
    referenceMedia?.applyMode ?? 'style-and-palette'
  );

  const handleSelectFile = async (file: File) => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      const profile = await analyzeReferenceMediaFile(file, applyMode);
      if (profile.thumbnailDataUrl) {
        getWatermarkImage(profile.thumbnailDataUrl);
      }
      onChangeReference(profile);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : L(
              lang,
              'Could not analyze reference file. Please upload a PNG, JPG, WebP image or MP4/WebM video.',
              'রেফারেন্স ফাইলটি বিশ্লেষণ করা যায়নি। অনুগ্রহ করে PNG, JPG, WebP ইমেজ অথবা MP4/WebM ভিডিও দিন।'
            )
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySamplePreset = (
    preset: 'anime-sunset' | 'emerald-folklore' | 'midnight-cyber'
  ) => {
    setErrorMsg(null);
    const profile = createSampleReferenceProfile(preset, applyMode);
    if (profile.thumbnailDataUrl) {
      getWatermarkImage(profile.thumbnailDataUrl);
    }
    onChangeReference(profile);
  };

  const handleToggleApplyMode = (nextMode: ReferenceApplyMode) => {
    setApplyMode(nextMode);
    if (referenceMedia) {
      if (referenceMedia.thumbnailDataUrl) {
        getWatermarkImage(referenceMedia.thumbnailDataUrl);
      }
      onChangeReference({
        ...referenceMedia,
        applyMode: nextMode,
      });
    }
  };

  return (
    <div
      data-testid="reference-media-uploader"
      className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-3.5 sm:p-4 space-y-3"
    >
      <input
        ref={fileInputRef}
        type="file"
        data-testid="reference-media-file-input"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,.png,.jpg,.jpeg,.webp,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleSelectFile(f);
          e.target.value = '';
        }}
      />

      {/* Header Row */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ck-accent)]/35 bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]">
            {referenceMedia?.mediaType === 'video' ? (
              <Film className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--ck-text)]">
                {L(
                  lang,
                  'Reference Animation Image or Video (Optional)',
                  'রেফারেন্স অ্যানিমেশন ইমেজ বা ভিডিও (ঐচ্ছিক)'
                )}
              </span>
              {referenceMedia && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ck-success)]">
                  <Check className="h-3 w-3" />
                  <span>{L(lang, 'Matched', 'ম্যাচড')}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Upload a reference animation clip (.mp4/.webm) or style frame (.png/.jpg) to automatically match its color palette, lighting mood, camera motion, and atmosphere.',
                'আপনার পছন্দের কোনো অ্যানিমেশন ভিডিও (.mp4/.webm) বা রেফারেন্স ছবি (.png/.jpg) আপলোড করলে ঠিক সেই ধরনের কালার প্যালেট, লাইটিং ও অ্যানিমেশন স্টাইল অনুযায়ী দৃশ্য তৈরি হবে।'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {referenceMedia && (
            <button
              type="button"
              data-testid="clear-reference-media-btn"
              onClick={() => onChangeReference(null)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2.5 text-xs text-[var(--ck-text-muted)] transition-colors hover:text-[var(--ck-text)] whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />
              <span>{L(lang, 'Remove', 'মুছুন')}</span>
            </button>
          )}
          <button
            type="button"
            data-testid="upload-reference-media-btn"
            disabled={isAnalyzing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--ck-accent)]/60 bg-[var(--ck-accent-soft)] px-3 text-xs font-semibold text-[var(--ck-accent-soft-text)] transition-colors hover:bg-[var(--ck-accent-soft-hover)] disabled:opacity-50 whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {isAnalyzing
                ? L(lang, 'Analyzing Reference…', 'রেফারেন্স বিশ্লেষণ হচ্ছে…')
                : referenceMedia
                  ? L(lang, 'Change Reference', 'নতুন রেফারেন্স দিন')
                  : L(lang, 'Upload Image / Video', 'রেফারেন্স ইমেজ / ভিডিও দিন')}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Sample Reference Presets when no file is uploaded yet */}
      {!referenceMedia && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-[var(--ck-text-muted)]">
          <span>{L(lang, 'Or test a sample reference look:', 'অথবা রেডিমেড রেফারেন্স ট্রাই করুন:')}</span>
          <button
            type="button"
            data-testid="sample-ref-anime-sunset"
            onClick={() => handleApplySamplePreset('anime-sunset')}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1 text-[11px] font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
          >
            <span className="h-2 w-2 rounded-full bg-[#FF9E2C]" />
            <span>{L(lang, 'Anime Sunset Ref', 'অ্যানিমে সানসেট')}</span>
          </button>
          <button
            type="button"
            data-testid="sample-ref-emerald-folklore"
            onClick={() => handleApplySamplePreset('emerald-folklore')}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1 text-[11px] font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
          >
            <span className="h-2 w-2 rounded-full bg-[#34D399]" />
            <span>{L(lang, 'Emerald Folklore Ref', 'সবুজ রূপকথা')}</span>
          </button>
          <button
            type="button"
            data-testid="sample-ref-midnight-cyber"
            onClick={() => handleApplySamplePreset('midnight-cyber')}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1 text-[11px] font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
          >
            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
            <span>{L(lang, 'Midnight Cinema Ref', 'মিডনাইট সিনেমা')}</span>
          </button>
        </div>
      )}

      {/* Active Reference Preview & Extracted Style Card */}
      {referenceMedia && (
        <div
          data-testid="reference-media-active-card"
          className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface)] p-3 sm:grid-cols-12 sm:items-center"
        >
          {/* Thumbnail / Video Frame Preview */}
          <div className="relative overflow-hidden rounded-lg border border-[var(--ck-border)] bg-[#101015] sm:col-span-4 aspect-video">
            {referenceMedia.thumbnailDataUrl ? (
              <img
                src={referenceMedia.thumbnailDataUrl}
                alt={referenceMedia.fileName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ck-text-muted)]">
                {referenceMedia.fileName}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 py-1 text-[10px] font-mono text-white flex items-center justify-between">
              <span className="truncate">
                {referenceMedia.mediaType === 'video'
                  ? L(lang, 'VIDEO REF', 'ভিডিও রেফারেন্স')
                  : L(lang, 'IMAGE REF', 'ইমেজ রেফারেন্স')}
              </span>
              <span>
                {referenceMedia.width}×{referenceMedia.height}
                {referenceMedia.durationSec ? ` · ${referenceMedia.durationSec}s` : ''}
              </span>
            </div>
          </div>

          {/* Extracted Swatches, Style & Application Mode */}
          <div className="space-y-2.5 sm:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-[var(--ck-text)]">
                  {referenceMedia.fileName}
                </div>
                <div
                  data-testid="reference-matched-summary"
                  className="text-[11px] font-medium text-[var(--ck-accent)]"
                >
                  {lang === 'bn' ? referenceMedia.summaryBn : referenceMedia.summaryEn}
                </div>
              </div>

              {/* Extracted Color Swatches */}
              <div
                className="flex items-center gap-1.5"
                aria-label={L(lang, 'Extracted color swatches', 'রেফারেন্স থেকে নেওয়া রঙ')}
              >
                {referenceMedia.dominantSwatches.map((hex, idx) => (
                  <div
                    key={`${hex}-${idx}`}
                    className="flex items-center gap-1 rounded border border-[var(--ck-border)] bg-[var(--ck-inset)] px-1.5 py-0.5 text-[10px] font-mono"
                    title={hex}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm border border-black/20"
                      style={{ backgroundColor: hex }}
                    />
                    {!compact && <span>{hex}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Application Mode Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                data-testid="ref-mode-style-palette"
                onClick={() => handleToggleApplyMode('style-and-palette')}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  referenceMedia.applyMode === 'style-and-palette'
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                    : 'border-[var(--ck-border)] bg-[var(--ck-inset)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                }`}
              >
                <Palette className="h-3 w-3 text-[var(--ck-accent)]" />
                <span>
                  {L(
                    lang,
                    'Match Style, Palette & Lighting',
                    'স্টাইল, কালার ও লাইটিং মেলান'
                  )}
                </span>
              </button>

              <button
                type="button"
                data-testid="ref-mode-backdrop-overlay"
                onClick={() => handleToggleApplyMode('backdrop-overlay')}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  referenceMedia.applyMode === 'backdrop-overlay'
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                    : 'border-[var(--ck-border)] bg-[var(--ck-inset)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                }`}
              >
                <Layers className="h-3 w-3 text-[var(--ck-accent)]" />
                <span>
                  {L(
                    lang,
                    'Use as Scene Backdrop + Style',
                    'ব্যাকগ্রাউন্ড লেয়ার ও স্টাইল হিসেবে ব্যবহার'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-3 py-2 text-xs text-[var(--ck-danger-text)]"
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
};
