import { calculateScores, determineVibe, scoresToPercent } from './scoring.js'
import { RATING_QUESTIONS } from '../data/questions.js'

// Test 1: all explorer answers → explorer wins
const singleAllExplorer = Object.fromEntries(
  ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].map(q => [q, 'explorer'])
)
const ratingNeutral = { r1: 3, r2: 3, r3: 3, r4: 3, r5: 3 }
const result1 = calculateScores(singleAllExplorer, ratingNeutral, RATING_QUESTIONS)
console.assert(result1.primary === 'explorer', 'primary should be explorer')
console.assert(result1.scores.explorer === 20 + 3, 'explorer score should be 23')

// Test 2: hybrid detection (close scores)
const hybridScores = { foodie: 20, explorer: 19, culture: 5, adventure: 5, relaxation: 5 }
const { primary, secondary } = determineVibe(hybridScores)
console.assert(primary === 'foodie', 'primary should be foodie')
console.assert(secondary === 'explorer', 'secondary should be explorer (diff <= 3)')

// Test 3: scoresToPercent
const pct = scoresToPercent({ foodie: 25, explorer: 0 })
console.assert(pct.foodie === 100, 'foodie should be 100%')
console.assert(pct.explorer === 0, 'explorer should be 0%')

console.log('All scoring tests passed ✓')
