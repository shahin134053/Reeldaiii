import { resolveAssetUrl } from './assetPath';

export type DeveloperSocialPlatform = 'linkedin' | 'github' | 'facebook' | 'email';

export interface DeveloperContactSlot {
  id: DeveloperSocialPlatform;
  platformNameEn: string;
  platformNameBn: string;
  labelBn: string;
  labelEn: string;
  displayNameEn: string;
  displayNameBn: string;
  handle: string;
  actionHintEn: string;
  actionHintBn: string;
  value: string | null;
  href: string | null;
  placeholderEn: string;
  placeholderBn: string;
}

export interface SupportKoriConfig {
  id: string;
  message: string;
  color: string;
  position: 'right' | 'left';
  scriptSrc: string;
  widgetUrl: string;
  profileUrl: string;
}

export interface DeveloperProfileConfig {
  isCustomized: boolean;
  monogram: string;
  nameEn: string | null;
  nameBn: string | null;
  namePlaceholderEn: string;
  namePlaceholderBn: string;
  roleEn: string;
  roleBn: string;
  locationEn: string | null;
  locationBn: string | null;
  locationPlaceholderEn: string;
  locationPlaceholderBn: string;
  bioEn: string | null;
  bioBn: string | null;
  bioPlaceholderEn: string;
  bioPlaceholderBn: string;
  missionEn: string;
  missionBn: string;
  photoUrl: string | null;
  focusAreasEn: string[];
  focusAreasBn: string[];
  techStack: Array<{ label: string; detailEn: string; detailBn: string }>;
  contactSlots: DeveloperContactSlot[];
  supportKori: SupportKoriConfig;
}

/**
 * Centralized bilingual developer profile configuration for Md Shahin (Reeldaiii).
 */
