import { useEffect } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  Code2,
  Coffee,
  ExternalLink,
  Home,
  Mail,
  MapPin,
  User,
} from 'lucide-react';
import { DEVELOPER_PROFILE, DeveloperSocialPlatform } from '../lib/developerProfile';
import { normalizeExternalUrl } from '../lib/appNavigation';
import { AppLang, L } from '../lib/i18n';
import { REELDAIII_BRAND } from '../lib/brandAssets';
import { ensureSupportKoriWidgetMounted, openSupportKoriPopup } from '../lib/supportKoriWidget';

interface DeveloperPageProps {
  lang: AppLang;
  onEnterStudio: () => void;
  onGoHome: () => void;
}

function SocialPlatformSvg({
  platform,
  className = 'h-5 w-5',
}: {
  platform: DeveloperSocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case 'linkedin':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case 'github':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
        >
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
        >
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
      );
    case 'email':
    default:
      return <Mail className={className} aria-hidden="true" />;
  }
}

function getPlatformIconStyle(platform: DeveloperSocialPlatform): string {
  switch (platform) {
    case 'linkedin':
      return 'bg-[#0A66C2]/15 text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#3897F0] border-[#0A66C2]/30 group-hover:bg-[#0A66C2] group-hover:text-white';
    case 'github':
      return 'bg-[var(--ck-surface-alt)] text-[var(--ck-text)] border-[var(--ck-border-strong)] group-hover:bg-[var(--ck-text)] group-hover:text-[var(--ck-bg)]';
    case 'facebook':
      return 'bg-[#1877F2]/15 text-[#1877F2] dark:bg-[#1877F2]/20 dark:text-[#4599FF] border-[#1877F2]/30 group-hover:bg-[#1877F2] group-hover:text-white';
    case 'email':
    default:
      return 'bg-[var(--ck-accent)]/15 text-[var(--ck-accent)] border-[var(--ck-accent)]/35 group-hover:bg-[var(--ck-accent)] group-hover:text-[var(--ck-accent-fg)]';
  }
}

