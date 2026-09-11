# InsertCoin

A personal browser arcade built with React, TypeScript, Vite, and Phaser. No accounts, backend, or external assets. Sound starts muted and can be enabled in the header.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and produces `dist/`; `npm run preview` serves the production build. `npm test` runs browser checks using installed Microsoft Edge.

## Structure

- `src/pages/`: title, selection, and game view.
- `src/components/`: arcade frame, readouts, pixel button, sound toggle, score display, transition, game card, and reusable Phaser shell.
- `src/data/games.ts`: typed game registry.
- `src/games/types.ts`: shared mount/controller/state contract.
- `src/games/circuit-break/index.ts`: original Phaser scene, rendering, collisions, input, and lifecycle.
- `src/games/silly-fish/`: `model.ts` for physics/collisions, `Scene.ts` for procedural art/input, `index.ts` for mounting, and `Preview.tsx` for the cabinet artwork.
- `src/games/air-hockey/`: `model.ts` for substepped puck physics, AI, and match rules; `Scene.ts` for input/rendering/sounds; `index.ts` for mounting; and `Preview.tsx` for cabinet artwork.
- `src/games/night-shift/`: original pseudo-3D cockpit racer. See the module guide below.
- `src/games/iron-viper/`: original six-sector run-and-gun, weapon upgrades, scout vehicle, checkpoints/continues and industrial boss. See [the Iron Viper editing guide](src/games/iron-viper/README.md).
- `src/utils/`: reusable local high scores and generated Web Audio sound cues.
- `src/styles/`: palette variables, animations, responsive global styles.
- `tests/`: browser integration checks.

## Add another game

1. Create `src/games/your-game/index.ts` exporting `mount: MountGame` from `src/games/types.ts`. Return `start`, `pause`, `restart`, and `destroy`; publish score, lives, and status through the callback. Clean up input and resources on destroy. Store records with `saveHighScore('your-game', score)`.
2. Add an `ArcadeGame` entry in `src/data/games.ts` with a unique ID, title, subtitle, genre, objective, description, controls, and `load: () => import('../games/your-game')`.
3. Optionally create `src/games/your-game/Preview.tsx` and assign that component to the registry entry's `Preview` field. Without it, the card displays the game title.

The selection page and game shell automatically use the registry. No new routes or page components are needed.

Optional registry fields `lives`, `readyLabel`, `startHint`, and `launchLabel` customize the shared shell for different game types.

Match games can set `mode: 'match'` and an `aspectRatio` (Air Hockey uses `2 / 3`). Publish optional `match: { player, cpu }` and `notice` fields in the shared snapshot for a scoreboard and nonblocking countdown/goal messages. `src/utils/matchStats.ts` provides reusable `getMatchStats(gameId)` and `saveMatchResult(gameId, player, opponent)` functions for local wins, losses, and best goal differential; it does not modify numeric high scores.

Race games can set `mode: 'race'` and publish `race: { position, time, speed, progress }`. Optional registry `touchControls` entries use the controller's optional `control(action, pressed)` method. The shell supplies held-pointer controls, result headings, and racing statistics without changing the score/match game paths.

## Controls

Enter / Space or click to enter. Circuit Break: arrows or A/D move, Space launches, P pauses. Mouse movement and touch dragging control the paddle. Clear 40 blocks for 4,000 points; three misses end the run. Ball speed increases with hits and is capped. Switching away pauses active gameplay. Records and sound preferences persist locally when browser storage is available.

The canvas uses Phaser's [FIT scaling](https://docs.phaser.io/phaser/concepts/scale-manager). Menus use semantic keyboard-accessible buttons; game state is mirrored in a live region. Reduced-motion preferences disable entrance and blinking animations.

Silly Fish: Space, Up Arrow, click, or tap swims upward; P pauses. One point per coral pair; touching coral or either water boundary ends the run. Speed rises from 155 to a maximum of 230 world units per second; the gap narrows from 216 to a minimum of 174 units. Neighboring gap centers differ by at most 75 units. The fixed 800×560 playfield scales to phones. Decorative parallax is disabled with reduced motion. High scores use the separate `silly-fish` storage key.

Air Hockey: move the mouse or drag anywhere in the bottom half; WASD/arrows also move the cyan paddle. Touch uses a small upward offset for visibility. Space starts, P pauses, and the first side to score seven wins. Goals require the entire puck to enter the opening. A brief goal freeze and READY → GO faceoff separate points. The CPU has a 130–200 ms reaction interval, aiming error, and a bounded 285–335 unit/s speed. Puck speed is capped at 1,050 units/s; physics use steps of at most 2 ms, normal-velocity collision response, and wall-pinch release. Match results are recorded only at completion; restarting an unfinished match does not record a loss. Both game listeners and Phaser instances are cleaned up on exit. Tests cover both end states, persistence, maximum-speed collisions, inputs, fullscreen, resizing, and repeated mount/unmount cycles.

## Night Shift

