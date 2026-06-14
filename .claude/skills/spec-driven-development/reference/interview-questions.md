# Interview Questions (greenfield)

Ask **one question at a time**. Prefer multiple-choice when you can; open-ended
is fine. Goal: extract intent so the spec anchors it.

## Constitution

**mission.md**
- What problem does this solve, and for whom?
- Who are the users, and what do they need?
- Why build this now? What does success look like (outcomes, not features)?
- Any non-negotiable principles (privacy, offline, performance, cost)?

**tech-stack.md**
- Languages/runtimes and frameworks — fixed, or open? (Propose options; never
  assume silently.)
- How is data stored? Where does it deploy?
- Testing approach and coding conventions?
- Any hard constraints (on-device, no network, regulated data)?

**roadmap.md**
- What's the first milestone (Now)? What comes Next? What's explicitly Later?

## Feature / module

**plan.md** — What's the goal in one sentence? What are the natural task groups
and their order?

**requirements.md** — What's in scope? What's explicitly out of scope? What
decisions and alternatives matter? What are you assuming? What's unresolved?

**validation.md** — For each behavior: what's the exact `verify:` check (command,
test, or manual check) and expected result? What edge cases must hold?
