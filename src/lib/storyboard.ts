import { resolveAssetUrl } from './assetPath';

export type SceneId =
  | 'morning-dropoff'
  | 'fajr-gamchha'
  | 'teastall-hurt'
  | 'exam-dinner'
  | 'storm-window'
  | 'rain-arrival'
  | 'mirror-ride'
  | 'sunset-epilogue';

export interface StoryScene {
  id: SceneId;
  chapterNumber: string;
  titleBn: string;
  titleEn: string;
  summaryEn: string;
  startTime: number;
  endTime: number;
  moodColor: string;
}

export const AUDIO_SRC = resolveAssetUrl(
  'assets/aistudio/ElevenLabs_2026-11-21T19_29_56_Charlie_-_Deep__Confident__Energetic_pre_s50_sim75_v4_efbd9144.mp3'
);

export const SRT_SRC = resolveAssetUrl(
  'assets/aistudio/ElevenLabs_2026-11-21T19_29_56_Charlie_-_Deep_Confident_Energetic_pre_s50_sim75_v4_ben_d89c7a2d.srt'
);

export const FILM_DURATION = 236.5; // 3:56.5 full narrated film duration

export const STORY_SCENES: StoryScene[] = [
  {
    id: 'morning-dropoff',
    chapterNumber: '01',
    titleBn: 'স্কুল গেটের ১০০ গজ আগে',
    titleEn: 'A Hundred Yards Before the Gate',
    summaryEn: 'Rafi asks his father to stop far from the school gate and walks away without looking back.',
    startTime: 0,
    endTime: 28.0,
    moodColor: '#E5A93C',
  },
  {
    id: 'fajr-gamchha',
    chapterNumber: '02',
    titleBn: 'ফজরের ভোর ও ভাঁজ করা গামছা',
    titleEn: 'Fajr Dawn & The Folded Gamchha',
    summaryEn: 'Every dawn, Father spreads polythene and his folded gamchha so his son rides softly.',
    startTime: 28.0,
    endTime: 57.6,
    moodColor: '#D9895B',
  },
  {
    id: 'teastall-hurt',
    chapterNumber: '03',
    titleBn: 'চায়ের দোকান ও ঝালমুড়ির ঠোঙা',
    titleEn: 'The Tea Stall & Jhalmuri',
    summaryEn: 'When Sakib asks who the rickshaw-puller is, Rafi denies knowing him while Father waits across the street.',
    startTime: 57.6,
    endTime: 100.2,
    moodColor: '#C87D55',
  },
  {
    id: 'exam-dinner',
    chapterNumber: '04',
    titleBn: 'পরীক্ষার ফি ও রাতের ভাত',
    titleEn: 'Exam Fee & Silent Supper',
    summaryEn: 'Facing a 3,000 Taka exam deadline, Father pauses over his meal and promises it will arrive by eleven.',
    startTime: 100.2,
    endTime: 125.4,
    moodColor: '#B88346',
  },
  {
    id: 'storm-window',
    chapterNumber: '05',
    titleBn: 'কালো আকাশ ও আধ ঘণ্টা বাকি',
    titleEn: 'Dark Skies & Half an Hour Left',
    summaryEn: 'Monsoon clouds darken the classroom as Jamal Sir warns that only thirty minutes remain.',
    startTime: 125.4,
    endTime: 145.8,
    moodColor: '#5B7C99',
  },
  {
    id: 'rain-arrival',
    chapterNumber: '06',
    titleBn: 'বৃষ্টিতে বাবা ও শুকনো টাকা',
    titleEn: 'Through the Downpour',
    summaryEn: 'Soaked to the bone with a torn sandal, Father delivers completely dry money—and Rafi runs into the rain.',
    startTime: 145.8,
    endTime: 189.0,
    moodColor: '#4A8BB2',
  },
  {
    id: 'mirror-ride',
    chapterNumber: '07',
    titleBn: 'রিকশার আয়নায় ছেলের মুখ',
    titleEn: 'In the Handlebar Mirror',
    summaryEn: 'Sitting on the dry gamchha seat, Rafi asks his father to drop him right at the gate tomorrow.',
    startTime: 189.0,
    endTime: 214.6,
    moodColor: '#D99B4E',
  },
  {
    id: 'sunset-epilogue',
    chapterNumber: '08',
    titleBn: 'হালাল ঘামের গর্ব',
    titleEn: 'Pride of Honest Labor',
    summaryEn: 'The seat Father kept dry while getting drenched was where Rafi truly grew up.',
    startTime: 214.6,
    endTime: FILM_DURATION,
    moodColor: '#E8A849',
  },
];

/**
 * English translations aligned 1-to-1 with the 65 Bengali SRT cues.
 */
