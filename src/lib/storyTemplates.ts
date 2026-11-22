import {
  AnimationProject,
  CameraMotion,
  VisualStyle,
} from './storyCompiler';
import {
  BgmConfig,
  ColorPaletteId,
  DEFAULT_BGM_CONFIG,
  DEFAULT_DESIGN_CONFIG,
  DEFAULT_SUBTITLE_CONFIG,
  DesignConfig,
  LayoutMode,
  SubtitleConfig,
  SubtitleFontId,
} from './redesignAndStudio';

export type StoryTemplateId =
  | 'rupkotha'
  | 'horror-mystery'
  | 'history'
  | 'motivational'
  | 'kids-rhyme';

export interface StoryTemplatePreset {
  id: StoryTemplateId;
  nameEn: string;
  nameBn: string;
  taglineEn: string;
  taglineBn: string;
  badgeEn: string;
  badgeBn: string;
  swatches: [string, string, string];
  accentColor: string;
  visualStyle: VisualStyle;
  colorPalette: ColorPaletteId;
  layoutMode: LayoutMode;
  parallaxDepth: number;
  cameraMotion: CameraMotion;
  cameraMotionLabelEn: string;
  cameraMotionLabelBn: string;
  subtitleFont: SubtitleFontId;
  subtitleFontLabelEn: string;
  subtitleFontLabelBn: string;
  subtitlePrimaryColor: string;
  subtitleHighlightColor: string;
  subtitleBoxOpacity: number;
  bgmPreset: BgmConfig['preset'];
  starterTitleEn: string;
  starterTitleBn: string;
  starterScriptEn: string;
  starterScriptBn: string;
}

