# Gundam Forge: Project Wiki

Gundam Forge is an unofficial deck builder and playtester for the Gundam Card Game. I designed and built it end to end: the interface system, the deck-building workflow, the rules engine underneath it, and a bot to playtest against.

Listing 623 cards was the easy part. The work was telling a player what a rule means for their deck while they're still building it, without building the deck for them.

> **Status:** Beta, built February to April 2026. Unofficial and not affiliated with Bandai or Sunrise. Card images are not stored in this repository (see the main [README](../../README.md)). Each page below separates what's built from what's designed and what's a known gap.

## The short version

| | |
|---|---|
| **My role** | Product design, interface system, and front-end and rules engineering. AI coding assistants (Claude and GitHub Copilot's agent) worked from my specs; I reviewed what came back, kept what fit and reverted what didn't. |
| **Stack** | Next.js 14 (App Router), React, TypeScript, Tailwind, Radix UI, TanStack Query, Zod, Vitest; npm-workspaces monorepo |
| **Scale** | 1 app and 3 packages, a 623-card catalog, 257 tests in 27 files (253 pass, 4 skipped), 300+ commits |
| **Hardest problems** | Separating hard rules from advice, all the way from the validator to the screen; deciding when to block a player and when to explain |
| **Case study** | [ehicksonjr.com/work/gundam-forge](https://ehicksonjr.com/work/gundam-forge) |

## Read in this order

1. **[Overview](01-overview.md)**: the problem, who it's for, and what exists
2. **[Design](02-design.md)**: the interface system, tokens, and the deck-building workflow
3. **[Architecture](03-architecture.md)**: the monorepo, the shared rules engine, the data pipeline, and persistence
4. **[Key decisions](04-decisions.md)**: what I chose, what I gave up, and when I changed my mind
5. **[Quality](05-quality.md)**: tests, CI, accessibility measurements, and known gaps
6. **[Challenges and lessons](06-challenges-and-lessons.md)**: real bugs, how I found them, and what's next

## Questions I'd enjoy being asked about

- Why can you build an invalid deck but not playtest one?
- Why are errors and warnings separate all the way down?
- Why did you remove the "Format" field that most deck builders have?
- The four-copy cap is enforced silently at the click. Is that the right call?
- Why do card images download at build time instead of loading from the official site?