export const ENGLISH_SUBTITLES: Record<number, string> = {
  1: '"Baba, stop right here. No need to go up to the gate."',
  2: 'Nearly a hundred yards before the school gate, the rickshaw stopped.',
  3: 'Rafi slung his bag over his shoulder, turning his face slightly away as he stepped down,',
  4: 'and melted into the crowd without looking back even once.',
  5: 'Father sat on the saddle, watching until his son’s blue shirt',
  6: 'disappeared beyond the gate. Then with his gamchha he wiped the sweat',
  7: 'from his forehead and placed his foot back on the pedal.',
  8: 'This rickshaw was everything in Rafi’s father’s life.',
  9: 'Every morning after Fajr prayer, he set out with his rickshaw.',
  10: 'He would spread a polythene sheet over the passenger seat,',
  11: 'and fold his worn gamchha neatly on top, so his son could sit comfortably',
  12: 'without getting dust on his shirt.',
  13: 'He himself sat on the hard, cracked bicycle saddle.',
  14: 'Every day Rafi rode to school on that soft seat, yet',
  15: 'he never once asked why it was prepared with such care.',
  16: 'One day during tiffin break, Rafi’s friend Sakib stood',
  17: 'outside the tea stall near the gate. Suddenly he pointed and asked,',
  18: '"I see that rickshaw-puller uncle with you every morning. Who is he?"',
  19: '"I don’t know him. Just a rickshaw-puller from our lane." Rafi said it',
  20: 'with a nervous laugh, then began flipping through his textbook.',
  21: 'Across the street, Father was waiting with his rickshaw.',
  22: 'He had bought jhalmuri for his son. Whether he overheard those words',
  23: 'nobody knows. All anyone saw was that he never stepped forward',
  24: 'with the paper cone. Placing it under the seat, from the very next day',
  25: 'he began dropping Rafi off far before the gate at the street corner,',
  26: 'before Rafi even had to ask.',
  27: 'A few days later, teacher Jamal Sir entered the classroom and announced:',
  28: '"Whoever still owes exam fees must submit them by tomorrow,',
  29: 'or you will not be allowed into the exam hall."',
  30: 'Rafi’s fee was three thousand taka. That night he told his father.',
  31: 'Father paused with a morsel of rice halfway to his mouth.',
  32: 'He simply said,',
  33: '"It will reach you before eleven tomorrow morning, son.',
  34: 'Do not worry."',
  35: 'From the next morning, the sky hung dark and heavy. At ten-thirty,',
  36: 'Jamal Sir walked into class holding the fee register',
  37: 'and said, "Rafi, only half an hour left."',
  38: 'Rafi stared out the window. Just then, torrential rain',
  39: 'poured down. The field flooded with water, and all the boys',
  40: 'crowded onto the veranda.',
  41: 'Just before eleven, a rickshaw appeared at the street corner.',
  42: 'Pedaling hard, drenched to the bone, Father rode straight',
  43: 'through the school gate. His wet shirt clung to his body,',
  44: 'one strap of his sandal was snapped. Yet',
  45: 'from inside his shirt against his chest, he carefully pulled out',
  46: 'a polythene packet. Inside, the folded money was not',
  47: 'even slightly wet.',
  48: 'Everyone on the veranda was watching. Sakib nudged Rafi’s elbow',
  49: 'and asked, "Hey, isn’t that the rickshaw-puller uncle',
  50: 'from your lane?"',
  51: '"No—he is my father." Saying this, Rafi ran straight',
  52: 'out into the pouring rain. Taking the packet from his father’s hand,',
  53: 'he took off his own shirt and held it over his father’s head. That afternoon,',
  54: 'sitting on the rickshaw seat, Rafi gently ran his hand over it for the first time.',
  55: 'The gamchha was still neatly folded; the polythene underneath was dry.',
  56: 'Yet Father’s entire body was drenched. Rafi said, "Baba, from tomorrow,',
  57: 'drop me off right in front of the gate. Let everyone see."',
  58: 'Father said nothing. He simply pressed down on the pedal, and in the',
  59: 'front mirror glanced once at his son’s face.',
  60: 'The Messenger of Allah (peace be upon him) said:',
  61: '"There is no better food than what one earns with one’s own hands."',
  62: 'The seat Father kept dry while getting soaked himself',
  63: 'was the place where Rafi truly grew up.',
  64: 'The man who sheds honest sweat to raise us',
  65: 'is never someone to hide—he is someone to proclaim with pride.',
};

export function getSceneAtTime(timeSeconds: number): StoryScene {
  const clamped = Math.max(0, Math.min(timeSeconds, FILM_DURATION));
  for (let i = 0; i < STORY_SCENES.length; i++) {
    const scene = STORY_SCENES[i];
    if (clamped >= scene.startTime && clamped < scene.endTime) {
      return scene;
    }
  }
  return STORY_SCENES[STORY_SCENES.length - 1];
}

export function getSceneProgress(scene: StoryScene, timeSeconds: number): number {
  const duration = Math.max(0.001, scene.endTime - scene.startTime);
  return Math.max(0, Math.min(1, (timeSeconds - scene.startTime) / duration));
}

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