export const STORY_TEMPLATES: readonly StoryTemplatePreset[] = [
  {
    id: 'rupkotha',
    nameEn: 'Fairy Tale',
    nameBn: 'রূপকথা',
    taglineEn: 'Soft watercolor hues, dreamy floating camera & serif storybook captions.',
    taglineBn: 'স্বপ্নিল জলরঙ প্যালেট, ভাসমান ক্যামেরা মোশন ও গল্পের সেরিফ ফন্ট।',
    badgeEn: 'Folklore & Magic',
    badgeBn: 'লোককথা ও জাদু',
    swatches: ['#A882DD', '#F6C28B', '#2C214A'],
    accentColor: '#D99B52',
    visualStyle: 'storybook-warm',
    colorPalette: 'pastel-watercolor',
    layoutMode: 'editorial-frame',
    parallaxDepth: 1.25,
    cameraMotion: 'dolly-out',
    cameraMotionLabelEn: 'Dreamy Pull-Out',
    cameraMotionLabelBn: 'স্বপ্নিল পুল-আউট',
    subtitleFont: 'noto-serif',
    subtitleFontLabelEn: 'Storybook Serif',
    subtitleFontLabelBn: 'গল্পের সেরিফ ফন্ট',
    subtitlePrimaryColor: '#FFF9F0',
    subtitleHighlightColor: '#F6C28B',
    subtitleBoxOpacity: 0.72,
    bgmPreset: 'warm-piano',
    starterTitleEn: 'The Golden Moon Prince',
    starterTitleBn: 'সোনার চাঁদের রাজপুত্র',
    starterScriptEn:
      'Once upon a time beyond seven seas stood an ancient village glowing under a golden moon. A kind young traveler found a lantern floating on the silent river. Inside the lantern whispered an old song of courage and hope. Through the misty forest and across starry hills, he carried the warm light back to every home.',
    starterScriptBn:
      'এক ছিল দূর দেশের ছোট্ট গ্রাম, যেখানে প্রতি পূর্ণিমায় সোনার চাঁদ উঠত। এক দয়ালু কিশোর নদীর জলে ভেসে আসা একটি জাদুর লণ্ঠন খুঁজে পেল। লণ্ঠনের ভেতর থেকে ভেসে এল সাহস আর ভালোবাসার এক প্রাচীন সুর। কুয়াশাচ্ছন্ন অরণ্য আর তারার পাহাড় পেরিয়ে সে সেই সোনালি আলো পৌঁছে দিল প্রতিটি ঘরে।',
  },
  {
    id: 'horror-mystery',
    nameEn: 'Horror & Mystery',
    nameBn: 'ভৌতিক ও রহস্য',
    taglineEn: 'Deep monochrome noir shadows, suspenseful slow dolly & crisp mono subtitles.',
    taglineBn: 'গাঢ় নয়ার অন্ধকার, রহস্যময় স্লো-ডলি ক্যামেরা ও তীক্ষ্ণ মনো ফন্ট।',
    badgeEn: 'Thriller & Suspense',
    badgeBn: 'ভৌতিক ও থ্রিলার',
    swatches: ['#151822', '#C93838', '#9DA8BC'],
    accentColor: '#C93838',
    visualStyle: 'dramatic-noir',
    colorPalette: 'monochrome-noir',
    layoutMode: 'full-bleed',
    parallaxDepth: 1.35,
    cameraMotion: 'dolly-in',
    cameraMotionLabelEn: 'Suspense Dolly-In',
    cameraMotionLabelBn: 'সাসপেন্স ডলি-ইন',
    subtitleFont: 'jetbrains-mono',
    subtitleFontLabelEn: 'Thriller Mono',
    subtitleFontLabelBn: 'রহস্য মনো ফন্ট',
    subtitlePrimaryColor: '#EAEFF7',
    subtitleHighlightColor: '#F87171',
    subtitleBoxOpacity: 0.86,
    bgmPreset: 'lofi-ambient',
    starterTitleEn: 'Midnight at the Old Station',
    starterTitleBn: 'পুরোনো স্টেশনের মধ্যরাত',
    starterScriptEn:
      'At midnight a dense fog swallowed the abandoned railway station. Rain tapped steadily on the rusted tin roof as a single streetlamp flickered in the wind. Footsteps echoed down the empty platform, though nobody was in sight. Near the old clock tower, a forgotten diary waited with a secret no one dared to read.',
    starterScriptBn:
      'মধ্যরাতে ঘন কুয়াশায় ঢেকে গেল পরিত্যক্ত পুরোনো রেলস্টেশন। মরিচা ধরা টিনের চালে বৃষ্টির ফোঁটা পড়ছে, আর বাতাসে কেঁপে উঠছে একা একটি ল্যাম্পপোস্ট। জনশূন্য প্ল্যাটফর্মে হঠাৎ পায়ের শব্দ শোনা গেল, কিন্তু চারপাশে কেউ নেই। পুরোনো ঘড়িঘরের নিচে পড়ে ছিল এক রহস্যময় ডায়েরি, যার পাতায় লুকানো ছিল অজানা সত্য।',
  },
  {
    id: 'history',
    nameEn: 'History & Heritage',
    nameBn: 'ইতিহাস ও ঐতিহ্য',
    taglineEn: 'Archival heritage gold grading, documentary pan & dignified classical serif.',
    taglineBn: 'ঐতিহ্যবাহী সোনালি গ্রেডিং, ডকুমেন্টারি প্যান ও ক্লাসিক সেরিফ ফন্ট।',
    badgeEn: 'Chronicle & Documentary',
    badgeBn: 'ডকুমেন্টারি ও ঐতিহ্য',
    swatches: ['#E5A93C', '#8C5A2B', '#1C1712'],
    accentColor: '#E5A93C',
    visualStyle: 'editorial-doc',
    colorPalette: 'heritage-gold',
    layoutMode: 'doc-minimal',
    parallaxDepth: 0.9,
    cameraMotion: 'pan-right',
    cameraMotionLabelEn: 'Archival Pan',
    cameraMotionLabelBn: 'আর্কাইভাল প্যান',
    subtitleFont: 'fraunces',
    subtitleFontLabelEn: 'Editorial Classic',
    subtitleFontLabelBn: 'এডিটোরিয়াল ক্লাসিক',
    subtitlePrimaryColor: '#FBF5E8',
    subtitleHighlightColor: '#E5A93C',
    subtitleBoxOpacity: 0.78,
    bgmPreset: 'cinematic-strings',
    starterTitleEn: 'Echoes of Bengal’s River Ports',
    starterTitleBn: 'বাংলার প্রাচীন নদীবন্দরের ইতিহাস',
    starterScriptEn:
      'Centuries ago, bustling wooden boats filled the wide rivers of Bengal at dawn. Weavers, merchants, and scholars gathered along the brick ghats carrying muslin, spices, and manuscripts. Every stone courtyard along the riverbanks preserved stories of resilience and craftsmanship. Even today, the morning river breeze echoes the timeless heritage of those golden years.',
    starterScriptBn:
      'কয়েক শতাব্দী আগে ভোরের আলো ফুটতেই বাংলার প্রশস্ত নদীগুলো ভরে উঠত পালতোলা নৌকায়। ইটের বাঁধানো ঘাটে তাঁতি, বণিক আর পণ্ডিতেরা নিয়ে আসতেন মসলিন, মসলা আর প্রাচীন পুঁথি। নদীর পাড়ের প্রতিটি প্রাচীন প্রাঙ্গণ আজও ধরে রেখেছে পরিশ্রম ও শিল্পকলার অমূল্য নিদর্শন। আজও ভোরের নদীবাতাসে শোনা যায় সেই সোনালি ঐতিহ্যের প্রতিধ্বনি।',
  },
  {
    id: 'motivational',
    nameEn: 'Motivational',
    nameBn: 'মোটিভেশনাল',
    taglineEn: 'Bold crimson-amber contrast, dynamic tracking motion & crisp modern headlines.',
    taglineBn: 'উদ্দীপনাময় ক্রিমসন-অ্যাম্বার রঙ, ডায়নামিক ট্র্যাকিং ও স্পষ্ট আধুনিক ফন্ট।',
    badgeEn: 'Inspire & Rise',
    badgeBn: 'অনুপ্রেরণা ও সাফল্য',
    swatches: ['#E85D4A', '#F5B041', '#1D1418'],
    accentColor: '#F59E0B',
    visualStyle: 'cinematic-anime',
    colorPalette: 'crimson-drama',
    layoutMode: 'split-focus',
    parallaxDepth: 1.2,
    cameraMotion: 'tracking',
    cameraMotionLabelEn: 'Dynamic Tracking',
    cameraMotionLabelBn: 'ডায়নামিক ট্র্যাকিং',
    subtitleFont: 'hind-siliguri',
    subtitleFontLabelEn: 'Bold Modern Sans',
    subtitleFontLabelBn: 'বোল্ড আধুনিক স্যান্স',
    subtitlePrimaryColor: '#FFFFFF',
    subtitleHighlightColor: '#FCD34D',
    subtitleBoxOpacity: 0.8,
    bgmPreset: 'epic-pulse',
    starterTitleEn: 'Every Quiet Step Builds Tomorrow',
    starterTitleBn: 'প্রতিটি ছোট পদক্ষেপই গড়ে তোলে আগামী',
    starterScriptEn:
      'Before the city wakes, a determined student opens her notebook beneath a warm desk lamp. Storms may slow the road and doubts may whisper loudly, yet consistency never betrays honest effort. Every small step taken with discipline turns an ordinary morning into a breakthrough. Rise again today, because your hardest chapter is shaping your strongest victory.',
    starterScriptBn:
      'শহর জেগে ওঠার আগেই টেবিল ল্যাম্পের আলোয় এক দৃঢ়প্রতিজ্ঞ শিক্ষার্থী তার খাতা খোলে। ঝড়-বৃষ্টি পথ আটকাতে পারে, ব্যর্থতা মন ভাঙতে চাইতে পারে, তবু নিয়মিত পরিশ্রম কখনো বিফলে যায় না। প্রতিদিনের ছোট ছোট প্রচেষ্টাই একসময় বড় সাফল্যের দরজা খুলে দেয়। আজ আবার নতুন উদ্যমে শুরু করো, কারণ আজকের সংগ্রামই তোমার আগামীর বিজয়।',
  },
  {
    id: 'kids-rhyme',
    nameEn: 'Children’s Rhymes',
    nameBn: 'ছোটদের ছড়া',
    taglineEn: 'Bright emerald-sunshine palette, playful pan-left flow & friendly rounded type.',
    taglineBn: 'উজ্জ্বল সবুজ-সোনালি রঙ, প্রাণবন্ত ক্যামেরা ও ছোটদের উপযোগী স্পষ্ট ফন্ট।',
    badgeEn: 'Kids & Rhymes',
    badgeBn: 'শিশুতোষ ও ছড়া',
    swatches: ['#34A853', '#FBBF24', '#38BDF8'],
    accentColor: '#34A853',
    visualStyle: 'storybook-warm',
    colorPalette: 'emerald-earth',
    layoutMode: 'editorial-frame',
    parallaxDepth: 1.0,
    cameraMotion: 'pan-left',
    cameraMotionLabelEn: 'Playful Pan',
    cameraMotionLabelBn: 'প্রাণবন্ত প্যান',
    subtitleFont: 'hind-siliguri',
    subtitleFontLabelEn: 'Friendly Rounded Sans',
    subtitleFontLabelBn: 'সহজপাঠ্য ফন্ট',
    subtitlePrimaryColor: '#FFFDF5',
    subtitleHighlightColor: '#FDE047',
    subtitleBoxOpacity: 0.74,
    bgmPreset: 'warm-piano',
    starterTitleEn: 'Morning Song of the Little Bird',
    starterTitleBn: 'ছোট্ট পাখির সকালের ছড়া',
    starterScriptEn:
      'Wake up, wake up, calls the little robin on the green mango branch! Golden sunshine dances across the garden flowers and smiling clouds drift high above. Paper boats sail merrily down the sparkling village stream. Laugh and clap your hands, for a bright new day of wonder has begun!',
    starterScriptBn:
      'আয় রে পাখি, আয় রে রোদ, সবুজ আমের ডালে বসে দোয়েল গায় গান! বাগানের ফুলগুলো হাসে সোনালি রোদে, আর সাদা মেঘ ভেসে যায় নীল আকাশে। ঝলমলে গ্রামের খালের জলে ভেসে চলে রঙিন কাগজের নৌকা। হাততালি দিয়ে হেসে ওঠো সবাই, আনন্দের নতুন সকাল শুরু হলো আজ!',
  },
] as const;

