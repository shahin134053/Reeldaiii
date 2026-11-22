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
} from './drawHelpers';

/**
 * Scene 1 (00:00 – 00:28): Morning drop-off 100 yards before the school gate.
 * - 0..6s: Rickshaw rolls up along sunlit tree-lined road and stops before the distant gate.
 * - 6..16s: Rafi gets off, turns his face slightly away, and walks into the student crowd toward the gate.
 * - 17..28s: Father watches until Rafi's blue shirt disappears past the gate, then wipes sweat with gamchha and pedals on.
 */
export function renderSceneMorningDropoff(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  // Warm golden Bangladeshi morning sky
  drawSky(ctx, [
    [0, '#4E7CA6'],
    [0.42, '#9DC3DC'],
    [0.72, '#F4D4A4'],
    [1, '#F8E3BE'],
  ]);

  drawSun(ctx, 980, 155, 36, '#FFF7DE', 'rgba(255, 206, 118, 0.45)');
  drawClouds(ctx, globalTime, 'rgba(255, 246, 228, 0.72)', 6, 60, 190, 9);

  // Distant town & school skyline
  drawTownSilhouette(ctx, 430, '#8A9BB0', 0, true);

  // Far school gate (100 yards ahead on the right)
  drawSchoolGate(ctx, 1060, 452, 0.62, false);

  // Grass verge & sunlit street pavement
  ctx.fillStyle = '#537347';
  ctx.fillRect(0, 444, CANVAS_W, 38);

  // Asphalt road with perspective warm haze
  const roadGrad = ctx.createLinearGradient(0, 476, 0, CANVAS_H);
  roadGrad.addColorStop(0, '#5A585B');
  roadGrad.addColorStop(0.5, '#464549');
  roadGrad.addColorStop(1, '#2D2C30');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, 476, CANVAS_W, CANVAS_H - 476);

  // Faded road markings
  ctx.strokeStyle = 'rgba(244, 232, 202, 0.35)';
  ctx.lineWidth = 4;
  ctx.setLineDash([42, 34]);
  ctx.beginPath();
  ctx.moveTo(0, 565);
  ctx.lineTo(CANVAS_W, 565);
  ctx.stroke();
  ctx.setLineDash([]);

  // Overhead utility wires
  ctx.strokeStyle = 'rgba(42, 38, 36, 0.32)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 175 + i * 18);
    ctx.quadraticCurveTo(CANVAS_W * 0.5, 220 + i * 20, CANVAS_W, 170 + i * 18);
    ctx.stroke();
  }

  // Lush roadside trees with crimson Krishnachura blossoms
  drawTree(ctx, 130, 466, 1.15, globalTime, '#2E5434', '#4B7B48', '#3F2B1F', '#D8432E');
  drawTree(ctx, 760, 458, 0.92, globalTime, '#33593A', '#51804F', '#3F2B1F');
  drawTree(ctx, 1210, 466, 1.05, globalTime, '#2C4F32', '#477644', '#3F2B1F', '#D8432E');

  // Distant crowd of students walking through the school gate
  for (let i = 0; i < 6; i++) {
    const sx = 950 + ((i * 34 + globalTime * 16) % 160);
    const sy = 468 + (i % 3) * 8;
    drawCharacter(ctx, {
      x: sx,
      y: sy,
      scale: 0.44,
      facing: 1,
      walkPhase: globalTime * 5 + i * 1.4,
      shirtColor: i % 2 === 0 ? '#79B6E4' : '#EBF1F5',
      pantsColor: '#1E2D45',
      hasBackpack: true,
    });
  }

  // Rickshaw motion: rolls in (0..5.2s), stops waiting (5.2..24.5s), then resumes pedaling (24.5..28s)
  const arrivalT = easeOutCubic(clamp01(sceneTime / 5.2));
  const departT = smoothstep(24.5, 28.0, sceneTime);
  const rickshawX = lerp(120, 395, arrivalT) + departT * 190;
  const isRolling = sceneTime < 5.2 || sceneTime > 24.5;
  const wheelAngle =
    (sceneTime < 5.2 ? arrivalT * 9.5 : 9.5) + (sceneTime > 24.5 ? departT * 7.0 : 0);

  const fatherState =
    sceneTime >= 22.5 && sceneTime < 25.2
      ? 'wiping-sweat'
      : isRolling
        ? 'pedaling'
        : 'waiting';

  const rafiStillSeated = sceneTime < 7.2;

  drawRickshaw(ctx, {
    x: rickshawX,
    y: 598,
    scale: 1.15,
    facing: 1,
    wheelAngle,
    pedalPhase: wheelAngle * 1.2,
    hoodUp: true,
    hasGamchhaOnSeat: true,
    hasPolytheneOnSeat: true,
    showFather: true,
    fatherState,
    showRafiSeated: rafiStillSeated,
  });

  // Rafi walking away toward the school gate without looking back (7.2s..21.5s)
  if (!rafiStillSeated && sceneTime < 22.2) {
    const walkT = clamp01((sceneTime - 7.2) / 14.2);
    const rafiX = lerp(418, 1055, walkT);
    const rafiY = lerp(602, 472, Math.pow(walkT, 0.85));
    const rafiScale = lerp(1.06, 0.44, walkT);
    const fadeOut = 1 - smoothstep(20.0, 21.8, sceneTime);

    ctx.save();
    ctx.globalAlpha = fadeOut;
    drawCharacter(ctx, {
      x: rafiX,
      y: rafiY,
      scale: rafiScale,
      facing: 1,
      walkPhase: (sceneTime - 7.2) * 5.6,
      shirtColor: '#79B6E4',
      pantsColor: '#1C2B42',
      hasBackpack: true,
      headTurnAway: sceneTime < 11.5,
    });
    ctx.restore();
  }

  // Subtle opening film title card overlay during 0.5s – 4.5s
  const titleAlpha =
    smoothstep(0.4, 1.4, sceneTime) * (1 - smoothstep(4.2, 5.4, sceneTime));
  if (titleAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = 'rgba(10, 12, 16, 0.46)';
    ctx.beginPath();
    ctx.roundRect(64, 58, 304, 86, 8);
    ctx.fill();
    ctx.fillStyle = '#F7F1E3';
    ctx.font = '700 34px "Noto Serif Bengali", serif';
    ctx.textAlign = 'left';
    ctx.fillText('বাবার রিকশা', 86, 104);
    ctx.fillStyle = '#E5A93C';
    ctx.font = '500 14px "Hind Siliguri", sans-serif';
    ctx.fillText('FATHER’S RICKSHAW  ·  SHORT ANIMATED FILM', 86, 128);
    ctx.restore();
  }
}

