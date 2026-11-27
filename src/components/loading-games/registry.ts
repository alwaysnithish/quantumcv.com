import KeywordCatcher from './keyword-catcher';
import CareerLadder from './career-ladder';
import TriviaQuiz from './trivia-quiz';
import TrafficRacer from './traffic-racer';
import StackTower from './stack-tower';
import BlockBlast from './block-blast';
import StartupTycoon from './startup-tycoon';
import FlappyResume from './flappy-resume';
import ZigzagDash from './zigzag-dash';
import SkyRunner from './sky-runner';
import type { ComponentType } from 'react';

export interface GameProps { onScore: (n: number) => void; onRoundEnd: () => void; round: number }

export interface GameDef {
  id: string;
  name: string;
  category: 'Racing' | 'Puzzle' | 'Simulation' | 'Arcade' | 'Trivia' | 'Runner';
  emoji: string;
  blurb: string;
  C: ComponentType<GameProps>;
}

/** Single list used by both the loading screen and the /games arcade. */
export const GAMES: GameDef[] = [
  { id: 'racer', name: 'Traffic Racer', category: 'Racing', emoji: '🏎️', blurb: 'Weave through endless traffic, grab coins, hit top speed.', C: TrafficRacer },
  { id: 'blocks', name: 'Block Blast', category: 'Puzzle', emoji: '🧩', blurb: 'Drag pieces onto the grid and clear lines for combos.', C: BlockBlast },
  { id: 'tycoon', name: 'Startup Tycoon', category: 'Simulation', emoji: '🏢', blurb: 'Tap, hire, automate — build an empire in 90 seconds.', C: StartupTycoon },
  { id: 'stack', name: 'Stack Tower', category: 'Arcade', emoji: '🗼', blurb: 'One tap. Perfect timing. How high can you go?', C: StackTower },
  { id: 'ladder', name: 'Career Ladder 2048', category: 'Puzzle', emoji: '🪜', blurb: 'Merge Intern → Founder in this 2048 twist.', C: CareerLadder },
  { id: 'catcher', name: 'ATS Keyword Catcher', category: 'Arcade', emoji: '🎯', blurb: 'Catch action verbs, dodge recruiter red flags.', C: KeywordCatcher },
  { id: 'trivia', name: 'Tech & HR Trivia', category: 'Trivia', emoji: '🧠', blurb: 'Five quick questions with streak bonuses.', C: TriviaQuiz },
  { id: 'zigzag', name: 'Zigzag Dash', category: 'Arcade', emoji: '⚡', blurb: 'Tap to switch direction and ride the twisting road forever.', C: ZigzagDash },
  { id: 'flappy', name: 'Flappy Resume', category: 'Arcade', emoji: '📄', blurb: 'Flap your resume through the rejection-letter towers.', C: FlappyResume },
{ id: 'runner', name: 'Sky Runner', category: 'Runner', emoji: '🏃', blurb: 'Jump the red flags in a runner that never stops speeding up.', C: SkyRunner },
];
