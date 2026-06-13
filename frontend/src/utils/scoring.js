import { VIBES } from '../data/questions.js'

/**
 * @param {Record<string, string>} singleAnswers  - { q1: 'foodie', q2: 'explorer', ... }
 * @param {Record<string, number>} ratingAnswers  - { r1: 4, r2: 2, ... }
 * @param {Array}                  ratingQuestions - RATING_QUESTIONS array
 * @returns {{ scores: Record<string,number>, primary: string, secondary: string|null }}
 */
export function calculateScores(singleAnswers, ratingAnswers, ratingQuestions) {
  const scores = Object.fromEntries(VIBES.map(v => [v, 0]))

  // Single choice: +2 per correct vibe answer
  for (const vibe of Object.values(singleAnswers)) {
    if (vibe && scores[vibe] !== undefined) {
      scores[vibe] += 2
    }
  }

  // Rating: add directly (1-5)
  for (const q of ratingQuestions) {
    const rating = ratingAnswers[q.id] ?? 0
    scores[q.vibe] += rating
  }

  return { scores, ...determineVibe(scores) }
}

/**
 * @param {Record<string, number>} scores
 * @returns {{ primary: string, secondary: string|null }}
 */
export function determineVibe(scores) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const primary = sorted[0][0]
  const secondScore = sorted[1][1]
  const primaryScore = sorted[0][1]
  const secondary = (primaryScore - secondScore) <= 3 ? sorted[1][0] : null
  return { primary, secondary }
}

/**
 * Convert scores (0-25) to percentages for display.
 * @param {Record<string,number>} scores
 * @returns {Record<string,number>}
 */
export function scoresToPercent(scores) {
  const max = 25
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, Math.round((v / max) * 100)])
  )
}
