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
 * Achieve coach voice: short, warm, philosophical, purpose-first.
 * Prefer contextual replies over random canned lines when possible.
 */
export function offlineCoachReply(
  input: string,
  mode: CoachModeId,
  ctx?: CoachContext,
): string {
  const text = input.trim()
  const lower = text.toLowerCase()
  const habitHint =
    ctx?.habitTitles[0] ??
    (ctx && ctx.habitCount > 0 ? 'your habit' : 'one small habit')

  if (/why|purpose|meaning/.test(lower)) {
    return 'A surgeon can finish a 14-hour shift exhausted yet peaceful because purpose was clear. If you feel low, revisit your Why and simplify your next step.'
  }
  if (/behind|fail|failed|missed|guilt|lazy|procrastin/.test(lower)) {
    return 'Forgive your failed checklist. You are already enough to start again. Shrink today to one meaningful action — then protect it.'
  }
  if (/tired|exhaust|burnout|energy|overwhelm|stress|anxious|anxiety/.test(lower)) {
    return 'Sit in silence for five minutes and ask: who am I without the noise? Energy follows meaning. Reconnect your next task to your Why.'
  }
  if (/habit|routine|consistency|streak|discipline/.test(lower)) {
    return `Pick one anchor habit${ctx?.habitTitles.length ? ` — keep “${habitHint}” sacred` : ''} — and protect it like a meeting. Done with peace beats perfect with burnout.`
  }
  if (/motivat|inspire|stuck|start|begin|help/.test(lower)) {
    return 'You do not need a 100% day. You need a sincere day. One sincere hour in purpose beats eight resentful hours.'
  }
  if (/lonely|alone|sad|empty|lost/.test(lower)) {
    return 'This is not doing nothing; it is recalibrating your instrument. Be gentle. Choose one sincere step that reconnects you to yourself.'
  }
  if (/money|business|success|brand|rich|goal/.test(lower)) {
    return 'Ambition without alignment burns out. Name the Why behind the goal, then take one clean next step that serves it — not your fear.'
  }
  if (/thank|thanks|grateful/.test(lower)) {
    return "You're welcome. Keep tending what matters. I'm here when you need to recalibrate."
  }
  if (/\?$/.test(text) || /^(what|how|should|can|do|is|are|why)\b/.test(lower)) {
    if (mode === 'routines') {
      return `Stack “${habitHint}” after something you already do every day. Reduce friction until the habit feels inevitable.`
    }
    if (mode === 'energy') {
      return 'Breathe, release pressure, and continue with one intentional step. If your energy drops, pause and reconnect to your Why.'
    }
    return 'Ask what would make today sincere — not impressive. Then do only that. Clarity shrinks the day into something you can love.'
  }

  const pools: Record<CoachModeId, string[]> = {
    motivation: [
      'This is not doing nothing; it is recalibrating your instrument.',
      'Forgive your failed checklist. You are already enough to start again.',
      'One sincere hour in purpose beats eight resentful hours.',
      'You need a sincere day, not a perfect day. Choose one action that feels true.',
    ],
    routines: [
      'Pick one anchor habit for tomorrow and protect it like a meeting.',
      'Stack your habit after an existing ritual to reduce friction.',
      'Done with peace is better than perfect with burnout.',
      ctx && ctx.habitCount > 0
        ? `Keep “${habitHint}” as your non-negotiable. Everything else is optional today.`
        : 'Start with one habit you can finish even on a hard day.',
    ],
    energy: [
      'Sit in silence for five minutes and ask: who am I without the noise?',
      'Energy follows meaning. Reconnect your task to your Why.',
      'Breathe, release pressure, and continue with one intentional step.',
      'If your energy drops, pause. Rest is part of the work when purpose stays clear.',
    ],
  }

  const pool = pools[mode]
  return pool[Math.floor(Math.random() * pool.length)] ?? 'One sincere step at a time.'
}
