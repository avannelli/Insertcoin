import type { MountGame } from '../games/types';
import type { ComponentType } from 'react';
import CircuitBreakPreview from '../games/circuit-break/Preview';
import SillyFishPreview from '../games/silly-fish/Preview';
import AirHockeyPreview from '../games/air-hockey/Preview';
import NightShiftPreview from '../games/night-shift/Preview';
import IronViperPreview from '../games/iron-viper/Preview';
export interface ArcadeGame { id: string; title: string; subtitle: string; genre: string; objective: string; Preview?: ComponentType; description: string; controls: string; lives?: number; readyLabel?: string; startHint?: string; launchLabel?: string; winLabel?: string; mode?: 'score' | 'match' | 'race'; touchControls?: { action: string; label: string }[]; aspectRatio?: string; load: () => Promise<{ mount: MountGame }>; }
export const games: ArcadeGame[] = [{
  id: 'circuit-break', title: 'CIRCUIT BREAK', subtitle: 'BREAK THE PATTERN.',
  genre: 'BRICK BREAKER', objective: 'Clear all 40 blocks. Make it count.', Preview: CircuitBreakPreview,
  description: 'One paddle. Three lives. A circuit waiting to be broken. Keep the ball alive and clear every last block.',
  controls: '← → or A / D to move · Space to launch · P to pause · Drag to move on touch',
  load: () => import('../games/circuit-break'),
}, {
  id: 'silly-fish', title: 'SILLY FISH', subtitle: 'SMALL FISH. BIG AMBITIONS.',
  genre: 'ONE-BUTTON SWIMMER', objective: 'Pass the coral. One point per gap. One life per run.', Preview: SillyFishPreview,
  description: 'Swim the gap. Don’t kiss the coral.',
  controls: 'Space / ↑ / click / tap to swim · P to pause',
  lives: 1, readyLabel: 'READY TO GET SILLY?', startHint: 'SPACE / ↑ / CLICK / TAP TO SWIM', launchLabel: 'START SWIMMING',
  load: () => import('../games/silly-fish'),
}, {
  id: 'air-hockey', title: 'AIR HOCKEY', subtitle: 'SEVEN GOALS. ONE TABLE.',
  genre: 'PLAYER VS CPU', objective: 'First to 7 goals wins. Defend the bottom goal and shoot into the CPU goal at the top. Stay in your half.',
  description: 'Seven goals. One table. No mercy.', Preview: AirHockeyPreview,
  controls: 'Move mouse / drag to play · WASD / arrows to move · P to pause',
  mode: 'match', aspectRatio: '2 / 3', lives: 0, readyLabel: 'FIRST TO 7',
  startHint: 'MOVE MOUSE / DRAG TO PLAY', launchLabel: 'START MATCH',
  load: () => import('../games/air-hockey'),
}, {
  id: 'night-shift', title: 'NIGHT SHIFT', subtitle: 'EIGHT CARS. ONE MIDNIGHT RUN.',
  genre: 'COCKPIT ARCADE RACER', objective: 'Race 9.9 km from 8th on the grid. Draft rivals, steer through the curves, and cross the finish line in the best position. Impacts and roadside driving slow you down.',
  description: 'Eight cars. Midnight roads. Make the pass.', Preview: NightShiftPreview,
  controls: '↑ / W accelerate · ↓ / S brake · ← → / A D steer · Hold R to look behind · P pause · Hold touch buttons to drive',
  mode: 'race', lives: 0, readyLabel: 'ON THE GRID', startHint: 'HOLD ↑ / W TO ACCELERATE', launchLabel: 'START RACE',
  touchControls: [{ action: 'left', label: '← LEFT' }, { action: 'right', label: 'RIGHT →' }, { action: 'brake', label: 'BRAKE' }, { action: 'accelerate', label: 'GAS ↑' }, { action: 'rear', label: 'REAR [R]' }],
  load: () => import('../games/night-shift'),
}, {
  id: 'iron-viper', title: 'IRON VIPER', subtitle: 'MOVE FAST. HIT HARD. KEEP GOING.',
  genre: 'SIDE-SCROLLING RUN & GUN', objective: 'Break through six industrial sectors and defeat the Furnace Warden. Clear each reinforcement wave to open the next gate. Shoot supply crates for weapons, health, and blast caps. Board the Mantis scout with ↑ in zone 5. Five health segments, three lives, and two free checkpoint continues.',
  description: 'Run. Gun. Break through.', Preview: IronViperPreview,
  controls: '← → / A D move · ↑ / W aim up or board scout · ↓ / S crouch · Space jump · Z / J fire · X / K grenade · P pause · Enter continue',
  lives: 3, readyLabel: 'IRON VIPER', startHint: 'MOVE: A / D · JUMP: SPACE · FIRE: Z / J · GRENADE: X / K', launchLabel: 'START MISSION', winLabel: 'MISSION COMPLETE',
  touchControls: [{ action: 'left', label: '← LEFT' }, { action: 'right', label: 'RIGHT →' }, { action: 'up', label: 'AIM ↑' }, { action: 'crouch', label: 'CROUCH' }, { action: 'jump', label: 'JUMP' }, { action: 'fire', label: 'FIRE' }, { action: 'grenade', label: 'BLAST' }],
  load: () => import('../games/iron-viper'),
}];

