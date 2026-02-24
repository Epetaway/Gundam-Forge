# Gundam Forge UI System Reset

## 1. Audit of Previous UI Layer

### Implementation profile
- Runtime: Vite SPA with `react-router-dom` and monolithic client hydration.
- Styling: Hybrid of Tailwind utilities and large global CSS (`tokens.css`, `layout.css`, `components.css`, `motion.css`).
- State: Broad Zustand stores hydrated on app mount.
- Routing shell: Single `App.tsx` orchestrating all pages, modals, and keyboard behavior.

### Architectural weaknesses
- SSR incompatibility: Entire UI rendered as client SPA; no server-rendered route surfaces.
- CSS architecture drift: Token intent existed, but global class names (`gf-*`) created implicit coupling and style leakage.
- Interaction accessibility gaps: Several custom components (dropdowns, menus) manually handled focus/escape and were missing complete ARIA semantics.
- Bundle pressure: High client surface area due to global route shell and route-wide hooks/effects.
- Scalability concerns: Feature pages mixed layout, state orchestration, and visual rendering responsibilities.

### Structural issues identified
1. Single-entry route shell (`src/App.tsx`) coupled routing, hydration, shortcuts, persistence, and modals.
2. Legacy CSS utility abstraction (`gf-btn`, `gf-panel`, etc.) bypassed composable typed component primitives.
3. Client-only app lifecycle loaded all route and store logic before first paint.
4. Component boundaries were inconsistent: custom dropdowns/modals duplicated behavior already solved by Radix primitives.
5. Build/runtime strategy centered around SPA patterns, not Next.js server-first rendering.

### Migration plan executed
1. Replace Vite runtime with Next.js App Router (`app/` routing, server components by default).
2. Introduce design-system source of truth under `lib/design-system`.
3. Rebuild UI primitives in `components/ui` with Radix + shadcn-style composition.
4. Refactor core pages (Home, Forge, Card Database, Deck View, Profile, Auth) onto new layout wrappers.
5. Contain interactivity to client islands (`forge-workbench`, `profile-panel`, auth form, nav).

## 2. Design Tokens and Theme Strategy

### Token modules
- `lib/design-system/tokens.ts`: color primitives, semantic colors, radii, elevation.
- `lib/design-system/spacing.ts`: 4px base spacing scale.
- `lib/design-system/typography.ts`: font families + type scale.
- `lib/design-system/motion.ts`: standardized durations/easing.
- `lib/design-system/theme.ts`: Tailwind-consumable semantic theme and HSL token export.

### Semantic token model
- Core semantic slots: `background`, `surface`, `foreground`, `accent`, `destructive`, `success`, `warning`, `border`, `ring`.
- Tokens are expressed as CSS variables (`--background`, `--accent`, etc.) and consumed via Tailwind semantic colors.
- No runtime CSS-in-JS dependency introduced.

### Tailwind mapping
- Tailwind configuration in `apps/web/tailwind.config.ts` maps design tokens directly into `colors`, `spacing`, `radii`, `shadows`, `motion`, and keyframes.
- Global CSS uses `@import 'tailwindcss'` and tokenized variables in `app/globals.css`.

## 3. Layout System Refactor

### Reusable layout wrappers
- `components/layout/Container.tsx`: responsive page container abstraction.
- `components/layout/PageHeader.tsx`: standardized route heading + description + action row.
- `components/layout/AppShell.tsx`: consistent chrome (header, nav, footer).
- `components/layout/MainNav.tsx`: accessible nav with mobile dropdown fallback.

### Page surfaces refactored
- `/` Home: server-rendered hero + featured deck cards.
- `/forge` Forge: server shell + focused client island for deck interactions.
- `/cards` Card Database: server-rendered filtering + card grid.
- `/decks`, `/decks/[id]`: server-rendered deck list and deck detail.
- `/profile`: server route with tabbed client panel.
- `/auth/login`, `/auth/register`: auth routes with shared form component.

## 4. Component System Replacement

### New UI primitives (`components/ui`)
- `Button.tsx`
- `Input.tsx`
- `Select.tsx` (Radix Select)
- `Dialog.tsx` (Radix Dialog)
- `Tabs.tsx` (Radix Tabs)
- `Card.tsx`
- `Badge.tsx`
- `Tooltip.tsx` (Radix Tooltip)
- `Dropdown.tsx` (Radix Dropdown Menu)

### Accessibility defaults built in
- Keyboard navigation and roving focus inherited from Radix primitives.
- Focus-visible ring treatment standardized across controls.
- ARIA roles/attributes included via semantic primitives and field descriptors.
- Modal focus trapping and escape handling delegated to Radix Dialog.

## 5. Continuous Evaluation and Tradeoffs

### Accessibility
- Improved: standardized keyboard/focus behavior through Radix primitives.
- Residual risk: route-specific content semantics still need dedicated a11y regression tests.

### Bundle strategy
- Improved: server components used for route shells and static content.
- Client JS isolated to interaction-heavy islands only.
- Residual risk: Forge client island can grow if simulation logic is added without chunk boundaries.

### SSR compatibility
- Improved: all major routes now ship as App Router server pages by default.
- Residual risk: external auth/data integrations must preserve server-safe boundaries.

### Theming consistency
- Improved: all styling derives from semantic tokens and Tailwind mapping.
- Residual risk: legacy `apps/web/src` UI files remain in repository as non-compiled historical artifacts.

### Maintainability
- Improved: clear layer split (`app`, `components`, `lib/design-system`, `lib/data`).
- Improved: reusable primitives replace bespoke per-feature UI controls.

## Refactored Folder Structure

```txt
apps/web
├── app
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   ├── cards/page.tsx
│   ├── decks/page.tsx
│   ├── decks/[id]/page.tsx
│   ├── forge/page.tsx
│   ├── forge/forge-workbench.tsx
│   ├── profile/page.tsx
│   ├── profile/profile-panel.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── auth/AuthForm.tsx
│   ├── layout/AppShell.tsx
│   ├── layout/Container.tsx
│   ├── layout/MainNav.tsx
│   ├── layout/PageHeader.tsx
│   └── ui/*.tsx
├── lib
│   ├── data/cards.ts
│   ├── data/decks.ts
│   ├── design-system/*.ts
│   ├── supabase/client.ts
│   └── utils/cn.ts
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Decision Justifications

1. App Router + server components reduce initial JS and improve first render performance versus SPA-only routing.
2. Radix primitives reduce custom accessibility bugs and improve keyboard/screen-reader reliability.
3. Tailwind tokens via semantic variables allow large-scale theming changes without component rewrites.
4. shadcn-style composable components improve consistency and reduce duplicated UI behavior.
5. Scoped client islands preserve interactivity while avoiding full-app hydration overhead.
