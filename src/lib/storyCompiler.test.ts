import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySceneText,
  compileStoryProject,
  deriveTitleFromContent,
  exportProjectToJson,
  parseProjectFromJson,
  parseScriptToCues,
} from './storyCompiler';

test('parseScriptToCues segments Bengali and English scripts into monotonic timed cues', () => {
  const script =
    'প্রতিদিন ভোরে ফজরের নামাজ পড়ে তিনি বের হন। নদীর পাড়ে কুয়াশা জমে থাকে। হঠাৎ আকাশে কালো মেঘ জমে বৃষ্টি নামে।';
  const cues = parseScriptToCues(script, 30);

  assert.equal(cues.length, 3);
  assert.ok(cues[0].startTime >= 0);
  for (let i = 1; i < cues.length; i++) {
    assert.ok(cues[i].startTime >= cues[i - 1].endTime);
    assert.ok(cues[i].endTime > cues[i].startTime);
  }
  assert.ok(cues[cues.length - 1].endTime <= 30.01);
});

test('classifySceneText detects settings and weather from Bengali and English cues', () => {
  const dawn = classifySceneText('প্রতিদিন ভোরে ফজরের নামাজ ও মসজিদ', 0, 5);
  assert.equal(dawn.setting, 'fajr-mosque');
  assert.equal(dawn.timeOfDay, 'dawn');

  const rain = classifySceneText('হঠাৎ মুষলধারে বৃষ্টি ও ঝড় শুরু হলো', 2, 5);
  assert.equal(rain.setting, 'monsoon-rain');
  assert.equal(rain.weather, 'heavy-storm');

  const river = classifySceneText('The boat glided gently down the green village river', 1, 5);
  assert.equal(river.setting, 'river-village');
  assert.equal(river.action, 'boat-glide');

  const moral = classifySceneText('হালাল পথে ঘাম ঝরিয়ে উপার্জনের গর্ব', 4, 5);
  assert.equal(moral.setting, 'quote-epilogue');
  assert.equal(moral.action, 'quote-card');
});

test('compileStoryProject compiles SRT + audio metadata into continuous scenes', () => {
  const sampleSrt = `1
00:00:00,000 --> 00:00:06,000
ভোরে ফজরের আজানের পর গ্রামে সকাল নামল।

2
00:00:06,200 --> 00:00:14,000
নদীর পাড়ে ছোট নৌকাটা ভেসে চলল।

3
00:00:14,500 --> 00:00:22,000
দুপুরে হঠাৎ আকাশ কালো করে মুষলধারে বৃষ্টি নামল।

4
00:00:22,500 --> 00:00:30,000
সন্ধ্যায় জীবন আমাদের শেখায় পরিশ্রমের গর্ব।`;

  const project = compileStoryProject({
    title: 'নদীর গল্প',
    srtText: sampleSrt,
    audioDuration: 32,
  });

  assert.equal(project.title, 'নদীর গল্প');
  assert.equal(project.cues.length, 4);
  assert.ok(project.scenes.length >= 2);
  assert.equal(project.scenes[0].startTime, 0);
  assert.equal(project.scenes[project.scenes.length - 1].endTime, 32);
  assert.equal(project.isDemo, false);
});

test('deriveTitleFromContent preserves manual title and auto-extracts when omitted', () => {
  assert.equal(
    deriveTitleFromContent('বাবার রিকশা', 'অন্য কোনো গল্প এখানে আছে'),
    'বাবার রিকশা'
  );

  const fromScript = deriveTitleFromContent(
    '',
    'নদীর পাড়ে সূর্যাস্ত। ছোট্ট নৌকাটি শান্ত জলে ভেসে চলছে।'
  );
  assert.equal(fromScript, 'নদীর পাড়ে সূর্যাস্ত');

  const fromSrt = deriveTitleFromContent(
    '   ',
    '',
    [{ index: 1, startTime: 0, endTime: 4, text: 'The quiet village woke up before dawn.' }]
  );
  assert.equal(fromSrt, 'The quiet village woke up');

  const fromAudio = deriveTitleFromContent('', '', [], 'morning_story_voiceover.mp3');
  assert.equal(fromAudio, 'morning story voiceover');
});

test('compileStoryProject auto-generates title from script when title is left empty', () => {
  const project = compileStoryProject({
    scriptText: 'মেঘলা বিকেলের গল্প। হঠাৎ করে আকাশ কালো হয়ে বৃষ্টি নামল।',
    audioDuration: 20,
  });
  assert.equal(project.title, 'মেঘলা বিকেলের গল্প');
});

