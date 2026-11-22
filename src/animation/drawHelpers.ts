export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutSine(t: number): number {
  const c = clamp01(t);
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

/**
 * Draws a multi-stop vertical sky gradient.
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  stops: Array<[number, string]>,
  w = CANVAS_W,
  h = CANVAS_H
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [offset, color] of stops) {
    grad.addColorStop(offset, color);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws a luminous sun or moon with layered atmospheric halo.
 */
export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  coreColor = '#FFF5D6',
  glowColor = 'rgba(255, 198, 108, 0.42)'
): void {
  const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 5.2);
  halo.addColorStop(0, glowColor);
  halo.addColorStop(0.45, glowColor.replace(/[\d.]+\)$/, '0.16)'));
  halo.addColorStop(1, 'rgba(255, 198, 108, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws soft layered painterly clouds drifting gently with time.
 */
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  time: number,
  color: string,
  count = 6,
  yMin = 65,
  yMax = 215,
  speed = 8
): void {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const seed = i * 197.3 + 41;
    const baseX = ((seed * 3.7 + time * (speed + (i % 3) * 2.5)) % (CANVAS_W + 340)) - 170;
    const baseY = yMin + ((seed * 1.9) % Math.max(10, yMax - yMin));
    const scale = 0.72 + (i % 3) * 0.24;

    const puffs: Array<[number, number, number, number]> = [
      [baseX, baseY, 72 * scale, 22 * scale],
      [baseX - 38 * scale, baseY + 6 * scale, 48 * scale, 18 * scale],
      [baseX + 44 * scale, baseY + 5 * scale, 52 * scale, 19 * scale],
      [baseX - 8 * scale, baseY - 12 * scale, 42 * scale, 18 * scale],
    ];
    for (const [cx, cy, rx, ry] of puffs) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draws a distant Bangladeshi town skyline with mosque dome, minaret, and low-rise buildings.
 */
export function drawTownSilhouette(
  ctx: CanvasRenderingContext2D,
  horizonY: number,
  color: string,
  scrollX = 0,
  showMosque = true
): void {
  ctx.save();
  ctx.fillStyle = color;

  const buildings = [
    { x: 40, w: 95, h: 80 },
    { x: 150, w: 70, h: 112 },
    { x: 235, w: 120, h: 68 },
    { x: 460, w: 105, h: 95 },
    { x: 580, w: 85, h: 124 },
    { x: 690, w: 130, h: 76 },
    { x: 870, w: 110, h: 102 },
    { x: 1000, w: 90, h: 86 },
    { x: 1120, w: 145, h: 110 },
  ];

  for (const b of buildings) {
    const bx = ((b.x - scrollX) % (CANVAS_W + 220) + (CANVAS_W + 220)) % (CANVAS_W + 220) - 110;
    ctx.fillRect(bx, horizonY - b.h, b.w, b.h + 8);
    // Roof parapet detail
    ctx.fillRect(bx + 10, horizonY - b.h - 10, 22, 10);
  }

  if (showMosque) {
    const mx = ((380 - scrollX * 0.6) % (CANVAS_W + 300) + (CANVAS_W + 300)) % (CANVAS_W + 300) - 150;
    // Main mosque hall
    ctx.fillRect(mx - 48, horizonY - 72, 96, 76);
    // Central dome
    ctx.beginPath();
    ctx.arc(mx, horizonY - 72, 34, Math.PI, 0);
    ctx.fill();
    // Crescent spire
    ctx.fillRect(mx - 2, horizonY - 122, 4, 18);
    // Side domes
    ctx.beginPath();
    ctx.arc(mx - 34, horizonY - 72, 16, Math.PI, 0);
    ctx.arc(mx + 34, horizonY - 72, 16, Math.PI, 0);
    ctx.fill();
    // Tall minaret
    ctx.fillRect(mx + 56, horizonY - 146, 14, 150);
    ctx.fillRect(mx + 52, horizonY - 134, 22, 6);
    ctx.beginPath();
    ctx.arc(mx + 63, horizonY - 146, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(mx + 62, horizonY - 165, 2, 12);
  }
  ctx.restore();
}

/**
 * Draws a lush Bangladeshi tree (banyan / krishnachura) with gentle wind sway.
 */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  time: number,
  foliageDark: string,
  foliageLight: string,
  trunkColor = '#3A281E',
  blossomColor?: string
): void {
  const sway = Math.sin(time * 1.4 + x * 0.02) * 3.5 * scale;
  ctx.save();
  // Trunk
  ctx.fillStyle = trunkColor;
  ctx.beginPath();
  ctx.moveTo(x - 10 * scale, groundY);
  ctx.quadraticCurveTo(x - 6 * scale, groundY - 58 * scale, x - 4 * scale + sway * 0.3, groundY - 112 * scale);
  ctx.lineTo(x + 8 * scale + sway * 0.3, groundY - 112 * scale);
  ctx.quadraticCurveTo(x + 9 * scale, groundY - 58 * scale, x + 14 * scale, groundY);
  ctx.closePath();
  ctx.fill();

  // Branches
  ctx.strokeStyle = trunkColor;
  ctx.lineWidth = 4.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, groundY - 82 * scale);
  ctx.lineTo(x - 32 * scale + sway * 0.5, groundY - 122 * scale);
  ctx.moveTo(x + 4 * scale, groundY - 88 * scale);
  ctx.lineTo(x + 36 * scale + sway * 0.5, groundY - 126 * scale);
  ctx.stroke();

  // Canopy dark base
  ctx.fillStyle = foliageDark;
  const puffs = [
    { dx: 0, dy: -138, rx: 64, ry: 44 },
    { dx: -44, dy: -116, rx: 46, ry: 34 },
    { dx: 46, dy: -118, rx: 48, ry: 35 },
    { dx: -22, dy: -158, rx: 44, ry: 30 },
    { dx: 26, dy: -156, rx: 42, ry: 28 },
  ];
  for (const p of puffs) {
    ctx.beginPath();
    ctx.ellipse(x + p.dx * scale + sway, groundY + p.dy * scale, p.rx * scale, p.ry * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunlit canopy highlight
  ctx.fillStyle = foliageLight;
  for (let i = 0; i < 3; i++) {
    const p = puffs[i];
    ctx.beginPath();
    ctx.ellipse(
      x + (p.dx - 8) * scale + sway,
      groundY + (p.dy - 10) * scale,
      p.rx * 0.68 * scale,
      p.ry * 0.58 * scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Optional Krishnachura crimson blossoms
  if (blossomColor) {
    ctx.fillStyle = blossomColor;
    const clusters = [
      [-34, -138],
      [-10, -162],
      [22, -148],
      [44, -124],
      [-48, -112],
      [6, -128],
    ];
    for (const [bx, by] of clusters) {
      ctx.beginPath();
      ctx.arc(x + bx * scale + sway, groundY + by * scale, 7 * scale, 0, Math.PI * 2);
      ctx.arc(x + (bx + 8) * scale + sway, groundY + (by + 4) * scale, 5.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draws the brick school building & iron gate with Bengali signboard.
 */
export function drawSchoolGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  isStormy = false
): void {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  const wallMain = isStormy ? '#5F6973' : '#C98F6B';
  const wallShadow = isStormy ? '#454E58' : '#9B6547';
  const roofTrim = isStormy ? '#374049' : '#6F3D29';

  // Main school building behind the gate
  ctx.fillStyle = wallMain;
  ctx.fillRect(-130, -215, 290, 215);
  ctx.fillStyle = roofTrim;
  ctx.fillRect(-136, -225, 302, 14);

  // Veranda arches on ground & upper floor
  ctx.fillStyle = isStormy ? '#2B323A' : '#4C2E20';
  for (let row = 0; row < 2; row++) {
    const wy = row === 0 ? -182 : -92;
    for (let i = 0; i < 4; i++) {
      const wx = -102 + i * 62;
      ctx.beginPath();
      ctx.roundRect(wx, wy, 40, 56, [14, 14, 2, 2]);
      ctx.fill();
      if (isStormy) {
        ctx.fillStyle = 'rgba(246, 212, 134, 0.34)';
        ctx.fillRect(wx + 5, wy + 12, 30, 38);
        ctx.fillStyle = '#2B323A';
      }
    }
  }

  // Compound boundary wall
  ctx.fillStyle = wallShadow;
  ctx.fillRect(-260, -86, 175, 86);
  ctx.fillRect(75, -86, 175, 86);

  // Two brick gate pillars
  ctx.fillStyle = isStormy ? '#4D5660' : '#B56E4B';
  ctx.fillRect(-94, -148, 28, 148);
  ctx.fillRect(62, -148, 28, 148);
  ctx.fillStyle = roofTrim;
  ctx.fillRect(-99, -156, 38, 10);
  ctx.fillRect(57, -156, 38, 10);

  // Overhead iron arch signboard
  ctx.strokeStyle = isStormy ? '#242A30' : '#1E2A38';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-80, -154);
  ctx.quadraticCurveTo(-2, -196, 76, -154);
  ctx.stroke();

  // Signboard plate
  ctx.fillStyle = isStormy ? '#263442' : '#183C5C';
  ctx.beginPath();
  ctx.roundRect(-72, -172, 140, 30, 4);
  ctx.fill();
  ctx.strokeStyle = '#E5A93C';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#F7F2E7';
  ctx.font = '600 13px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('আদর্শ উচ্চ বিদ্যালয়', -2, -156);

  // Open iron gate leaves
  ctx.strokeStyle = '#1D242C';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-64 + i * 10, -118);
    ctx.lineTo(-64 + i * 10, -4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60 - i * 10, -118);
    ctx.lineTo(60 - i * 10, -4);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a woven red-and-white checkered Bangladeshi gamchha cloth.
 */
export function drawGamchhaRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 4
): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();

  // Base deep crimson
  ctx.fillStyle = '#B82626';
  ctx.fillRect(x, y, w, h);

  // Cream & saffron woven checks
  ctx.fillStyle = '#F5E4C8';
  const step = Math.max(5, Math.min(w, h) * 0.24);
  for (let gx = x; gx < x + w; gx += step * 2) {
    ctx.fillRect(gx, y, step * 0.42, h);
  }
  ctx.fillStyle = 'rgba(245, 228, 200, 0.72)';
  for (let gy = y; gy < y + h; gy += step * 2) {
    ctx.fillRect(x, gy, w, step * 0.36);
  }
  ctx.fillStyle = 'rgba(42, 118, 72, 0.55)';
  ctx.fillRect(x, y + h - 4, w, 3);
  ctx.fillRect(x, y + 2, w, 2);

  ctx.restore();
}

export interface RickshawOptions {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1; // 1 = moving right, -1 = moving left
  wheelAngle?: number;
  hoodUp?: boolean;
  hasGamchhaOnSeat?: boolean;
  hasPolytheneOnSeat?: boolean;
  hasJhalmuriUnderSeat?: boolean;
  isWet?: boolean;
  pedalPhase?: number;
  showFather?: boolean;
  fatherState?: 'pedaling' | 'waiting' | 'wiping-sweat' | 'drenched' | 'looking-mirror';
  showRafiSeated?: boolean;
  rafiTouchingSeat?: boolean;
}

/**
 * Draws a richly detailed traditional Bangladeshi cycle-rickshaw with optional Father & Rafi.
 */
export function drawRickshaw(ctx: CanvasRenderingContext2D, opts: RickshawOptions): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    wheelAngle = 0,
    hoodUp = true,
    hasGamchhaOnSeat = true,
    hasPolytheneOnSeat = true,
    hasJhalmuriUnderSeat = false,
    isWet = false,
    pedalPhase = 0,
    showFather = true,
    fatherState = 'pedaling',
    showRafiSeated = false,
    rafiTouchingSeat = false,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  // Ground contact shadow
  ctx.fillStyle = isWet ? 'rgba(10, 18, 28, 0.42)' : 'rgba(20, 14, 10, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-8, 4, 128, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const wheelR = 36;
  const rearX = -68;
  const frontX = 82;
  const wheelY = -wheelR;

  const drawSpokeWheel = (wx: number, wy: number) => {
    ctx.save();
    ctx.translate(wx, wy);
    // Tire
    ctx.strokeStyle = '#181A1F';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    // Chrome rim
    ctx.strokeStyle = isWet ? '#A8C4D8' : '#D6D8DE';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR - 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    ctx.strokeStyle = 'rgba(214, 218, 224, 0.65)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      const a = wheelAngle + (i * Math.PI) / 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (wheelR - 4), Math.sin(a) * (wheelR - 4));
      ctx.stroke();
    }

    // Hub
    ctx.fillStyle = '#C9963A';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Back wheel (far side subtle ghost wheel for 3-wheeler depth)
  ctx.save();
  ctx.globalAlpha = 0.55;
  drawSpokeWheel(rearX - 10, wheelY - 3);
  ctx.restore();

  // Passenger carriage body (Bangladeshi colorful rickshaw art)
  // Painted wooden/metal undercarriage
  ctx.fillStyle = '#146C5E'; // Emerald green base
  ctx.beginPath();
  ctx.moveTo(-114, -56);
  ctx.lineTo(-10, -56);
  ctx.lineTo(-4, -32);
  ctx.lineTo(-106, -32);
  ctx.closePath();
  ctx.fill();

  // Decorative folk art panel on the side of the carriage
  ctx.fillStyle = '#D93B3B';
  ctx.beginPath();
  ctx.roundRect(-108, -72, 92, 22, 4);
  ctx.fill();

  // Golden folk floral stripes
  ctx.strokeStyle = '#F4C44E';
  ctx.lineWidth = 2;
  ctx.strokeRect(-104, -69, 84, 16);
  ctx.fillStyle = '#F4C44E';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(-90 + i * 20, -61, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Footrest & floorboard
  ctx.fillStyle = '#2B2F36';
  ctx.fillRect(-16, -38, 30, 6);

  // Optional Jhalmuri paper cone tucked under seat (Scene 3)
  if (hasJhalmuriUnderSeat) {
    ctx.save();
    ctx.translate(-34, -44);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#E8DCC6';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, -6);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8F7B62';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Passenger backrest & cushion
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(-110, -118, 18, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#7A1F24';
  ctx.beginPath();
  ctx.roundRect(-94, -76, 62, 13, 5);
  ctx.fill();

  // Polythene sheet gleaming over the seat
  if (hasPolytheneOnSeat) {
    ctx.fillStyle = 'rgba(230, 244, 255, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-95, -78, 64, 14, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Neatly folded red-checkered gamchha on the passenger seat
  if (hasGamchhaOnSeat) {
    drawGamchhaRect(ctx, -88, -83, 48, 10, 3);
  }

  // Iconic folded colorful canopy hood — draw interior shell behind Rafi so his face stays clearly visible
  if (hoodUp) {
    ctx.fillStyle = '#1A3A5C';
    ctx.beginPath();
    ctx.moveTo(-116, -74);
    ctx.quadraticCurveTo(-124, -156, -72, -172);
    ctx.lineTo(-18, -162);
    ctx.quadraticCurveTo(-24, -138, -42, -132);
    ctx.lineTo(-104, -116);
    ctx.closePath();
    ctx.fill();

    // Inner canopy shadow lining
    ctx.fillStyle = '#122842';
    ctx.beginPath();
    ctx.moveTo(-106, -114);
    ctx.quadraticCurveTo(-112, -150, -70, -162);
    ctx.lineTo(-26, -156);
    ctx.quadraticCurveTo(-56, -134, -84, -114);
    ctx.closePath();
    ctx.fill();

    // Crimson & gold hood trim bands
    ctx.strokeStyle = '#E5A93C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-114, -76);
    ctx.quadraticCurveTo(-121, -154, -71, -169);
    ctx.lineTo(-18, -160);
    ctx.stroke();

    // Structural brass hood ribs
    ctx.strokeStyle = 'rgba(244, 196, 78, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-104, -114);
    ctx.lineTo(-72, -169);
    ctx.moveTo(-98, -114);
    ctx.lineTo(-42, -163);
    ctx.stroke();

    // Tassel fringe at hood front edge
    ctx.fillStyle = '#D93B3B';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(-22 - i * 6, -160 - i * 1.4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rafi seated in passenger carriage if enabled (drawn in front of inner canopy so his face is unobstructed)
  if (showRafiSeated) {
    ctx.save();
    // Legs in navy school trousers
    ctx.strokeStyle = '#1C2B42';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-58, -76);
    ctx.lineTo(-24, -74);
    ctx.lineTo(-16, -42);
    ctx.stroke();

    // Shoe
    ctx.fillStyle = '#111317';
    ctx.beginPath();
    ctx.ellipse(-12, -38, 9, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack resting behind him
    ctx.fillStyle = '#2B4263';
    ctx.beginPath();
    ctx.roundRect(-94, -112, 14, 30, 4);
    ctx.fill();

    // Torso (sky-blue uniform shirt)
    ctx.fillStyle = '#79B6E4';
    ctx.beginPath();
    ctx.roundRect(-80, -122, 30, 46, 8);
    ctx.fill();
    // Collar
    ctx.fillStyle = '#A8D4F5';
    ctx.beginPath();
    ctx.moveTo(-64, -122);
    ctx.lineTo(-52, -114);
    ctx.lineTo(-64, -112);
    ctx.closePath();
    ctx.fill();

    // Arm (either resting or gently touching the folded gamchha seat)
    ctx.strokeStyle = '#79B6E4';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(-60, -110);
    if (rafiTouchingSeat) {
      ctx.lineTo(-46, -92);
      ctx.lineTo(-56, -82);
    } else {
      ctx.lineTo(-46, -94);
      ctx.lineTo(-32, -90);
    }
    ctx.stroke();
    // Hand
    ctx.fillStyle = '#C98E67';
    ctx.beginPath();
    ctx.arc(rafiTouchingSeat ? -56 : -31, rafiTouchingSeat ? -81 : -90, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#C98E67';
    ctx.beginPath();
    ctx.arc(-62, -136, 13.5, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.arc(-64, -141, 13.2, Math.PI * 0.95, Math.PI * 2.04);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.arc(-55, -136, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Steel bicycle frame connecting carriage to front fork
  ctx.strokeStyle = '#1E242B';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -52);
  ctx.lineTo(30, -52); // bottom tube
  ctx.lineTo(66, -104); // head tube
  ctx.lineTo(22, -98); // top tube
  ctx.lineTo(30, -52); // seat tube
  ctx.stroke();

  // Front fork
  ctx.beginPath();
  ctx.moveTo(64, -108);
  ctx.lineTo(frontX, wheelY);
  ctx.stroke();

  // Handlebars
  ctx.strokeStyle = '#C8CED6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, -108);
  ctx.lineTo(54, -118);
  ctx.lineTo(44, -116);
  ctx.stroke();

  // Small round rearview mirror mounted on handlebar
  ctx.strokeStyle = '#B4BCC6';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(58, -116);
  ctx.lineTo(66, -128);
  ctx.stroke();
  ctx.fillStyle = '#D8EBF8';
  ctx.strokeStyle = '#252B33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(68, -130, 6, 4.5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hard cracked bicycle saddle
  ctx.fillStyle = '#23201E';
  ctx.beginPath();
  ctx.ellipse(18, -101, 14, 5, -0.08, 0, Math.PI * 2);
  ctx.fill();
  // Subtle crack line on saddle
  ctx.strokeStyle = '#6D5D53';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, -103);
  ctx.lineTo(21, -99);
  ctx.stroke();

  // Pedal crank
  const crankR = 14;
  const px = 30 + Math.cos(pedalPhase) * crankR;
  const py = -52 + Math.sin(pedalPhase) * crankR;
  ctx.strokeStyle = '#9AA3AE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, -52);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.fillStyle = '#181A1F';
  ctx.fillRect(px - 6, py - 2.5, 12, 5);

  // Front & near rear wheels
  drawSpokeWheel(rearX, wheelY);
  drawSpokeWheel(frontX, wheelY);

  // Father riding/sitting on the saddle
  if (showFather) {
    ctx.save();
    const leanForward = fatherState === 'pedaling' || fatherState === 'drenched' ? 0.14 : 0.04;
    const wetShirt = isWet || fatherState === 'drenched';
    const shirtColor = wetShirt ? '#7E8E9B' : '#DDD6C7';
    const lungiColor = wetShirt ? '#1D374D' : '#2C4D63';

    // Pedaling leg
    const kneeX = 36 + Math.cos(pedalPhase) * 6;
    const kneeY = -78 + Math.sin(pedalPhase) * 8;
    ctx.strokeStyle = lungiColor;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(19, -98);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();

    // Lower shin & foot on pedal
    ctx.strokeStyle = '#9F6948';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(kneeX, kneeY);
    ctx.lineTo(px, py - 2);
    ctx.stroke();

    // Sandal (torn strap hint if drenched)
    ctx.fillStyle = '#3B281E';
    ctx.fillRect(px - 7, py - 5, 15, 4);

    // Torso
    ctx.save();
    ctx.translate(20, -100);
    ctx.rotate(leanForward);

    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.roundRect(-14, -48, 28, 50, 9);
    ctx.fill();

    // Lungi waist wrap
    ctx.fillStyle = lungiColor;
    ctx.fillRect(-14, -8, 28, 14);

    // Gamchha draped on shoulder when not folded on seat (or extra corner when wiping sweat)
    if (fatherState === 'wiping-sweat') {
      drawGamchhaRect(ctx, 8, -68, 16, 12, 3);
    }

    // Head
    ctx.fillStyle = '#A8704E';
    ctx.beginPath();
    ctx.arc(4, -62, 14, 0, Math.PI * 2);
    ctx.fill();

    // Short graying dark hair
    ctx.fillStyle = '#24201E';
    ctx.beginPath();
    ctx.arc(2, -65, 14.2, Math.PI * 0.85, Math.PI * 2.05);
    ctx.fill();
    // Subtle silver streak at temple
    ctx.strokeStyle = '#B8B6B2';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, -64);
    ctx.lineTo(1, -66);
    ctx.stroke();

    // Mustache & gentle eye
    ctx.fillStyle = '#24201E';
    ctx.beginPath();
    ctx.arc(11, -63, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(9, -57, 7, 2);

    // Arms
    ctx.strokeStyle = shirtColor;
    ctx.lineWidth = 8.5;
    ctx.lineCap = 'round';
    if (fatherState === 'wiping-sweat') {
      // One arm raised wiping brow
      ctx.beginPath();
      ctx.moveTo(4, -40);
      ctx.lineTo(22, -52);
      ctx.lineTo(14, -64);
      ctx.stroke();
    } else {
      // Arms holding handlebars
      ctx.beginPath();
      ctx.moveTo(4, -40);
      ctx.lineTo(24, -26);
      ctx.lineTo(36, -18);
      ctx.stroke();
      ctx.fillStyle = '#A8704E';
      ctx.beginPath();
      ctx.arc(36, -18, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  ctx.restore();
}

export interface CharacterOpts {
  x: number;
  y: number; // feet baseline
  scale?: number;
  facing?: 1 | -1;
  walkPhase?: number;
  shirtColor: string;
  pantsColor: string;
  skinColor?: string;
  hasBackpack?: boolean;
  isAdult?: boolean;
  isWet?: boolean;
  holdingBook?: boolean;
  holdingJhalmuri?: boolean;
  holdingPolytheneMoney?: boolean;
  holdingShirtOverHead?: boolean;
  pointing?: boolean;
  headTurnAway?: boolean;
}

/**
 * Draws an expressive articulated standing/walking character (Rafi, Father, Sakib, Jamal Sir).
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, opts: CharacterOpts): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    walkPhase = 0,
    shirtColor,
    pantsColor,
    skinColor = '#C68B64',
    hasBackpack = false,
    isAdult = false,
    isWet = false,
    holdingBook = false,
    holdingJhalmuri = false,
    holdingPolytheneMoney = false,
    holdingShirtOverHead = false,
    pointing = false,
    headTurnAway = false,
  } = opts;

  const hScale = isAdult ? 1.15 : 0.92;
  const stride = Math.sin(walkPhase) * 16;
  const bounce = Math.abs(Math.sin(walkPhase)) * 3.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(12, 10, 10, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -bounce);

  // Legs
  const hipY = -62 * hScale;
  ctx.lineCap = 'round';
  ctx.lineWidth = isAdult ? 11 : 9.5;

  // Back leg
  ctx.strokeStyle = pantsColor;
  ctx.beginPath();
  ctx.moveTo(-2, hipY);
  ctx.lineTo(-stride * 0.85, -4);
  ctx.stroke();

  // Front leg
  ctx.beginPath();
  ctx.moveTo(2, hipY);
  ctx.lineTo(stride * 0.85, -4);
  ctx.stroke();

  // Shoes / sandals
  ctx.fillStyle = isAdult ? '#3A281E' : '#181A1F';
  ctx.beginPath();
  ctx.ellipse(-stride * 0.85 + 4, -2, 8.5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(stride * 0.85 + 4, -2, 8.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Backpack behind torso
  if (hasBackpack) {
    ctx.fillStyle = '#243C5A';
    ctx.beginPath();
    ctx.roundRect(-24, -108 * hScale, 15, 36 * hScale, 5);
    ctx.fill();
    ctx.fillStyle = '#E5A93C';
    ctx.fillRect(-22, -92 * hScale, 11, 3);
  }

  // Torso
  const shoulderY = -108 * hScale;
  ctx.fillStyle = holdingShirtOverHead ? '#C68B64' : shirtColor;
  ctx.beginPath();
  ctx.roundRect(-14, shoulderY, 28, 48 * hScale, 8);
  ctx.fill();

  // Undershirt / vest if Rafi took off his uniform shirt to shield his father
  if (holdingShirtOverHead) {
    ctx.fillStyle = '#ECEEF2';
    ctx.beginPath();
    ctx.roundRect(-12, shoulderY + 4, 24, 42 * hScale, 6);
    ctx.fill();
  }

  // Collar detail
  if (!holdingShirtOverHead) {
    ctx.fillStyle = isWet ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.38)';
    ctx.beginPath();
    ctx.moveTo(-6, shoulderY);
    ctx.lineTo(4, shoulderY + 9);
    ctx.lineTo(10, shoulderY);
    ctx.closePath();
    ctx.fill();
  }

  // Head
  const headY = -124 * hScale;
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, headY, 13.5, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = isAdult ? '#24201E' : '#161414';
  ctx.beginPath();
  ctx.arc(headTurnAway ? 2 : -1, headY - 3, 13.8, Math.PI * 0.88, Math.PI * 2.1);
  ctx.fill();

  // Eye & gentle facial detail
  if (!headTurnAway) {
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.arc(6.5, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (isAdult) {
      ctx.fillRect(4.5, headY + 4, 6, 1.8);
    }
  }

  // Arms & held story props
  ctx.strokeStyle = holdingShirtOverHead ? skinColor : shirtColor;
  ctx.lineWidth = isAdult ? 8.5 : 7.5;

  if (holdingShirtOverHead) {
    // Both arms raised holding the blue school shirt like an umbrella canopy
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 10);
    ctx.lineTo(18, headY - 22);
    ctx.moveTo(-4, shoulderY + 10);
    ctx.lineTo(-10, headY - 22);
    ctx.stroke();

    // Draped sky-blue school shirt held aloft over father's head
    ctx.fillStyle = '#6AAAE0';
    ctx.beginPath();
    ctx.moveTo(-16, headY - 26);
    ctx.quadraticCurveTo(22, headY - 46, 62, headY - 24);
    ctx.lineTo(54, headY - 10);
    ctx.quadraticCurveTo(20, headY - 24, -14, headY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9ACAF2';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (pointing) {
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 10);
    ctx.lineTo(34, shoulderY + 4);
    ctx.stroke();
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(36, shoulderY + 4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (holdingBook) {
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 10);
    ctx.lineTo(16, shoulderY + 28);
    ctx.stroke();
    // Open textbook
    ctx.fillStyle = '#F3EFE6';
    ctx.strokeStyle = '#3B5674';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(12, shoulderY + 16, 18, 16);
    ctx.fill();
    ctx.stroke();
  } else if (holdingJhalmuri) {
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 10);
    ctx.lineTo(22, shoulderY + 24);
    ctx.stroke();
    // Paper cone (thonga) of Jhalmuri
    ctx.fillStyle = '#E8DCC6';
    ctx.beginPath();
    ctx.moveTo(22, shoulderY + 34);
    ctx.lineTo(16, shoulderY + 14);
    ctx.lineTo(32, shoulderY + 16);
    ctx.closePath();
    ctx.fill();
    // Spicy puffed rice peek at top
    ctx.fillStyle = '#D98E38';
    ctx.beginPath();
    ctx.ellipse(24, shoulderY + 15, 7, 3.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (holdingPolytheneMoney) {
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 10);
    ctx.lineTo(24, shoulderY + 20);
    ctx.stroke();
    // Wrapped dry polythene packet with crisp Taka notes visible inside
    ctx.fillStyle = 'rgba(235, 248, 255, 0.72)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(22, shoulderY + 12, 22, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4E9A5A';
    ctx.fillRect(25, shoulderY + 15, 16, 8);
  } else {
    // Natural walking arm swing
    ctx.beginPath();
    ctx.moveTo(2, shoulderY + 10);
    ctx.lineTo(-stride * 0.55 + 4, shoulderY + 38);
    ctx.stroke();
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(-stride * 0.55 + 4, shoulderY + 40, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws monsoon rainfall streaks and animated splash ripples on flooded ground.
 */
export function drawMonsoonRain(
  ctx: CanvasRenderingContext2D,
  time: number,
  intensity = 1,
  groundY = 560
): void {
  if (intensity <= 0.01) return;
  ctx.save();
  const dropCount = Math.floor(170 * intensity);
  ctx.strokeStyle = `rgba(195, 224, 245, ${0.42 * intensity})`;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < dropCount; i++) {
    const seed = i * 73.13 + 19.7;
    const speed = 720 + (i % 5) * 110;
    const rx = ((seed * 19.3 - time * 190) % (CANVAS_W + 180) + (CANVAS_W + 180)) % (CANVAS_W + 180) - 90;
    const ry = ((seed * 11.7 + time * speed) % (CANVAS_H + 80)) - 40;
    const len = 18 + (i % 4) * 7;

    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - len * 0.28, ry + len);
    ctx.stroke();
  }

  // Puddle ripples along flooded ground
  ctx.strokeStyle = `rgba(215, 236, 250, ${0.38 * intensity})`;
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 24; i++) {
    const phase = (time * 1.9 + i * 0.37) % 1;
    const px = ((i * 97 + 53) % (CANVAS_W - 80)) + 40;
    const py = groundY + ((i * 41) % (CANVAS_H - groundY - 24));
    const r = 4 + phase * 22;
    ctx.globalAlpha = (1 - phase) * 0.55 * intensity;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a subtle cinema vignette & warm atmospheric color wash.
 */
export function drawCinemaVignette(ctx: CanvasRenderingContext2D, strength = 0.45): void {
  const grad = ctx.createRadialGradient(
    CANVAS_W * 0.5,
    CANVAS_H * 0.46,
    CANVAS_W * 0.28,
    CANVAS_W * 0.5,
    CANVAS_H * 0.5,
    CANVAS_W * 0.68
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(6, 7, 10, ${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}
