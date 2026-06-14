# Legacy Onboarding (reverse-engineer a constitution)

SDD works on existing codebases. The agent explores the code, drafts a
constitution, and the user corrects it — then you continue the normal workflow.

## 1. Explore
- Entry points, top-level directory structure, and how the app runs.
- Dependency manifests (package.json, pyproject.toml, go.mod, etc.).
- Existing docs (README, CONTRIBUTING, ADRs), tests, and recent git log.

## 2. Draft the constitution
- `mission.md` — infer problem/users/success from README, usage, and UI/CLI.
- `tech-stack.md` — read it off the manifests, configs, and directory layout.
- `roadmap.md` — infer Now/Next/Later from open issues, TODOs, and recent commits.

## 3. Review
Present the draft. The user corrects inferred intent — they are the authority on
"why". Save the corrected constitution to `docs/specs/`.

## 4. Continue
Proceed with the normal feature cycle (Plan -> Implement -> Validate).
