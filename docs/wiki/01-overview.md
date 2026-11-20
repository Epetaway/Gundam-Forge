# 1. Overview

[← Wiki home](README.md) · Next: [Design →](02-design.md)

## The problem

Card games publish their rules as documents and their cards as databases. Neither tells you, mid-build, that your deck is one card short or one colour over, or why that matters. Most deck builders either say nothing until you export, or quietly refuse your click.

A Gundam Card Game deck is fifty cards, ten resources, at most two colours and at most four copies of anything. Those are **rules**. Fifteen units and a sensible cost curve are **advice**. If an interface can't tell those apart, it either nags or misleads.

The question behind the project: **what's the difference between giving someone information and actually helping them understand a decision?**

## Who it's for

Gundam Card Game players building and testing decks, whether they're exploring a new idea or tuning one for a tournament. The tool should cut out avoidable rule lookups without presenting one deck as "correct."

## What exists

| Area | What it does | Status |
|---|---|---|
| Catalog | Search and filter 623 cards built from the official card list | Built |
| Deck builder | Create → Build → View workflow, with validation on every change | Built |
| Validation | Five rules and three pieces of advice in one shared function | Built |
| Deck analytics | Colour split, type counts, cost curve | Built |
| Playtester | Coin flip, mulligan, and a heuristic bot that follows the rules | Built |
| Persistence | Decks saved in the browser, with a visible notice that says so | Built |
| Cloud sync and accounts | Supabase paths behind feature flags, off by default | Partial |
| Banned and restricted cards | Modelled in the types; the validator doesn't use them yet | Designed |

The bot is a **heuristic test partner**: deterministic game-state rules, not generative AI and not a competitive opponent.

## My role

I designed and built it:
- The interface system and its tokens
- The create–build–view workflow
- The validation engine in a shared package
- The playtester and its rule-following bot
- The data pipeline behind the card catalog

AI coding assistants worked from my specs to fill gaps and speed things up. The commit history shows it: 289 commits by me, 10 by Copilot's agent and 9 co-authored with Claude. The direction and the decisions were mine.

## Boundaries

- **Unofficial.** It isn't affiliated with or endorsed by Bandai or Sunrise. The README and the app footer both say so.
- **No usage claims.** It has no public user base and no measured outcomes. Nothing here claims competitive quality or official rules accuracy.
- **Card art isn't in the repository.** It's downloaded at build time by `npm run fetch-assets`.
