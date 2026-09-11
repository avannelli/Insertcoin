import type { MountGame } from '../games/types';
import type { ComponentType } from 'react';
import CircuitBreakPreview from '../games/circuit-break/Preview';
import SillyFishPreview from '../games/silly-fish/Preview';
import AirHockeyPreview from '../games/air-hockey/Preview';
export interface ArcadeGame { id: string; title: string; subtitle: string; genre: string; objective: string; Preview?: ComponentType; description: string; controls: string; lives?: number; readyLabel?: string; startHint?: string; launchLabel?: string; winLabel?: string; mode?: 'score' | 'match' | 'race'; touchControls?: { action: string; label: string }[]; aspectRatio?: string; load: () => Promise<{ mount: MountGame }>; }
export const games: ArcadeGame[] = [{
  id: 'circuit-break', title: 'CIRCUIT BREAK', subtitle: 'BREAK THE PATTERN.',
  genre: 'BRICK BREAKER', objective: 'Clear all 40 blocks. Make it count.', Preview: CircuitBreakPreview,
  description: 'One paddle. Three lives. A circuit waiting to be broken. Keep the ball alive and clear every last block.',
  controls: '← → or A / D to move · Space to launch · P to pause · Slide the control below the board on touch',
  startHint: 'Slide the control below to move your paddle. Tap Launch ball to begin.',
  load: () => import('../games/circuit-break'),
}, {
  id: 'silly-fish', title: 'SILLY FISH', subtitle: 'SMALL FISH. BIG AMBITIONS.',
  genre: 'ONE-BUTTON SWIMMER', objective: 'Thread the coral for one point per gap. The reef gets faster and the gaps get tighter. Follow each opening; a steady rhythm will not last forever.', Preview: SillyFishPreview,
  description: 'Swim the gap. Don’t kiss the coral.',
  controls: 'Tap the large Swim button below the reef, or tap the water. Each tap lifts you; release to sink. Keyboard: Space or Up to swim, P to pause. Aim for the center of the next opening.',
  aspectRatio: '3 / 4', touchControls: [{ action: 'swim', label: 'TAP TO SWIM' }],
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
}];