Hold Up/W to accelerate, Down/S to brake, and Left/Right or A/D to steer. Hold R to look behind; release it to return to the forward view. P pauses; Space starts. On touch screens, hold the steering, brake, gas, or rear-view buttons below the canvas. The player's turquoise race car is visible in the foreground with the dashboard below it. The rear camera projects the road behind the player, mirrors lane placement, and shows the headlights/fronts of chasing rivals without changing driving controls or race physics. Pause, blur, and restart release rear view.

Race seven rivals over 10.4 km (about 2–3 minutes of active driving). No time-out prevents a slower player from finishing. Rivals now accelerate at 17–20.6 m/s², target 79–83.8 m/s before curve/drafting adjustments, react every 0.365–0.635 seconds, and pass more assertively. They anticipate hazards and take speed penalties if they hit them. The 29 authored hazards leave escape lanes, preserve the opening straight, and appear roughly every 200–370 metres thereafter. Drafting gives a modest boost; impacts and off-road driving reduce speed. The starters are adult female marshals in workwear, positioned outside the road. They wave at GO and recede behind the driver as the car accelerates.

- `src/games/night-shift/track.ts`: named course sections, lengths, eased curve strengths, hill/horizon offsets, and authored hazards. Edit this for new tracks; keep `TRACK_LENGTH` equal to the section-length total. Hazards leave clear passing lanes and never occupy the starting straight.
- `src/games/night-shift/projection.ts`: fixed 800×560 camera math. Road cross-sections use perspective scale `500 / distance`; near samples are denser than distant samples. Curvature is integrated into heading and lateral displacement, so the road bends progressively. `projectAt` interpolates those same samples for cars, marshals, hazards, and scenery. Hills gently shift the horizon rather than simulating full terrain occlusion.
- `src/games/night-shift/roadArt.ts`: procedural sky, skyline, headlights/road illumination, lane dashes, starting/finish markings, signs, lamps, car sprites, and animated flag officials. Scenery is drawn back-to-front using projected world distances.
- `src/games/night-shift/racers.ts`: seven independently advancing NPCs with different accelerations, top speeds, reaction delays, lane preferences, and mild mistakes. They slow for curves and choose free lanes to pass other racers. There is no rubber-banding.
- `src/games/night-shift/model.ts`: staging/countdown/racing/pause/finish/results states, player handling, drafting, cooldown-limited impact penalties, and interpolated finish times. Race order uses actual progress; final placement compares crossing times and remains fixed once the player finishes. Remaining NPC results are not extrapolated.
- `src/games/night-shift/cockpit.ts`: fixed dashboard and steering wheel (lower 23% of the screen), RPM bars, and restrained impact feedback.
- `src/games/night-shift/Scene.ts`: Phaser lifecycle, keyboard/touch input, digital HUD labels, event sounds, short engine tones, shared-shell snapshots, and saving completed results. All listeners are removed on shutdown/destroy; no persistent engine oscillator or scene timers survive exit.
- `src/games/night-shift/index.ts` and `Preview.tsx`: game mount/controller and cabinet artwork.
- `src/utils/localStats.ts`: shared fault-tolerant JSON storage now used by match and race statistics. Existing Air Hockey storage keys and values are retained.
- `src/utils/raceStats.ts`: `getRaceStats`, `saveRaceResult`, and time/place formatters. Local records track best time, best placement, wins, and completed races under `insertcoin:races:night-shift`. Restarts do not count as finished races.
- `src/components/RaceStatsDisplay.tsx` and `src/styles/night-shift.css`: discreet race records and racing-specific presentation.

Integration changes are in `src/data/games.ts`, `src/games/types.ts`, `src/components/GameCard.tsx`, `src/components/GameShell.tsx`, `src/utils/sound.ts`, and `src/main.tsx`. Existing Circuit Break, Silly Fish, and Air Hockey game modules are unchanged by this addition. `tests/night-shift.spec.ts` covers the new game; existing selection-count assertions in `tests/arcade.spec.ts` and `tests/air-hockey.spec.ts` now expect four cards.

## Responsive play layouts

`src/styles/responsive.css` controls the larger desktop play area, phone edge-to-edge game layout, readable menus, and touch targets. Air Hockey retains its portrait table. Circuit Break has a trial portrait board that adjusts its logical height, paddle position and lower collision boundary to fill the opening viewport; the other games retain their existing layouts. Its separate labeled slider keeps fingers below the board. Circuit Break-only rules live in src/styles/circuit-break.css.

The shared GameShell offers **Expand / Shrink** independently of the browser Fullscreen API, including on mobile browsers without element fullscreen. Expanded landscape layouts move driving/shooting buttons beside the canvas. Escape exits Expand, and leaving the game restores page scrolling. `tests/responsive.spec.ts` checks all five games at phone sizes, rotation, aspect ratios, accessible controls, and larger desktop sizing.

## Retro menu presentation

src/styles/retro-menu.css gives the intro and centralized game-selection screen their shared CRT cabinet presentation. It contains the scanlines, neon marquee, responsive cabinet grid, system-font arcade display stack, hover/focus states, staggered card entrances, and phone overrides. The rotating coin and Start hop remain in src/styles/animations.css, with motion disabled when the visitor requests reduced motion.
