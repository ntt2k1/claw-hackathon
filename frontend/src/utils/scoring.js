import { QUESTIONS, MAX_POSSIBLE, PERSONA_MAP } from '../data/questions.js'

/**
 * Calculate DNA scores from quiz answers.
 * @param {Array<{questionNum: number, selectedOption: string}>} answers
 * @returns {{ axes: Record<string,number>, primary: string, secondary: string, persona: string, tagline: string, accentColor: string }}
 */
export function calculateScores(answers) {
  // Accumulate raw scores per axis
  const raw = {}
  for (const axis of Object.keys(MAX_POSSIBLE)) {
    raw[axis] = 0
  }

  for (const { questionNum, selectedOption } of answers) {
    const q = QUESTIONS.find(q => q.num === questionNum)
    if (!q) continue
    const opt = q.options.find(o => o.letter === selectedOption)
    if (!opt) continue
    for (const [axis, points] of Object.entries(opt.scores)) {
      if (raw[axis] !== undefined) {
        raw[axis] += points
      }
    }
  }

  // Clamp negatives to 0, normalize to 0-100 (capped at 100)
  const axes = {}
  for (const [axis, maxVal] of Object.entries(MAX_POSSIBLE)) {
    const clamped = Math.max(0, raw[axis])
    axes[axis] = Math.min(100, Math.round((clamped / maxVal) * 100))
  }

  // Sort axes descending
  const sorted = Object.entries(axes).sort((a, b) => b[1] - a[1])
  const primary = sorted[0][0]
  const secondary = sorted[1][0]
  const top3Keys = sorted.slice(0, 3).map(([k]) => k)

  // Find persona: first entry whose key array is fully contained in top3
  const matched = PERSONA_MAP.find(p => {
    if (p.key === 'default') return false
    return p.key.every(k => top3Keys.includes(k))
  }) || PERSONA_MAP.find(p => p.key === 'default')

  return {
    axes,
    primary,
    secondary,
    persona: matched.name,
    tagline: matched.tagline,
    accentColor: matched.accentColor,
  }
}
