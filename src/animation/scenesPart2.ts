import {
  CANVAS_W,
  CANVAS_H,
  clamp01,
  lerp,
  smoothstep,
  easeOutCubic,
  drawSky,
  drawSun,
  drawClouds,
  drawTownSilhouette,
  drawTree,
  drawSchoolGate,
  drawGamchhaRect,
  drawRickshaw,
  drawCharacter,
  drawMonsoonRain,
} from './drawHelpers';

/**
 * Scene 5 (02:05.4 – 02:25.8): Dark storm clouds, 10:30 AM classroom wall clock,
 * Jamal Sir's warning ("half an hour left"), Rafi gazing through window as torrential rain floods the field.
 */
export function renderSceneStormWindow(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  const rainStarts = smoothstep(10.5, 13.0, sceneTime);
  const lightning =
    sceneTime > 12.2 && (Math.sin(globalTime * 11.7) > 0.955 || Math.sin(globalTime * 7.3) > 0.97)
      ? 0.42
      : 0;

  // Outside monsoon sky visible through large barred classroom window
  drawSky(ctx, [
    [0, '#1B2531'],
    [0.52, '#2F3E4E'],
    [0.85, '#465868'],
    [1, '#586A7A'],
  ]);
  drawClouds(ctx, globalTime, 'rgba(26, 34, 44, 0.78)', 7, 45, 220, 22);

  // School field outside window flooding with water
  ctx.fillStyle = lerpColorHex('#455E42', '#344B5A', rainStarts);
  ctx.fillRect(0, 395, CANVAS_W, 180);
  drawTree(ctx, 880, 412, 0.95, globalTime * 2.2, '#1F3528', '#2C4938', '#221C18');
  drawTree(ctx, 1140, 418, 1.05, globalTime * 2.2, '#1D3025', '#294334', '#221C18');

  if (rainStarts > 0.05) {
    drawMonsoonRain(ctx, globalTime, rainStarts * 1.15, 420);
  }

  // Classroom interior wall framing the big window on the right
  ctx.fillStyle = '#2B3038';
  ctx.fillRect(0, 0, 560, CANVAS_H);
  ctx.fillRect(560, 0, CANVAS_W - 560, 96);
  ctx.fillRect(560, 515, CANVAS_W - 560, CANVAS_H - 515);
  ctx.fillRect(1185, 96, 95, 420);

  // Iron window bars
  ctx.strokeStyle = '#181C22';
  ctx.lineWidth = 7;
  ctx.strokeRect(560, 96, 625, 419);
  ctx.lineWidth = 4;
  for (let i = 1; i <= 5; i++) {
    const bx = 560 + i * (625 / 6);
    ctx.beginPath();
    ctx.moveTo(bx, 96);
    ctx.lineTo(bx, 515);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(560, 305);
  ctx.lineTo(1185, 305);
  ctx.stroke();

  // Classroom wall clock showing 10:30 ticking toward 10:45
  ctx.save();
  ctx.translate(275, 195);
  ctx.fillStyle = '#ECE7DC';
  ctx.strokeStyle = '#3C2F26';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hour ticks
  ctx.strokeStyle = '#242220';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 50, Math.sin(a) * 50);
    ctx.lineTo(Math.cos(a) * 58, Math.sin(a) * 58);
    ctx.stroke();
  }
  // Hour hand (near 10:30)
  const minuteProgress = clamp01(sceneTime / 20) * 14; // 10:30 -> 10:44
  const hourAngle = ((10 + (30 + minuteProgress) / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = ((30 + minuteProgress) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#1A1A1D';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(hourAngle) * 34, Math.sin(hourAngle) * 34);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(minAngle) * 48, Math.sin(minAngle) * 48);
  ctx.stroke();

  // Red ticking second hand
  const secAngle = ((globalTime * 1) % 60 / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#C93A32';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(secAngle) * 52, Math.sin(secAngle) * 52);
  ctx.stroke();
  ctx.restore();

  // Rafi in foreground silhouette gazing anxiously out the rain-streaked window
  ctx.save();
  ctx.translate(485, 555);
  ctx.fillStyle = '#5389B8';
  ctx.beginPath();
  ctx.roundRect(-52, -130, 104, 155, 18);
  ctx.fill();
  ctx.fillStyle = '#B8815B';
  ctx.beginPath();
  ctx.arc(8, -162, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#151417';
  ctx.beginPath();
  ctx.arc(2, -168, 35, Math.PI * 0.85, Math.PI * 2.04);
  ctx.fill();
  ctx.fillStyle = '#151417';
  ctx.beginPath();
  ctx.arc(24, -164, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle lightning flash
  if (lightning > 0) {
    ctx.fillStyle = `rgba(220, 238, 255, ${lightning})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

/**
 * Scene 6 (02:25.8 – 03:09.0): Climax!
 * - 0..13s: Just before 11:00, Father pedals drenched straight through the school gate in heavy monsoon rain.
 * - 13..24s: Emotional close-up inset of Father pulling the dry polythene-wrapped ৳3,000 packet from inside his wet shirt.
 * - 24..33s: Veranda students & Sakib nudging Rafi ("isn't that your lane's rickshaw-puller?").
 * - 33..43.2s: "No, he is my father!" — Rafi sprints into the pouring rain, takes the packet, and holds his own blue shirt over Father's head!
 */
export function renderSceneRainArrival(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  drawSky(ctx, [
    [0, '#16202C'],
    [0.48, '#263646'],
    [0.82, '#3B4E5F'],
    [1, '#4A5F70'],
  ]);
  drawClouds(ctx, globalTime, 'rgba(22, 30, 40, 0.82)', 8, 35, 200, 26);
  drawTownSilhouette(ctx, 430, '#222F3D', 0, false);

  // Stormy school building & open gate on left-center
  drawSchoolGate(ctx, 325, 466, 0.96, true);

  // Flooded school yard & wet reflective road
  const floodGrad = ctx.createLinearGradient(0, 466, 0, CANVAS_H);
  floodGrad.addColorStop(0, '#2B3E4D');
  floodGrad.addColorStop(0.5, '#223342');
  floodGrad.addColorStop(1, '#15222E');
  ctx.fillStyle = floodGrad;
  ctx.fillRect(0, 466, CANVAS_W, CANVAS_H - 466);

  // Wet reflections of warm veranda lights on flooded water
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(246, 206, 128, 0.14)';
    ctx.beginPath();
    ctx.ellipse(240 + i * 60, 520 + (i % 2) * 14, 24, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTree(ctx, 1080, 476, 1.12, globalTime * 2.5, '#192E24', '#274235', '#1F1A17');

  // Students watching from the sheltered school veranda (left side)
  for (let i = 0; i < 4; i++) {
    drawCharacter(ctx, {
      x: 118 + i * 44,
      y: 470,
      scale: 0.62,
      facing: 1,
      shirtColor: i === 2 ? '#86BCE6' : '#CBD8E4',
      pantsColor: '#1B283C',
      pointing: i === 2 && sceneTime >= 25.0 && sceneTime < 33.0,
    });
  }

  // Father pedaling furiously from right into the school courtyard (0..11.5s), then stopping by center
  const arriveT = easeOutCubic(clamp01(sceneTime / 11.2));
  const rickshawX = lerp(1240, 745, arriveT);
  const wheelAngle = -arriveT * 16;

  // After 12.5s Father dismounts to stand in the rain holding out the dry polythene packet
  const fatherStanding = sceneTime >= 12.2;

  drawRickshaw(ctx, {
    x: rickshawX,
    y: 598,
    scale: 1.15,
    facing: -1,
    wheelAngle,
    pedalPhase: wheelAngle,
    hoodUp: true,
    hasGamchhaOnSeat: true,
    hasPolytheneOnSeat: true,
    isWet: true,
    showFather: !fatherStanding,
    fatherState: 'drenched',
  });

  if (fatherStanding) {
    drawCharacter(ctx, {
      x: 590,
      y: 604,
      scale: 1.18,
      facing: -1,
      shirtColor: '#6C7D8B', // soaked clinging shirt
      pantsColor: '#1B3347',
      skinColor: '#9C6646',
      isAdult: true,
      isWet: true,
      holdingPolytheneMoney: sceneTime < 37.5,
    });
  }

  // Rafi sprinting out from veranda into the rain (32.8s..37.5s), then shielding Father with his own blue shirt!
  if (sceneTime >= 32.8) {
    const runT = easeOutCubic(clamp01((sceneTime - 32.8) / 4.2));
    const rafiX = lerp(265, 545, runT);
    const rafiY = lerp(476, 606, runT);
    const rafiScale = lerp(0.68, 1.12, runT);
    const shieldingFather = sceneTime >= 37.2;

    drawCharacter(ctx, {
      x: rafiX,
      y: rafiY,
      scale: rafiScale,
      facing: 1,
      walkPhase: shieldingFather ? 0 : (sceneTime - 32.8) * 11,
      shirtColor: '#79B6E4',
      pantsColor: '#1C2B42',
      isWet: true,
      holdingShirtOverHead: shieldingFather,
    });
  } else if (sceneTime >= 24.0) {
    // Rafi on veranda beside Sakib before running out
    drawCharacter(ctx, {
      x: 256,
      y: 472,
      scale: 0.65,
      facing: 1,
      shirtColor: '#79B6E4',
      pantsColor: '#1C2B42',
    });
  }

  // Emotional inset: Dry folded Taka notes inside clear polythene packet (sceneTime 14.5..24.5s)
  const moneyInset =
    smoothstep(14.5, 16.0, sceneTime) * (1 - smoothstep(23.2, 24.6, sceneTime));
  if (moneyInset > 0.01) {
    ctx.save();
    ctx.globalAlpha = moneyInset;
    ctx.translate(640, 218);
    ctx.fillStyle = 'rgba(12, 18, 26, 0.92)';
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-210, -108, 420, 216, 14);
    ctx.fill();
    ctx.stroke();

    // Clear polythene wrap gleaming against rain
    ctx.fillStyle = 'rgba(220, 242, 255, 0.25)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-124, -62, 248, 118, 12);
    ctx.fill();
    ctx.stroke();

    // Crisp dry Bangladeshi Taka notes neatly folded inside
    const drawTakaNote = (oy: number, rot: number, color: string) => {
      ctx.save();
      ctx.translate(0, oy);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-84, -26, 168, 52, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-76, -19, 152, 38);
      ctx.fillStyle = '#F7F3E6';
      ctx.font = '700 22px "Noto Serif Bengali", serif';
      ctx.textAlign = 'center';
      ctx.fillText('৳ ১০০০', 0, 8);
      ctx.restore();
    };
    drawTakaNote(-10, -0.05, '#7A3D58');
    drawTakaNote(-2, 0.03, '#4E7C5A');
    drawTakaNote(8, -0.01, '#8D495C');

    ctx.fillStyle = '#F4E5C2';
    ctx.font = '600 16px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('শুকনো পলিথিনে ভাঁজ করা ৩,০০০ টাকা · একটুও ভেজেনি', 0, 86);
    ctx.restore();
  }

  // Intense monsoon downpour over entire frame
  drawMonsoonRain(ctx, globalTime, 1.35, 480);

  // Dramatic lightning pulse near Father's entrance
  if (sceneTime > 3 && sceneTime < 12 && Math.sin(globalTime * 9.1) > 0.965) {
    ctx.fillStyle = 'rgba(220, 238, 255, 0.34)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

/**
 * Scene 7 (03:09.0 – 03:34.6): Post-rain golden afternoon ride home.
 * Rafi runs his hand gently over the dry folded gamchha seat while Father's back is soaked.
 * At 17..25.6s: Close-up on the round handlebar rearview mirror reflecting Rafi's proud smile.
 */
export function renderSceneMirrorRide(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  const scroll = sceneTime * 78;

  // Post-rain golden clouds breaking open
  drawSky(ctx, [
    [0, '#446888'],
    [0.36, '#87A4BA'],
    [0.7, '#E6B985'],
    [1, '#F5D8A8'],
  ]);
  drawSun(ctx, 1020, 210, 42, '#FFF4D4', 'rgba(255, 194, 104, 0.48)');
  drawClouds(ctx, globalTime, 'rgba(255, 234, 206, 0.68)', 6, 55, 190, 10);
  drawTownSilhouette(ctx, 438, '#667484', scroll * 0.25, true);

  // Fresh rain-washed greenery & gleaming wet road
  ctx.fillStyle = '#3B613E';
  ctx.fillRect(0, 438, CANVAS_W, 44);
  const wetRoad = ctx.createLinearGradient(0, 482, 0, CANVAS_H);
  wetRoad.addColorStop(0, '#444E5A');
  wetRoad.addColorStop(0.55, '#343D48');
  wetRoad.addColorStop(1, '#232A34');
  ctx.fillStyle = wetRoad;
  ctx.fillRect(0, 482, CANVAS_W, CANVAS_H - 482);

  // Soft painterly golden light sheen stretching along wet asphalt
  const wetSheen = ctx.createLinearGradient(0, 500, 0, CANVAS_H);
  wetSheen.addColorStop(0, 'rgba(252, 206, 128, 0.14)');
  wetSheen.addColorStop(0.5, 'rgba(252, 206, 128, 0.05)');
  wetSheen.addColorStop(1, 'rgba(252, 206, 128, 0)');
  ctx.fillStyle = wetSheen;
  ctx.fillRect(0, 500, CANVAS_W, CANVAS_H - 500);

  for (let i = 0; i < 7; i++) {
    const rx = ((i * 210 - scroll * 1.1) % (CANVAS_W + 220) + (CANVAS_W + 220)) % (CANVAS_W + 220) - 110;
    const g = ctx.createLinearGradient(rx - 64, 0, rx + 64, 0);
    g.addColorStop(0, 'rgba(252, 212, 138, 0)');
    g.addColorStop(0.5, 'rgba(252, 212, 138, 0.14)');
    g.addColorStop(1, 'rgba(252, 212, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx - 64, 545 + (i % 3) * 34, 128, 3);
  }

  for (let i = 0; i < 4; i++) {
    const tx = ((i * 410 - scroll * 0.85) % (CANVAS_W + 300) + (CANVAS_W + 300)) % (CANVAS_W + 300) - 150;
    drawTree(ctx, tx, 474, 1.06, globalTime, '#264E2E', '#487A47', '#35241A');
  }

  // Rickshaw gliding smoothly home — Rafi gently touching the folded gamchha seat
  drawRickshaw(ctx, {
    x: 470,
    y: 602 + Math.sin(sceneTime * 7) * 1.5,
    scale: 1.25,
    facing: 1,
    wheelAngle: sceneTime * 4.5,
    pedalPhase: sceneTime * 4.5,
    hoodUp: true,
    hasGamchhaOnSeat: true,
    hasPolytheneOnSeat: true,
    isWet: true,
    showFather: true,
    fatherState: 'pedaling',
    showRafiSeated: true,
    rafiTouchingSeat: sceneTime < 15.0,
  });

  // Poetic close-up inset of the round handlebar rearview mirror showing Rafi smiling proudly (16.5..25.6s)
  const mirrorAlpha = smoothstep(16.0, 18.2, sceneTime);
  if (mirrorAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = mirrorAlpha;
    ctx.translate(965, 278);

    // Chrome mirror rim & angled stem (angled slightly left so caption sits cleanly below)
    ctx.strokeStyle = '#9EA8B4';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-42, 142);
    ctx.lineTo(-96, 226);
    ctx.stroke();

    // Outer dark housing
    ctx.fillStyle = '#1C2026';
    ctx.beginPath();
    ctx.arc(0, 0, 148, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D5DCE4';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Clipped mirror glass reflection
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 136, 0, Math.PI * 2);
    ctx.clip();

    // Reflected warm sky & hood arch inside mirror
    const mirSky = ctx.createLinearGradient(0, -136, 0, 136);
    mirSky.addColorStop(0, '#96B5CC');
    mirSky.addColorStop(0.65, '#EAC38F');
    mirSky.addColorStop(1, '#3A4A5A');
    ctx.fillStyle = mirSky;
    ctx.fillRect(-140, -140, 280, 280);

    // Reflected rickshaw hood frame behind Rafi
    ctx.strokeStyle = '#1E3C5E';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(0, 32, 114, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();

    // Reflected Rafi smiling warmly with pride & gratitude
    // Shoulders & sky-blue shirt with collar
    ctx.fillStyle = '#79B6E4';
    ctx.beginPath();
    ctx.roundRect(-58, 44, 116, 110, 28);
    ctx.fill();
    ctx.fillStyle = '#B8DCF8';
    ctx.beginPath();
    ctx.moveTo(-22, 44);
    ctx.lineTo(0, 62);
    ctx.lineTo(22, 44);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#B97F5A';
    ctx.fillRect(-13, 28, 26, 22);

    // Ears
    ctx.fillStyle = '#C98E67';
    ctx.beginPath();
    ctx.ellipse(-42, 4, 7, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(42, 4, 7, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face oval
    ctx.fillStyle = '#CE946D';
    ctx.beginPath();
    ctx.ellipse(0, 2, 40, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neatly shaped hair sitting cleanly above eyebrows (never covering eyes!)
    ctx.fillStyle = '#181414';
    ctx.beginPath();
    ctx.arc(0, -12, 41, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(22, -26, 0, -24);
    ctx.quadraticCurveTo(-22, -26, -40, -18);
    ctx.closePath();
    ctx.fill();

    // Soft eyebrows
    ctx.strokeStyle = '#2B1F1B';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-24, -10);
    ctx.quadraticCurveTo(-15, -14, -7, -10);
    ctx.moveTo(7, -10);
    ctx.quadraticCurveTo(15, -14, 24, -10);
    ctx.stroke();

    // Warm expressive eyes with soft catchlights
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.arc(-15, 0, 3.8, 0, Math.PI * 2);
    ctx.arc(15, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-13.8, -1.2, 1.3, 0, Math.PI * 2);
    ctx.arc(16.2, -1.2, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Gentle proud smile
    ctx.strokeStyle = '#5E2F1E';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 14, 14, 0.16 * Math.PI, 0.84 * Math.PI);
    ctx.stroke();

    // Mirror glass diagonal sheen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-110, -90);
    ctx.lineTo(90, 110);
    ctx.stroke();
    ctx.restore();

    // Clean non-overlapping caption plate below mirror
    ctx.fillStyle = 'rgba(10, 12, 16, 0.72)';
    ctx.beginPath();
    ctx.roundRect(-108, 164, 236, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#F5E5C4';
    ctx.font = '500 15px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('সামনের আয়নায় ছেলের হাসিমুখ', 10, 186);
    ctx.restore();
  }
}

/**
 * Scene 8 (03:34.6 – 03:56.5): Golden sunset road, Father & Rafi riding into luminous dusk,
 * calligraphic Hadith & moral closing title card.
 */
export function renderSceneSunsetEpilogue(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  // Deep luminous crimson-gold Bengali sunset sky
  drawSky(ctx, [
    [0, '#1B213A'],
    [0.32, '#5C3A52'],
    [0.64, '#C96E4B'],
    [0.86, '#ECA554'],
    [1, '#F6CE7B'],
  ]);

  drawSun(ctx, 640, 395, 62, '#FFF2C8', 'rgba(255, 186, 86, 0.55)');
  drawClouds(ctx, globalTime, 'rgba(255, 206, 146, 0.36)', 6, 65, 210, 6);
  drawTownSilhouette(ctx, 448, '#2C1F2B', 0, true);

  // Silhouette horizon & evening road
  ctx.fillStyle = '#241B22';
  ctx.fillRect(0, 448, CANVAS_W, 38);
  const roadGrad = ctx.createLinearGradient(0, 486, 0, CANVAS_H);
  roadGrad.addColorStop(0, '#36262C');
  roadGrad.addColorStop(0.5, '#221920');
  roadGrad.addColorStop(1, '#120E14');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, 486, CANVAS_W, CANVAS_H - 486);

  // Golden path shimmer toward horizon
  const shimmer = ctx.createLinearGradient(0, 486, 0, CANVAS_H);
  shimmer.addColorStop(0, 'rgba(246, 188, 92, 0.32)');
  shimmer.addColorStop(1, 'rgba(246, 188, 92, 0)');
  ctx.fillStyle = shimmer;
  ctx.beginPath();
  ctx.moveTo(575, 486);
  ctx.lineTo(705, 486);
  ctx.lineTo(840, CANVAS_H);
  ctx.lineTo(440, CANVAS_H);
  ctx.closePath();
  ctx.fill();

  drawTree(ctx, 130, 476, 1.18, globalTime, '#1F1820', '#2E2229', '#191318');
  drawTree(ctx, 1150, 476, 1.16, globalTime, '#1F1820', '#2E2229', '#191318');

  // Rickshaw gliding peacefully along the golden road
  const rideX = lerp(220, 880, clamp01(sceneTime / 21.5));
  drawRickshaw(ctx, {
    x: rideX,
    y: 604 + Math.sin(sceneTime * 6) * 1.4,
    scale: 1.12,
    facing: 1,
    wheelAngle: sceneTime * 3.8,
    pedalPhase: sceneTime * 3.8,
    hoodUp: true,
    hasGamchhaOnSeat: true,
    hasPolytheneOnSeat: true,
    showFather: true,
    fatherState: 'pedaling',
    showRafiSeated: true,
  });

  // Gentle fireflies / golden dust motes floating in the sunset air
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const mx = ((i * 137 + globalTime * 18) % CANVAS_W);
    const my = 140 + ((i * 73) % 340) + Math.sin(globalTime * 2 + i) * 12;
    const alpha = 0.25 + 0.35 * Math.sin(globalTime * 2.5 + i);
    ctx.fillStyle = `rgba(255, 224, 148, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Elegant calligraphic Hadith card (sceneTime 0.5..11.5s)
  const hadithAlpha =
    smoothstep(0.6, 2.0, sceneTime) * (1 - smoothstep(10.0, 11.6, sceneTime));
  if (hadithAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = hadithAlpha;
    ctx.fillStyle = 'rgba(14, 11, 16, 0.56)';
    ctx.beginPath();
    ctx.roundRect(220, 82, 840, 152, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.48)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#E5A93C';
    ctx.font = '500 16px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('রাসূলুল্লাহ (সা.) বলেছেন', 640, 122);

    ctx.fillStyle = '#FAF4E8';
    ctx.font = '700 28px "Noto Serif Bengali", serif';
    ctx.fillText('“নিজের হাতের উপার্জনের চেয়ে উত্তম খাবার আর কিছু নেই।”', 640, 168);

    ctx.fillStyle = '#D5C7B0';
    ctx.font = '400 15px "Hind Siliguri", sans-serif';
    ctx.fillText('“There is no better food than what one earns with one’s own hands.”', 640, 206);
    ctx.restore();
  }

  // Closing tribute title card (sceneTime 12.2..21.9s)
  const endAlpha = smoothstep(12.2, 14.0, sceneTime);
  if (endAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = endAlpha;
    ctx.fillStyle = 'rgba(12, 10, 14, 0.62)';
    ctx.beginPath();
    ctx.roundRect(270, 92, 740, 164, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.42)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Small folded gamchha emblem above title
    drawGamchhaRect(ctx, 612, 112, 56, 16, 4);

    ctx.fillStyle = '#FAF4E8';
    ctx.font = '700 36px "Noto Serif Bengali", serif';
    ctx.textAlign = 'center';
    ctx.fillText('বাবার রিকশা', 640, 174);

    ctx.fillStyle = '#E5A93C';
    ctx.font = '500 17px "Hind Siliguri", sans-serif';
    ctx.fillText('হালাল ঘামের পরিচয় লুকিয়ে রাখার নয় — বুক ফুলিয়ে বলার জিনিস', 640, 214);
    ctx.restore();
  }
}

function lerpColorHex(hexA: string, hexB: string, t: number): string {
  const c = clamp01(t);
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * c);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * c);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * c);
  return `rgb(${r}, ${g}, ${bl})`;
}
