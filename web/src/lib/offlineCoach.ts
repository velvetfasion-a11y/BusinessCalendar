import type { CoachModeId } from './models'

export type CoachContext = {
  habitCount: number
  todayPercent: number
  habitTitles: string[]
  streak: number
  profileName: string
}

/** Dynamic opening line matching the live Achieve Chat welcome. */
export function welcomeMessage(ctx: CoachContext): string {
  const name = ctx.profileName && ctx.profileName !== 'Guest' ? ctx.profileName : null
  const hi = name ? `Welcome back, ${name}. ✦` : 'Welcome back. ✦'
  if (ctx.habitCount === 0) {
    return `${hi}\n\nYou haven't added habits yet — that's fine. Start with one sincere commitment.\n\nWhat's on your mind?`
  }
  return `${hi}\n\nYou're tending ${ctx.habitCount} habit${ctx.habitCount === 1 ? '' : 's'} and you're ${ctx.todayPercent}% aligned today.\n\nWhat's on your mind?`
}

/**
 * Mirrors Achieve/AppStore.swift `generateCoachReply(for:mode:)` exactly,
 * with light keyword routing for empty/new chats on the web.
 */
export function offlineCoachReply(
  input: string,
  mode: CoachModeId,
  _ctx?: CoachContext,
): string {
  const lower = input.trim().toLowerCase()

  // Same special-case as native AppStore.swift
  if (lower.includes('why')) {
    return 'A surgeon can finish a 14-hour shift exhausted yet peaceful because purpose was clear. If you feel low, revisit your Why and simplify your next step.'
  }

  const pools: Record<CoachModeId, string[]> = {
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

  const pool = pools[mode]
  return pool[Math.floor(Math.random() * pool.length)] ?? 'One sincere step at a time.'
}
