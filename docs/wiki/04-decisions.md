# 4. Key decisions

[← Architecture](03-architecture.md) · Next: [Quality →](05-quality.md)

Each decision follows the same format: **context → decision → what I gave up → what I'd revisit.**

---

## 1. Rules block outcomes, not edits

**Context:** Many deck builders either refuse an illegal click or say nothing until you export.

**Decision:** You can always build an invalid deck. Validation runs on every change and explains what's wrong. The one thing you can't do with an invalid deck is playtest it, because a playtest of an illegal deck would teach you the wrong thing.

**What I gave up:** A builder that guarantees a legal deck at every moment.

**Why it's right here:** Deck building is exploratory. People add five cards they're considering and cut later. Blocking edits punishes thinking. Blocking the playtest only stops the step where the invalid deck would mislead.

---

## 2. Errors and warnings stay separate all the way down

**Context:** "Exactly 50 cards" is a rule. "Consider 15 units" is advice. One list would make both feel equally urgent.

**Decision:** `validateDeck()` returns two lists, and `isValid` depends only on errors. The screen keeps them apart too: errors are red and block playtesting, warnings are amber and don't.

**What I gave up:** A single, simpler "issues" model.

**What came of it:** Once the two were separate in the data, the colours, the copy and the Playtest gate all followed. It's the most useful thing the validator does.

---

## 3. Remove the "Format" field other deck builders have

**Context:** Early versions borrowed Magic: The Gathering conventions, including a format-legality field.

**Decision:** Removed on Feb 26, when the builder moved to a Create → Build → View workflow (`ebe0950`).

**Why:** It was a pattern borrowed from Magic deck builders that didn't match how Gundam decks are built. A proven pattern isn't automatically right when the domain changes.

---

## 4. Cap copies at the click, the one silent rule

**Context:** On Mar 1, 2026 I made the builder cap each card at four copies at the click, "rather than relying solely on validation errors" (`9665008`).

**What I gave up:** Explanation. Decks stay legal, but the fifth click does nothing and says nothing.

**What I'd change:** It's this project's open question in one line of code: when should an interface block, and when should it explain? Next version: allow the click, show the count go red, and say why. A silent "no" teaches nothing.

---

## 5. Download card art at build time instead of hotlinking it

**Context:** On Feb 25 every card image broke in the browser, because both image sources block hotlinking.

**Decision:** Download the art during the build and serve it from the app's own origin (`258720a`). Since Nov 2026 the art is also kept out of the repository: it's gitignored and fetched by `npm run fetch-assets`, locally and in CI, because the images belong to their rights holders.

**What I gave up:** A slightly longer build, and the images are missing in local development until you run the fetch script. The app shows placeholders until then.

---

## 6. Banned and restricted cards: model now, enforce later

**Context:** The types include `getCopyLimit()` and `isLegalInFormat()` for ban and restriction lists.

**Decision:** They're modelled but not wired into `validateDeck()`.

**Why:** Enforcing a ban list needs a trusted, maintained source, and there isn't one wired in yet. Until then, the status is labelled "designed," not "built."

**Revisit when:** A reliable official list can be synced the way the card catalog is.
