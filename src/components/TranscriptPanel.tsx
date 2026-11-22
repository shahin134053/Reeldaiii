import React, { useMemo, useState } from 'react';
import { getActiveCue } from '../lib/srtParser';
import { AnimationProject, getProjectSceneAtTime } from '../lib/storyCompiler';
import { formatTimecode } from '../lib/storyboard';
import { AppLang, L } from '../lib/i18n';

interface TranscriptPanelProps {
  lang: AppLang;
  project: AnimationProject;
  isLoading?: boolean;
  currentTime: number;
  onSeekToCue: (startTime: number) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  lang,
  project,
  isLoading = false,
  currentTime,
  onSeekToCue,
}) => {
  const [query, setQuery] = useState('');
  const activeCue = getActiveCue(project.cues, currentTime);

  const filteredCues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return project.cues;
    return project.cues.filter((cue) => {
      const en = (project.englishTranslations[cue.index] ?? '').toLowerCase();
      return cue.text.toLowerCase().includes(q) || en.includes(q);
    });
  }, [project.cues, project.englishTranslations, query]);

  return (
    <section id="script" className="pt-10 border-t border-[var(--ck-border)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ck-text)]">
            {L(lang, 'Synchronized Script', 'সিঙ্কড স্ক্রিপ্ট ও সংলাপ')}
          </h2>
          <p className="mt-1 text-sm text-[var(--ck-text-muted)]">
            {L(
              lang,
              'Click any timed line to seek both 16:9 and 9:16 previews directly to that moment.',
              'যেকোনো লাইনে ক্লিক করলে ১৬:৯ এবং ৯:১৬ প্রিভিউ সরাসরি সেই সময়ে চলে যাবে।'
            )}
          </p>
        </div>

        <div className="w-full sm:w-72">
          <label htmlFor="script-search" className="sr-only">
            {L(lang, 'Filter script lines', 'স্ক্রিপ্ট লাইন খুঁজুন')}
          </label>
          <input
            id="script-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={L(lang, 'Search script lines...', 'স্ক্রিপ্ট লাইন খুঁজুন...')}
            className="h-10 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3.5 text-sm text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
          />
        </div>
      </div>

      <div className="cinema-scroll max-h-[400px] overflow-y-auto rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] divide-y divide-[var(--ck-border-subtle)]">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-[var(--ck-text-faint)]">
            {L(lang, 'Loading synchronized script…', 'সিঙ্কড স্ক্রিপ্ট লোড হচ্ছে…')}
          </div>
        ) : project.cues.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[var(--ck-text-faint)]">
            {L(
              lang,
              'No subtitle lines loaded for this project. Upload an .srt file or paste a script in Upload & Generate.',
              'এই প্রোজেক্টে কোনো সাবটাইটেল লাইন নেই। আপলোড ট্যাবে .srt ফাইল বা স্ক্রিপ্ট দিন।'
            )}
          </div>
        ) : filteredCues.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[var(--ck-text-faint)]">
            {L(lang, `No script lines match “${query}”.`, `“${query}” মিলিয়ে কোনো লাইন পাওয়া যায়নি।`)}
          </div>
        ) : (
          filteredCues.map((cue) => {
            const isActive = activeCue?.index === cue.index;
            const scene = getProjectSceneAtTime(project, cue.startTime);
            const english = project.englishTranslations[cue.index];

            return (
              <button
                key={`${project.id}-${cue.index}`}
                type="button"
                onClick={() => onSeekToCue(cue.startTime + 0.05)}
                className={`flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ck-accent)] ${
                  isActive ? 'bg-[var(--ck-accent-soft)]' : 'hover:bg-[var(--ck-surface-alt)]'
                }`}
              >
                <span
                  className={`mt-0.5 w-14 shrink-0 font-mono text-xs tabular-nums ${
                    isActive ? 'text-[var(--ck-accent)] font-medium' : 'text-[var(--ck-text-faint)]'
                  }`}
                >
                  {formatTimecode(cue.startTime)}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-relaxed sm:text-base ${
                      isActive ? 'text-[var(--ck-text)] font-medium' : 'text-[var(--ck-text-secondary)]'
                    }`}
                  >
                    {cue.text}
                  </p>
                  {english && (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ck-text-muted)]">
                      {english}
                    </p>
                  )}
                </div>

                <span className="hidden shrink-0 text-xs text-[var(--ck-text-faint)] md:inline">
                  {L(lang, `Ch. ${scene.chapterNumber}`, `দৃশ্য ${scene.chapterNumber}`)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};
