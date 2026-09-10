export type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'over';
export interface GameSnapshot { score: number; lives: number; status: GameStatus; match?: { player: number; cpu: number }; race?: { position: number; time: number; speed: number; progress: number }; notice?: string; prompt?: { title: string; detail: string; label: string }; }
export interface GameController { start(): void; pause(): void; restart(): void; destroy(): void; control?(action: string, pressed: boolean): void; }
export type MountGame = (parent: HTMLElement, onChange: (state: GameSnapshot) => void) => GameController;
