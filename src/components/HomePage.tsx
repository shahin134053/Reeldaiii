import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Coffee,
  ExternalLink,
  Film,
  Mic,
  Palette,
  Play,
  SlidersHorizontal,
  Subtitles,
} from 'lucide-react';
import heroStudioImg from '../assets/images/hero_story_studio_1795308517822.jpg';
import { HomeShowcaseStory } from '../lib/manualContent';
import { HomeLiveStage } from './HomeLiveStage';
import { AppLang, L } from '../lib/i18n';
import { REELDAIII_BRAND } from '../lib/brandAssets';
import { DEVELOPER_PROFILE } from '../lib/developerProfile';
import { ensureSupportKoriWidgetMounted, openSupportKoriPopup } from '../lib/supportKoriWidget';
import { LivePresenceState } from '../lib/useLivePresence';
import { LiveOnlineBanner } from './LivePresenceCorner';

interface HomePageProps {
  lang: AppLang;
  presence: LivePresenceState;
  onEnterStudio: () => void;
  onOpenVoiceRecorder?: () => void;
  onLaunchDemo: () => void;
  onOpenManual: () => void;
  onOpenDeveloper: () => void;
  onTryStoryInStudio: (story: HomeShowcaseStory) => void;
  savedDraftCount: number;
}

