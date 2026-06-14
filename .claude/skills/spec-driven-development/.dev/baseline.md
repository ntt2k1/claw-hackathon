# RED baseline — spec-driven-development

## Scenario
URL-shortener web app: "add a feature that lets users set a custom expiration
date on their short links." Greenfield/hypothetical. Prompt asked only for the
planning/specification artifacts the agent would "normally produce", with **no
mention** of SDD, constitutions, or any spec structure.

Test agent: fresh general-purpose subagent (sonnet), superpowers installed,
spec-driven-development skill NOT provided.

## Untrained agent output (summary + characteristics)

Produced a single, high-quality **implementation plan** in the superpowers
`writing-plans` style: a `# ... Implementation Plan` header with
Goal/Architecture/Tech Stack, a File Structure table, an embedded Data Model
spec, an embedded API Contract spec, then 7 TDD tasks (RED-GREEN-REFACTOR steps
with full code + commit per task), and a self-review checklist.

Representative facts about the output:
- One fused document containing plan + data model + API contract.
- Tech Stack stated as fact: "Node.js 20, Express 5, PostgreSQL 15, Prisma ORM,
  React 18, Vite, Vitest, Jest + Supertest, date-fns, zod" — none of which the
  user specified.
- Ended with: "There is no existing repo to save it to, so it is delivered here
  inline." (Nothing persisted to disk.)

## Observed gaps (what the skill must fix)

- [x] **No project constitution.** Went straight to a feature plan; never
  established `mission.md` (why/who/success/principles), `tech-stack.md`, or
  `roadmap.md`. Nothing anchors intent across sessions.
- [x] **Silent assumptions.** Invented an entire tech stack and presented it as
  settled fact rather than surfacing it as a decision to confirm. Violates
  *Think Before Coding* (don't pick silently; surface interpretations; ask).
- [x] **No artifact separation.** plan / requirements / validation were fused
  into one document instead of the SDD trio. Scope/decisions/alternatives were
  not captured as a distinct `requirements.md`.
- [x] **No standalone validation with `verify:` checks.** "Done" was implicit in
  the test code + a self-review table; there was no `validation.md` listing
  acceptance criteria each carrying an explicit `verify:` check. Violates
  *Goal-Driven Execution* as a persistent artifact.
- [x] **Thin out-of-scope / Simplicity First.** Out-of-scope existed but was
  minimal; added a background sweep job and README docs beyond the stated ask.
- [x] **No persistence / file convention.** No `docs/specs/` layout; the work
  lived only in chat — exactly the drift SDD exists to prevent.

## Conclusion
Gaps are real and non-empty. A capable agent defaults to a good *plan* but skips
the SDD structure (constitution, separated trio, surfaced assumptions, persisted
`docs/specs/`, `verify:`-checked validation). The skill targets these directly.

## GREEN result (same scenario, same model, WITH the skill)

Fresh subagent (sonnet) told to read+follow SKILL.md, same URL-shortener
scenario, greenfield, operating autonomously. Result vs. each gap:

| GREEN criterion | Verdict | Evidence |
|-----------------|---------|----------|
| Constitution recognized/written first | PASS | Routed "greenfield, no constitution → write constitution first"; produced mission/tech-stack/roadmap. |
| Assumptions surfaced, not silently picked | PASS | Interview-Q+proposed-answers table; tech stack marked "proposals to confirm"; Assumptions section + 5 Open questions marked `[PROPOSED]`. |
| Trio separated | PASS | `plan.md` / `requirements.md` / `validation.md` as distinct files. |
| `verify:` per validation item | PASS | 11 acceptance criteria + 4 edge cases, each with a concrete `verify:` (curl/pytest/HTML check). |
| Scope bounded + explicit out-of-scope | PASS | "Out of scope (YAGNI)" list + decisions table with alternatives rejected. |
| Persisted to `docs/specs/` | PASS | Constitution at `docs/specs/`, feature at `docs/specs/link-expiration/`. |

All six GREEN criteria pass. Independent spec+quality review (separate pass):
SPEC-COMPLIANT / APPROVED, one non-blocking minor note (DOT routing block reads
slower than prose; backstopped by adjacent prose, kept for house-style
consistency). The skill demonstrably changes behavior in the intended direction.

## REFACTOR — legacy routing check

GREEN only tested the greenfield branch. A fresh subagent (sonnet) pointed at an
existing codebase ("onboard this repo to SDD, no docs/specs/ yet") correctly:
- Took the **legacy** branch ("Explore code → draft constitution → user
  reviews") and quoted the routing logic to justify it (no constitution +
  existing code).
- Explored README/manifests/package.json/git log/skills/tests before drafting.
- Drafted mission/tech-stack/roadmap with every inference marked
  `[INFERRED — needs confirmation]` (per legacy-onboarding.md Step 3 — surface
  inferences, don't silently assert).
- Gave correct next steps (present draft → user corrects → save → continue).

Both routing branches verified. REFACTOR surfaced no gaps requiring edits; the
skill is solid as written.
