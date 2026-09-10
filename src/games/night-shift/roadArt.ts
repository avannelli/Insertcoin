import type Phaser from 'phaser';
import { projectAt, projectRoad, type RoadPoint, ROAD_BOTTOM } from './projection';
import { hazards, TRACK_LENGTH, trackAt } from './track';
import type { NightRace } from './model';

type Graphics = Phaser.GameObjects.Graphics;
function quad(g: Graphics, color: number, a: RoadPoint, b: RoadPoint, left: number, right: number, alpha = 1) {
  g.fillStyle(color, alpha); g.fillPoints([
    { x: a.x + a.half * left, y: a.y }, { x: a.x + a.half * right, y: a.y },
    { x: b.x + b.half * right, y: b.y }, { x: b.x + b.half * left, y: b.y },
  ], true);
}
export function drawRoad(g: Graphics, race: NightRace, rear = false) {
  const direction = rear ? -1 : 1;
  const { distance, lane } = race.player, points = projectRoad(distance, lane, rear), bend = trackAt(distance).curve * direction;
  const relative = (worldDistance: number) => (worldDistance - distance) * direction;
  // Neon-city dusk: gradient sky, retro gridline sun, parallax towers, grid horizon.
  g.fillGradientStyle(0x0a0722, 0x0a0722, 0x2a1450, 0x431d54, 1); g.fillRect(0, 0, 800, ROAD_BOTTOM);
  g.fillStyle(0xe7d6ff, 0.55);
  for (let i = 0; i < 34; i++) g.fillRect((i * 137 + 27) % 800, 6 + (i * 43) % 92, i % 5 ? 1 : 2, i % 5 ? 1 : 2);
  const sunX = 400 - bend * 26, sunY = 136;
  g.fillStyle(0xff2d95, 0.12); g.fillCircle(sunX, sunY, 78);
  for (const [rad, col] of [[56, 0xff2d95], [44, 0xff5470], [31, 0xff9d4d], [18, 0xffd878]] as [number, number][]) {
    g.fillStyle(col, 0.95); g.fillCircle(sunX, sunY, rad);
  }
  // Widening scanline gaps, clipped to the disc so the glow halo stays round.
  g.fillStyle(0x2a1450);
  for (let k = 0; k < 9; k++) {
    const gy = sunY + k * 3.6 + 1, thick = 1 + k * 0.6;
    const chord = Math.sqrt(Math.max(0, 56 * 56 - (gy - sunY) ** 2));
    if (chord > 0) g.fillRect(sunX - chord, gy, chord * 2, thick);
  }
  // Far skyline silhouette.
  g.fillStyle(0x1a0f36);
  for (let i = -1; i < 15; i++) {
    const x = i * 62 - bend * 15, hh = 18 + ((i * 53 + 11) % 32);
    g.fillRect(x, 152 - hh, 48, hh);
  }
  // Near towers with neon window grids and roof beacons.
  for (let i = -1; i < 26; i++) {
    const x = i * 36 - bend * 32, h = 12 + ((i * 47 + 13) % 48), w = 26;
    const neon = i % 3 === 0 ? 0xff4dd2 : i % 3 === 1 ? 0x4df3ff : 0xb98bff;
    g.fillStyle(0x120a2b); g.fillRect(x, 154 - h, w, h);
    g.fillStyle(neon, 0.5);
    for (let row = 4; row < h - 2; row += 7) for (let col = 3; col < w - 3; col += 8)
      if ((row + col + i) % 3) g.fillRect(x + col, 152 - row, 3, 2);
    g.fillStyle(neon, 0.95); g.fillRect(x + w / 2 - 1, 154 - h - 3, 2, 3);
  }
  // Synthwave grid horizon fading into the road.
  g.fillGradientStyle(0x2b1550, 0x2b1550, 0x0a0722, 0x0a0722, 1); g.fillRect(0, 152, 800, 22);
  g.lineStyle(1, 0x4df3ff, 0.65); g.lineBetween(0, 154, 800, 154);
  g.lineStyle(1, 0xff4dd2, 0.22);
  for (let i = -6; i <= 6; i++) g.lineBetween(sunX + i * 7, 154, sunX + i * 62, 178);
  for (let gy = 158; gy < 178; gy += 5) { g.lineStyle(1, 0x4df3ff, 0.12 + (gy - 158) / 110); g.lineBetween(0, gy, 800, gy); }
  for (let i = points.length - 2; i >= 0; i--) {
    const a = points[i], b = points[i + 1], band = Math.floor((distance + direction * a.z) / 16) % 2;
    g.fillStyle(band ? 0x201c30 : 0x241d34); g.fillRect(0, b.y, 800, a.y - b.y + 1);
    quad(g, band ? 0x9c3978 : 0x433657, a, b, -1.08, 1.08);
    quad(g, band ? 0x242737 : 0x272a3b, a, b, -1, 1);
    if (a.z < 130) quad(g, 0xb9d2db, a, b, -0.96, 0.96, (1 - a.z / 140) * (rear ? 0.05 : 0.12));
    quad(g, 0xa3e6d8, a, b, -1, -0.985, 0.7); quad(g, 0xa3e6d8, a, b, 0.985, 1, 0.7);
    if (Math.floor((distance + direction * a.z) / 7) % 2) { quad(g, 0xf7dc73, a, b, -0.34, -0.325); quad(g, 0xf7dc73, a, b, 0.325, 0.34); }
    // Checkered starting/finish lines sit on the road and share its perspective.
    if (Math.abs(distance + direction * a.z - 16) < 1.2 || Math.abs(distance + direction * a.z - TRACK_LENGTH) < 1.2) {
      const row = Math.floor((distance + direction * a.z) * 2) % 2;
      for (let cell = 0; cell < 16; cell++) quad(g, (cell + row) % 2 ? 0x171127 : 0xf2ecf7, a, b, -1 + cell / 8, -1 + (cell + 1) / 8);
    }
  }
  if (distance < 900) for (let slot = 0; slot < 7; slot++) {
    const a = projectAt(points, relative(24 + slot * 12)), b = projectAt(points, relative(27 + slot * 12));
    if (a && b) {
      const lane = (slot % 2 ? 0.4 : -0.4) * direction;
      quad(g, 0xb8c7d4, a, b, lane - 0.16, lane - 0.145, 0.6);
      quad(g, 0xb8c7d4, a, b, lane + 0.145, lane + 0.16, 0.6);
    }
  }
  const objects: { z: number; draw: (p: RoadPoint) => void }[] = [];
  const rangeStart = rear ? Math.max(0, distance - 809) : distance;
  const rangeEnd = rear ? distance : distance + 809;
  const firstLamp = Math.floor(rangeStart / 45) * 45;
  for (let d = firstLamp; d < rangeEnd; d += 45) {
    for (const side of [-1, 1]) objects.push({ z: relative(d), draw: p => {
      const x = p.x + p.half * side * 1.22, h = Math.min(240, p.scale * 5);
      const neon = Math.floor(d / 45) % 2 ? 0x4df3ff : 0xff4dd2, tipX = x - side * h * 0.14;
      g.fillStyle(neon, 0.07); g.fillEllipse(x - side * p.half * 0.25, p.y, p.half * 1.5, p.scale * 0.5);
      g.lineStyle(Math.max(1, p.scale * 0.055), 0x3b3350); g.lineBetween(x, p.y, x, p.y - h);
      g.lineStyle(Math.max(1, p.scale * 0.07), neon, 0.85); g.lineBetween(x, p.y - h, tipX, p.y - h);
      g.fillStyle(neon, 0.12); g.fillCircle(tipX, p.y - h, Math.max(2, p.scale * 0.22));
      g.fillStyle(0xffffff, 0.5); g.fillCircle(tipX, p.y - h, Math.max(1, p.scale * 0.06));
    } });
  }
  for (let d = Math.ceil((rangeStart + 10) / 420) * 420; d < rangeEnd; d += 420) {
    objects.push({ z: relative(d), draw: p => {
      const index = Math.floor(d / 420), side = (index % 2 ? -1 : 1) * direction;
      const x = p.x + side * p.half * 1.38, w = p.scale * 2.2;
      const neon = index % 3 === 0 ? 0xff4dd2 : index % 3 === 1 ? 0x4df3ff : 0xf7ed59;
      g.fillStyle(0x2a2138); g.fillRect(x - p.scale * 0.06, p.y - w * 0.75, p.scale * 0.12, w * 0.75);
      g.fillStyle(neon, 0.13); g.fillRect(x - w * 0.72, p.y - w * 1.35, w * 1.44, w * 0.8);
      g.fillStyle(0x1b1030); g.fillRect(x - w / 2, p.y - w * 1.25, w, w * 0.55);
      g.lineStyle(Math.max(1, p.scale * 0.03), neon); g.strokeRect(x - w / 2, p.y - w * 1.25, w, w * 0.55);
      g.fillStyle(neon, 0.85);
      for (let row = 0; row < 3; row++) g.fillRect(x - w * 0.36 + row * w * 0.06, p.y - w * 1.12 + row * w * 0.14, w * (0.5 - row * 0.09), w * 0.07);
    } });
  }
  // Skyscrapers line both sides of the road and tower past as you drive through.
  for (let d = Math.ceil((rangeStart + 10) / 62) * 62; d < rangeEnd; d += 62) {
    const index = Math.floor(d / 62);
    for (const side of [-1, 1]) {
      const seed = index * 7 + (side > 0 ? 3 : 0);
      objects.push({ z: relative(d), draw: p => {
        const facing = side * direction;
        const inner = p.x + facing * p.half * (1.42 + (seed % 3) * 0.28);
        const outer = inner + facing * p.scale * (2.2 + (seed % 5) * 0.75);
        const left = Math.min(inner, outer), right = Math.max(inner, outer);
        if (right < -60 || left > 860) return;
        const tall = p.scale * (8 + (seed % 7) * 3.2), top = p.y - tall, wide = right - left;
        const neon = seed % 3 === 0 ? 0xff4dd2 : seed % 3 === 1 ? 0x4df3ff : 0xb98bff;
        g.fillStyle(neon, 0.09); g.fillRect(left - p.scale * 0.5, top - p.scale * 0.5, wide + p.scale, tall + p.scale * 0.5);
        g.fillStyle(0x110a28); g.fillRect(left, top, wide, tall);
        // Lit edge on the face turned toward the road.
        g.fillStyle(neon, 0.4); g.fillRect(facing > 0 ? inner : inner - p.scale * 0.16, top, p.scale * 0.16, tall);
        if (p.scale > 0.8) {
          const cols = Math.max(2, Math.min(7, Math.round(wide / (p.scale * 0.95))));
          const rows = Math.max(2, Math.min(26, Math.round(tall / (p.scale * 0.85))));
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            if ((r * 5 + c * 3 + seed) % 4 === 0) continue;
            g.fillStyle(neon, (r + c + seed) % 5 ? 0.45 : 0.85);
            g.fillRect(left + (c + 0.28) * wide / cols, top + (r + 0.3) * tall / rows, wide / cols * 0.44, tall / rows * 0.38);
          }
        }
        g.fillStyle(0x241650); g.fillRect(left, top, wide, Math.max(1, p.scale * 0.35));
        g.fillStyle(0xff4d4d, 0.95); g.fillRect((left + right) / 2 - p.scale * 0.07, top - p.scale * 0.9, Math.max(1, p.scale * 0.14), p.scale * 0.9);
      } });
    }
  }
  for (const car of race.racers) objects.push({ z: relative(car.distance), draw: p => drawCar(g, p.x + car.lane * direction * p.half, p.y, p.scale, car.color, rear) });
  for (const hazard of hazards) objects.push({ z: relative(hazard.distance), draw: p => {
    const x = p.x + hazard.lane * direction * p.half, w = p.scale * (hazard.kind === 'barrier' ? 2.4 : 1.2);
    if (hazard.kind === 'oil') { g.fillStyle(0x060b18, 0.8); g.fillEllipse(x, p.y, w * 1.7, w * 0.35); g.lineStyle(1, 0x8970ab, 0.5); g.strokeEllipse(x, p.y, w, w * 0.2); }
    else if (hazard.kind === 'cone') { g.fillStyle(0xff9958); g.fillTriangle(x - w / 2, p.y, x + w / 2, p.y, x, p.y - w); g.fillStyle(0xf2ecf7); g.fillRect(x - w * 0.2, p.y - w * 0.5, w * 0.4, w * 0.12); }
    else { g.fillStyle(0xf7dc73); g.fillRect(x - w / 2, p.y - w * 0.38, w, w * 0.38); g.fillStyle(0x171127); for (let j = 0; j < 3; j++) g.fillRect(x - w / 2 + j * w / 3, p.y - w * 0.38, w * 0.15, w * 0.38); }
  } });
  // Adult flag carriers stand outside the road, never in the racing line.
  for (const side of [-1, 1]) objects.push({ z: relative(16), draw: p => drawStarter(g, p.x + side * direction * p.half * 1.17, p.y, p.scale, side * direction, race.phase === 'racing' && race.elapsed < 1.5, race.elapsed) });
  objects.sort((a, b) => b.z - a.z).forEach(object => { const point = projectAt(points, object.z); if (point) object.draw(point); });
}
function drawCar(g: Graphics, x: number, y: number, scale: number, color: number, front = false) {
  const w = scale * 1.9, h = scale;
  // Ground shadow under a coloured neon underglow.
  g.fillStyle(0x05070f, 0.55); g.fillEllipse(x, y + h * 0.07, w * 1.18, h * 0.3);
  g.fillStyle(color, 0.22); g.fillEllipse(x, y + h * 0.02, w * 1.12, h * 0.48);
  g.fillStyle(0x0a0a12);
  g.fillRoundedRect(x - w * 0.57, y - h * 0.44, w * 0.2, h * 0.5, Math.max(1, scale * 0.05));
  g.fillRoundedRect(x + w * 0.37, y - h * 0.44, w * 0.2, h * 0.5, Math.max(1, scale * 0.05));
  g.fillStyle(0x0d1018); g.fillRect(x - w * 0.5, y - h * 0.34, w, h * 0.36);
  // Low wedge body with a lit top surface.
  g.fillStyle(color); g.fillPoints([
    { x: x - w * 0.5, y }, { x: x - w * 0.47, y: y - h * 0.5 }, { x: x - w * 0.25, y: y - h * 0.92 },
    { x: x + w * 0.25, y: y - h * 0.92 }, { x: x + w * 0.47, y: y - h * 0.5 }, { x: x + w * 0.5, y },
  ], true);
  g.fillStyle(0xffffff, 0.16); g.fillPoints([
    { x: x - w * 0.25, y: y - h * 0.92 }, { x: x + w * 0.25, y: y - h * 0.92 },
    { x: x + w * 0.21, y: y - h * 0.72 }, { x: x - w * 0.21, y: y - h * 0.72 },
  ], true);
  g.fillStyle(0x0b1a24); g.fillRect(x - w * 0.22, y - h * 0.87, w * 0.44, h * 0.31);
  g.fillStyle(0x58e6cf, 0.35); g.fillRect(x - w * 0.18, y - h * 0.83, w * 0.13, h * 0.06);
  g.fillStyle(0x05070f); g.fillRect(x - w * (front ? 0.3 : 0.5), y - h * 0.07, w * (front ? 0.6 : 1), h * 0.08);
  if (front) {
    g.fillStyle(0xfff1ad); g.fillRect(x - w * 0.44, y - h * 0.31, w * 0.17, h * 0.12); g.fillRect(x + w * 0.27, y - h * 0.31, w * 0.17, h * 0.12);
    g.fillStyle(0xfff1ad, 0.22); g.fillRect(x - w * 0.46, y - h * 0.21, w * 0.92, h * 0.05);
  } else {
    g.fillStyle(0xff2d55); g.fillRect(x - w * 0.42, y - h * 0.33, w * 0.84, h * 0.09);
    g.fillStyle(0xff96aa, 0.6); g.fillRect(x - w * 0.42, y - h * 0.31, w * 0.84, h * 0.03);
  }
  g.fillStyle(0xf2ecf7, 0.45); g.fillRect(x - w * 0.31, y - h * 0.5, w * 0.62, h * 0.03);
}
export function drawPlayerCar(g: Graphics, race: NightRace, steering: number, rear: boolean, reducedMotion: boolean) {
  const shake = !reducedMotion && race.disruption > 0 ? Math.sin(race.elapsed * 75) * 3 : 0;
  const x = 400 + steering * 14 * (rear ? -1 : 1) + shake, y = 419;
  drawCar(g, x, y, 65, 0x43d7c7, rear);
  // White racing stripes and a central deck vent identify the player's car.
  g.fillStyle(0xe8f5f0, 0.85); g.fillRect(x - 13, y - 36, 6, 12); g.fillRect(x + 7, y - 36, 6, 12);
  g.lineStyle(1, 0x184b54); for (let i = 0; i < 4; i++) g.lineBetween(x - 16, y - 57 + i * 3, x + 16, y - 57 + i * 3);
  if (race.player.speed > 10 && !rear) {
    // Twin exhaust flames stretch with speed.
    const flame = Math.min(1, race.player.speed / 82), len = 4 + flame * 9;
    g.fillStyle(0xff6a4d, 0.35 + flame * 0.3); g.fillRect(x - 34 - len, y - 4, len, 4); g.fillRect(x + 34, y - 4, len, 4);
    g.fillStyle(0xfff1ad, 0.5); g.fillRect(x - 34 - len * 0.4, y - 3, len * 0.4, 2); g.fillRect(x + 34, y - 3, len * 0.4, 2);
  }
}
function drawStarter(g: Graphics, x: number, y: number, scale: number, side: number, wave: boolean, time: number) {
  const h = scale * 2.05, u = h / 44;
  const skin = side < 0 ? 0xf0bd93 : 0xd0956d, shade = side < 0 ? 0xcf9b74 : 0xae7752;
  const hair = side < 0 ? 0x241825 : 0x4a2420, gloss = side < 0 ? 0x4a3550 : 0x74403a;
  const red = 0xff2d55, redDark = 0xc41840;
  // Grid girls in red two-pieces and heels, waving the cars away.
  // Built from an hourglass silhouette: soft shoulders, cinched waist, long legs.
  g.fillStyle(hair);                                            // hair fall past the shoulders
  g.fillRect(x - 5.4 * u, y - 44 * u, 10.8 * u, 17 * u);
  g.fillRect(x - 6 * u, y - 39 * u, 2.2 * u, 9 * u); g.fillRect(x + 3.8 * u, y - 39 * u, 2.2 * u, 9 * u);
  g.fillStyle(gloss); g.fillRect(x - 4.6 * u, y - 43.4 * u, 2 * u, 4 * u); // highlight
  g.fillStyle(skin); g.fillRect(x - 3 * u, y - 42 * u, 6 * u, 7.6 * u);    // face
  g.fillStyle(shade); g.fillRect(x - 3 * u, y - 35.4 * u, 6 * u, 1 * u);   // jawline
  g.fillStyle(hair); g.fillRect(x - 3.4 * u, y - 43.4 * u, 6.8 * u, 2.4 * u); // fringe
  g.fillStyle(0x2a1a20); g.fillRect(x - 2 * u, y - 39.6 * u, 1.3 * u, 1.1 * u); g.fillRect(x + 0.7 * u, y - 39.6 * u, 1.3 * u, 1.1 * u);
  g.fillStyle(red); g.fillRect(x - 0.8 * u, y - 37.2 * u, 1.6 * u, 0.9 * u); // lips
  g.fillStyle(skin); g.fillRect(x - 1.5 * u, y - 34.6 * u, 3 * u, 2.4 * u);  // neck
  // Torso tapers from shoulders to a narrow waist, then flares to the hips.
  g.fillStyle(skin);
  g.fillPoints([
    { x: x - 4.4 * u, y: y - 32.4 * u }, { x: x + 4.4 * u, y: y - 32.4 * u },
    { x: x + 2.5 * u, y: y - 21 * u }, { x: x + 4.6 * u, y: y - 16.6 * u },
    { x: x - 4.6 * u, y: y - 16.6 * u }, { x: x - 2.5 * u, y: y - 21 * u },
  ], true);
  g.fillStyle(shade); g.fillRect(x + 2.6 * u, y - 30 * u, 1.4 * u, 10 * u); // body shading
  g.fillStyle(skin); g.fillRect(x - 6.1 * u, y - 31.6 * u, 1.8 * u, 12 * u); // resting arm
  g.fillStyle(red);                                             // bikini top
  g.fillTriangle(x - 4.3 * u, y - 31.6 * u, x - 0.3 * u, y - 31.6 * u, x - 2.3 * u, y - 26.2 * u);
  g.fillTriangle(x + 0.3 * u, y - 31.6 * u, x + 4.3 * u, y - 31.6 * u, x + 2.3 * u, y - 26.2 * u);
  g.fillRect(x - 4.4 * u, y - 32.2 * u, 8.8 * u, 1 * u);
  g.fillStyle(redDark); g.fillRect(x - 4.4 * u, y - 31.4 * u, 8.8 * u, 0.6 * u);
  g.fillStyle(red);                                             // bikini bottom, high cut
  g.fillPoints([
    { x: x - 4.5 * u, y: y - 17 * u }, { x: x + 4.5 * u, y: y - 17 * u },
    { x: x + 3.4 * u, y: y - 11.6 * u }, { x: x - 3.4 * u, y: y - 11.6 * u },
  ], true);
  g.fillStyle(redDark); g.fillRect(x - 4.5 * u, y - 17 * u, 9 * u, 1 * u);
  // Long legs, slightly apart, on heels.
  g.fillStyle(skin);
  g.fillPoints([{ x: x - 3.4 * u, y: y - 12 * u }, { x: x - 0.4 * u, y: y - 12 * u }, { x: x - 0.9 * u, y: y - 1.4 * u }, { x: x - 3 * u, y: y - 1.4 * u }], true);
  g.fillPoints([{ x: x + 0.4 * u, y: y - 12 * u }, { x: x + 3.4 * u, y: y - 12 * u }, { x: x + 3 * u, y: y - 1.4 * u }, { x: x + 0.9 * u, y: y - 1.4 * u }], true);
  g.fillStyle(shade); g.fillRect(x + 2.2 * u, y - 12 * u, 1 * u, 10.6 * u);
  g.fillStyle(redDark); g.fillRect(x - 3.2 * u, y - 1.6 * u, 3 * u, 1.6 * u); g.fillRect(x + 0.7 * u, y - 1.6 * u, 3 * u, 1.6 * u);
  // Neon rim light off the city, on the side facing the road.
  g.fillStyle(0xff4dd2, 0.24); g.fillRect(x + side * 4.4 * u, y - 44 * u, 1.4 * u, 44 * u);
  const angle = wave ? Math.sin(time * 20) * 0.65 : -0.4;
  const fx = x + side * (12.5 + Math.sin(angle) * 8) * u, fy = y - (39 + Math.cos(angle) * 10) * u;
  g.lineStyle(2 * u, skin); g.lineBetween(x + side * 4 * u, y - 31 * u, fx, fy + 10 * u);
  g.lineStyle(Math.max(1, u), 0xd9d9e6); g.lineBetween(fx, fy + 13 * u, fx, fy);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { g.fillStyle((row + col) % 2 ? 0x171127 : 0xf2ecf7); g.fillRect(fx + side * col * 3 * u, fy + row * 3 * u, side * 3 * u, 3 * u); }
}