export function getStoryTemplateById(id: StoryTemplateId): StoryTemplatePreset {
  const found = STORY_TEMPLATES.find((t) => t.id === id);
  return found ?? STORY_TEMPLATES[0];
}

/**
 * Applies a Ready-Made Story Template's complete visual, camera, color palette,
 * subtitle typography, and BGM preset to an AnimationProject without mutating input.
 */
export function applyStoryTemplateToProject(
  project: AnimationProject,
  templateId: StoryTemplateId
): AnimationProject {
  const tpl = getStoryTemplateById(templateId);

  const nextDesignConfig: DesignConfig = {
    ...(project.designConfig ?? DEFAULT_DESIGN_CONFIG),
    layoutMode: tpl.layoutMode,
    colorPalette: tpl.colorPalette,
    parallaxDepth: tpl.parallaxDepth,
    remixSeed: (project.designConfig?.remixSeed ?? 0) + 1,
  };

  const nextSubtitleConfig: SubtitleConfig = {
    ...(project.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG),
    fontFamily: tpl.subtitleFont,
    primaryColor: tpl.subtitlePrimaryColor,
    highlightColor: tpl.subtitleHighlightColor,
    boxOpacity: tpl.subtitleBoxOpacity,
  };

  const nextBgmConfig: BgmConfig = {
    ...(project.bgmConfig ?? DEFAULT_BGM_CONFIG),
    preset: tpl.bgmPreset,
  };

  const nextScenes = project.scenes.map((scene, idx) => ({
    ...scene,
    // Keep scene variety while biasing primary motion toward the genre template
    cameraMotion: idx % 3 === 2 ? scene.cameraMotion : tpl.cameraMotion,
    accentColor: tpl.accentColor,
  }));

  return {
    ...project,
    visualStyle: tpl.visualStyle,
    designConfig: nextDesignConfig,
    subtitleConfig: nextSubtitleConfig,
    bgmConfig: nextBgmConfig,
    scenes: nextScenes,
  };
}
