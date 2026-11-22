export const COACH_MODES = [
  {
    id: 'motivation',
    title: 'Motivation',
    greeting: 'You do not need a 100% day. You need a sincere day.',
  },
  {
    id: 'routines',
    title: 'Routines',
    greeting: 'Start small. One aligned routine is stronger than ten forced tasks.',
  },
  {
    id: 'energy',
    title: 'Energy',
    greeting: 'If your energy drops, pause and reconnect to your Why.',
  },
] as const

export type CoachModeId = (typeof COACH_MODES)[number]['id']

export function coachModeById(id: CoachModeId) {
  return COACH_MODES.find((m) => m.id === id) ?? COACH_MODES[0]
}
