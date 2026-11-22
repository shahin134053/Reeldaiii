import { SceneSetting, TimeOfDay, WeatherType, VisualStyle } from './storyCompiler';
import { AppLang } from './i18n';

export interface ManualBullet {
  title: string;
  detail: string;
}

export interface ManualChapter {
  id: string;
  number: string;
  title: string;
  category: 'overview' | 'workflow' | 'worlds' | 'editing' | 'export' | 'shortcuts';
  categoryLabel: string;
  summary: string;
  bullets: ManualBullet[];
  tip?: string;
  keywords: string[];
}

export interface ManualFaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface KeyboardShortcutRow {
  keys: string;
  actionEn: string;
  whereEn: string;
  actionBn: string;
  whereBn: string;
}

export interface HomeShowcaseStory {
  id: string;
  labelEn: string;
  labelBn: string;
  categoryEn: string;
  categoryBn: string;
  setting: SceneSetting;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  visualStyle: VisualStyle;
  accentColor: string;
  spokenLineEn: string;
  spokenLineBn: string;
  fullScriptEn: string;
  fullScriptBn: string;
  titleEn: string;
  titleBn: string;
}

export const HOME_SHOWCASE_STORIES: HomeShowcaseStory[] = [
  {
    id: 'forest-mystery',
    labelEn: 'Deep Forest Mystery',
    labelBn: 'গভীর জঙ্গল ও রহস্য',
    categoryEn: 'Adventure Story',
    categoryBn: 'অ্যাডভেঞ্চার গল্প',
    setting: 'forest-wild',
    timeOfDay: 'morning',
    weather: 'mist',
    visualStyle: 'storybook-warm',
    accentColor: '#69A86A',
    spokenLineEn: 'A lone traveler walked through the misty emerald forest searching for an ancient light.',
    spokenLineBn: 'গভীর সবুজ জঙ্গলের ভেতর দিয়ে একজন পথিক অজানা আলোর সন্ধানে এগিয়ে চলল।',
    titleEn: 'The Hidden Forest Trail',
    titleBn: 'গভীর জঙ্গলের অজানা পথ',
    fullScriptEn:
      'A lone traveler walked slowly through the deep green forest at dawn. In the quiet mist, a lantern glowed inside an old wooden library. Opening an ancient book on the table, he uncovered a long-forgotten truth.',
    fullScriptBn:
      'গভীর সবুজ জঙ্গলের ভেতর দিয়ে একজন পথিক হাঁটছিল। মাঝরাতে রহস্যময় কুয়াশায় একটি পুরনো লাইব্রেরির আলো দেখা গেল। ভেতরে টেবিলের ওপর প্রাচীন বই খুলে সে বহু বছরের হারানো সত্য খুঁজে পেল।',
  },
  {
    id: 'desert-justice',
    labelEn: 'Desert & Courtroom',
    labelBn: 'মরুভূমি ও আদালত',
    categoryEn: 'Historical Tale',
    categoryBn: 'ঐতিহাসিক কাহিনি',
    setting: 'desert-dunes',
    timeOfDay: 'sunset',
    weather: 'clear',
    visualStyle: 'cinematic-anime',
    accentColor: '#E5A93C',
    spokenLineEn: 'Across golden desert dunes at sunset, the caravan marched toward the city of justice.',
    spokenLineBn: 'উত্তপ্ত মরুভূমির বালির টিলা পেরিয়ে সোনালি সন্ধ্যায় কাফেলা নগরের পথে রওনা হলো।',
    titleEn: 'Caravan Across the Dunes',
    titleBn: 'মরুভূমির কাফেলা ও ন্যায়বিচার',
    fullScriptEn:
      'Crossing the warm golden desert dunes, the camel caravan reached the ancient city walls. Inside the grand courtroom, the judge lifted the scales of truth and delivered a fair verdict. That evening, the entire city celebrated with lanterns and fireworks.',
    fullScriptBn:
      'উত্তপ্ত মরুভূমির বালির টিলা পেরিয়ে উটের কাফেলা এগিয়ে চলল। নগরের আদালতে বিচারক ন্যায়ের দাঁড়িপাল্লা হাতে সত্যের রায় শোনালেন। সেই আনন্দে পুরো শহরে আতশবাজি আর আলোকসজ্জার বিশাল উৎসব শুরু হলো।',
  },
  {
    id: 'village-river',
    labelEn: 'Village & Riverbank',
    labelBn: 'গ্রামবাংলা ও নদী',
    categoryEn: 'Emotional Story',
    categoryBn: 'আবেগঘন গল্প',
    setting: 'village-cottage',
    timeOfDay: 'sunset',
    weather: 'fireflies',
    visualStyle: 'storybook-warm',
    accentColor: '#D49456',
    spokenLineEn: 'Under glowing evening fireflies in the village courtyard, grandmother’s timeless tales come alive.',
    spokenLineBn: 'সন্ধ্যার জোনাকি জ্বলা গ্রামের উঠানে দাদির মুখে শোনা পুরনো দিনের গল্প আজও মনে পড়ে।',
    titleEn: 'Twilight Village & Quiet River',
    titleBn: 'সন্ধ্যার গ্রামবাংলা ও নদীর ঘাট',
    fullScriptEn:
      'Under glowing evening fireflies in the quiet village courtyard, grandmother shared stories of old. The next morning, a wooden boat glided smoothly across the calm river as the boatman sang. Nature’s peaceful rhythm still brings warmth to every heart.',
    fullScriptBn:
      'সন্ধ্যার জোনাকি জ্বলা গ্রামের কুঁড়েঘরের উঠানে বসে দাদি গল্প বলতেন। পরদিন সকালে শান্ত নদীর বুকে পালতোলা নৌকায় মাঝি গান গেয়ে পাড়ি জমাত। প্রকৃতির এই শান্ত রূপ আজও আমাদের মনে প্রশান্তি এনে দেয়।',
  },
  {
    id: 'festival-night',
    labelEn: 'Festival & Fireworks',
    labelBn: 'উৎসব ও আতশবাজি',
    categoryEn: 'Celebration',
    categoryBn: 'আনন্দ ও উদযাপন',
    setting: 'festival-celebration',
    timeOfDay: 'night',
    weather: 'fireflies',
    visualStyle: 'cinematic-anime',
    accentColor: '#F59E0B',
    spokenLineEn: 'Hundreds of glowing lanterns and fireworks lit up the night sky across the celebrating city.',
    spokenLineBn: 'রাতের আকাশ আলোকিত করে শত শত ফানুস আর আতশবাজিতে মুখর হয়ে উঠল পুরো শহর।',
    titleEn: 'Night of Lanterns & Celebration',
    titleBn: 'আলোকসজ্জা ও মহোৎসবের রাত',
    fullScriptEn:
      'Hundreds of floating lanterns and golden fireworks illuminated the midnight sky. Families and friends gathered in the streets with music, laughter, and joy. The light of the festival sparked fresh hope in every heart.',
    fullScriptBn:
      'রাতের আকাশে শত শত ফানুস আর আতশবাজির আলো ছড়িয়ে পড়ল। শহরের মানুষ সবাই মিলে আনন্দ আর গানে মেতে উঠল। এই উৎসবের আলো প্রতিটি মানুষের মনে নতুন আশার সঞ্চার করল।',
  },
  {
    id: 'library-night',
    labelEn: 'Midnight Library',
    labelBn: 'রহস্যময় লাইব্রেরি',
    categoryEn: 'Knowledge & Mystery',
    categoryBn: 'জ্ঞান ও রহস্য',
    setting: 'library-study',
    timeOfDay: 'night',
    weather: 'clear',
    visualStyle: 'dramatic-noir',
    accentColor: '#C98A4B',
    spokenLineEn: 'By warm candlelight in the silent archive, opening the antique manuscript revealed hidden history.',
    spokenLineBn: 'পুরনো গ্রন্থাগারের মোমবাতির আলোয় প্রাচীন পাণ্ডুলিপি খুলতেই বেরিয়ে এল অজানা ইতিহাস।',
    titleEn: 'Secrets of the Old Archive',
    titleBn: 'প্রাচীন লাইব্রেরির গোপন পুঁথি',
    fullScriptEn:
      'Inside the quiet midnight library, a single desk lamp shone over towering shelves of ancient books. Hidden between dusty manuscript pages was a mysterious hand-drawn map. Curiosity and knowledge always open doors to new worlds.',
    fullScriptBn:
      'রাতের নিস্তব্ধ পুরনো লাইব্রেরিতে টেবিল ল্যাম্প জ্বালিয়ে সে প্রাচীন বই খুঁজছিল। ধুলোমাখা পাণ্ডুলিপির পাতায় লুকানো ছিল এক অদ্ভুত মানচিত্র। জ্ঞান আর কৌতূহলই মানুষকে নতুন পথের দিশা দেখায়।',
  },
  {
    id: 'space-voyage',
    labelEn: 'Space & Rocket',
    labelBn: 'মহাকাশ ও বিজ্ঞান',
    categoryEn: 'Educational Video',
    categoryBn: 'শিক্ষামূলক ভিডিও',
    setting: 'space-cosmos',
    timeOfDay: 'night',
    weather: 'stars',
    visualStyle: 'editorial-doc',
    accentColor: '#60A5FA',
    spokenLineEn: 'Piercing the starry night sky, the rocket roared upward toward uncharted cosmic horizons.',
    spokenLineBn: 'রাতের অন্ধকার ভেদ করে গর্জন তুলে রকেট মহাকাশের অসীম নক্ষত্রের পথে ছুটে চলল।',
    titleEn: 'Voyage Beyond the Stars',
    titleBn: 'মহাকাশ জয়ের স্বপ্নযাত্রা',
    fullScriptEn:
      'Humanity’s boldest dream has always been exploring deep space. Breaking through the night sky, a roaring rocket climbs into orbit among distant stars. Inside the science lab, researchers track every signal in search of new worlds.',
    fullScriptBn:
      'মানুষের সবচেয়ে বড় স্বপ্ন ছিল মহাকাশ জয় করা। রাতের অন্ধকার ভেদ করে গর্জন তুলে রকেট আকাশের দিকে ছুটে চলে। বিজ্ঞানীরা ল্যাবে বসে প্রতিটি সংকেত পর্যবেক্ষণ করে নতুন পৃথিবীর সন্ধান করেন।',
  },
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcutRow[] = [
  {
    keys: 'Space',
    actionEn: 'Play / Pause video preview',
    whereEn: 'Studio Preview',
    actionBn: 'ভিডিও প্লে / পজ করুন',
    whereBn: 'স্টুডিও প্রিভিউ',
  },
  {
    keys: '← / →',
    actionEn: 'Jump to previous or next scene',
    whereEn: 'Studio Preview',
    actionBn: 'আগের বা পরের দৃশ্যে যান',
    whereBn: 'স্টুডিও প্রিভিউ',
  },
  {
    keys: 'M',
    actionEn: 'Mute / Unmute voiceover & BGM',
    whereEn: 'Studio Preview',
    actionBn: 'ভয়েসওভার মিউট / আনমিউট করুন',
    whereBn: 'স্টুডিও প্রিভিউ',
  },
  {
    keys: 'F',
    actionEn: 'Toggle Focus Cinema Mode (hide/show Director)',
    whereEn: 'Studio Preview',
    actionBn: 'ফোকাস সিনেমা মোড (ডিরেক্টর প্যানেল লুকান/দেখান)',
    whereBn: 'স্টুডিও প্রিভিউ',
  },
  {
    keys: 'Esc',
    actionEn: 'Close active dialog or popover',
    whereEn: 'Anywhere in App',
    actionBn: 'খোলা পপআপ বা মডাল বন্ধ করুন',
    whereBn: 'সম্পূর্ণ সফটওয়্যার',
  },
];

export const MANUAL_CHAPTERS_EN: ManualChapter[] = [
  {
    id: 'what-you-can-do',
    number: '01',
    title: 'What Can You Create with Reeldaiii?',
    category: 'overview',
    categoryLabel: 'Overview',
    summary:
      'Reeldaiii is a browser-based, context-aware 2D storytelling animation studio built for international and Bengali creators. Without installing heavy desktop software or learning complex timelines, you can transform voiceover audio, SRT subtitles, or written scripts into synchronized animated films.',
    bullets: [
      {
        title: 'YouTube Storytelling, Essays & Documentaries (16:9 Landscape)',
        detail:
          'Upload your English or Bengali voiceover and SRT file to automatically generate distinct 2D scenes, expressive character acting, phonetic lip-sync, and burned-in captions up to 4K UHD.',
      },
      {
        title: 'YouTube Shorts, Instagram Reels & TikTok (9:16 Vertical)',
        detail:
          'Never rebuild a project twice. Smart subject tracking, customizable portrait zoom, and 9:16 safe-zone framing render crisp vertical videos from the exact same timeline.',
      },
      {
        title: 'Audiobooks, Children’s Tales & Educational Lessons',
        detail:
          'Match narration across 32+ hand-crafted 2D environments—forests, deserts, courtrooms, libraries, villages, oceans, labs, and outer space—so every line visually illustrates the story.',
      },
      {
        title: 'Instant Script-Only Quick Preview (No Audio Needed)',
        detail:
          'Want to visualize a draft before recording? Switch to “Script-Only” mode, paste your story, and preview timed 2D scenes with synthesized speech cadence immediately.',
      },
    ],
    tip: 'Everything runs directly inside your browser with zero mandatory paid API keys or accounts—keeping your audio recordings and unpublished scripts completely private.',
    keywords: ['overview', 'what you can do', 'youtube', 'reels', 'shorts', 'tiktok', 'audiobook', 'education', '2d animation'],
  },
  {
    id: 'prepare-files',
    number: '02',
    title: 'File Preparation & Supported Formats',
    category: 'workflow',
    categoryLabel: 'Files & Formats',
    summary:
      'Follow these quick guidelines to get crisp lip-sync accuracy, natural scene pacing, and seamless file imports.',
    bullets: [
      {
        title: 'Voiceover Audio (.mp3, .wav, .m4a, .ogg, .flac)',
        detail:
          'Clean narration audio enables the engine to decode speech energy peaks and natural pauses for responsive mouth shapes and emotion-aware BGM auto-ducking.',
      },
      {
        title: 'SRT Subtitle Files (.srt)',
        detail:
          'Each timestamped cue guides scene transitions and kinetic captions. Standard UTF-8 English, Bengali, or bilingual SRT files are parsed automatically.',
      },
      {
        title: 'Written Scripts (.txt, .md, or Direct Paste)',
        detail:
          'No SRT yet? Paste your story or drop a .txt script. The story compiler segments sentences automatically and aligns them smoothly across your narration duration.',
      },
      {
        title: 'Portable Project Backups (.json)',
        detail:
          'Export your complete storyboard, styling, and timing to a lightweight .json file at any time, and re-import it later to resume editing seamlessly.',
      },
    ],
    tip: 'You can select and drag-and-drop your Audio, SRT, and Script files together in one drop—Reeldaiii automatically detects each file type.',
    keywords: ['files', 'audio', 'mp3', 'wav', 'srt', 'txt', 'json', 'upload', 'format', 'import'],
  },
  {
    id: 'step-by-step-create',
    number: '03',
    title: 'Step-by-Step: Creating Your First Animated Video',
    category: 'workflow',
    categoryLabel: 'Workflow',
    summary:
      'Go from raw voiceover or script to a synchronized dual-format animated video in four straightforward steps.',
    bullets: [
      {
        title: 'Step 1 — Open Studio → New Project',
        detail:
          'Click “Studio” in the top bar. Choose “Audio + SRT Upload” to attach your voiceover and subtitles, or pick “Script-Only (Quick Preview)” to test a story instantly.',
      },
      {
        title: 'Step 2 — Pick Your Visual Style (Optional)',
        detail:
          'Expand Optional Settings to set a custom title or choose from Warm Storybook 2D, Cinematic Anime, Editorial Documentary, or Dramatic Night Cinema.',
      },
      {
        title: 'Step 3 — Watch the Transparent 1%–100% Pipeline',
        detail:
          'Click “Generate Animation” to watch all 15 stages run live: audio decoding, SRT drift check, story intelligence, character cast locking, dynamic scene building, and QC audit.',
      },
      {
        title: 'Step 4 — Preview, Refine & Export in 16:9 + 9:16',
        detail:
          'Review both widescreen and vertical canvases side by side, tweak any scene in Director or Timeline, and click “Export Video” to download MP4 or WebM.',
      },
    ],
    keywords: ['step by step', 'first video', 'create', 'studio', 'processing', 'workflow', 'pipeline'],
  },
  {
    id: 'story-worlds-matching',
    number: '04',
    title: '32+ Animated 2D Worlds & Story-Matching Tips',
    category: 'worlds',
    categoryLabel: '32+ Worlds',
    summary:
      'Reeldaiii never loops random stock templates. It analyzes your script’s locations, time of day, weather, and props to generate unique, story-specific beats across 32+ custom 2D worlds.',
    bullets: [
      {
        title: 'Nature & Journey Environments',
        detail:
          'Deep forest, desert dunes & caravan, open ocean & ship, snowy mountain peaks, calm riverbank & boat, rural cottage courtyard, bridges, highways, and rainy streets.',
      },
      {
        title: 'Narrative, Historical & Social Locations',
        detail:
          'Grand courtroom, antique candlelit library, lantern & fireworks festival, misty night mystery, battlefield camp, stage speech, school classroom, hospital, office, and bustling market.',
      },
      {
        title: 'Science, Tech & Contemporary Settings',
        detail:
          'Outer space & rocket launch, AI & science laboratory, startup boardroom & growth charts, express train, neon city skyline, and cozy café/tea stall.',
      },
      {
        title: 'Richer Descriptions Produce Sharper Visuals',
        detail:
          'Mentioning specific places, times of day (dawn, sunset, midnight), weather (rain, mist, snow, stars), or key props (book, lantern, boat, scales, rocket) yields hyper-accurate scene selection.',
      },
    ],
    tip: 'Want a different setting for any single chapter? Click that scene and pick any of the 32+ worlds directly in the right-hand Director panel.',
    keywords: ['32', 'worlds', 'forest', 'desert', 'courtroom', 'festival', 'library', 'space', 'village', 'scenes', 'matching'],
  },
  {
    id: 'studio-editing-tools',
    number: '05',
    title: 'Director Editing, One-Click Redesign, Lip-Sync & BGM',
    category: 'editing',
    categoryLabel: 'Editing & Redesign',
    summary:
      'Once your film is generated, every detail—scene layout, color palette, timing, lip-sync, captions, music, and channel branding—remains completely customizable.',
    bullets: [
      {
        title: '10-Shape Phonetic Viseme Lip-Sync',
        detail:
          'Characters naturally shape vowels and consonants (closed, bilabial, open, round, wide) synced to both English and Bengali speech data plus real vocal energy.',
      },
      {
        title: 'One-Click Redesign Studio & Version History',
        detail:
          'Not thrilled with the initial look? Open “Redesign Studio” from the left menu to remix the entire video’s framing architecture, color palette, and choreography—with full Undo & snapshot restore.',
      },
      {
        title: 'Interactive Waveform, Split/Merge & SRT Sync Nudge',
        detail:
          'Trim chapter durations (±1s), split long chapters, merge adjacent beats, or nudge SRT subtitles by ±0.1s / ±0.5s against the live audio waveform.',
      },
      {
        title: 'Emotion BGM Auto-Ducking & Channel Watermark',
        detail:
          'Enable background music that automatically lowers volume whenever narration plays (Auto-Ducking). Customize subtitle typography, colors, position, and upload your channel logo in “Sub & Brand”.',
      },
    ],
    keywords: ['lip-sync', 'viseme', 'redesign', 'timeline', 'split', 'merge', 'bgm', 'ducking', 'watermark', 'subtitle', 'undo'],
  },
  {
    id: 'export-guide',
    number: '06',
    title: 'High-Resolution 16:9 & 9:16 Video Export Guide',
    category: 'export',
    categoryLabel: 'Export & Download',
    summary:
      'Render crisp vector 2D frames mixed with your voiceover and BGM directly into downloadable MP4 or WebM video files.',
    bullets: [
      {
        title: 'Flexible Aspect Ratios (16:9, 9:16, or Both at Once)',
        detail:
          'Export 16:9 Landscape for YouTube, 9:16 Vertical for Reels/Shorts/TikTok, or select “Both 16:9 + 9:16” to automatically encode and save both files back to back.',
      },
      {
        title: 'Resolution Presets up to 4K UHD',
        detail:
          'Because scenes render from crisp 2D vectors, 4K UHD (3840×2160 / 2160×3840) stays razor-sharp. Choose 1080p HD for everyday uploads or 720p for fast drafts.',
      },
      {
        title: 'Burned-In Captions & Chapter Scope',
        detail:
          'Export either the full film or just the active chapter for fast review. Toggle burned-in subtitles on, bilingual, or completely clean (No Subtitles).',
      },
      {
        title: 'Built-In Preview & Guaranteed Direct Save',
        detail:
          'Once encoding finishes, you can immediately play back the exported video inside the modal and click the explicit Save button to download MP4 or WebM reliably.',
      },
    ],
    keywords: ['export', 'download', 'mp4', 'webm', '4k', '1080p', '720p', '16:9', '9:16', 'video'],
  },
  {
    id: 'shortcuts-and-tips',
    number: '07',
    title: 'Keyboard Shortcuts & Productivity Tips',
    category: 'shortcuts',
    categoryLabel: 'Shortcuts & Tips',
    summary:
      'Speed up playback review and scene direction with built-in Studio shortcuts and workspace modes.',
    bullets: [
      {
        title: 'Focus Cinema Mode (Press F)',
        detail:
          'Click “Focus Mode” in the Studio workspace bar or press F to collapse the right-hand Director sidebar and enjoy a wide, distraction-free preview stage.',
      },
      {
        title: 'Dark / Light Theme & English / Bengali Switcher',
        detail:
          'Switch seamlessly between Dark and Light mode or English and Bengali from the top bar at any moment—your preferences are remembered automatically.',
      },
      {
        title: 'Auto-Saved Browser Draft Library',
        detail:
          'Every non-demo project you create is automatically saved in your browser’s local Draft Library so you can resume work right from the New Project screen.',
      },
    ],
    keywords: ['shortcuts', 'keyboard', 'focus mode', 'dark mode', 'light mode', 'drafts', 'tips', 'language'],
  },
];

export const MANUAL_CHAPTERS_BN: ManualChapter[] = [
  {
    id: 'what-you-can-do',
    number: '০১',
    title: 'এই ওয়েবসাইট দিয়ে আপনি কী কী করতে পারবেন?',
    category: 'overview',
    categoryLabel: 'পরিচিতি',
    summary:
      'Reeldaiii হলো একটি ব্রাউজার-ভিত্তিক বাংলা ও ইংরেজি কনটেক্সট-অ্যাওয়্যার ২ডি স্টোরিটেলিং অ্যানিমেশন সফটওয়্যার। কোনো ভারী সফটওয়্যার ইনস্টল বা ভিডিও এডিটিংয়ের জটিল অভিজ্ঞতা ছাড়াই আপনি আপনার ভয়েসওভার ও গল্পকে জীবন্ত অ্যানিমেটেড ভিডিওতে রূপান্তর করতে পারবেন।',
    bullets: [
      {
        title: 'ইউটিউব গল্প ও মোটিভেশনাল ভিডিও (১৬:৯ ল্যান্ডস্কেপ)',
        detail:
          'আপনার রেকর্ড করা বাংলা বা ইংরেজি ভয়েসওভার এবং SRT ফাইল আপলোড করলে প্রতিটি বাক্যের অর্থ অনুযায়ী আলাদা আলাদা ২ডি দৃশ্য, চরিত্রের অভিনয় ও সাবটাইটেলসহ সম্পূর্ণ ইউটিউব ভিডিও তৈরি হয়ে যাবে।',
      },
      {
        title: 'ফেসবুক রিলস, ইউটিউব শর্টস ও টিকটক ভিডিও (৯:১৬ ভার্টিকাল)',
        detail:
          'একই প্রোজেক্ট আলাদা করে আবার বানাতে হয় না। স্বয়ংক্রিয় স্মার্ট সাবজেক্ট জুম ও ৯:১৬ সেফ-জোন ফ্রেমিং ব্যবহার করে ১ ক্লিকেই ভার্টিকাল ভিডিও রেন্ডার করা যায়।',
      },
      {
        title: 'শিশুতোষ রূপকথা, শিক্ষামূলক গল্প ও অডিওবুক ভিজ্যুয়ালাইজেশন',
        detail:
          'গল্পের চরিত্র, জঙ্গল, মরুভূমি, গ্রামবাংলা, মহাকাশ, সমুদ্র, লাইব্রেরি কিংবা আদালত—কাহিনির সাথে মিল রেখে ৩২+ পরিবেশে অ্যানিমেটেড পাঠ্য বা গল্পের ভিডিও বানানো যায়।',
      },
      {
        title: 'অডিও ছাড়াই দ্রুত খসড়া (Script-Only Quick Preview)',
        detail:
          'ভয়েসওভার রেকর্ড করার আগেই শুধু গল্পের স্ক্রিপ্ট লিখে “শুধু স্ক্রিপ্ট” মোডে তাৎক্ষণিক অ্যানিমেটেড স্টোরিবোর্ড দেখে নিতে পারবেন।',
      },
    ],
    tip: 'কোনো পেইড এপিআই কী বা অ্যাকাউন্ট ছাড়াই সব কাজ সরাসরি আপনার ব্রাউজারে চলে, ফলে আপনার অডিও ও গল্প নিরাপদ থাকে।',
    keywords: ['পরিচিতি', 'কী কী করতে পারবেন', 'ইউটিউব', 'রিলস', 'শর্টস', 'অডিওবুক', 'overview', 'youtube', 'reels'],
  },
  {
    id: 'prepare-files',
    number: '০২',
    title: 'শুরু করার আগে ফাইল প্রস্তুতি ও সাপোর্টেড ফরম্যাট',
    category: 'workflow',
    categoryLabel: 'ফাইল প্রস্তুতি',
    summary:
      'সেরা অ্যানিমেশন ও নিখুঁত লিপ-সিঙ্ক পেতে আপনার অডিও ও সাবটাইটেল ফাইলগুলো কীভাবে প্রস্তুত করবেন তা এখানে দেওয়া হলো।',
    bullets: [
      {
        title: 'ভয়েসওভার অডিও (.mp3, .wav, .m4a, .ogg)',
        detail:
          'স্পষ্ট কণ্ঠে রেকর্ড করা অডিও দিলে সফটওয়্যারটি শব্দের ওঠানামা (waveform) বিশ্লেষণ করে চরিত্রের ঠোঁটের নড়াচড়া ও বিরতির সময় নিখুঁতভাবে সিঙ্ক করে।',
      },
      {
        title: 'SRT সাবটাইটেল ফাইল (.srt)',
        detail:
          'SRT ফাইলের প্রতিটি টাইমস্ট্যাম্প অনুযায়ী দৃশ্য বদলায় এবং পর্দায় সাবটাইটেল ভেসে ওঠে। বাংলা, ইংরেজি বা উভয় ভাষার SRT সরাসরি কাজ করে।',
      },
      {
        title: 'গল্পের স্ক্রিপ্ট (.txt অথবা সরাসরি লেখা)',
        detail:
          'যদি আপনার কাছে SRT না থাকে, তবে সরাসরি গল্পের লেখা পেস্ট করুন বা .txt ফাইল আপলোড করুন। সফটওয়্যারটি নিজেই বাক্য ভাগ করে টাইমিং সাজিয়ে নেবে।',
      },
      {
        title: 'পুরনো প্রোজেক্ট ব্যাকআপ (.json)',
        detail:
          'আগে বানানো কোনো প্রোজেক্ট JSON হিসেবে সংরক্ষণ করলে যেকোনো সময় “Import JSON” দিয়ে আগের জায়গা থেকে পুনরায় এডিট করতে পারবেন।',
      },
    ],
    tip: 'একসাথে অডিও + SRT + টেক্সট ফাইল সিলেক্ট করে ড্র্যাগ অ্যান্ড ড্রপ করলেই সফটওয়্যার নিজে থেকে প্রতিটি ফাইল চিনে নেবে।',
    keywords: ['ফাইল', 'অডিও', 'mp3', 'wav', 'srt', 'txt', 'json', 'আপলোড', 'upload', 'format'],
  },
  {
    id: 'step-by-step-create',
    number: '০৩',
    title: 'ধাপে ধাপে আপনার প্রথম অ্যানিমেশন ভিডিও তৈরি',
    category: 'workflow',
    categoryLabel: 'কাজের ধাপ',
    summary:
      'মাত্র ৪টি সহজ ধাপে শূন্য থেকে একটি পূর্ণাঙ্গ সিঙ্কড ২ডি অ্যানিমেশন ভিডিও তৈরি করতে পারবেন।',
    bullets: [
      {
        title: 'ধাপ ১ — স্টুডিওর “নতুন প্রোজেক্ট” খুলুন',
        detail:
          'উপরের মেনু থেকে “স্টুডিও” বাটনে ক্লিক করুন। আপনার কাছে অডিও থাকলে “অডিও + SRT” মোডে ফাইল দিন, আর অডিও ছাড়া পরীক্ষা করতে চাইলে “শুধু স্ক্রিপ্ট” ট্যাবে গল্প লিখুন।',
      },
      {
        title: 'ধাপ ২ — ভিজ্যুয়াল স্টাইল পছন্দ করুন',
        detail:
          'Warm Storybook 2D (গল্পের বইয়ের মতো উষ্ণ), Cinematic Anime, Editorial Documentary অথবা Dramatic Night Cinema—আপনার গল্পের মেজাজ অনুযায়ী স্টাইল বেছে নিন।',
      },
      {
        title: 'ধাপ ৩ — ১% থেকে ১০০% স্বচ্ছ বিশ্লেষণ দেখুন',
        detail:
          '“অ্যানিমেশন তৈরি করুন” বাটনে চাপলে ১৫টি ধাপে অডিও ডিকোডিং, গল্পের ভাব বিশ্লেষণ, চরিত্র লক করা, ডাইনামিক দৃশ্য তৈরি ও অটো-কোয়ালিটি চেক সম্পন্ন হবে।',
      },
      {
        title: 'ধাপ ৪ — প্রিভিউ দেখে প্রয়োজনীয় পরিবর্তন ও এক্সপোর্ট করুন',
        detail:
          'তৈরি হওয়া ভিডিও ১৬:৯, ৯:১৬ অথবা ডুয়াল মোডে একসাথে চালিয়ে দেখুন। সব ঠিক থাকলে উপরের “এক্সপোর্ট ভিডিও” বাটন থেকে ডাউনলোড করুন।',
      },
    ],
    keywords: ['ধাপে ধাপে', 'ভিডিও তৈরি', 'প্রথম ভিডিও', 'স্টুডিও', 'প্রসেসিং', 'workflow', 'steps'],
  },
  {
    id: 'story-worlds-matching',
    number: '০৪',
    title: '৩২+ অ্যানিমেটেড পরিবেশ ও গল্প মেলানোর কৌশল',
    category: 'worlds',
    categoryLabel: 'গল্প ও দৃশ্যপট',
    summary:
      'সফটওয়্যারটি কখনো র‍্যান্ডম বা একঘেয়ে ২৪ সিন লুপ করে না। আপনার গল্পের দৈর্ঘ্য ও কথার অর্থ বুঝে ৩২টির বেশি হাতে তৈরি ২ডি পরিবেশ থেকে উপযুক্ত দৃশ্য তৈরি করে।',
    bullets: [
      {
        title: 'প্রকৃতি ও ভ্রমণ পরিবেশ',
        detail:
          'জঙ্গল/অরণ্য, মরুভূমি/কাফেলা, সমুদ্র/জাহাজ, পাহাড়/তুষারাবৃত উপত্যকা, শান্ত নদী/নৌকা, গ্রামীণ কুঁড়েঘর/উঠান, ব্রিজ/হাইওয়ে এবং বৃষ্টিভেজা রাস্তা।',
      },
      {
        title: 'কাহিনি, ইতিহাস ও সামাজিক পরিবেশ',
        detail:
          'আদালত/বিচারক, প্রাচীন লাইব্রেরি/বই, উৎসব/আতশবাজি, রহস্যময় কুয়াশাচ্ছন্ন রাত, রণাঙ্গন/শিবির, মঞ্চ/ভাষণ, স্কুল/শ্রেণিকক্ষ, হাসপাতাল, অফিস এবং ব্যস্ত বাজার।',
      },
      {
        title: 'বিজ্ঞান, প্রযুক্তি ও আধুনিক পরিবেশ',
        detail:
          'মহাকাশ/রকেট, এআই ও টেক ল্যাব, ব্যবসার গ্রাফ/উদ্যোক্তা, এক্সপ্রেস ট্রেন, শহরের রাত এবং কফি বা চায়ের দোকান।',
      },
      {
        title: 'গল্পে যত স্পষ্ট বর্ণনা, দৃশ্য তত জীবন্ত',
        detail:
          'বাক্যে জায়গা, সময় (সকাল/সন্ধ্যা/মাঝরাত), আবহাওয়া (বৃষ্টি/কুয়াশা/তুষার) এবং বস্তু (প্রদীপ, নৌকা, বই, চাঁদ, রকেট) উল্লেখ করলে দৃশ্যপট আরও নিখুঁতভাবে মিলে যাবে।',
      },
    ],
    tip: 'কোনো একটি দৃশ্যের পরিবেশ বদলাতে চাইলে স্টুডিও প্রিভিউর ডান পাশের ডিরেক্টর প্যানেল থেকে ১ ক্লিকেই ৩২টি ওয়ার্ল্ডের যেকোনোটি বেছে নিতে পারবেন।',
    keywords: ['৩২', 'পরিবেশ', 'জঙ্গল', 'মরুভূমি', 'আদালত', 'উৎসব', 'লাইব্রেরি', 'মহাকাশ', 'গ্রাম', 'world', 'scene'],
  },
  {
    id: 'studio-editing-tools',
    number: '০৫',
    title: 'স্টুডিও এডিটিং, রিডিজাইন, লিপ-সিঙ্ক ও BGM গাইড',
    category: 'editing',
    categoryLabel: 'এডিটিং টুলস',
    summary:
      'অটোমেটিক ভিডিও তৈরি হওয়ার পরও আপনি প্রতিটি দৃশ্য, সময়সীমা, রঙ, সাবটাইটেল এবং ব্যাকগ্রাউন্ড মিউজিক নিজের মতো সাজিয়ে নিতে পারবেন।',
    bullets: [
      {
        title: 'ফনেটিক ভিসেম লিপ-সিঙ্ক (১০টি মুখের আকৃতি)',
        detail:
          'বাংলা ও ইংরেজি উচ্চারণের ধ্বনি এবং অডিও এনার্জি বিশ্লেষণ করে চরিত্রের ঠোঁট, দাঁত ও চোয়ালের নড়াচড়া স্বয়ংক্রিয়ভাবে সিঙ্ক হয়। বিরতির সময় মুখ স্বাভাবিকভাবে বন্ধ থাকে।',
      },
      {
        title: 'ওয়ান-ক্লিক রিডিজাইন স্টুডিও ও Undo হিস্ট্রি',
        detail:
          'ভিজ্যুয়াল বা কালার কম্বিনেশন ভালো না লাগলে বাম মেনু থেকে “রিডিজাইন স্টুডিও” খুলুন। পুরো ভিডিওর লেআউট, ফ্রেমিং, কালার প্যালেট ও মুড এক ক্লিকে বদলে যাবে—আগের ডিজাইনে ফিরতে Undo বাটন আছে।',
      },
      {
        title: 'টাইমলাইন Split, Merge ও SRT ± সিঙ্ক',
        detail:
          'ভিডিও প্লেয়ারের নিচের টাইমলাইনে যেকোনো দৃশ্য দুই ভাগ (Split), পাশের দৃশ্যের সাথে জোড়া (Merge) বা সময় কমানো-বাড়ানো যায়। সাবটাইটেল আগে-পরে হলে ±০.১ / ±০.৫ সেকেন্ড বাটন দিয়ে সাথে সাথে ঠিক করুন।',
      },
      {
        title: 'ইমোশন অনুযায়ী BGM অটো-ডাকিং ও চ্যানেল ব্র্যান্ডিং',
        detail:
          'টাইমলাইন থেকে ব্যাকগ্রাউন্ড মিউজিক চালু করলে কথা বলার সময় মিউজিক নিজেই নরম হয়ে যায় (Auto-Ducking)। ডিরেক্টর প্যানেলের “সাব ও ব্র্যান্ড” ট্যাবে সাবটাইটেলের ফন্ট, রঙ ও চ্যানেলের ওয়াটারমার্ক যুক্ত করুন।',
      },
    ],
    keywords: ['লিপ-সিঙ্ক', 'ভিসেম', 'রিডিজাইন', 'টাইমলাইন', 'split', 'merge', 'bgm', 'ওয়াটারমার্ক', 'সাবটাইটেল', 'undo'],
  },
  {
    id: 'export-guide',
    number: '০৬',
    title: '১৬:৯ ও ৯:১৬ হাই-রেজোলিউশন ভিডিও এক্সপোর্ট গাইড',
    category: 'export',
    categoryLabel: 'এক্সপোর্ট ও ডাউনলোড',
    summary:
      'কাজ শেষ হলে সরাসরি ব্রাউজার থেকেই হাই-রেজোলিউশন ভিডিও ও অডিও মিক্স করে ডাউনলোড করা যায়।',
    bullets: [
      {
        title: 'ফরম্যাট নির্বাচন (১৬:৯, ৯:১৬ অথবা একসাথে দুটিই)',
        detail:
          'ইউটিউবের জন্য ১৬:৯ ল্যান্ডস্কেপ, রিলস/শর্টসের জন্য ৯:১৬ ভার্টিকাল অথবা “Both 16:9 + 9:16” বেছে নিয়ে পরপর দুইটি ফাইলই অটোমেটিক ডাউনলোড করতে পারবেন।',
      },
      {
        title: 'রেজোলিউশন অপশন (720p, 1080p HD, 4K UHD)',
        detail:
          'ভেক্টর-ক্রিস্প ২ডি রেন্ডারিং হওয়ায় 4K UHD (2160p) পর্যন্ত ঝকঝকে ভিডিও পাওয়া যায়। দ্রুত প্রিভিউ শেয়ারের জন্য 720p বা 1080p বেছে নিতে পারেন।',
      },
      {
        title: 'বার্নড-ইন সাবটাইটেল ও রেঞ্জ নির্বাচন',
        detail:
          'সম্পূর্ণ ভিডিও অথবা শুধু নির্দিষ্ট একটি চ্যাপ্টার এক্সপোর্ট করা যায়। চাইলে ভিডিওর ভেতরে সাবটাইটেল স্থায়ীভাবে যুক্ত (Subtitles On) অথবা সাবটাইটেল ছাড়া রেন্ডার করতে পারবেন।',
      },
      {
        title: 'এক্সপোর্ট চলাকালীন ব্রাউজার ট্যাব খোলা রাখুন',
        detail:
          'ভিডিও রেন্ডারিং সরাসরি আপনার ব্রাউজারে ফ্রেম ও অডিও মিক্স করে সম্পন্ন হয়, তাই এক্সপোর্ট শেষ হওয়া পর্যন্ত ট্যাবটি খোলা রাখুন এবং প্রয়োজনে Save বাটনে ক্লিক করে ডাউনলোড করুন।',
      },
    ],
    keywords: ['এক্সপোর্ট', 'ডাউনলোড', '4k', '1080p', '720p', '১৬:৯', '৯:১৬', 'export', 'download', 'video'],
  },
  {
    id: 'shortcuts-and-tips',
    number: '০৭',
    title: 'দ্রুত কাজের জন্য কিবোর্ড শর্টকাট ও প্রো টিপস',
    category: 'shortcuts',
    categoryLabel: 'শর্টকাট ও টিপস',
    summary:
      'স্টুডিওতে দ্রুত এডিটিং এবং ঝামেলামুক্ত কাজের জন্য নিচের কিবোর্ড শর্টকাট ও টিপসগুলো ব্যবহার করুন।',
    bullets: [
      {
        title: 'ফোকাস সিনেমা মোড ব্যবহার করুন (F চাপুন)',
        detail:
          'ভিডিও বড় পর্দায় শান্তভাবে দেখতে চাইলে স্টুডিও প্রিভিউর উপরের “ফোকাস মোড” বাটনে ক্লিক করুন বা F চাপুন—ডান পাশের ডিরেক্টর প্যানেল সাময়িকভাবে লুকিয়ে যাবে।',
      },
      {
        title: 'ডার্ক/লাইট থিম ও বাংলা/ইংরেজি ভাষা পরিবর্তন',
        detail:
          'উপরের হেডার থেকে যেকোনো সময় ডার্ক/লাইট থিম এবং বাংলা বা ইংরেজি ভাষা পরিবর্তন করতে পারবেন—আপনার পছন্দ স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।',
      },
      {
        title: 'অটো-সেভড ড্রাফট লাইব্রেরি',
        detail:
          'আপনার তৈরি প্রতিটি নন-ডেমো প্রোজেক্ট ব্রাউজারে স্বয়ংক্রিয়ভাবে ড্রাফট হিসেবে সংরক্ষিত থাকে। পরবর্তীতে “নতুন প্রোজেক্ট” পেজের নিচ থেকে এক ক্লিকে আবার খুলতে পারবেন।',
      },
    ],
    keywords: ['শর্টকাট', 'কিবোর্ড', 'ফোকাস', 'ডার্ক', 'লাইট', 'ড্রাফট', 'shortcut', 'keyboard', 'tips'],
  },
];

export const MANUAL_FAQS_EN: ManualFaqItem[] = [
  {
    id: 'faq-no-audio',
    question: 'Can I create and preview an animation before recording my voiceover?',
    answer:
      'Yes! Open Studio → New Project, switch to the “Script-Only (Quick Preview)” tab, and paste your English or Bengali script. The engine automatically calculates natural narration pacing and 10-shape phonetic lip-sync so you can preview the full animation immediately.',
    keywords: ['no audio', 'script only', 'quick preview', 'audio', 'draft'],
  },
  {
    id: 'faq-wrong-scene',
    question: 'What if a single scene’s world, mood, or character isn’t quite right?',
    answer:
      'Click that scene and open the right-hand Director panel to switch between 32+ worlds, character roles, expressions, lighting, weather, or camera shots instantly. You can also enter a short direction prompt to regenerate that individual scene.',
    keywords: ['change scene', 'director', 'world', 'character', 'regenerate'],
  },
  {
    id: 'faq-subtitle-sync',
    question: 'How do I fix subtitles that appear slightly ahead or behind my voiceover?',
    answer:
      'In the Timeline Editor directly beneath the video preview, use the SRT Subtitle Sync Offset buttons (-0.5s, -0.1s, +0.1s, +0.5s). Watching the audio waveform lets you lock subtitles and lip-sync to the millisecond.',
    keywords: ['subtitle', 'sync', 'srt', 'delay', 'offset', 'waveform'],
  },
  {
    id: 'faq-redesign',
    question: 'Can I redesign the entire video’s visual style and colors in one click?',
    answer:
      'Yes. Open “Redesign Studio” from the left Studio menu and click “Remix Everything” to refresh framing layout, color palette, and scene choreography while keeping your audio and story timing untouched. Full Undo & version history are always available.',
    keywords: ['redesign', 'color', 'palette', 'layout', 'undo', 'remix'],
  },
  {
    id: 'faq-mobile',
    question: 'Does Reeldaiii work on phones and tablets?',
    answer:
      'Yes, the entire site—including the live showcase, manual, and studio workspace—is responsive for mobile and tablet screens. For fastest 4K UHD multi-minute video encoding, a desktop or laptop browser is recommended.',
    keywords: ['mobile', 'phone', 'tablet', 'desktop', 'responsive'],
  },
  {
    id: 'faq-free-privacy',
    question: 'Do I need a paid API key or subscription to use this software?',
    answer:
      'No. The complete 32-world 2D animation engine, phonetic viseme lip-sync, timeline editor, redesign studio, and direct browser MP4/WebM export work out of the box with no paid key required.',
    keywords: ['free', 'paid', 'api key', 'privacy', 'subscription'],
  },
];

export const MANUAL_FAQS_BN: ManualFaqItem[] = [
  {
    id: 'faq-no-audio',
    question: 'আমার কাছে এখনো ভয়েসওভার অডিও নেই, তবুও কি ভিডিও বানিয়ে দেখতে পারব?',
    answer:
      'হ্যাঁ, অবশ্যই! স্টুডিওর “নতুন প্রোজেক্ট” অংশে “শুধু স্ক্রিপ্ট” ট্যাবটি নির্বাচন করে আপনার বাংলা বা ইংরেজি গল্প লিখুন। সফটওয়্যারটি নিজেই কথার গতি অনুযায়ী টাইমিং ও ফনেটিক লিপ-সিঙ্ক তৈরি করে অ্যানিমেশন দেখাবে। পরে অডিও রেকর্ড হয়ে গেলে তা যুক্ত করে ফাইনাল এক্সপোর্ট করতে পারবেন।',
    keywords: ['অডিও নেই', 'স্ক্রিপ্ট', 'quick preview', 'audio'],
  },
  {
    id: 'faq-wrong-scene',
    question: 'কোনো একটি দৃশ্যের পরিবেশ বা চরিত্র আমার মনের মতো না হলে কী করব?',
    answer:
      'ভিডিওর ওই দৃশ্যে ক্লিক করে ডান পাশের “ডিরেক্টর” প্যানেল থেকে ৩২+ পরিবেশ, চরিত্র, অভিব্যক্তি, আলো বা ক্যামেরা অ্যাঙ্গেল সাথে সাথে বদলে নিতে পারবেন। এছাড়া “দৃশ্য পুনরায় সাজান” বক্সে বাংলা বা ইংরেজিতে ছোট নির্দেশনা লিখে ক্লিক করলে ওই একটি দৃশ্যই নতুন করে সাজানো যাবে।',
    keywords: ['দৃশ্য পরিবর্তন', 'ডিরেক্টর', 'সিন', 'change scene', 'character'],
  },
  {
    id: 'faq-subtitle-sync',
    question: 'ভয়েসওভারের সাথে সাবটাইটেল একটু আগে বা পরে এলে কীভাবে ঠিক করব?',
    answer:
      'স্টুডিও প্রিভিউর নিচে থাকা টাইমলাইন এডিটরে “SRT সিঙ্ক” অংশে -0.5s, -0.1s, +0.1s এবং +0.5s বাটন আছে। ওয়েভফর্ম দেখে কয়েকবার ক্লিক করলেই পুরো ভিডিওর সাবটাইটেল ও লিপ-সিঙ্ক নিখুঁতভাবে মিলে যাবে।',
    keywords: ['সাবটাইটেল', 'সিঙ্ক', 'srt', 'delay', 'offset'],
  },
  {
    id: 'faq-redesign',
    question: 'সম্পূর্ণ ভিডিওর ডিজাইন ও কালার কম্বিনেশন কি এক ক্লিকে বদলানো যায়?',
    answer:
      'হ্যাঁ। বাম পাশের স্টুডিও মেনু থেকে “রিডিজাইন স্টুডিও” খুলুন। সেখানে “সবকিছু রিমিক্স করুন” চাপলে পুরো ভিডিওর ফ্রেমিং, কালার প্যালেট ও স্টাইল নতুন রূপে সাজবে। আগের ডিজাইন ভালো লাগলে সাথে সাথেই “Undo” করে ফিরিয়ে আনতে পারবেন।',
    keywords: ['রিডিজাইন', 'কালার', 'ডিজাইন', 'undo', 'redesign'],
  },
  {
    id: 'faq-mobile',
    question: 'মোবাইল ফোন থেকে কি এই ওয়েবসাইট ব্যবহার করা যাবে?',
    answer:
      'হ্যাঁ, পুরো ওয়েবসাইট ও স্টুডিও মোবাইল এবং ট্যাবলেট স্ক্রিনের জন্য রেসপন্সিভভাবে তৈরি। তবে ৪কে (4K UHD) দীর্ঘ ভিডিও এক্সপোর্ট করার জন্য ডেস্কটপ বা ল্যাপটপ ব্রাউজার সবচেয়ে দ্রুত ও স্থিতিশীল পারফরম্যান্স দেয়।',
    keywords: ['মোবাইল', 'ফোন', 'ল্যাপটপ', 'mobile', 'responsive'],
  },
  {
    id: 'faq-free-privacy',
    question: 'এই সফটওয়্যার ব্যবহার করতে কি কোনো পেইড এপিআই কী বা সাবস্ক্রিপশন লাগে?',
    answer:
      'না, কোনো পেইড এপিআই কী ছাড়াই এর সম্পূর্ণ ৩২-ওয়ার্ল্ড ২ডি অ্যানিমেশন ইঞ্জিন, ফনেটিক লিপ-সিঙ্ক, টাইমলাইন, রিডিজাইন ও ব্রাউজার ভিডিও এক্সপোর্ট সরাসরি কাজ করে।',
    keywords: ['ফ্রি', 'পেইড', 'এপিআই', 'free', 'api key', 'privacy'],
  },
];

// Default legacy exports preserved for existing imports/tests
export const MANUAL_CHAPTERS = MANUAL_CHAPTERS_BN;
export const MANUAL_FAQS = MANUAL_FAQS_BN;

export function getManualChapters(lang: AppLang): ManualChapter[] {
  return lang === 'bn' ? MANUAL_CHAPTERS_BN : MANUAL_CHAPTERS_EN;
}

export function getManualFaqs(lang: AppLang): ManualFaqItem[] {
  return lang === 'bn' ? MANUAL_FAQS_BN : MANUAL_FAQS_EN;
}

export function filterManualSections(
  chapters: ManualChapter[],
  query: string,
  category: ManualChapter['category'] | 'all' = 'all'
): ManualChapter[] {
  const normalized = query.trim().toLowerCase();
  return chapters.filter((chapter) => {
    if (category !== 'all' && chapter.category !== category) {
      return false;
    }
    if (!normalized) return true;

    const haystack = [
      chapter.title,
      chapter.summary,
      chapter.categoryLabel,
      chapter.tip ?? '',
      ...chapter.keywords,
      ...chapter.bullets.flatMap((b) => [b.title, b.detail]),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function filterManualFaqs(faqs: ManualFaqItem[], query: string): ManualFaqItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return faqs;
  return faqs.filter((faq) => {
    const haystack = `${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
