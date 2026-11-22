import test from 'node:test';
import assert from 'node:assert/strict';
import { compileStoryProject } from './storyCompiler';
import {
  classifyStoryGenre,
  computeStorySeed,
  extractDynamicStoryElements,
} from './storySceneDirector';

function buildSyntheticLongSrt(cueCount: number, secondsPerCue: number, lines: string[]): string {
  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.round((sec - Math.floor(sec)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };
  const blocks: string[] = [];
  for (let i = 0; i < cueCount; i++) {
    const start = i * secondsPerCue;
    const end = start + secondsPerCue - 0.3;
    blocks.push(`${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${lines[i % lines.length]}`);
  }
  return blocks.join('\n\n');
}

test('long uploaded SRT stories are NEVER capped at 24 scenes and scale naturally with story shifts', () => {
  const richLines = [
    'ভোরবেলা গ্রামের কুঁড়েঘরের উঠানে পাখি ডাকতে শুরু করল।',
    'সকালে তারা গভীর জঙ্গলের পথে হরিণ দেখতে এগিয়ে গেল।',
    'দুপুরে নদীর পাড়ে ছোট নৌকায় চড়ে ওপারে গেল।',
    'বিকেলে শহরের বড় সেতু আর হাইওয়ে পেরিয়ে বাস চলল।',
    'সন্ধ্যায় পুরনো গ্রন্থাগারে বসে ডায়েরি ও চিঠি পড়ল।',
    'রাতে রহস্যময় অন্ধকার গলিতে হারিকেন হাতে হাঁটল।',
    'পরদিন আদালতে বিচারকের সামনে সত্য সাক্ষ্য দিল।',
    'শেষে উৎসবের আতশবাজি আর আলোকসজ্জায় সবাই আনন্দ করল।',
  ];
  // 42 cues * 10s = 420s (7-minute story)
  const srt = buildSyntheticLongSrt(42, 10, richLines);
  const project = compileStoryProject({
    title: 'দীর্ঘ অভিযানের গল্প',
    srtText: srt,
    audioDuration: 422,
  });

  assert.ok(
    project.scenes.length > 24,
    `Expected > 24 natural scenes for 7-minute multi-location story, got ${project.scenes.length}`
  );
  const uniqueSettings = new Set(project.scenes.map((s) => s.setting));
  assert.ok(
    uniqueSettings.size >= 6,
    `Expected at least 6 distinct visual worlds, got ${uniqueSettings.size}`
  );
});

test('three different Bengali stories produce completely different worlds, genres, and visual seeds', () => {
  const storyA = compileStoryProject({
    title: 'রহস্যময় জঙ্গল অভিযান',
    scriptText:
      'গভীর জঙ্গলের ভেতর দিয়ে আমরা হাঁটছিলাম। হঠাৎ কুয়াশাচ্ছন্ন রাতে পরিত্যক্ত বাড়ির অন্ধকার গলিতে হারিকেন জ্বলে উঠল। পুরনো লাইব্রেরিতে পাওয়া চিঠিটা রহস্যের সমাধান করল। তুষার ঢাকা শীতের সকালে সবাই নিরাপদে ফিরে এল।',
    audioDuration: 42,
  });

  const storyB = compileStoryProject({
    title: 'মরুভূমি ও প্রাচীন সাম্রাজ্য',
    scriptText:
      'তপ্ত মরুভূমির বালু পেরিয়ে উটের কাফেলা এগিয়ে চলেছে। প্রাচীন রাজপ্রাসাদের সিংহাসনে সম্রাট যুদ্ধের ঘোষণা দিলেন। সন্ধ্যায় যুদ্ধক্ষেত্রে মশাল আর পতাকা উড়ল। শেষে বিজয়ের আনন্দ ছড়িয়ে পড়ল।',
    audioDuration: 42,
  });

  const storyC = compileStoryProject({
    title: 'আদালত ও শহরের সংগ্রাম',
    scriptText:
      'সকালে হাইওয়ে আর বড় ব্রিজ পেরিয়ে সে শহরে পৌঁছাল। আদালতে বিচারকের সামনে ন্যায়বিচারের জন্য লড়াই করল। অফিসে ল্যাপটপ নিয়ে নতুন স্টার্টআপ গড়ে তুলল। রাতে বিয়ের উৎসবে আতশবাজি আর আলোকসজ্জায় সবাই হাসল।',
    audioDuration: 42,
  });

  assert.notEqual(storyA.analysis?.storyGenre, storyB.analysis?.storyGenre);
  assert.notEqual(storyB.analysis?.storyGenre, storyC.analysis?.storyGenre);

  const settingsA = new Set(storyA.scenes.map((s) => s.setting));
  const settingsB = new Set(storyB.scenes.map((s) => s.setting));
  const settingsC = new Set(storyC.scenes.map((s) => s.setting));

  assert.ok(settingsA.has('forest-wild') || settingsA.has('mystery-night'));
  assert.ok(settingsB.has('desert-dunes') || settingsB.has('ancient-palace') || settingsB.has('battle-camp'));
  assert.ok(settingsC.has('court-justice') || settingsC.has('highway-bridge') || settingsC.has('festival-celebration'));

  assert.notEqual(storyA.scenes[0].visualSeed, storyB.scenes[0].visualSeed);
  assert.notEqual(storyB.scenes[0].visualSeed, storyC.scenes[0].visualSeed);
});

test('generic narration without explicit location words evolves visually and never locks onto identical consecutive shots', () => {
  const abstractLines = [
    'জীবনের প্রতিটি দিন আমাদের নতুন কিছু শেখায়।',
    'অনেক সময় আমরা ভেবে পাই না কোন পথে যাব।',
    'তবু মনের ভেতর একটা ছোট্ট আশা জ্বলে থাকে।',
    'ধীরে ধীরে সময় বদলাতে শুরু করে।',
    'মানুষের পরিশ্রম কখনো বৃথা যায় না।',
    'সবাই একসাথে দাঁড়ালে কঠিন পথও সহজ হয়।',
    'শেষ পর্যন্ত সত্য আর ভালোবাসাই জয়ী হয়।',
  ];
  const srt = buildSyntheticLongSrt(14, 9, abstractLines);
  const project = compileStoryProject({
    title: 'আশার আলো',
    srtText: srt,
    audioDuration: 128,
  });

  assert.ok(project.scenes.length >= 6);
  const uniqueSettings = new Set(project.scenes.map((s) => s.setting));
  assert.ok(
    uniqueSettings.size >= 3,
    `Expected companion worlds to diversify abstract story instead of looping 1 backdrop, got ${Array.from(uniqueSettings).join(', ')}`
  );

  for (let i = 1; i < project.scenes.length; i++) {
    const prev = project.scenes[i - 1];
    const curr = project.scenes[i];
    const identicalTuple =
      prev.setting === curr.setting &&
      prev.action === curr.action &&
      prev.cameraShot === curr.cameraShot &&
      prev.cameraMotion === curr.cameraMotion;
    assert.equal(identicalTuple, false, `Scene ${i + 1} repeated identical camera/action/setting of Scene ${i}`);
  }
});

test('classifyStoryGenre, computeStorySeed, and extractDynamicStoryElements extract concrete Bengali story elements', () => {
  assert.equal(classifyStoryGenre('গভীর জঙ্গলে হরিণ আর পাহাড়ে অভিযান').genre, 'nature-adventure');
  assert.equal(classifyStoryGenre('আদালতে বিচারক আর উকিল সত্যের জন্য লড়ছেন').genre, 'justice-drama');
  assert.notEqual(computeStorySeed('গল্প ক'), computeStorySeed('গল্প খ'));

  const els = extractDynamicStoryElements('রাতের চাঁদের আলোয় হারিকেন হাতে চিঠি পড়ছে', 'mystery-night');
  assert.ok(els.includes('crescent-moon'));
  assert.ok(els.includes('lantern'));
  assert.ok(els.includes('books'));
});