test('classifySceneText analyzes office, doctor, and family beats without random rickshaws', () => {
  const office = classifySceneText('রাত জেগে অফিসে বসে তরুণ উদ্যোক্তা ল্যাপটপে কোড লিখছে।', 0, 4);
  assert.equal(office.setting, 'office-studio');
  assert.equal(office.primaryCharacter, 'professional');
  assert.equal(office.action, 'working-desk');
  assert.notEqual(office.action, 'rickshaw-ride');

  const hospital = classifySceneText('হাসপাতালে ডাক্তার মাকে আশ্বস্ত করলেন।', 1, 4);
  assert.equal(hospital.setting, 'hospital-care');
  assert.equal(hospital.primaryCharacter, 'doctor');

  const emotional = classifySceneText('চোখে জল নিয়ে মা ছেলের মাথায় হাত রাখলেন।', 2, 4);
  assert.equal(emotional.primaryCharacter, 'mother');
  assert.equal(emotional.emotion, 'emotional');
});

test('compileStoryProject produces StoryAnalysisSummary and audioEnvelope for lip-sync', () => {
  const project = compileStoryProject({
    scriptText: 'স্বপ্নের শুরু ল্যাপটপ থেকে। অফিসে বসে পরিশ্রম আর একাগ্রতা একদিন সাফল্যের আলো আনে।',
    audioDuration: 24,
  });

  assert.ok(project.analysis, 'Expected StoryAnalysisSummary on compiled project');
  assert.ok(project.analysis.detectedCharacters.length > 0);
  assert.ok(project.analysis.narrativeHighlights.length >= 2);
  assert.ok(project.audioEnvelope && project.audioEnvelope.length > 10);
});

test('exportProjectToJson and parseProjectFromJson round-trip cleanly with v3 metadata', () => {
  const project = compileStoryProject({
    title: 'Open Source Tale',
    scriptText: 'Dawn breaks over the mosque. Rain pours at noon. Sunset brings wisdom.',
    visualStyle: 'cinematic-anime',
    audioDuration: 24,
  });

  const json = exportProjectToJson(project);
  const restored = parseProjectFromJson(json);

  assert.equal(restored.title, project.title);
  assert.equal(restored.scenes.length, project.scenes.length);
  assert.equal(restored.cues.length, project.cues.length);
  assert.equal(restored.visualStyle, 'cinematic-anime');
});

test('classifySceneText accurately matches all 9 newly added cinematic worlds & motifs', () => {
  const space = classifySceneText('রাতের আকাশে গর্জন তুলে রকেট মহাকাশের পথে ছুটে চলল।', 0, 5);
  assert.equal(space.setting, 'space-cosmos');
  assert.equal(space.motif, 'rocket-launch');

  const ocean = classifySceneText('উত্তাল সমুদ্রের ঢেউয়ের বুকে পালতোলা জাহাজ এগিয়ে চলে।', 1, 5);
  assert.equal(ocean.setting, 'ocean-voyage');
  assert.equal(ocean.motif, 'sailing-ship');

  const mountain = classifySceneText('তুষার ঢাকা পাহাড়ের চূড়ায় পৌঁছানোই ছিল তার স্বপ্ন।', 1, 5);
  assert.equal(mountain.setting, 'mountain-summit');
  assert.equal(mountain.motif, 'mountain-peak');

  const train = classifySceneText('রেল স্টেশন ছেড়ে এক্সপ্রেস ট্রেন ছুটে চলেছে দূরের শহরে।', 1, 5);
  assert.equal(train.setting, 'train-journey');
  assert.equal(train.motif, 'train-express');

  const tech = classifySceneText('কৃত্রিম বুদ্ধিমত্তা আর রোবট নিয়ে বিজ্ঞানীরা ল্যাবে গবেষণা করছেন।', 1, 5);
  assert.equal(tech.setting, 'tech-ai-lab');
  assert.equal(tech.motif, 'digital-network');

  const finance = classifySceneText('সঠিক বিনিয়োগ আর স্টার্টআপ ব্যবসায় মুনাফার গ্রাফ দ্রুত বাড়ছে।', 1, 5);
  assert.equal(finance.setting, 'finance-growth');
  assert.equal(finance.motif, 'growth-chart');

  const sports = classifySceneText('হাজারো দর্শকের উল্লাসে স্টেডিয়ামে শেষ মিনিটে গোল হলো।', 1, 5);
  assert.equal(sports.setting, 'sports-arena');
  assert.equal(sports.motif, 'stadium-ball');

  const palace = classifySceneText('ইতিহাসের প্রাচীন রাজপ্রাসাদ আর দুর্গের গল্প আজও অম্লান।', 1, 5);
  assert.equal(palace.setting, 'ancient-palace');
  assert.equal(palace.motif, 'royal-arch');

  const stage = classifySceneText('বড় মঞ্চে মাইক্রোফোন হাতে দর্শকদের সামনে সে বক্তব্য রাখল।', 1, 5);
  assert.equal(stage.setting, 'stage-spotlight');
  assert.equal(stage.motif, 'spotlight-mic');
});