export const DEVELOPER_PROFILE: DeveloperProfileConfig = {
  isCustomized: true,
  monogram: 'MS',
  nameEn: 'Md Shahin',
  nameBn: 'মোঃ শাহীন (Md Shahin)',
  namePlaceholderEn: 'Md Shahin',
  namePlaceholderBn: 'মোঃ শাহীন (Md Shahin)',
  roleEn: 'Creator & Software Engineer — Reeldaiii',
  roleBn: 'নির্মাতা ও সফটওয়্যার ডেভেলপার — Reeldaiii',
  locationEn: 'Dhaka, Bangladesh',
  locationBn: 'ঢাকা, বাংলাদেশ (Dhaka, Bangladesh)',
  locationPlaceholderEn: 'Dhaka, Bangladesh',
  locationPlaceholderBn: 'ঢাকা, বাংলাদেশ',
  bioEn:
    'Md Shahin is a software engineer and creative developer based in Dhaka, Bangladesh, and the creator of Reeldaiii — a browser-based, context-aware 2D storytelling animation studio that transforms voiceover audio, SRT subtitles, and written scripts into expressive 16:9 and 9:16 animated videos.',
  bioBn:
    'মোঃ শাহীন (Md Shahin) ঢাকার একজন সফটওয়্যার ইঞ্জিনিয়ার ও ক্রিয়েটিভ ডেভেলপার এবং Reeldaiii-এর নির্মাতা। ভয়েসওভার অডিও, SRT সাবটাইটেল এবং বাংলা ও ইংরেজি গল্পের স্ক্রিপ্ট থেকে সরাসরি ব্রাউজারেই গল্প-সামঞ্জস্যপূর্ণ জীবন্ত ২ডি অ্যানিমেশন ভিডিও তৈরির লক্ষ্যে তিনি এই স্টুডিওটি তৈরি করেছেন।',
  bioPlaceholderEn: 'Creator and Software Engineer behind Reeldaiii.',
  bioPlaceholderBn: 'Reeldaiii-এর নির্মাতা ও সফটওয়্যার ইঞ্জিনিয়ার।',
  missionEn:
    'To empower global and Bengali storytellers, creators, educators, and podcasters to turn voiceover audio and scripts into expressive, context-aware 2D animated videos directly in the browser.',
  missionBn:
    'বাংলা ও ইংরেজি গল্পকার, কনটেন্ট ক্রিয়েটর এবং শিক্ষকদের জন্য ভয়েসওভার ও স্ক্রিপ্ট থেকে সহজেই গল্প-সামঞ্জস্যপূর্ণ টু-ডি অ্যানিমেশন ভিডিও তৈরির একটি আধুনিক, সহজবোধ্য এবং দ্রুত স্টুডিও তৈরি করা।',
  photoUrl: resolveAssetUrl('assets/aistudio/Headshot_profile_Md_Shahin_4d1abc51.png'),
  focusAreasEn: [
    'Context-aware 2D storytelling animation engine synchronized to voiceover & SRT',
    '10-shape phonetic viseme lip-sync and audio waveform cadence analysis',
    'Dual 16:9 (YouTube) & 9:16 (Reels/Shorts/TikTok) live preview and 4K UHD export',
    'Bilingual English & Bengali studio workflow with one-click visual redesign',
  ],
  focusAreasBn: [
    'ভয়েসওভার ও SRT ভিত্তিক কনটেক্সট-অ্যাওয়্যার টু-ডি অ্যানিমেশন ইঞ্জিন',
    'ফনেটিক ভিসেম (Viseme) লিপ-সিঙ্ক এবং অডিও ওয়েভফর্ম বিশ্লেষণ',
    'ডুয়াল ১৬:৯ (YouTube) ও ৯:১৬ (Reels/Shorts) লাইভ প্রিভিউ এবং ৪কে এক্সপোর্ট',
    'বাংলা ও ইংরেজি দ্বিভাষিক স্টুডিও ইন্টারফেস ও সহজ রিডিজাইন ওয়ার্কফ্লো',
  ],
  techStack: [
    {
      label: 'HTML5 Canvas 2D Engine',
      detailEn: '32+ layered parallax worlds, camera choreography, and 10-shape phonetic viseme lip-sync',
      detailBn: '৩২+ প্যারালাক্স দৃশ্যপট, ক্যামেরা মোশন ও ১০-শেপ ভিসেম লিপ-সিঙ্ক রেন্ডারার',
    },
    {
      label: 'Web Audio DSP & Auto-Ducking',
      detailEn: 'Voiceover spectral envelope analysis and emotion-driven BGM auto-ducking balance',
      detailBn: 'ভয়েসওভার স্পেক্ট্রাল অ্যানালাইসিস এবং ইমোশন-ভিত্তিক BGM ভলিউম ব্যালেন্সিং',
    },
    {
      label: 'React 19 & TypeScript',
      detailEn: 'Type-safe story compiler, interactive timeline editor, and offline local draft storage',
      detailBn: 'টাইপ-সেফ স্টোরি কম্পাইলার, টাইমলাইন এডিটর এবং অফলাইন ড্রাফট সংরক্ষণ',
    },
    {
      label: 'High-Resolution Browser Export',
      detailEn: 'Direct 720p, 1080p HD, and 4K UHD export in MP4 & WebM for 16:9 and 9:16 formats',
      detailBn: '৭২০পি থেকে ৪কে UHD পর্যন্ত ১৬:৯ এবং ৯:১৬ ফরম্যাটে সরাসরি ভিডিও রেন্ডারিং',
    },
  ],
  contactSlots: [
    {
      id: 'linkedin',
      platformNameEn: 'LinkedIn',
      platformNameBn: 'LinkedIn',
      labelBn: 'লিংকডইন প্রোফাইল',
      labelEn: 'LinkedIn Profile',
      displayNameEn: 'Md Shahin',
      displayNameBn: 'Md Shahin',
      handle: '@shahin134053',
      actionHintEn: 'Connect on LinkedIn',
      actionHintBn: 'লিঙ্কডইনে যুক্ত হোন',
      value: 'Md Shahin',
      href: 'https://www.linkedin.com/in/shahin134053/',
      placeholderEn: 'Md Shahin',
      placeholderBn: 'Md Shahin',
    },
    {
      id: 'github',
      platformNameEn: 'GitHub',
      platformNameBn: 'GitHub',
      labelBn: 'গিটহাব প্রোফাইল',
      labelEn: 'GitHub Profile',
      displayNameEn: 'shahin134053',
      displayNameBn: 'shahin134053',
      handle: '@shahin134053',
      actionHintEn: 'View GitHub Projects',
      actionHintBn: 'গিটহাব প্রোফাইল দেখুন',
      value: 'shahin134053',
      href: 'https://github.com/shahin134053',
      placeholderEn: 'shahin134053',
      placeholderBn: 'shahin134053',
    },
    {
      id: 'facebook',
      platformNameEn: 'Facebook',
      platformNameBn: 'Facebook',
      labelBn: 'ফেসবুক প্রোফাইল',
      labelEn: 'Facebook Profile',
      displayNameEn: 'Designpro202',
      displayNameBn: 'Designpro202',
      handle: '@Designpro202',
      actionHintEn: 'Follow on Facebook',
      actionHintBn: 'ফেসবুকে ফলো করুন',
      value: 'Designpro202',
      href: 'https://www.facebook.com/Designpro202',
      placeholderEn: 'Designpro202',
      placeholderBn: 'Designpro202',
    },
    {
      id: 'email',
      platformNameEn: 'Email',
      platformNameBn: 'ইমেইল',
      labelBn: 'সরাসরি ইমেইল',
      labelEn: 'Direct Email',
      displayNameEn: 'shahin.prpl@gmail.com',
      displayNameBn: 'shahin.prpl@gmail.com',
      handle: 'shahin.prpl@gmail.com',
      actionHintEn: 'Send an Email',
      actionHintBn: 'সরাসরি ইমেইল পাঠান',
      value: 'shahin.prpl@gmail.com',
      href: 'mailto:shahin.prpl@gmail.com',
      placeholderEn: 'shahin.prpl@gmail.com',
      placeholderBn: 'shahin.prpl@gmail.com',
    },
  ],
  supportKori: {
    id: 'shahin134053',
    message: 'Support Shahin',
    color: '#FFDD00',
    position: 'right',
    scriptSrc: 'https://www.supportkori.com/widget.js',
    widgetUrl: 'https://supportkori.com/widget/shahin134053',
    profileUrl: 'https://www.supportkori.com/shahin134053',
  },
};
