# 6. Challenges and lessons

[← Quality](05-quality.md) · [Wiki home](README.md)

## Real problems and how they were fixed

| Date | What went wrong | Fix |
|---|---|---|
| Feb 24 | The deck rules were wrong: three copies instead of four, and the 10-card resource deck was only a warning | Corrected against the official rules; the resource deck became a hard error (`1f88aa2`) |
| Feb 25 | Every card image broke in the browser, because both image hosts block hotlinking | Art downloads at build time and ships from the app's own origin (`258720a`) |
| Mar 2 | Playtester labels were emoji-only, and the error toast pulsed | Real `aria-label`s, a static `role="alert"`, and a way back to Decks (`58e3ef6`) |
| Mar 2 | Decks vanished if browser data was cleared, with no warning | A notice where decks are created says so (`da46838`) |
| Mar 3 | On phones, the card dialog was cut off below the browser bar | Anchored on `svh` units instead of `100vh` (`260138a`, PR #6) |
| Mar 30 | Filters, counts and validation disagreed about which cards were which | One shared card classification used by all three (PR #8) |

## Lessons

**A rule and a hint need different voices.** Separating errors from warnings in the data was the most useful decision in the project. The colours, the copy and the Playtest gate all followed from it.

**Prevention is a decision too.** Capping copies at the click made every deck legal and made one rule invisible. I'd still prevent it, but I'd show the count go red and say why.

**Tokens don't stay true on their own.** I audited colours in March and the theme still drifted, and the package and the CSS still disagree. The fix is structural: generate the CSS from one source and test contrast in CI.

**Check the domain before reusing a pattern.** The "Format" field came from Magic deck builders and didn't fit this game. I removed it once I saw it was asking players a question they didn't have.

## How I worked with AI coding assistants

Claude and GitHub Copilot's agent worked from my specs to fill gaps and speed things up: 10 commits by Copilot's agent and 9 co-authored with Claude, out of 308. I reviewed what came back, kept what fit and reverted what didn't.

<!-- EARL: confirm this section matches how you worked. Interviewers will ask. -->

## What's next

**Product**
- Replace the hard-coded home counters with real data, or remove them
- Name cards, not IDs, in every validation message
- Let the fifth copy click through and turn the count red with an explanation, instead of silently blocking it

**Engineering**
- Run Vitest in CI
- Fix the autosave-on-mount race
- Generate the `globals.css` colour variables from the design-system package
- Fix the measured contrast gaps, starting with the primary button (cobalt-600)
- Wire `getCopyLimit()` into `validateDeck()` once a trusted ban list exists

**Research**
- Scenario test: build to 50 cards with and without the live counts
- Think-aloud on warning wording: does "consider" read as optional?
- Block versus explain: compare the silent cap with a red count