export function DeveloperPage({ lang, onEnterStudio, onGoHome }: DeveloperPageProps) {
  const profile = DEVELOPER_PROFILE;
  const displayName = lang === 'bn' ? profile.nameBn : profile.nameEn;
  const displayNamePlaceholder =
    lang === 'bn' ? profile.namePlaceholderBn : profile.namePlaceholderEn;
  const displayRole = lang === 'bn' ? profile.roleBn : profile.roleEn;
  const displayLocation = lang === 'bn' ? profile.locationBn : profile.locationEn;
  const displayLocationPlaceholder =
    lang === 'bn' ? profile.locationPlaceholderBn : profile.locationPlaceholderEn;
  const displayBio = lang === 'bn' ? profile.bioBn : profile.bioEn;
  const displayBioPlaceholder = lang === 'bn' ? profile.bioPlaceholderBn : profile.bioPlaceholderEn;
  const displayMission = lang === 'bn' ? profile.missionBn : profile.missionEn;
  const focusAreas = lang === 'bn' ? profile.focusAreasBn : profile.focusAreasEn;

  useEffect(() => {
    ensureSupportKoriWidgetMounted();
  }, []);

  return (
    <div className="space-y-12 pt-2 sm:pt-4" data-testid="developer-page">
      {/* Editorial Header */}
      <section className="max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ck-text-muted)]">
          <span className="font-semibold text-[var(--ck-accent)]">
            {L(lang, 'Developer Profile', 'ডেভেলপার পরিচিতি')}
          </span>
          <span aria-hidden="true">·</span>
          <span>Reeldaiii</span>
          <span aria-hidden="true">·</span>
          <span>{L(lang, '2D Animation Studio', '২ডি অ্যানিমেশন স্টুডিও')}</span>
        </div>

        <h1
          className="font-display font-semibold leading-[1.18] tracking-tight text-[var(--ck-text)]"
          style={{ fontSize: 'clamp(2rem, 3.2vw, 2.9rem)' }}
        >
          {L(lang, 'Creator & Software Overview', 'নির্মাতা ও সফটওয়্যার পরিচিতি')}
        </h1>

        <p className="text-[15px] leading-relaxed text-[var(--ck-text-muted)]">
          {profile.isCustomized
            ? displayMission
            : L(
                lang,
                'The developer’s personal name, portrait, biography, and contact links will be updated directly in the dedicated slots below once shared.',
                'ডেভেলপারের ব্যক্তিগত নাম, ছবি, বায়ো এবং যোগাযোগের তথ্য শেয়ার করার সাথে সাথেই নিচের নির্ধারিত ঘরগুলোতে আপডেট করা হবে।'
              )}
        </p>
      </section>

      {/* Main 2-Column Developer Profile & Engineering Info */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Identity, Social Icon Cards & SupportKori Column */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 space-y-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {profile.photoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={profile.photoUrl}
                    alt={displayName || L(lang, 'Developer profile photo', 'ডেভেলপার প্রোফাইল ছবি')}
                    data-testid="developer-profile-photo"
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-[var(--ck-accent)]/45 bg-[var(--ck-surface-alt)] object-cover object-top shadow-md shrink-0"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--ck-surface)] bg-[var(--ck-accent)] text-[10px] font-bold text-[var(--ck-accent-fg)] shadow-sm"
                    title="Creator — Reeldaiii"
                  >
                    ✓
                  </span>
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-3"
                >
                  <img
                    src={REELDAIII_BRAND.faviconUrl}
                    alt="Reeldaiii"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <div className="min-w-0 space-y-1.5">
                <div className="font-display text-xl font-semibold text-[var(--ck-text)]">
                  {displayName ?? L(lang, 'Developer Name', 'ডেভেলপারের নাম')}
                </div>
                <div className="text-xs leading-snug text-[var(--ck-text-muted)]">{displayRole}</div>

                {/* Quick 1-Click Icon Bar */}
                <div
                  className="flex flex-wrap items-center gap-2 pt-1"
                  aria-label={L(lang, 'Quick social icon links', 'সোশ্যাল আইকন লিংক')}
                >
                  {profile.contactSlots.map((slot) => {
                    const safeHref = normalizeExternalUrl(slot.href);
                    if (!safeHref) return null;
                    const platformTitle = lang === 'bn' ? slot.platformNameBn : slot.platformNameEn;
                    const displayHandle = lang === 'bn' ? slot.displayNameBn : slot.displayNameEn;
                    return (
                      <a
                        key={`quick-icon-${slot.id}`}
                        href={safeHref}
                        target={safeHref.startsWith('mailto:') ? undefined : '_blank'}
                        rel={safeHref.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                        data-testid={`dev-quick-icon-${slot.id}`}
                        aria-label={`${platformTitle} — ${displayHandle}`}
                        title={`${platformTitle} (${displayHandle})`}
                        className="group inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
                      >
                        <SocialPlatformSvg platform={slot.id} className="h-4 w-4" />
                      </a>
                    );
                  })}

                  <button
                    type="button"
                    data-testid="dev-quick-icon-support"
                    onClick={openSupportKoriPopup}
                    aria-label={L(
                      lang,
                      'Support Shahin — Buy Me a Coffee',
                      'Support Shahin — এক কাপ কফি খাওয়ান'
                    )}
                    title={L(
                      lang,
                      'Support Shahin (Buy Me a Coffee)',
                      'Support Shahin (এক কাপ কফি খাওয়ান)'
                    )}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FFDD00] px-2.5 text-xs font-bold text-[#111111] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00]"
                  >
                    <Coffee className="h-3.5 w-3.5 shrink-0" />
                    <span>{L(lang, 'Support', 'সাপোর্ট')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[var(--ck-border-subtle)] pt-5 text-xs sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ck-accent)]" />
                <div className="min-w-0">
                  <div className="text-[var(--ck-text-faint)]">
                    {L(lang, 'Full Name', 'পূর্ণ নাম')}
                  </div>
                  <div className="mt-0.5 font-medium text-[var(--ck-text-secondary)]">
                    {displayName ?? displayNamePlaceholder}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ck-accent)]" />
                <div className="min-w-0">
                  <div className="text-[var(--ck-text-faint)]">
                    {L(lang, 'Location', 'অবস্থান')}
                  </div>
                  <div className="mt-0.5 font-medium text-[var(--ck-text-secondary)]">
                    {displayLocation ?? displayLocationPlaceholder}
                  </div>
                </div>
              </div>
            </div>

            {/* Eye-Catching Icon-Based Social & Contact Cards (No raw URLs) */}
            <div className="space-y-3 border-t border-[var(--ck-border-subtle)] pt-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--ck-text)]">
                  {L(lang, 'Connect & Follow', 'সোশ্যাল প্রোফাইল ও যোগাযোগ')}
                </span>
                <span className="text-[11px] text-[var(--ck-text-muted)]">
                  {L(lang, 'Click any icon card to visit', 'আইকন কার্ডে ক্লিক করুন')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {profile.contactSlots.map((slot) => {
                  const safeHref = normalizeExternalUrl(slot.href);
                  const platformTitle = lang === 'bn' ? slot.platformNameBn : slot.platformNameEn;
                  const displayHandle = lang === 'bn' ? slot.displayNameBn : slot.displayNameEn;
                  const actionHint = lang === 'bn' ? slot.actionHintBn : slot.actionHintEn;

                  if (!safeHref) return null;

                  return (
                    <a
                      key={slot.id}
                      href={safeHref}
                      target={safeHref.startsWith('mailto:') ? undefined : '_blank'}
                      rel={safeHref.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      data-testid={`dev-social-card-${slot.id}`}
                      aria-label={`${platformTitle}: ${displayHandle}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--ck-accent)] hover:bg-[var(--ck-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${getPlatformIconStyle(
                            slot.id
                          )}`}
                        >
                          <SocialPlatformSvg platform={slot.id} className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-[var(--ck-text)] group-hover:text-[var(--ck-accent)]">
                            {platformTitle}
                          </div>
                          <div className="truncate text-[11px] font-medium text-[var(--ck-text-secondary)]">
                            {displayHandle}
                          </div>
                          <div className="truncate text-[10px] text-[var(--ck-text-muted)]">
                            {actionHint}
                          </div>
                        </div>
                      </div>

                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--ck-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--ck-accent)]" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dedicated SupportKori / Buy Me a Coffee Card */}
          <div
            data-testid="developer-supportkori-card"
            className="rounded-xl border border-[#FFDD00]/45 bg-[var(--ck-surface)] p-6 space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFDD00] text-[#111111] shadow-sm">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[var(--ck-accent)]">
                  {L(lang, 'Support the Creator · SupportKori', 'প্রজেক্টে সাপোর্ট করুন · SupportKori')}
                </div>
                <h2 className="font-display text-lg font-semibold text-[var(--ck-text)]">
                  {L(
                    lang,
                    'Buy Md Shahin a Coffee',
                    'ডেভেলপার মোঃ শাহীনকে এক কাপ কফি খাওয়ান'
                  )}
                </h2>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--ck-text-secondary)]">
              {L(
                lang,
                'Enjoying Reeldaiii for your 2D animated stories? You can support Md Shahin directly with a coffee or donation via the SupportKori popup widget.',
                'Reeldaiii দিয়ে অ্যানিমেশন ভিডিও তৈরি আপনার ভালো লাগলে বা কাজে আসলে নিচের বাটনে ক্লিক করে সরাসরি পপ-আপ উইজেটের মাধ্যমে ডেভেলপার মোঃ শাহীনকে কফি বা ডোনেশন দিয়ে সাপোর্ট করতে পারেন।'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                data-testid="dev-open-supportkori-popup-btn"
                onClick={openSupportKoriPopup}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FFDD00] px-4 text-xs font-bold text-[#111111] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00] whitespace-nowrap shrink-0"
              >
                <Coffee className="h-4 w-4 shrink-0" />
                <span>
                  {L(lang, 'Support Shahin (Open Popup)', 'Support Shahin (পপ-আপ খুলুন)')}
                </span>
              </button>

              <a
                href={profile.supportKori.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="dev-supportkori-external-link"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-3.5 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0"
              >
                <span>{L(lang, 'SupportKori Profile', 'SupportKori পেইজ')}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Bio, Vision & Technical Stack Column */}
        <div className="space-y-8 lg:col-span-7">
          {/* Developer Bio & Mission */}
          <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 sm:p-7 space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-[var(--ck-text)]">
                {L(lang, 'About the Developer', 'ডেভেলপার সম্পর্কে')}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ck-text-secondary)]">
                {displayBio ?? displayBioPlaceholder}
              </p>
            </div>

            <div className="space-y-2 border-t border-[var(--ck-border-subtle)] pt-5">
              <h3 className="font-display text-base font-semibold text-[var(--ck-text)]">
                {L(lang, 'Vision & Product Philosophy', 'সফটওয়্যারটির লক্ষ্য ও দর্শন')}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--ck-text-muted)]">{displayMission}</p>
            </div>

            <div className="space-y-2.5 border-t border-[var(--ck-border-subtle)] pt-5">
              <h3 className="font-display text-base font-semibold text-[var(--ck-text)]">
                {L(lang, 'Core Engineering Focus', 'মূল কাজের ক্ষেত্র')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--ck-text-secondary)]">
                {focusAreas.map((area, index) => (
                  <li key={area} className="flex items-start gap-3">
                    <span className="font-mono text-xs tabular-nums text-[var(--ck-accent)] pt-0.5">
                      0{index + 1}.
                    </span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Software Technical Architecture */}
          <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[var(--ck-accent)]" />
              <h2 className="font-display text-xl font-semibold text-[var(--ck-text)]">
                {L(lang, 'Technical Architecture', 'সফটওয়্যারের কারিগরি কাঠামো')}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-[var(--ck-border-subtle)] pt-5 sm:grid-cols-2">
              {profile.techStack.map((tech) => (
                <div key={tech.label} className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--ck-text)]">{tech.label}</div>
                  <p className="text-xs leading-relaxed text-[var(--ck-text-muted)]">
                    {lang === 'bn' ? tech.detailBn : tech.detailEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quick Navigation Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEnterStudio}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-5 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              <Clapperboard className="h-4 w-4" />
              <span>{L(lang, 'Open Dedicated Studio', 'ডেডিকেটেড স্টুডিওতে যান')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-4 text-sm font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              <Home className="h-4 w-4 text-[var(--ck-accent)]" />
              <span>{L(lang, 'Back to Home', 'হোম পেইজে ফিরুন')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
