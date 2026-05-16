---
name: pr-formatter
description: Format pull request descriptions for the basarai project in the project's standard structure — bulleted Summary → Phase Tasks Completed (with categorized sub-sections like New Service Modules / New Provider Wrappers / New Router / Modified Files) → Test Plan checklist. Use this skill whenever the user asks to draft, format, write, generate, or open a PR / pull request / PR description / PR body for the basarai project, including invocations like "create the PR", "format the PR", "open a PR for this branch", "write the PR body", or `gh pr create` for this repo. Also use proactively after a speckit feature phase has been implemented when the user signals they're about to push or open a PR.
---

# basarai PR Formatter

The basarai project follows speckit (`specs/NNN-feature-name/`) and PR descriptions have a recognizable house style. Authors lose time reformatting the same shape over and over. This skill reads the branch state, classifies what changed, and emits a PR body that matches the convention so the human can paste it straight into `gh pr create`.

## When this skill triggers

The user is asking for a PR description for the **current branch** of the basarai repo. They may say:

- "format the PR", "draft the PR", "write the PR description"
- "open a PR for this branch", "create the PR for me"
- "give me the body for `gh pr create`"
- After running `/speckit.implement` or finishing a phase, they may simply say "ship it" or "PR time"

If the user has *already* given you a draft PR body and just wants you to clean it up, follow the same format below but keep their content — don't rederive from git.

## The output format (canonical)