/**
 * Scene 2 (00:28 – 00:57.6): Fajr dawn, spreading polythene & folding the worn gamchha,
 * contrasting with the hard cracked bicycle saddle, then Rafi riding smoothly to school.
 */
export function renderSceneFajrGamchha(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  // Phase A (0..10s): Serene Fajr Dawn sky & mosque silhouette
  // Phase B (10..21.5s): Intimate split/close-up of passenger seat (polythene + folded gamchha) vs cracked hard saddle
  // Phase C (21.5..29.6s): Morning ride with Rafi sitting comfortably
  if (sceneTime < 10.2) {
    drawSky(ctx, [
      [0, '#17233B'],
      [0.42, '#35486A'],
      [0.74, '#9E6A6C'],
      [1, '#E6A87C'],
    ]);

    // Delicate Fajr crescent moon & soft dawn glow
    ctx.save();
    ctx.fillStyle = '#FFF5D9';
    ctx.beginPath();
    ctx.arc(230, 118, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20304F';
    ctx.beginPath();
    ctx.arc(239, 113, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawSun(ctx, 1010, 415, 44, '#FFE3B0', 'rgba(244, 165, 102, 0.36)');
    drawTownSilhouette(ctx, 445, '#252E44', 0, true);

    // Morning mist band
    const mistGrad = ctx.createLinearGradient(0, 390, 0, 520);
    mistGrad.addColorStop(0, 'rgba(236, 206, 185, 0)');
    mistGrad.addColorStop(0.5, 'rgba(236, 206, 185, 0.24)');
    mistGrad.addColorStop(1, 'rgba(236, 206, 185, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 390, CANVAS_W, 130);

    // Courtyard lane ground
    ctx.fillStyle = '#2E313A';
    ctx.fillRect(0, 445, CANVAS_W, CANVAS_H - 445);

    drawTree(ctx, 160, 468, 1.05, globalTime, '#1C2D2B', '#2C423B', '#211917');
    drawTree(ctx, 1120, 465, 0.98, globalTime, '#1C2D2B', '#2C423B', '#211917');

    // Father gently wheeling his rickshaw out into the Fajr morning
    const slideT = easeOutCubic(clamp01(sceneTime / 8.5));
    const rx = lerp(310, 620, slideT);
    drawRickshaw(ctx, {
      x: rx,
      y: 595,
      scale: 1.25,
      facing: 1,
      wheelAngle: slideT * 6.5,
      pedalPhase: slideT * 6.5,
      hoodUp: true,
      hasGamchhaOnSeat: true,
      hasPolytheneOnSeat: true,
      showFather: true,
      fatherState: 'pedaling',
    });
  } else if (sceneTime < 22.0) {
    // Intimate close-up visual storytelling: soft cushioned passenger seat vs cracked hard saddle
    const localT = sceneTime - 10.2;
    drawSky(ctx, [
      [0, '#1B1D24'],
      [0.5, '#282529'],
      [1, '#19171B'],
    ]);

    // Warm dawn beam illuminating the seat
    const beam = ctx.createRadialGradient(420, 290, 20, 420, 320, 460);
    beam.addColorStop(0, 'rgba(246, 198, 128, 0.24)');
    beam.addColorStop(1, 'rgba(246, 198, 128, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // LEFT FRAME: Close-up of the passenger seat being carefully layered
    ctx.save();
    ctx.translate(415, 395);

    // Carriage backrest & upholstered seat cushion
    ctx.fillStyle = '#1B3858';
    ctx.beginPath();
    ctx.roundRect(-270, -200, 520, 185, 18);
    ctx.fill();
    ctx.strokeStyle = '#E5A93C';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#7A1F24';
    ctx.beginPath();
    ctx.roundRect(-280, -30, 540, 125, 16);
    ctx.fill();

    // Polythene sheet unfurling gently (localT 0..4s)
    const polyT = easeOutCubic(clamp01(localT / 3.4));
    ctx.save();
    ctx.globalAlpha = polyT;
    ctx.fillStyle = 'rgba(225, 242, 255, 0.34)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-255, -18, 490 * polyT, 96, 10);
    ctx.fill();
    ctx.stroke();
    // Diagonal sheen highlight on polythene
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-180, -10);
    ctx.lineTo(-110, 68);
    ctx.moveTo(40, -10);
    ctx.lineTo(110, 68);
    ctx.stroke();
    ctx.restore();

    // Father's folded red-checkered gamchha settling softly onto the polythene (localT 3..7s)
    const gamchhaT = easeOutCubic(clamp01((localT - 2.8) / 3.2));
    if (gamchhaT > 0.01) {
      ctx.save();
      ctx.globalAlpha = gamchhaT;
      const dropY = lerp(-44, 0, gamchhaT);
      drawGamchhaRect(ctx, -185, -8 + dropY, 355, 76, 8);
      // Fold crease lines
      ctx.strokeStyle = 'rgba(35, 12, 12, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-185, 30 + dropY);
      ctx.lineTo(170, 30 + dropY);
      ctx.stroke();
      ctx.restore();
    }

    // Father's gentle weathered hand smoothing the gamchha
    const handAlpha = smoothstep(2.4, 3.6, localT) * (1 - smoothstep(7.2, 8.4, localT));
    if (handAlpha > 0.01) {
      const handX = lerp(-120, 110, clamp01((localT - 3.2) / 4.0));
      ctx.save();
      ctx.globalAlpha = handAlpha;
      ctx.fillStyle = '#A8704E';
      ctx.beginPath();
      ctx.ellipse(handX, 24, 36, 18, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DDD6C7';
      ctx.fillRect(handX + 26, 8, 84, 30);
      ctx.restore();
    }

    // Caption under left closeup
    ctx.fillStyle = '#E5A93C';
    ctx.font = '600 18px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('যাত্রীর সিট · পলিথিন ও ভাঁজ করা গামছা', -10, 134);
    ctx.restore();

    // RIGHT FRAME: Contrasting inset of Father's hard cracked bicycle saddle (appears at localT > 7.4s)
    const saddleReveal = easeOutCubic(clamp01((localT - 7.0) / 2.2));
    if (saddleReveal > 0.01) {
      ctx.save();
      ctx.globalAlpha = saddleReveal;
      ctx.translate(995, 395);

      ctx.fillStyle = 'rgba(15, 16, 20, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-185, -170, 370, 320, 14);
      ctx.fill();
      ctx.stroke();

      // Seat post steel rod
      ctx.fillStyle = '#737B84';
      ctx.fillRect(-12, 10, 24, 100);
      // Coiled springs under saddle
      ctx.strokeStyle = '#8F969E';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(-42, 22 + i * 11, 18, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Hard worn black leather/rubber saddle with visible cracks
      ctx.fillStyle = '#242120';
      ctx.beginPath();
      ctx.moveTo(-112, 6);
      ctx.quadraticCurveTo(-90, -56, -24, -44);
      ctx.quadraticCurveTo(55, -30, 118, -16);
      ctx.quadraticCurveTo(126, -4, 96, 6);
      ctx.quadraticCurveTo(10, 14, -112, 6);
      ctx.closePath();
      ctx.fill();

      // Exposed jagged crack lines & worn foam underneath
      ctx.strokeStyle = '#9C7B5C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-64, -32);
      ctx.lineTo(-42, -16);
      ctx.lineTo(-52, -4);
      ctx.moveTo(-12, -38);
      ctx.lineTo(14, -22);
      ctx.lineTo(2, -8);
      ctx.moveTo(46, -24);
      ctx.lineTo(62, -12);
      ctx.stroke();

      ctx.fillStyle = '#B8B4AC';
      ctx.font = '500 17px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('বাবার শক্ত, ফেটে যাওয়া সিট', 0, 128);
      ctx.restore();
    }
  } else {
    // Phase C (22..29.6s): Smooth gliding ride to school, Rafi sitting comfortably without noticing
    const rideT = sceneTime - 22.0;
    const scroll = rideT * 95;

    drawSky(ctx, [
      [0, '#598BB8'],
      [0.5, '#A9CFE4'],
      [0.82, '#F3DAB0'],
      [1, '#F8E7C8'],
    ]);
    drawSun(ctx, 1060, 140, 34);
    drawClouds(ctx, globalTime, 'rgba(255, 249, 238, 0.72)', 5, 65, 175, 12);
    drawTownSilhouette(ctx, 435, '#8A9CAE', scroll * 0.28, true);

    ctx.fillStyle = '#4E6E44';
    ctx.fillRect(0, 435, CANVAS_W, 45);
    ctx.fillStyle = '#45464B';
    ctx.fillRect(0, 480, CANVAS_W, CANVAS_H - 480);

    // Moving trees in parallax
    for (let i = 0; i < 4; i++) {
      const tx = ((i * 390 - scroll * 0.9) % (CANVAS_W + 300) + (CANVAS_W + 300)) % (CANVAS_W + 300) - 150;
      drawTree(ctx, tx, 474, 1.05, globalTime, '#2E5434', '#4C7A4A', '#3C2A1E', i % 2 === 0 ? '#D94932' : undefined);
    }

    // Road dashes scrolling smoothly
    ctx.strokeStyle = 'rgba(244, 232, 202, 0.42)';
    ctx.lineWidth = 4;
    for (let i = -1; i < 12; i++) {
      const dx = ((i * 130 - scroll * 1.4) % (CANVAS_W + 130) + (CANVAS_W + 130)) % (CANVAS_W + 130) - 65;
      ctx.beginPath();
      ctx.moveTo(dx, 566);
      ctx.lineTo(dx + 58, 566);
      ctx.stroke();
    }

    drawRickshaw(ctx, {
      x: 610,
      y: 598 + Math.sin(rideT * 9) * 1.8,
      scale: 1.24,
      facing: 1,
      wheelAngle: rideT * 5.2,
      pedalPhase: rideT * 5.2,
      hoodUp: true,
      hasGamchhaOnSeat: true,
      hasPolytheneOnSeat: true,
      showFather: true,
      fatherState: 'pedaling',
      showRafiSeated: true,
    });
  }
}

/**
 * Scene 3 (00:57.6 – 01:40.2): Tiffin break outside the roadside tea stall.
 * Sakib points across the road asking who the rickshaw-puller is; Rafi denies him;
 * Father across the street lowers the jhalmuri cone and places it under the seat.
 */
export function renderSceneTeastallHurt(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  // Warm midday / afternoon street palette
  drawSky(ctx, [
    [0, '#6B96BA'],
    [0.52, '#C8D9E2'],
    [0.82, '#EED6B5'],
    [1, '#F2DFC2'],
  ]);
  drawClouds(ctx, globalTime, 'rgba(255, 250, 240, 0.65)', 5, 60, 175, 7);
  drawTownSilhouette(ctx, 430, '#8C97A4', 0, false);

  // Far school compound wall
  ctx.fillStyle = '#B88463';
  ctx.fillRect(0, 385, CANVAS_W, 70);
  ctx.fillStyle = '#7A4933';
  ctx.fillRect(0, 380, CANVAS_W, 8);

  // Street dividing foreground tea stall (left) and Father across the street (right)
  ctx.fillStyle = '#4B4B50';
  ctx.fillRect(0, 455, CANVAS_W, CANVAS_H - 455);
  // Sidewalk curb
  ctx.fillStyle = '#8F897F';
  ctx.fillRect(0, 455, CANVAS_W, 18);
  ctx.fillRect(0, 622, CANVAS_W, 98);

  // Roadside Bangladeshi Tea Stall (চায়ের দোকান) on left side
  ctx.save();
  ctx.translate(90, 468);
  // Wooden posts & corrugated tin roof
  ctx.fillStyle = '#4F3626';
  ctx.fillRect(0, -172, 12, 172);
  ctx.fillRect(256, -172, 12, 172);
  ctx.fillStyle = '#5D6C78';
  ctx.beginPath();
  ctx.moveTo(-24, -176);
  ctx.lineTo(294, -196);
  ctx.lineTo(286, -166);
  ctx.lineTo(-18, -158);
  ctx.closePath();
  ctx.fill();

  // Back wall & signboard "মামার চায়ের দোকান"
  ctx.fillStyle = '#3B2C24';
  ctx.fillRect(12, -165, 244, 165);
  ctx.fillStyle = '#1D5244';
  ctx.fillRect(46, -184, 178, 28);
  ctx.fillStyle = '#F7EFE0';
  ctx.font = '600 14px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('মামার চায়ের দোকান', 135, -166);

  // Counter & steaming tea kettle + glass jars + hanging bananas
  ctx.fillStyle = '#6E4931';
  ctx.fillRect(10, -76, 248, 76);
  // Hanging bunch of yellow bananas
  ctx.fillStyle = '#E8BE40';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(222 + i * 7, -132 + Math.abs(i - 2) * 3, 4, 13, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  // Aluminum kettle + rising steam curls
  ctx.fillStyle = '#C8CFD6';
  ctx.beginPath();
  ctx.roundRect(54, -104, 34, 28, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const sy = ((globalTime * 22 + i * 16) % 44);
    ctx.beginPath();
    ctx.moveTo(70 + i * 5, -108 - sy);
    ctx.quadraticCurveTo(64 + i * 5, -118 - sy, 74 + i * 5, -126 - sy);
    ctx.stroke();
  }
  ctx.restore();

  // Sakib pointing across the road (sceneTime 5..15s)
  const sakibPointing = sceneTime >= 6.0 && sceneTime < 15.5;
  drawCharacter(ctx, {
    x: 245,
    y: 642,
    scale: 1.15,
    facing: 1,
    shirtColor: '#86BCE6',
    pantsColor: '#1E2D45',
    pointing: sakibPointing,
  });

  // Rafi beside Sakib, flipping his textbook awkwardly after denying Father (sceneTime >= 12.5s)
  const rafiHidingInBook = sceneTime >= 12.5;
  drawCharacter(ctx, {
    x: 345,
    y: 644,
    scale: 1.15,
    facing: rafiHidingInBook ? -1 : 1,
    shirtColor: '#79B6E4',
    pantsColor: '#1C2B42',
    hasBackpack: true,
    holdingBook: rafiHidingInBook,
    headTurnAway: sceneTime >= 11.5 && sceneTime < 22,
  });

  // Across the street: Father waiting with his rickshaw and Jhalmuri paper cone
  const placedUnderSeat = sceneTime >= 32.0;
  const fatherRetreating = sceneTime >= 35.0;
  const retreatOffset = fatherRetreating ? easeOutCubic(clamp01((sceneTime - 35.0) / 6.5)) * 220 : 0;

  drawRickshaw(ctx, {
    x: 965 + retreatOffset,
    y: 558,
    scale: 1.04,
    facing: -1,
    wheelAngle: retreatOffset * 0.06,
    pedalPhase: retreatOffset * 0.06,
    hoodUp: true,
    hasGamchhaOnSeat: true,
    hasPolytheneOnSeat: true,
    hasJhalmuriUnderSeat: placedUnderSeat,
    showFather: fatherRetreating,
    fatherState: 'pedaling',
  });

  // Standing Father holding Jhalmuri cone before stepping back quietly (0..35s)
  if (!fatherRetreating) {
    drawCharacter(ctx, {
      x: 828,
      y: 562,
      scale: 1.02,
      facing: -1,
      shirtColor: '#DDD6C7',
      pantsColor: '#2C4D63',
      skinColor: '#A8704E',
      isAdult: true,
      holdingJhalmuri: !placedUnderSeat,
    });
  }

  // Emotional close-up inset of the untouched Jhalmuri paper cone (sceneTime 22..34s)
  const insetAlpha =
    smoothstep(22.0, 23.6, sceneTime) * (1 - smoothstep(33.2, 34.8, sceneTime));
  if (insetAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = insetAlpha;
    ctx.translate(930, 198);
    ctx.fillStyle = 'rgba(14, 15, 19, 0.88)';
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-165, -95, 330, 190, 12);
    ctx.fill();
    ctx.stroke();

    // Detailed paper cone of Jhalmuri resting quietly
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(-0.28);
    ctx.fillStyle = '#EAE0CC';
    ctx.beginPath();
    ctx.moveTo(-48, 34);
    ctx.lineTo(18, -42);
    ctx.lineTo(54, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8A7963';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Puffed rice & mustard oil spices inside cone
    ctx.fillStyle = '#D98E38';
    ctx.beginPath();
    ctx.ellipse(34, -20, 24, 12, 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C6402B';
    ctx.beginPath();
    ctx.arc(38, -24, 4, 0, Math.PI * 2);
    ctx.arc(28, -14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#D6CFC2';
    ctx.font = '500 15px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ঝালমুড়ির ঠোঙা আর এগিয়ে দেওয়া হলো না', 0, 74);
    ctx.restore();
  }
}

/**
 * Scene 4 (01:40.2 – 02:05.4): Classroom exam-fee warning by Jamal Sir (0..10s),
 * then warm dim-lit home supper where Father pauses with a morsel of rice and reassures Rafi (10..25.2s).
 */
export function renderSceneExamDinner(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number
): void {
  if (sceneTime < 10.2) {
    // Part A: Classroom with green chalkboard & Jamal Sir announcing fee deadline
    drawSky(ctx, [
      [0, '#D8D1C2'],
      [1, '#B8AF9E'],
    ]);

    // Classroom chalkboard
    ctx.fillStyle = '#1E4635';
    ctx.fillRect(220, 92, 620, 250);
    ctx.strokeStyle = '#6A472B';
    ctx.lineWidth = 12;
    ctx.strokeRect(220, 92, 620, 250);

    // Chalk writing on board
    ctx.fillStyle = 'rgba(244, 242, 234, 0.85)';
    ctx.font = '600 28px "Noto Serif Bengali", serif';
    ctx.textAlign = 'center';
    ctx.fillText('বার্ষিক পরীক্ষা — ফি জমার শেষ তারিখ', 530, 175);
    ctx.fillStyle = '#F2CA6B';
    ctx.font = '600 24px "Hind Siliguri", sans-serif';
    ctx.fillText('পরীক্ষার ফি: ৩,০০০ টাকা  ·  আগামীকাল সকাল ১১:০০', 530, 232);

    // Classroom window on right
    ctx.fillStyle = '#B7D5EA';
    ctx.fillRect(960, 98, 210, 225);
    ctx.strokeStyle = '#5D4029';
    ctx.lineWidth = 8;
    ctx.strokeRect(960, 98, 210, 225);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(1065, 98);
    ctx.lineTo(1065, 323);
    ctx.moveTo(960, 210);
    ctx.lineTo(1170, 210);
    ctx.stroke();

    // Wooden floor
    ctx.fillStyle = '#6D543D';
    ctx.fillRect(0, 465, CANVAS_W, CANVAS_H - 465);

    // Jamal Sir standing by the lectern holding fee ledger
    drawCharacter(ctx, {
      x: 245,
      y: 550,
      scale: 1.32,
      facing: 1,
      shirtColor: '#EAE4D8',
      pantsColor: '#383B42',
      skinColor: '#B5815D',
      isAdult: true,
      holdingBook: true,
    });

    // Foreground wooden school benches & Rafi seated looking anxious
    for (let i = 0; i < 3; i++) {
      const bx = 460 + i * 245;
      ctx.fillStyle = '#7D5433';
      ctx.fillRect(bx, 530, 215, 22);
      ctx.fillStyle = '#5C3C22';
      ctx.fillRect(bx + 16, 552, 16, 130);
      ctx.fillRect(bx + 180, 552, 16, 130);
    }

    // Rafi sitting at middle bench looking worried
    ctx.save();
    ctx.translate(780, 530);
    ctx.fillStyle = '#79B6E4';
    ctx.beginPath();
    ctx.roundRect(-24, -68, 48, 68, 10);
    ctx.fill();
    ctx.fillStyle = '#C68B64';
    ctx.beginPath();
    ctx.arc(0, -90, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#181414';
    ctx.beginPath();
    ctx.arc(0, -96, 20, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.restore();
  } else {
    // Part B (10.2..25.2s): Intimate modest home at night — warm hanging bulb, steel rice plates
    const localT = sceneTime - 10.2;
    drawSky(ctx, [
      [0, '#161211'],
      [0.55, '#251C16'],
      [1, '#1A130F'],
    ]);

    // Warm tungsten hanging bulb glow
    const flicker = 0.96 + Math.sin(globalTime * 8.5) * 0.03;
    const lampGlow = ctx.createRadialGradient(640, 145, 16, 640, 310, 560);
    lampGlow.addColorStop(0, `rgba(255, 214, 136, ${0.42 * flicker})`);
    lampGlow.addColorStop(0.45, `rgba(224, 152, 74, ${0.18 * flicker})`);
    lampGlow.addColorStop(1, 'rgba(20, 14, 10, 0)');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Bulb wire & shade
    ctx.strokeStyle = '#332A24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(640, 0);
    ctx.lineTo(640, 128);
    ctx.stroke();
    ctx.fillStyle = '#FFF0C2';
    ctx.beginPath();
    ctx.arc(640, 138, 12, 0, Math.PI * 2);
    ctx.fill();

    // Modest home night window showing deep blue night
    ctx.fillStyle = '#111A2B';
    ctx.fillRect(140, 118, 170, 185);
    ctx.strokeStyle = '#4B3627';
    ctx.lineWidth = 8;
    ctx.strokeRect(140, 118, 170, 185);
    ctx.fillStyle = '#FFF6D8';
    ctx.beginPath();
    ctx.arc(255, 166, 10, 0, Math.PI * 2);
    ctx.fill();

    // Woven floor mat (পাটি) & low dinner surface
    ctx.fillStyle = '#3B281B';
    ctx.fillRect(0, 480, CANVAS_W, CANVAS_H - 480);
    ctx.fillStyle = '#7E5A38';
    ctx.beginPath();
    ctx.moveTo(220, 515);
    ctx.lineTo(1060, 515);
    ctx.lineTo(1160, 690);
    ctx.lineTo(120, 690);
    ctx.closePath();
    ctx.fill();
    // Subtle woven stripes
    ctx.strokeStyle = 'rgba(186, 48, 42, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(255, 545);
    ctx.lineTo(1025, 545);
    ctx.moveTo(160, 650);
    ctx.lineTo(1120, 650);
    ctx.stroke();

    // Father sitting on the left
    const handPauseT = smoothstep(3.8, 5.4, localT);
    ctx.save();
    ctx.translate(455, 518);
    // Seated silhouette & cotton shirt
    ctx.fillStyle = '#C9BFA9';
    ctx.beginPath();
    ctx.roundRect(-52, -162, 104, 132, 24);
    ctx.fill();
    // Lungi seated fold
    ctx.fillStyle = '#254257';
    ctx.beginPath();
    ctx.ellipse(0, -10, 74, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#A8704E';
    ctx.beginPath();
    ctx.arc(4, -196, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#211D1B';
    ctx.beginPath();
    ctx.arc(0, -203, 32.5, Math.PI * 0.85, Math.PI * 2.08);
    ctx.fill();
    // Expressive eyes & mustache
    ctx.fillStyle = '#1A1614';
    ctx.beginPath();
    ctx.arc(17, -198, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(13, -184, 14, 3.5);

    // Arm holding a morsel of rice that pauses mid-air when Rafi mentions 3,000 Taka
    const handLiftY = lerp(-42, -118, handPauseT);
    const handLiftX = lerp(68, 56, handPauseT);
    ctx.strokeStyle = '#C9BFA9';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(32, -130);
    ctx.lineTo(74, -84);
    ctx.lineTo(handLiftX, handLiftY);
    ctx.stroke();
    // Hand + white rice morsel
    ctx.fillStyle = '#A8704E';
    ctx.beginPath();
    ctx.arc(handLiftX, handLiftY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F7F3EA';
    ctx.beginPath();
    ctx.arc(handLiftX + 6, handLiftY - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rafi sitting opposite on the right
    ctx.save();
    ctx.translate(825, 526);
    ctx.fillStyle = '#4A6E8C';
    ctx.beginPath();
    ctx.roundRect(-42, -138, 84, 114, 20);
    ctx.fill();
    ctx.fillStyle = '#1E2C40';
    ctx.beginPath();
    ctx.ellipse(0, -6, 62, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C68B64';
    ctx.beginPath();
    ctx.arc(-4, -168, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#161414';
    ctx.beginPath();
    ctx.arc(-2, -174, 27.5, Math.PI * 0.92, Math.PI * 2.15);
    ctx.fill();
    ctx.fillStyle = '#1A1614';
    ctx.beginPath();
    ctx.arc(-16, -168, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Two stainless-steel plates of rice & dal bowl between them
    const drawSteelPlate = (px: number, py: number) => {
      ctx.fillStyle = '#BFC5CC';
      ctx.beginPath();
      ctx.ellipse(px, py, 54, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9EA6AE';
      ctx.beginPath();
      ctx.ellipse(px, py + 1, 44, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      // White rice mound
      ctx.fillStyle = '#F6F2E8';
      ctx.beginPath();
      ctx.ellipse(px - 4, py - 3, 28, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Yellow dal splash
      ctx.fillStyle = '#D9A13B';
      ctx.beginPath();
      ctx.ellipse(px + 14, py - 1, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawSteelPlate(545, 565);
    drawSteelPlate(730, 568);

    // Steel water glass
    ctx.fillStyle = '#C4CBD2';
    ctx.fillRect(632, 526, 22, 34);
  }
}
