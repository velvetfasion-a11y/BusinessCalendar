import type { CoachModeId } from './models'

/** Same canned coach replies as Achieve's AppStore.generateCoachReply */
export function offlineCoachReply(input: string, mode: CoachModeId): string {
  const source: Record<CoachModeId, string[]> = {
    motivation: [
      'This is not doing nothing; it is recalibrating your instrument.',
      'Forgive your failed checklist. You are already enough to start again.',
      'One sincere hour in purpose beats eight resentful hours.',
    ],
    routines: [
      'Pick one anchor habit for tomorrow and protect it like a meeting.',
      'Stack your habit after an existing ritual to reduce friction.',
      'Done with peace is better than perfect with burnout.',
    ],
    energy: [
      'Sit in silence for five minutes and ask: who am I without the noise?',
      'Energy follows meaning. Reconnect your task to your Why.',
      'Breathe, release pressure, and continue with one intentional step.',
    ],
  }

  if (input.toLowerCase().includes('why')) {
    return 'A surgeon can finish a 14-hour shift exhausted yet peaceful because purpose was clear. If you feel low, revisit your Why and simplify your next step.'
  }

  const pool = source[mode]
  return pool[Math.floor(Math.random() * pool.length)] ?? 'One sincere step at a time.'
}
