# UX Reference - Train Personal Training App

Source app inspected:

`/Users/francis/Projects/PersonalDevelopment/Fitness/May 2026 Program/workout-app`

## What To Carry Into Ledger

Ledger should feel like a quiet personal utility, not a finance product. The Train app is a strong reference because it is mobile-first, fast, persistent, and focused on the next useful action.

## Transferable Patterns

### 1. First Screen Is The Product

Train opens directly into the useful state:

- sticky topbar with current context
- one primary "next" panel
- compact status strip
- bottom navigation

Ledger should do the same. No landing page, no explainer screen, no decorative hero.

Default Ledger home should show:

- current net worth
- month-on-month change
- asset/debt split or LVR
- one compact chart that explains the trend
- last snapshot date and FX status

### 2. One Primary Action, Even If The Viewer Does Not Edit

Train has a clear "Start next workout" action. Ledger has two audiences:

- Francis: update this month's snapshot
- wife: view the current position

The default screen should still have one obvious next action, but it can be role-neutral:

- viewer state: "Latest snapshot"
- editor state later: "Add monthly snapshot"

Do not expose admin concepts, roles, or configuration in the main view.

### 3. Bottom Nav With Few Destinations

Train uses three tabs: Home, Program, Settings.

Ledger should use the same mental model:

- Home
- Net Worth
- Settings or Data

When Stage 2 arrives, this can become:

- Home
- Net Worth
- Cashflow
- Data

Keep the phone nav shallow. Avoid sidebar navigation.

### 4. Compact, Dense Cards

Train uses small cards, 8px radii, tight labels, and predictable vertical rhythm. Ledger should use compact information blocks, not large marketing cards.

Good Ledger equivalents:

- metric cards for net worth, gross assets, debt, LVR
- compact rows for category totals
- small badges for AUD/NZD exposure and FX source

Avoid:

- oversized hero sections
- decorative gradients
- nested cards
- text-heavy onboarding panels

### 5. Dark, Calm, High-Contrast Utility Theme

Train uses:

- near-black background
- muted panels
- cream text
- pale blue/tan accents
- monospaced labels for operational detail

Ledger can borrow the mood, but should not become a one-note black finance app. Use the same restraint:

- dark base
- warm off-white text
- restrained accent colours
- category colours only where they help chart interpretation
- monospaced labels for dates, currency, FX, and small metadata

### 6. Local State For UI, Canonical File For Data

Train keeps user progress in `localStorage` and static program data in a source file.

Ledger should separate:

- canonical financial snapshots: versioned JSON files in the repo
- viewer UI preferences: local browser state only
- temporary form draft: local browser state until exported or committed

Do not make browser localStorage the only home of financial truth.

### 7. Setup And Update Are Forms, Not Admin Screens

Train's setup screen asks only for the few values needed to make the app useful.

Ledger's monthly update should follow this:

- a small form with the existing line items prefilled from the previous month
- enter the changed balances
- fetch FX automatically
- validate totals
- generate the snapshot JSON

No admin panel. No database console. No account screen.

### 8. Offline/PWA Feel Is Useful, But Data Freshness Must Be Clear

Train has a manifest and service worker for installable/offline use.

Ledger can benefit from the same static PWA shape, especially for spouse phone viewing, but finance data must show freshness:

- latest snapshot date
- FX rate date
- whether FX was fetched live, stored historically, or fallback
- clear stale/API-down state

Offline caching should never make an old number look current.

## Specific Design Implications For Ledger Phase 1

- Build the home screen around two to three chart/metric areas max on phone.
- Put "current position" first, trend second, details third.
- Make the viewer path zero-interaction: opening the URL should be enough.
- Use forms only for Francis's update path, probably hidden behind a separate route or local-only workflow.
- Keep the app static-first unless a later update workflow proves a server is necessary.
- Include PWA metadata and safe-area mobile layout if the deployment choice supports it.

## Anti-Patterns To Avoid

- Treating Ledger like an analytics platform.
- Adding a chart picker before the core view is proven useful.
- Making the wife choose filters or tabs to answer "how are we tracking?"
- Making monthly updates depend on a fragile local server.
- Hiding FX state, data freshness, or historical conversion assumptions.