export function HomePage({
  lang,
  presence,
  onEnterStudio,
  onOpenVoiceRecorder,
  onLaunchDemo,
  onOpenManual,
  onOpenDeveloper,
  onTryStoryInStudio,
  savedDraftCount,
}: HomePageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    ensureSupportKoriWidgetMounted();
  }, []);

  const useCases = [
    {
      number: L(lang, '01', '০১'),
      audience: L(lang, 'YouTube Creators · 16:9 Landscape', 'ইউটিউব ক্রিয়েটর · ১৬:৯ ল্যান্ডস্কেপ'),
      title: L(
        lang,
        'Storytelling, Motivation & Documentary Channels',
        'গল্প, মোটিভেশন ও ডকুমেন্টারি চ্যানেল'
      ),
      description: L(
        lang,
        'Upload your voiceover and SRT file to automatically build distinct 2D scenes for every sentence, paired with phonetic lip-sync and crisp 4K UHD export.',
        'ভয়েসওভার ও SRT আপলোড করলেই প্রতিটি বাক্যের ভাব অনুযায়ী আলাদা ২ডি দৃশ্য, ফনেটিক লিপ-সিঙ্ক এবং ৪কে (4K UHD) ভিডিও তৈরি হয়ে যাবে।'
      ),
    },
    {
      number: L(lang, '02', '০২'),
      audience: L(lang, 'Reels & Shorts · 9:16 Vertical', 'রিলস ও শর্টস · ৯:১৬ ভার্টিকাল'),
      title: L(
        lang,
        'YouTube Shorts, Instagram Reels & TikTok',
        'ফেসবুক রিলস, ইউটিউব শর্টস ও টিকটক'
      ),
      description: L(
        lang,
        'Generate vertical videos from the exact same project with smart subject zoom, 9:16 safe-zone framing, and kinetic animated subtitles.',
        'একই গল্প থেকে স্মার্ট সাবজেক্ট জুম ও ৯:১৬ সেফ-জোন ফ্রেমিংয়ে স্বয়ংক্রিয় ভার্টিকাল ভিডিও — সাথে কাইনেটিক বাংলা সাবটাইটেল।'
      ),
    },
    {
      number: L(lang, '03', '০৩'),
      audience: L(lang, 'Educators, Authors & Podcasters', 'শিক্ষক, লেখক ও পডকাস্টার'),
      title: L(
        lang,
        'Fables, Educational Lessons & Visual Audiobooks',
        'শিশুতোষ রূপকথা, শিক্ষামূলক পাঠ ও অডিওবুক'
      ),
      description: L(
        lang,
        'Bring narrations and audiobooks to life across 32+ illustrated worlds—forests, deserts, villages, courtrooms, libraries, and outer space.',
        'জঙ্গল, মরুভূমি, গ্রামবাংলা, মহাকাশ, আদালত বা লাইব্রেরির মতো ৩২+ পরিবেশে আপনার লেখা বা অডিওবুককে জীবন্ত ভিজ্যুয়াল গল্পে রূপ দিন।'
      ),
    },
  ];

  const quickSteps = [
    {
      step: L(lang, '01', '০১'),
      title: L(lang, 'Add Audio, SRT or Script', 'অডিও, SRT বা স্ক্রিপ্ট দিন'),
      detail: L(
        lang,
        'Drop .mp3/.wav audio and .srt subtitles, or paste your story script directly for an instant preview.',
        '.mp3/.wav ও .srt ড্রপ করুন, অথবা অডিও ছাড়াই সরাসরি বাংলা গল্প লিখুন।'
      ),
    },
    {
      step: L(lang, '02', '০২'),
      title: L(lang, 'Smart Analysis & Scene Direction', 'স্মার্ট বিশ্লেষণ ও দৃশ্য তৈরি'),
      detail: L(
        lang,
        'The engine reads setting, time of day, weather, and emotion to stage custom 2D worlds and phonetic lip-sync.',
        'গল্পের স্থান, সময় ও আবেগ বুঝে প্রতিটি বাক্যের জন্য আলাদা ২ডি দৃশ্য ও লিপ-সিঙ্ক সাজানো হয়।'
      ),
    },
    {
      step: L(lang, '03', '০৩'),
      title: L(lang, 'Redesign, Fine-Tune & Export 4K', 'রিডিজাইন, এডিট ও ৪কে এক্সপোর্ট'),
      detail: L(
        lang,
        'Remix the full look in one click, fine-tune timing on the waveform, and download 16:9 & 9:16 MP4 or WebM.',
        'এক ক্লিকে ডিজাইন বদলান, টাইমলাইন ঠিক করুন এবং ১৬:৯ ও ৯:১৬ ভিডিও ডাউনলোড করুন।'
      ),
    },
  ];

  const studioHighlights = [
    {
      icon: Mic,
      title: L(lang, '10-Shape Viseme Lip-Sync', '১০টি ভিসেম ফনেটিক লিপ-সিঙ্ক'),
      detail: L(
        lang,
        'Natural lip, jaw, and expression synchronization aligned to English & Bengali phonetics and vocal energy.',
        'বাংলা ও ইংরেজি উচ্চারণের সাথে চরিত্রের ঠোঁট, চোয়াল ও অভিব্যক্তির স্বাভাবিক সিঙ্ক।'
      ),
    },
    {
      icon: Palette,
      title: L(lang, 'One-Click Redesign & Undo', 'এক-ক্লিক রিডিজাইন ও Undo'),
      detail: L(
        lang,
        'Switch framing layouts, color palettes, and art styles instantly while keeping full Undo version history.',
        'ডিজাইন ভালো না লাগলে মুহূর্তেই নতুন লেআউট ও কালার প্যালেট বদলে নিন।'
      ),
    },
    {
      icon: SlidersHorizontal,
      title: L(lang, 'Timeline & BGM Auto-Ducking', 'টাইমলাইন ও BGM অটো-ডাকিং'),
      detail: L(
        lang,
        'Split or merge chapters, nudge SRT offset in milliseconds, and balance emotion-matched background music.',
        'সিন Split/Merge, SRT ±০.১ সেকেন্ড সিঙ্ক এবং কথার সাথে মানানসই মিউজিক ব্যালেন্স।'
      ),
    },
    {
      icon: Subtitles,
      title: L(lang, 'Custom Subtitles & Branding', 'সাবটাইটেল ও চ্যানেল ব্র্যান্ডিং'),
      detail: L(
        lang,
        'Style bilingual captions with custom fonts, colors, placement, and add your own channel logo watermark.',
        'দ্বিভাষিক সাবটাইটেল ফন্ট, রঙ, অবস্থান ও নিজস্ব চ্যানেল ওয়াটারমার্ক যুক্ত করুন।'
      ),
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20" data-testid="home-front-page">
      {/* Section 1: Clean Focal Hero Proposition */}
      <section className="space-y-8 pt-2 sm:pt-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
          <div className="flex flex-col justify-between space-y-6 lg:col-span-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ck-text-muted)]">
                <img
                  src={REELDAIII_BRAND.faviconUrl}
                  alt="Reeldaiii icon"
                  className="h-4 w-4 rounded-sm object-contain shrink-0"
                />
                <span className="font-semibold text-[var(--ck-accent)]">Reeldaiii</span>
                <span aria-hidden="true">·</span>
                <span>
                  {L(
                    lang,
                    'Context-Aware 2D Storytelling Animation',
                    'কনটেক্সট-অ্যাওয়্যার ২ডি স্টোরি অ্যানিমেশন'
                  )}
                </span>
                <span aria-hidden="true">·</span>
                <span>{L(lang, '16:9 & 9:16', '১৬:৯ ও ৯:১৬')}</span>
              </div>

              <h1
                className="font-display font-semibold leading-[1.14] tracking-tight text-[var(--ck-text)] text-balance"
                style={{ fontSize: 'clamp(2.1rem, 3.6vw, 3.35rem)' }}
              >
                {L(
                  lang,
                  'Turn Your Voiceover & Script into Living 2D Animation',
                  'আপনার ভয়েসওভার ও গল্প থেকে তৈরি হবে জীবন্ত ২ডি অ্যানিমেশন'
                )}
              </h1>

              <p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--ck-text-secondary)] sm:text-base">
                {L(
                  lang,
                  'No repetitive stock loops. Analyze your voiceover audio, SRT subtitles, or written story to generate matched 2D scenes, expressive lip-sync, and 4K videos for YouTube & Reels directly in your browser.',
                  'কোনো র‍্যান্ডম ভিডিও লুপ নয়। আপনার অডিও, SRT সাবটাইটেল কিংবা বাংলা-ইংরেজি স্ক্রিপ্ট বুঝে প্রতিটি বাক্যের সাথে মানানসই দৃশ্যপট, চরিত্রের লিপ-সিঙ্ক এবং ইউটিউব ও রিলসের ভিডিও সরাসরি ব্রাউজারেই তৈরি করুন।'
                )}
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="home-enter-studio-btn"
                  onClick={onEnterStudio}
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[var(--ck-accent)] px-6 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ck-bg)]"
                >
                  <Clapperboard className="h-4 w-4" />
                  <span>{L(lang, 'Start Creating Free', 'ভিডিও তৈরি শুরু করুন')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  data-testid="home-demo-btn"
                  onClick={onLaunchDemo}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-5 text-sm font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] hover:bg-[var(--ck-surface-alt)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
                >
                  <Play className="h-4 w-4 text-[var(--ck-accent)]" />
                  <span>{L(lang, 'Watch Demo Film', 'ডেমো ফিল্ম দেখুন')}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--ck-text-muted)]">
                <button
                  type="button"
                  data-testid="home-hero-manual-link"
                  onClick={onOpenManual}
                  className="inline-flex items-center gap-1.5 font-medium text-[var(--ck-accent)] underline-offset-4 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{L(lang, 'Read Complete User Manual', 'বিস্তারিত ইউজার ম্যানুয়াল পড়ুন')}</span>
                </button>
                <span aria-hidden="true">·</span>
                <span>{L(lang, 'No paid API key required', 'কোনো পেইড কী লাগে না')}</span>
                {savedDraftCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={onEnterStudio}
                      className="font-medium text-[var(--ck-text-secondary)] underline-offset-4 hover:text-[var(--ck-accent)] hover:underline"
                    >
                      {L(
                        lang,
                        `Saved Drafts (${savedDraftCount})`,
                        `সংরক্ষিত ড্রাফট (${savedDraftCount}টি)`
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Focal 16:9 Artwork */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[260px] overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[#101014]">
              {!heroImgFailed ? (
                <img
                  src={heroStudioImg}
                  alt={L(
                    lang,
                    'Reeldaiii workspace showcasing synchronized 16:9 landscape and 9:16 vertical 2D storytelling animation',
                    'Reeldaiii ওয়ার্কস্পেসে ১৬:৯ ল্যান্ডস্কেপ ও ৯:১৬ ভার্টিকাল টু-ডি বাংলা গল্পের দৃশ্য'
                  )}
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 bg-[#121218] p-8 text-center">
                  <Film className="h-10 w-10 text-[#FFAC1C]" />
                  <p className="font-display text-lg text-[#F4F3EF]">Reeldaiii 2D Studio</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#09090B]/95 via-[#09090B]/65 to-transparent px-5 pb-4 pt-14">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#D6D4CE]">
                  <span className="font-medium text-[#F4F3EF]">
                    {L(
                      lang,
                      'Dual 16:9 YouTube & 9:16 Reels Studio',
                      'ডুয়াল ১৬:৯ ইউটিউব ও ৯:১৬ রিলস স্টুডিও'
                    )}
                  </span>
                  <span className="font-mono tabular-nums text-[#E5A93C]">
                    4K UHD · 1080p · 720p
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Genuine Live Online User Counter (100 = 0 baseline, 101 = 1 user, unlimited scaling) */}
        <LiveOnlineBanner lang={lang} presence={presence} />

        {/* Clean 4-Metric Proof Strip */}
        <div className="grid grid-cols-2 gap-y-6 border-y border-[var(--ck-border-subtle)] py-6 sm:grid-cols-4 sm:divide-x sm:divide-[var(--ck-border-subtle)]">
          <div className="pr-4 sm:px-5 first:sm:pl-0">
            <div className="font-display text-2xl font-semibold tabular-nums text-[var(--ck-text)]">
              {L(lang, '32+', '৩২+')}
            </div>
            <div className="mt-1 text-xs text-[var(--ck-text-muted)]">
              {L(lang, 'Story-Matched 2D Worlds', 'গল্প-সামঞ্জস্যপূর্ণ ২ডি পরিবেশ')}
            </div>
          </div>
          <div className="pl-4 sm:px-5">
            <div className="font-display text-2xl font-semibold tabular-nums text-[var(--ck-text)]">
              {L(lang, '10', '১০টি')}
            </div>
            <div className="mt-1 text-xs text-[var(--ck-text-muted)]">
              {L(lang, 'Phonetic Viseme Lip-Sync Shapes', 'ফনেটিক ভিসেম লিপ-সিঙ্ক শেপ')}
            </div>
          </div>
          <div className="pr-4 sm:px-5">
            <div className="font-display text-2xl font-semibold tabular-nums text-[var(--ck-text)]">
              {L(lang, '16:9 & 9:16', '১৬:৯ ও ৯:১৬')}
            </div>
            <div className="mt-1 text-xs text-[var(--ck-text-muted)]">
              {L(lang, 'Dual Formats from One Project', 'এক প্রোজেক্টে দুটি ফরম্যাট')}
            </div>
          </div>
          <div className="pl-4 sm:px-5">
            <div className="font-display text-2xl font-semibold tabular-nums text-[var(--ck-text)]">
              {L(lang, '4K UHD', '৪কে UHD')}
            </div>
            <div className="mt-1 text-xs text-[var(--ck-text-muted)]">
              {L(lang, 'Direct Browser MP4 & WebM Export', 'সরাসরি ব্রাউজার ভিডিও রেন্ডার')}
            </div>
          </div>
        </div>
      </section>

      {/* Section 1.5: Human-Touch Voiceover Creation (ElevenLabs, Cartesia AI & Built-In Studio Recorder) */}
      <section
        data-testid="home-voiceover-partners-section"
        aria-labelledby="voiceover-partners-heading"
        className="rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-5 sm:p-7 space-y-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ck-accent)]">
              <Mic className="h-3.5 w-3.5" />
              <span>
                {L(
                  lang,
                  'Create Human-Touch Voiceovers or Record Live',
                  'হিউম্যান-টাচ ভয়েসওভার তৈরি বা সরাসরি রেকর্ড করুন'
                )}
              </span>
            </div>
            <h2
              id="voiceover-partners-heading"
              className="font-display text-xl font-semibold tracking-tight text-[var(--ck-text)] sm:text-2xl text-balance"
            >
              {L(
                lang,
                'Need a lifelike voiceover? Try ElevenLabs & Cartesia AI — or record right here',
                'প্রাকৃতিক হিউম্যান-টাচ ভয়েসওভার চাইলে ElevenLabs ও Cartesia AI ব্যবহার করুন — অথবা আমাদের স্টুডিওতেই ভয়েস রেকর্ড করুন'
              )}
            </h2>
            <p className="text-xs leading-relaxed text-[var(--ck-text-muted)] sm:text-sm">
              {L(
                lang,
                'Click either logo below to create natural, emotional voiceovers on ElevenLabs or Cartesia AI, or use Reeldaiii Studio’s built-in microphone recorder with live script teleprompter.',
                'নিচের যেকোনো লোগোতে ক্লিক করে ElevenLabs অথবা Cartesia AI থেকে প্রাকৃতিক হিউম্যান-টাচ ভয়েসওভার তৈরি করুন, অথবা আলাদা কোনো অ্যাপ ছাড়াই সরাসরি আমাদের স্টুডিওতে নিজের ভয়েস রেকর্ড করে অ্যানিমেশন বানান।'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1: ElevenLabs (Clickable Logo + Website Link) */}
          <a
            href="https://elevenlabs.io/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="home-partner-elevenlabs"
            aria-label="ElevenLabs — Create Human-Touch AI Voiceovers (opens elevenlabs.io)"
            className="group flex flex-col justify-between rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--ck-accent)] hover:bg-[var(--ck-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                {/* ElevenLabs Clickable Brand Logo Emblem + Wordmark */}
                <div className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--ck-border-strong)] bg-[#0E0F12] px-3 py-2 text-white shadow-sm group-hover:border-[var(--ck-accent)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5 text-white shrink-0"
                  >
                    <rect x="7" y="4" width="3.5" height="16" rx="1" />
                    <rect x="13.5" y="4" width="3.5" height="16" rx="1" />
                  </svg>
                  <span className="font-sans text-sm font-bold tracking-tight text-white">
                    ElevenLabs
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ck-text-muted)] group-hover:text-[var(--ck-accent)]">
                  <span>{L(lang, 'Suggested', 'সাজেস্টেড')}</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--ck-text)] group-hover:text-[var(--ck-accent)]">
                  ElevenLabs · {L(lang, 'Human-Touch AI Voice', 'হিউম্যান-টাচ AI ভয়েস')}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Generate warm, lifelike storytelling narration with natural emotion and breath pacing in Bengali or English.',
                    'গল্প বলার মতো আবেগপূর্ণ, প্রাণবন্ত এবং প্রাকৃতিক হিউম্যান-টাচ ভয়েসওভার তৈরি করে MP3 ডাউনলোড করুন।'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--ck-border-subtle)] pt-3 text-xs font-semibold text-[var(--ck-accent)]">
              <span>{L(lang, 'Open elevenlabs.io', 'লোগোতে ক্লিক করে ভিজিট করুন')}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>

          {/* Card 2: Cartesia AI (Clickable Logo + Website Link) */}
          <a
            href="https://play.cartesia.ai/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="home-partner-cartesia"
            aria-label="Cartesia AI — Create Expressive Human-Like Voiceovers (opens play.cartesia.ai)"
            className="group flex flex-col justify-between rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--ck-accent)] hover:bg-[var(--ck-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                {/* Cartesia AI Clickable Brand Logo Emblem + Wordmark */}
                <div className="inline-flex items-center gap-2.5 rounded-lg border border-[#38BDF8]/35 bg-[#0B111E] px-3 py-2 text-white shadow-sm group-hover:border-[#38BDF8]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="9.5" stroke="#38BDF8" strokeWidth="1.8" />
                    <path
                      d="M6.5 12c1.2-3.5 2.6-3.5 3.8 0s2.5 3.5 3.7 0 2.3-3.5 3.5 0"
                      stroke="#7DD3FC"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-sans text-sm font-bold tracking-tight text-white">
                    Cartesia <span className="text-[#38BDF8]">AI</span>
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ck-text-muted)] group-hover:text-[var(--ck-accent)]">
                  <span>{L(lang, 'Suggested', 'সাজেস্টেড')}</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--ck-text)] group-hover:text-[var(--ck-accent)]">
                  Cartesia AI · {L(lang, 'Ultra-Realistic Sonic Voice', 'বাস্তবসম্মত ভয়েস স্টুডিও')}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Craft crisp, human-like conversational narrations and character dialogues in seconds via Cartesia Playground.',
                    'দ্রুত সময়ে স্পষ্ট ও মানুষের কণ্ঠের মতো সাবলীল ডায়ালগ এবং স্টোরি ভয়েসওভার তৈরি করতে চমৎকার।'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--ck-border-subtle)] pt-3 text-xs font-semibold text-[var(--ck-accent)]">
              <span>{L(lang, 'Open play.cartesia.ai', 'লোগোতে ক্লিক করে ভিজিট করুন')}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>

          {/* Card 3: Built-In Reeldaiii Studio Voice Recorder */}
          <button
            type="button"
            data-testid="home-open-voice-recorder-btn"
            onClick={onOpenVoiceRecorder ?? onEnterStudio}
            className="group flex flex-col justify-between rounded-xl border border-[var(--ck-accent)]/45 bg-[var(--ck-accent-soft)] p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--ck-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <div className="space-y-3.5 w-full">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--ck-accent)]/40 bg-[var(--ck-surface)] px-3 py-2 shadow-sm">
                  <img
                    src={REELDAIII_BRAND.faviconUrl}
                    alt="Reeldaiii Studio"
                    className="h-5 w-5 object-contain shrink-0"
                  />
                  <span className="font-display text-sm font-bold text-[var(--ck-text)]">
                    Reeldaiii Studio
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--ck-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--ck-accent-fg)]">
                  <Mic className="h-3 w-3" />
                  <span>{L(lang, 'Built-In', 'ইন-ব্রাউজার')}</span>
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--ck-text)]">
                  {L(
                    lang,
                    'Or Record Your Own Voice Right Here',
                    'অথবা সরাসরি আমাদের স্টুডিওতেই ভয়েস রেকর্ড করুন'
                  )}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--ck-text-secondary)]">
                  {L(
                    lang,
                    'Prefer your own natural voice? Read your script on our live teleprompter and record directly inside Reeldaiii Studio — no external app needed.',
                    'নিজের কণ্ঠে গল্প বলতে চাইলে আলাদা কোনো সফটওয়্যার ছাড়াই সরাসরি মাইক্রোফোনে গল্প পড়ে আমাদের Reeldaiii স্টুডিওতে রেকর্ড ও যুক্ত করুন।'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex w-full items-center justify-between border-t border-[var(--ck-accent)]/25 pt-3 text-xs font-bold text-[var(--ck-accent)]">
              <span>{L(lang, 'Open Voice Recorder in Studio', 'স্টুডিওতে ভয়েস রেকর্ডার খুলুন')}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </section>

      {/* Section 2: Interactive Live 2D Animation Showcase */}
      <HomeLiveStage lang={lang} onTryStoryInStudio={onTryStoryInStudio} />

      {/* Section 3: What You Can Build + 3-Step Flow */}
      <section className="space-y-10" aria-labelledby="use-cases-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-[var(--ck-accent)]">
              {L(lang, 'Built for Storytellers', 'কাদের জন্য ও কী তৈরি করবেন')}
            </div>
            <h2
              id="use-cases-heading"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ck-text)] sm:text-3xl text-balance"
            >
              {L(
                lang,
                'Turn any narrated story into a polished animated video',
                'এই ওয়েবসাইট দিয়ে যেকোনো গল্পকে রূপ দিন পেশাদার ভিডিওতে'
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenManual}
            className="inline-flex h-10 items-center gap-2 self-start text-sm font-semibold text-[var(--ck-accent)] underline-offset-4 hover:underline whitespace-nowrap shrink-0 sm:self-end"
          >
            <span>{L(lang, 'Explore all features in Manual', 'সব ফিচার ম্যানুয়ালে পড়ুন')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {useCases.map((item) => (
            <div
              key={item.number}
              className="flex flex-col justify-between rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[var(--ck-text-muted)]">
                  <span className="font-mono font-semibold tabular-nums text-[var(--ck-accent)]">
                    {item.number}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.audience}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--ck-text)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--ck-text-secondary)]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Clean 3-Step Compact Overview + 4 Studio Highlights */}
        <div className="grid grid-cols-1 gap-8 border-t border-[var(--ck-border-subtle)] pt-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[var(--ck-accent)]">
                {L(lang, '3 Simple Steps', 'সহজ ৩ ধাপ')}
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--ck-text)]">
                {L(
                  lang,
                  'From voiceover to finished animation in minutes',
                  'মাত্র কয়েক মিনিটেই অ্যানিমেশন প্রস্তুত'
                )}
              </h3>
            </div>
            <ol className="divide-y divide-[var(--ck-border-subtle)]">
              {quickSteps.map((item) => (
                <li key={item.step} className="flex items-start gap-4 py-4 first:pt-1 last:pb-0">
                  <span className="font-display text-2xl font-semibold tabular-nums text-[var(--ck-accent)]">
                    {item.step}.
                  </span>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[var(--ck-text)]">{item.title}</div>
                    <p className="text-xs leading-relaxed text-[var(--ck-text-muted)] sm:text-[13px]">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 lg:col-span-6">
            <div className="mb-4 text-xs font-semibold text-[var(--ck-accent)]">
              {L(lang, 'Core Studio Capabilities', 'স্টুডিওর মূল সুবিধাসমূহ')}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {studioHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-[var(--ck-accent)]" />
                      <h4 className="text-sm font-semibold text-[var(--ck-text)]">{item.title}</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--ck-text-muted)]">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Dedicated User Manual & Start Banner */}
      <section className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] px-6 py-8 sm:px-9 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-2.5 lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ck-accent)]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                {L(
                  lang,
                  'Complete Documentation for New Creators',
                  'নতুন ব্যবহারকারীদের জন্য সম্পূর্ণ বাংলা গাইড'
                )}
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[var(--ck-text)] sm:text-3xl text-balance">
              {L(
                lang,
                'Learn everything you can create — read the step-by-step User Manual',
                'কীভাবে শুরু করবেন বা কী কী করা যায় — সব পড়ুন ইউজার ম্যানুয়ালে'
              )}
            </h2>
            <p className="max-w-[60ch] text-sm leading-relaxed text-[var(--ck-text-muted)]">
              {L(
                lang,
                'File preparation, 32+ world-matching tips, timeline editing, one-click redesign, 4K export settings, keyboard shortcuts, and FAQs in one searchable guide.',
                'ফাইল প্রস্তুতি, ৩২+ পরিবেশ মেলানোর টিপস, টাইমলাইন ও রিডিজাইন ব্যবহার, ৪কে এক্সপোর্ট পদ্ধতি এবং সাধারণ প্রশ্নের উত্তর এক জায়গায় গুছিয়ে দেওয়া আছে।'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
            <button
              type="button"
              data-testid="home-open-manual-btn"
              onClick={onOpenManual}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-5 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              <BookOpen className="h-4 w-4" />
              <span>{L(lang, 'Read User Manual', 'ইউজার ম্যানুয়াল পড়ুন')}</span>
            </button>
            <button
              type="button"
              onClick={onEnterStudio}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-5 text-sm font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
            >
              <span>{L(lang, 'Open Studio', 'স্টুডিও খুলুন')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="home-support-shahin-btn"
              onClick={openSupportKoriPopup}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FFDD00] px-4 text-xs font-bold text-[#111111] transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00]"
            >
              <Coffee className="h-4 w-4 shrink-0" />
              <span>{L(lang, 'Support Shahin', 'Support Shahin · কফি খাওয়ান')}</span>
            </button>
            <button
              type="button"
              data-testid="home-about-developer-btn"
              onClick={onOpenDeveloper}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-3.5 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0"
            >
              <img
                src={DEVELOPER_PROFILE.photoUrl || ''}
                alt="Md Shahin"
                className="h-6 w-6 rounded-full border border-[var(--ck-accent)]/50 object-cover object-top shrink-0"
              />
              <span>{L(lang, 'About Developer', 'ডেভেলপার পরিচিতি')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
