## Summary

<!-- Concise description of what this PR does and why. Focus on intent, not implementation details. -->

### Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Refactoring (no functional changes, improves maintainability)
- [ ] Documentation (updates to README, ARCHITECTURE.md, or code comments)
- [ ] Test improvements (new tests or test coverage)
- [ ] Performance optimization
- [ ] Build/CI/deployment configuration

---

## Problem Statement

<!-- What issue does this solve? Link to relevant issues or discussions if applicable. -->
<!-- Example: "Fixes #123", "Addresses missing error handling in validation", "Closes #456" -->

---

## Solution

<!-- Explain the approach taken to solve the problem. Why this approach? Any tradeoffs? -->
<!-- Reference files and functions that changed: e.g., "Updated CardDefinition in packages/shared/src/types.ts to add format legality support" -->

---

## Changes

### Files Modified
- [ ] List primary files changed and *why*
  - `apps/web/components/cards/CardTile.tsx` — Added quick-add overlay
  - `packages/shared/src/types.ts` — Added `getKeywordValue()` helper function

### New Files (if any)
- [ ] `apps/web/components/filters/ActiveFilterChips.tsx` — Shows active filters above card grid

---

## Testing

### Manual Testing Checklist
- [ ] Tested on desktop (Chrome/Safari/Firefox)
- [ ] Tested on mobile (iOS Safari / Chrome)
- [ ] Tested at breakpoints: 320px (mobile), 768px (tablet), 1024px+ (desktop)
- [ ] Screen reader tested (VoiceOver / NVDA) if UI changes
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No console errors or warnings

### Specific Test Cases
<!-- What scenarios did you test to verify the fix/feature? -->
- [ ] Applied filters → results update correctly
- [ ] Cleared all filters → card count returns to total
- [ ] URL persists filters → refresh page → filters restore
- [ ] Browser back/forward → filter state preserved
- [ ] Mobile quick-add → toast appears → undo works

### Automated Tests
- [ ] Added/updated unit tests (if applicable)
- [ ] Tests pass locally: `npm run test:shared` / `npm run test:web`
- [ ] No test regressions

---

## Performance Impact

### Bundle Size
- [ ] Ran `npm run build` and checked output
- [ ] Bundle impact: **minimal** / **none** / **X KB increase** (justify if >50KB)
- [ ] New dependencies added? (if yes, justify)

### Runtime Performance
- [ ] Measured: Filter time, render time, or operation latency (if significant change)
- [ ] Example: "Filters 471 cards in <50ms (was 150ms before)"
- [ ] No new bottlenecks introduced

---

## Accessibility & Mobile

### Mobile Responsiveness
- [ ] Tested at 320px, 768px, 1024px+ viewports
- [ ] Touch targets all 44px minimum (tap area)
- [ ] Text readable without horizontal scroll
- [ ] Bottom-sheet / modals swipe correctly (if applicable)

### Accessibility
- [ ] Semantic HTML used (buttons, labels, regions)
- [ ] ARIA labels added (aria-label, role, aria-live)
- [ ] Focus states visible (focus ring on interactive elements)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Screen reader tested (if UI changes)

---

## Breaking Changes

- [ ] None
- [ ] Yes, version bump required (justify below)

<!-- If breaking: describe what breaks and migration path -->

---

## Validation & Type Safety

### Schema & Zod Validation
- [ ] No Zod schemas modified (if no data structure changes)
- [ ] Updated `CardDefinitionSchema` in `packages/shared/src/card-schema.ts`
- [ ] Updated API contract schema (if API response changed)
- [ ] All Zod parsing uses `.safeParse()` (never throws)
- [ ] Tests verify error messages include field paths

### Type Checking
- [ ] `npm run lint` passes (TypeScript strict mode)
- [ ] No `any` types introduced
- [ ] Discriminated unions used for state machines (if applicable)

---

## Migration / Deployment Notes

- [ ] No data migration needed
- [ ] Requires env changes (document below)
- [ ] Requires database schema update (document below)
- [ ] Backwards-compatible with current production state

<!-- Document any special deployment steps, rollback procedures, or environment variable changes -->

---

## Reviewers Checklist

- [ ] Code follows project conventions (naming, structure, comments)
- [ ] No unnecessary dependencies added
- [ ] Functionality matches the problem statement
- [ ] Tests are comprehensive and pass
- [ ] Mobile/accessibility concerns addressed
- [ ] Documentation updated (ARCHITECTURE.md, code comments)
- [ ] No debugging code left in (console.logs, debuggers)

---

## Before Merge

- [ ] Self-review complete (code looks good to author first)
- [ ] PR description is clear and concise
- [ ] Linked to related issues (if applicable)
- [ ] Branch is up to date with main
- [ ] All CI checks pass (build, linting, tests)
