# Gundam Forge — Master Execution Prompt

Paste the block below into a fresh Claude Code session to begin executing the roadmap.
The agent will read the roadmap, work phase by phase, run QA gates, and commit each phase before advancing.

---

## THE PROMPT

```
You are executing the Gundam Forge 9/10 production readiness roadmap.

## Project Context

- Repo: /Users/earlhickson/Development/Gundam-Forge
- Stack: Next.js 14 App Router, Tailwind v4, Radix UI, TypeScript strict
- Deployment: GitHub Pages static export — `output: 'export'` in next.config.mjs
- basePath: `/Gundam-Forge` applied only when NODE_ENV === 'production'
- Images: `unoptimized: true` required (no Next.js Image Optimization in static export)
- Package manager: npm workspaces (root + apps/web + packages/shared)
- Dev command: `npm run dev:web` from repo root → http://localhost:3000
- QA command: `npm run qa` from repo root (runs tsc + eslint + next build)
- Test command: `npm test` from repo root (vitest)
- Known pre-existing test failures: 5 combat trigger tests in lib/game/__tests__/ — these are allowed to fail, do NOT fix them, do NOT introduce new failures
- Build output: apps/web/out/ (not dist/)
- Card data: apps/web/lib/data/cards.json (~471 cards, ~613 in catalog)
- Design tokens: `steel-*`, `cobalt-*`, `surface-*`, `surface-elevated`, `surface-interactive`, `border-border`, `text-foreground` — use these, never raw `slate-*` or `zinc-*`

## Your Instructions

Read the full roadmap at docs/ROADMAP.md before doing anything else.

Then execute it phase by phase using these rules:

### Execution Rules

1. **One phase at a time.** Complete all tasks in a phase before moving to the next.
2. **Read before you write.** For every file you will modify, read it in full first. Never edit code you haven't read.
3. **QA gate is mandatory.** After completing every task, run `npm run qa` from the repo root. If it fails, fix all errors before marking the task done and before moving on. Do not carry lint or type errors forward.
4. **Test gate.** After every phase, run `npm test`. The only allowed failures are the 5 pre-existing combat trigger tests. Any new failures introduced by your changes must be fixed before advancing.
5. **Commit each phase.** After all tasks in a phase pass QA and tests, create a git commit using conventional commit format. Stage only the files changed in that phase — never use `git add .` or `git add -A`.
6. **No over-engineering.** Only make the changes described in each task. Do not refactor surrounding code, add comments, add types to unchanged code, or add features beyond what is specified.
7. **Static export constraint.** This is a GitHub Pages deployment. No server-side API calls, no dynamic routes without generateStaticParams, no Node.js-only APIs in client components. If a task asks for something that conflicts with static export, note the conflict and implement the closest static-compatible equivalent.
8. **Design system constraint.** Never introduce raw Tailwind color classes (`slate-*`, `zinc-*`, `gray-*`, `purple-600`, etc.) in files that use the custom token system. Match the token vocabulary already present in the file you are editing.
9. **Mobile constraint.** Every UI change must be tested mentally at 375px width. If your change introduces a layout that would break at 375px, fix it before committing.
10. **If a task is already done**, skip it, note it as complete, and move to the next.

### Phase Commit Format

After each phase passes QA + tests:

```
git commit -m "feat(roadmap): Phase X — [short description]

- Task X.1: [what was done]
- Task X.2: [what was done]
...

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### What "QA passes" means

`npm run qa` must exit with code 0:
- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- Next.js build: successful static export to apps/web/out/

`npm test` must exit with:
- All suites passing except the 5 known combat trigger failures
- Zero new failures compared to the pre-task baseline

### Stopping Conditions

Stop and ask the user if you encounter any of the following:
- A task requires modifying the Supabase schema, database migrations, or RLS policies
- A task requires adding a new npm dependency with a non-trivial API surface
- A task's implementation would require changing the Next.js output mode away from `'export'`
- QA fails after 2 attempts to fix the same error
- A type error requires changing a shared type in packages/shared/src/types.ts or packages/shared/src/playtest-types.ts in a way that would break the game engine

## Start

Begin now. Read docs/ROADMAP.md, then start Phase 1, Task 1.1.

Report your progress after each task in this format:
✅ Task X.X — [task name]: done. QA: pass.
⚠️  Task X.X — [task name]: done with notes: [note]. QA: pass.
❌ Task X.X — [task name]: blocked — [reason]. Asking user.

After each full phase, post a phase summary:
### Phase X Complete
Tasks: X.1 ✅  X.2 ✅  X.3 ✅
QA: pass | Tests: pass
Commit: [hash]
```

---

## Notes for the User

- You can paste the entire prompt above to run all 10 phases in one session, or copy individual phase task blocks from ROADMAP.md to run one phase at a time.
- If a session hits context limits mid-phase, start a new session and paste this prompt again — the agent will detect which tasks are already done from the git log and skip them.
- The 5 pre-existing test failures are in `apps/web/lib/game/__tests__/` (combat trigger tests). They are tracked in MEMORY.md and must not be touched.
- Auth tasks (Phase 8) only touch UI visibility — they do not require a working Supabase backend.
- Content tasks (Phase 9) require looking up real card IDs from `apps/web/lib/data/cards.json` before writing deck entries — the agent is instructed to do this automatically.