test('compileStoryProject splits multi-topic SRT into distinct visual beats at semantic boundaries', () => {
  const multiTopicSrt = `1
00:00:00,000 --> 00:00:05,500
রাতের আকাশে রকেট মহাকাশের উদ্দেশ্যে যাত্রা শুরু করল।

2
00:00:06,000 --> 00:00:11,500
অন্যদিকে উত্তাল সমুদ্রের ঢেউয়ে পালতোলা জাহাজ ভেসে চলেছে।

3
00:00:12,000 --> 00:00:17,500
তুষার ঢাকা পাহাড়ের চূড়ায় দাঁড়িয়ে যাত্রীরা সূর্যোদয় দেখল।

4
00:00:18,000 --> 00:00:24,000
কৃত্রিম বুদ্ধিমত্তা আর প্রযুক্তির ল্যাবে নতুন যুগ শুরু হয়েছে।`;

  const project = compileStoryProject({
    srtText: multiTopicSrt,
    visualStyle: 'editorial-doc',
    audioDuration: 25,
  });

  assert.equal(project.visualStyle, 'editorial-doc');
  assert.equal(project.scenes.length, 4, 'Expected each topic shift to cut a distinct visual beat');
  assert.equal(project.scenes[0].setting, 'space-cosmos');
  assert.equal(project.scenes[1].setting, 'ocean-voyage');
  assert.equal(project.scenes[2].setting, 'mountain-summit');
  assert.equal(project.scenes[3].setting, 'tech-ai-lab');
  for (const scene of project.scenes) {
    assert.ok(scene.spokenExcerpt && scene.spokenExcerpt.length > 5);
    assert.ok(scene.visualMatchReason && scene.visualMatchReason.length > 5);
  }
});

test('short Bengali and English keywords do not falsely match inside longer words', () => {
  const space = classifySceneText('মানুষের সবচেয়ে বড় স্বপ্ন ছিল মহাকাশ জয় করা।', 0, 4);
  assert.equal(space.setting, 'space-cosmos');
  assert.notEqual(space.primaryCharacter, 'mother', 'মা must not match inside মানুষের');

  const sailing = classifySceneText('The sailing ship crossed the deep ocean waves.', 0, 4);
  assert.equal(sailing.setting, 'ocean-voyage');
  assert.notEqual(sailing.setting, 'tech-ai-lab', 'ai must not match inside sailing');
});

test('common Bengali pronouns and everyday words NEVER trigger random rockets, stadiums, storms, or tea stalls', () => {
  // "তারা" = they (must NOT trigger space-cosmos!)
  const theyWalked = classifySceneText('তারা দুজন মিলে চুপচাপ হাঁটতে লাগল।', 1, 6, 'গ্রামের বাড়িতে বাবা আর ছেলে', 'river-village');
  assert.notEqual(theyWalked.setting, 'space-cosmos', 'তারা (they) must never trigger space rocket');
  assert.equal(theyWalked.setting, 'river-village', 'Should preserve story setting continuity');

  // "পৃথিবী" = the world (must NOT trigger space-cosmos!)
  const bestFather = classifySceneText('পৃথিবীতে বাবার ভালোবাসার চেয়ে বড় আর কিছু নেই।', 2, 6, 'ঘরের ভেতর বাবা আর ছেলে', 'home-night');
  assert.notEqual(bestFather.setting, 'space-cosmos', 'পৃথিবী (world) alone must not trigger space rocket');

  // "বল" = say/tell (must NOT trigger sports-arena!)
  const sayTruth = classifySceneText('বাবা বললেন, সত্যি কথাটা আমাকে বল।', 2, 6, 'বাসায় বাবা ছেলের কথা', 'home-night');
  assert.notEqual(sayTruth.setting, 'sports-arena', 'বল (say) must never trigger sports stadium');

  // "পানি" = glass of water (must NOT trigger monsoon-rain!)
  const glassWater = classifySceneText('মা টেবিলে এক গ্লাস পানি ও ভাত এনে দিলেন।', 1, 6);
  assert.notEqual(glassWater.setting, 'monsoon-rain', 'পানি (drinking water) must not trigger monsoon storm');
  assert.equal(glassWater.setting, 'home-night');

  // "বন্ধু" alone without tea/cafe must NOT hijack a classroom/home into tea-stall!
  const friendClass = classifySceneText('বন্ধু আমাকে ক্লাসরুমের পরীক্ষার খাতাটা দিল।', 1, 6);
  assert.equal(friendClass.setting, 'classroom');
  assert.notEqual(friendClass.setting, 'tea-stall');
});