Reproduce this shape exactly. The example below is the gold-standard structure (PR #11 in the repo); use it as your template, not as literal content.

```markdown
## Summary

- Implements the complete **backend generation pipeline** for Phase 6 (Image Generation)
- Adds `POST /brands/{brand_id}/generate` endpoint with full lifecycle management (`pending → processing → succeeded|failed`)
- Adds `google-genai>=1.0.0` dependency for Gemini image generation via official SDK
- **40 unit tests** covering all pure service modules — all passing

## Phase 2 Tasks Completed (T002–T019)

### New Service Modules
- `presets.py` — 13 platform presets, aspect ratio mapping, filename sanitization (FR-034)
- `prompt_composer.py` — Prompt composition with brand context + logo instruction
- `postprocess.py` — Scale-to-cover + center-crop to exact preset dimensions (FR-018)
- `watermark.py` — Brand logo watermark at bottom-right, 15% width, 70% opacity (FR-019)
- `error_mapping.py` — Provider error classification with user-friendly messages

### New Provider Wrappers
- `openai_image.py` — Async httpx wrapper for OpenAI `/v1/images/generations`
- `gemini_image.py` — Sync `google-genai` SDK wrapper (run via `asyncio.to_thread`)

### New Router
- `generations.py` — Full pipeline: ownership check → key resolution → prompt composition → provider call (120s timeout) → postprocess → watermark → storage upload → response

### Modified Files
- `requirements.txt` — Added `google-genai>=1.0.0`
- `main.py` — Registered generations router

## Test Plan

- [x] 40 unit tests pass (`pytest tests/test_*.py -v`)
- [ ] Manual smoke test (T020) — requires running backend + real API keys
- [ ] Phase 2 review checkpoint
```

### Format rules — why each part looks the way it does

- **`## Summary`** — 3-5 bullets. The first bullet states the **what** (the feature being implemented) and includes **bold** for the headline noun phrase. The remaining bullets call out the most important *concrete artifacts* — a new endpoint, a new dependency, a count of tests. Bold is earned, not sprinkled. Reviewers should be able to read only the Summary and understand what they're approving.
- **`## Phase N Tasks Completed (Tnnn–Tmmm)`** — only include this if the branch is a speckit feature with a `tasks.md`. The phase number and task ID range come from `specs/NNN-*/tasks.md`. Use an **en dash** (`–`, U+2013), not a hyphen, in the range. If the branch isn't from a spec, replace this header with `## Changes` and skip the task ID range.
- **`### Sub-sections`** — categorize files by *purpose*, not by location. Common buckets: `New Service Modules`, `New Provider Wrappers`, `New Router`, `New Components`, `New Migrations`, `New Models`, `New Hooks`, `Modified Files`. Pick the buckets that fit; don't invent ones with only one entry unless that one entry is genuinely a different category.
- **File lines** — `` `filename.ext` — short clause describing what it does (FR-XXX if relevant) ``. Em dash (`—`, U+2014), not hyphen. The clause is fragments, not full sentences. Use backticks for filenames, code identifiers, env vars, HTTP routes, package names. Reference the FR number from `spec.md` when one applies — reviewers use this to map code back to requirements.
- **`## Test Plan`** — checkbox list. `[x]` for what's already passing on the branch (typically the unit/integration suites you ran), `[ ]` for what still needs human verification (manual smoke tests, multi-environment checks, the named "review checkpoint" task from `tasks.md`). Don't pad — three items is fine. Reviewers look here to know what they need to do.

## How to build the PR body

Work in this order. Steps 1–3 are read-only; only step 4 produces the artifact.

### 1. Gather branch state

Run these in parallel:

```bash
git rev-parse --abbrev-ref HEAD
git log master..HEAD --oneline
git diff master...HEAD --stat
git diff master...HEAD --name-status
```

The branch name follows `NNN-feature-name`; the leading `NNN` matches the directory under `specs/`. If the branch base isn't `master`, swap it for whatever the user's `Main branch` is (visible in the system git status block at session start).

### 2. If this is a speckit feature, read the spec

```bash
ls specs/<NNN-feature-name>/ 2>/dev/null
```

If the directory exists, read `tasks.md` to find:

- **Which phase** the completed tasks belong to (phases are headers like `## Phase 2: Backend Pipeline`)
- **The task ID range** (the lowest and highest `T0NN` IDs that show as completed `[x]` and that touch files in this branch's diff)
- **Any "review checkpoint" task** at the end of the phase — that goes verbatim into Test Plan as `[ ]`

Read `spec.md` only if you need to look up FR numbers for specific files. The FR mapping is usually in the file's docstring or near the top of the implementation, so check the file itself first.

### 3. Classify the changed files

For each file in `git diff --name-status`, decide:

- **Status**: added (`A`), modified (`M`), deleted (`D`), renamed (`R`)
- **Bucket**: by purpose, using the file's path and what it actually does — read the file when the path is ambiguous

Heuristics for the basarai layout (do not over-rely on these — read the file if uncertain):

| Path pattern | Likely bucket |
|---|---|
| `backend/app/services/*.py` | New Service Modules / Modified Service Modules |
| `backend/app/routers/*.py` | New Router / Modified Router |
| `backend/app/models/*.py` | New Models |
| `backend/app/providers/*.py` or `*_image.py` style wrappers | New Provider Wrappers |
| `backend/tests/*.py` | (don't list individually — summarize as a count in Summary, mention in Test Plan) |
| `frontend/components/**/*.tsx` | New Components / Modified Components |
| `frontend/app/**/page.tsx` or `route.ts` | New Routes / Modified Routes |
| `frontend/lib/**` or `frontend/hooks/**` | New Hooks / New Lib Modules |
| `supabase/migrations/*.sql` | New Migrations |
| `requirements.txt`, `package.json`, `Dockerfile`, `Makefile`, `next.config.*` | Modified Files (always — these are infra) |
| `specs/**` | Don't list individually; mention as "Spec artifacts under `specs/NNN-*/`" only if it's the *primary* change of the PR |

A file goes into `Modified Files` (not its purpose-bucket) if the change is small/incidental — e.g., one line in `main.py` that registers a router. Big changes to existing files go in their purpose-bucket as `Modified <bucket>`.

### 4. Compose and present

Render the markdown using the structure shown above. Then:

- If the user asked you to **draft** it, paste the body inside a fenced code block in your reply so they can copy it. Don't run `gh pr create` yourself unless they explicitly asked you to push and open.
- If the user asked you to **open** it (`gh pr create`), use a HEREDOC for the body (per the project conventions for git/gh in this repo) and confirm the title before running. Default title format mirrors recent PRs: `feat(NNN): <short scope>` or `feat: <thing>` — match what the recent merged PRs on the branch's path look like (`gh pr list --state merged --limit 5`) when in doubt.
- The trailing `🤖 Generated with [Claude Code]…` line is added automatically by `gh pr create` per repo convention; don't include it in the body you draft.

## Edge cases

- **Refactor / bug-fix PR** with no associated phase: drop the `## Phase N Tasks Completed` section, use `## Changes` instead, no task ID range. Keep Summary and Test Plan.
- **Spec-only PR** (only `specs/**` files changed, like merged PR #12): Summary is one or two bullets describing what was specified; replace the middle section with `## Artifacts` listing `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md` as applicable; Test Plan can be a single `[x] Spec review` line.
- **Frontend-only PR**: same shape, just different bucket names (`New Components`, `Modified Pages`, etc.). The example happens to be backend; the format isn't backend-specific.
- **Mixed front+back**: split sub-sections by tier — e.g., `### Backend — New Routers`, `### Frontend — New Components`. Only do this if the volume warrants it; otherwise plain buckets are fine.
- **CodeRabbit fix-up PR**: use `## Summary` with bullets describing each addressed comment, then `## Test Plan` with how each fix was verified. Skip the Phase Tasks section.
- **No `tasks.md` matches the diff cleanly** (mid-phase work, or tasks IDs not yet checked off): use the smallest range that covers the work done on the branch and note `(in progress)` after the range, e.g., `## Phase 2 Tasks Completed (T010–T015, in progress)`.

## Tone notes

- Bullets are fragments. No trailing periods on bullets unless the bullet is two sentences.
- Prefer numbers and verbs over adjectives ("40 unit tests pass", not "extensive test coverage").
- Reference behavior, not implementation gossip ("Scale-to-cover + center-crop to exact preset dimensions" — good. "Refactored the resize logic to be cleaner" — bad).
- The reader is a co-maintainer reviewing in 60 seconds. Help them.
