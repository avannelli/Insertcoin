# Iron Viper

Original procedural run-and-gun for the existing InsertCoin shell. The runner, Mantis scout, Furnace Warden, scenery, and cabinet illustration are drawn locally with Phaser graphics/SVG. No downloaded sprites or audio. Music is intentionally omitted; effects use the shared muted-by-default synthesizer.

## Play

Move with arrows or A/D, aim up with Up/W (diagonal while moving), crouch with Down/S, jump with Space, fire with Z/J, throw a blast cap with X/K, and pause with P. Enter accepts a continue. Touch buttons mirror the actions and support holding multiple buttons.

Clear five waves in each of the first five sectors to unlock its exit. Supply crates hold COIL STORM, ARC FAN, or COMET TUBE upgrades; ammunition runs out and restores PULSE-9. Explosive barrels hurt enemies, and pickups are collected on contact. A yellow marker warns of incoming attacks; magenta bullets belong to enemies.

There are five health segments and three lives, with 1.35 seconds of protection after damage. Each sector establishes a checkpoint; the boss entrance establishes another. Falls return you to a safe checkpoint. Two free continues per run are available for nine seconds each. Defeated targets and collected supplies stay cleared after respawn, preventing score farming.

Board the Mantis with Up near the marked station in sector five. It has eight armor points, unlimited cannon fire and a short hop. It ejects the player on destruction or at the end of its section. The Furnace Warden opens its cyan core between attacks: jump the low volley, leave the marked artillery zones, then duck or jump its alternating sweeps. Destruction and completion bonuses happen once.

## Where to edit

| File | Responsibility |
| --- | --- |
| `config.ts` | Resolution, movement speed, jump/gravity, health/lives/continue limits, pool capacities. |
| `level.ts` | Six sector boundaries, wave compositions and timing, platforms, pits, props and supply drops. |
| `model.ts` | Run states, safe wave placement, checkpoints, scoring, pickups, death/continues, vehicle station and exit. |
| `player.ts` | Acceleration, air control, jump, crouch, one-way platform collision, player state. |
| `weapons.ts` | Names, cooldowns, damage, ammo, spread and projectile speeds for every weapon. |
| `combat.ts` | Aiming, projectile integration, swept hits, collision ownership, grenade and rocket area damage. |
| `entities.ts` | Reused projectile/effect pools and enemy/pickup data shapes. |
| `enemies.ts` | Five archetypes, health, patrol/rush movement, attack telegraphs and burst patterns. |
| `boss.ts` | Warden health thresholds, attack timing, targeting and phase patterns. |
| `actorArt.ts` | Runner animation, scarf, enemy silhouettes, vehicle geometry and palette. |
| `worldArt.ts` | Parallax factories, sector landmarks, scenery, platforms, pits and boss drawing. |
| `Renderer.ts` | Camera framing, pooled labels, HUD, projectiles, pickups and effects. |
| `Scene.ts` | Focused keyboard/touch input, buffered taps, pause/cleanup, sound cues and score persistence. |
| `index.ts` | Phaser creation, responsive 800×560 canvas and controller lifecycle. |
| `Preview.tsx` | Original SVG cabinet art. |
| `../../data/games.ts` | Registry entry, title, controls, instruction card and lazy loading. |
| `../../utils/sound.ts` | Shared original synthesized effects; Iron Viper cues are prefixed `viper`. |

`../../components/GameShell.tsx` supports optional continue prompts and a per-game victory title. Existing games retain their defaults. High scores use `insertcoin:high:iron-viper` through the shared score utility.

## Validation

Run `npm run build` and `npm test` from the project root. `tests/iron-viper.spec.ts` covers combat ownership, swept hits, explosions, pickups/ammo, damage protection, checkpoint respawn, continue limits/expiry, vehicle behavior, all boss patterns, one-time completion, full encounter progression, pool bounds, browser controls, persistence, resize/fullscreen, and repeated mount cleanup. The full combat simulation uses invulnerability to isolate reachability and pacing from dodging skill; it is not a substitute for human difficulty tuning.

The single-level pacing is around four to six minutes, depending on combat and retries. Projectiles (180), effects (90), and live wave populations are bounded. Rendering reuses Graphics and Text objects; gameplay has no independent intervals or timeouts. The scene owns and removes native input/visibility listeners and Phaser destroys its graphics on exit.
