# Ledger - Initial Requirements

## Mode

Planning, requirements review, and architecture brainstorming only. Do not write implementation code yet.

## Original Brief

Francis wants to build Ledger, a personal household finance dashboard. Stage 1 is a net worth dashboard; Stage 2 will later add cashflow. Before writing any code, brainstorm and explore the design space, then recommend an architecture.

### Context

- Two users, different roles: Francis is the only one who enters data. His wife needs view-only access from her phone.
- Keep access simple: she should open a URL with lightweight protection and see the dashboard.
- No accounts, roles, or admin panel.
- Must be viewable from a phone anywhere, not just localhost.
- Update cadence: manual monthly snapshot, about five minutes of data entry.
- Francis is comfortable with Python, JavaScript, Docker, and git workflows.
- This is Stage 1 of a two-stage plan.
- Stage 2, later and separate, is a cashflow dashboard for income, expenses, and savings rate.
- Do not design Stage 2 now, but avoid architecture choices that force a rebuild when it arrives. Data format, hosting, and navigation should accommodate a second dashboard/page.

### Monthly Snapshot Data

Each line item has:

- `name`
- `category`
- `currency`: `AUD` or `NZD`
- `amount`

Line item families:

- Cash / liquidity position in AUD.
- Superannuation balance x2 in AUD.
- Property values entered as gross value, tagged AUD or NZD.
- Total debt, currency-tagged, including AUD loans and one NZD loan.
- Shares/ETFs, currently negligible but should be able to grow later.

Net worth equals assets minus debts, consolidated into AUD.

### FX Handling

Francis does not want to manually enter exchange rates.

Explore:

- Free no-key FX APIs callable from client-side JavaScript, such as `frankfurter.dev` and `exchangerate.host`, including reliability and rate-limit considerations.
- Storing the rate used at each snapshot date, so historical net worth is charted at historical rates rather than restated at today's rate.
- Fallback behaviour if the FX API is down.

Francis thinks historical snapshots should retain historical FX rates. Challenge this if there is a better maintenance/simplicity tradeoff.

### Deployment Options To Pressure-Test

1. GitHub Pages static site plus client-side encrypted data blob, with snapshot JSON versioned in a private repo.
2. Cloudflare Pages plus Cloudflare Access email OTP, deployed on git push.
3. Docker on Synology NAS plus Tailscale for remote access.

Consider:

- The FX API call must work client-side.
- Francis's wife needs near-zero-friction phone access.
- Weigh Tailscale on her device vs passphrase vs email OTP.
- Stage 2 will add a second dashboard to the same setup.

### Requested Session Output

1. Pressure-test the deployment options for this scale: a few KB of JSON, monthly updates, one external API call, one editor, one viewer. Identify anything missing.
2. Propose the snapshot JSON schema: currency-tagged line items, FX rate captured per snapshot, extensible line items without breaking history, and a notes field. Structure repo/data layout so a Stage 2 cashflow dataset can sit alongside it cleanly.
3. Sketch dashboard views ranked by usefulness. Candidate views: net worth over time stacked by category, gross assets vs total debt, AUD vs NZD exposure, LVR, month-on-month delta, liquid vs illiquid. Phone view should have two to three charts max and need zero interaction to be useful.
4. Design the monthly update flow for near-zero friction: Francis types about ten numbers on phone or laptop, commits, done. Compare direct JSON editing vs a small entry form that generates and commits it.
5. End with recommended architecture, phased build plan where Phase 1 is usable in one evening, and decisions needed from Francis first.

### Overriding Constraint

Optimize for longevity and simplicity over features. Monthly maintenance must remain about five minutes.

## Initial Codex Read

This looks like a small, privacy-sensitive, static-first personal app. The primary design risk is not charting complexity; it is choosing an access/update model that stays frictionless for both users over years.

Initial hypotheses to test during brainstorming:

- Cloudflare Pages plus Cloudflare Access likely has the best balance for anywhere access, spouse phone UX, low operations, and later multi-page dashboard expansion.
- GitHub Pages with an encrypted blob can work, but passphrase UX and accidental data exposure risks need careful treatment.
- Synology plus Tailscale is operationally familiar but probably higher friction for the view-only phone user and more brittle over time.
- Historical FX rates should be stored per snapshot, but the system should also store enough provenance to show when a rate was fetched versus manually carried forward as fallback.
- Stage 1 should probably use static JSON files and client-side rendering, with a data validation script or local entry helper later. Avoid introducing a database until Stage 2 proves it needs one.

## UX Reference

Use the Train personal training app as the main personal-utility UX reference. See `docs/ux-reference-train.md`.

Relevant carryovers:

- mobile-first static/PWA feel
- no landing page
- direct useful home screen
- compact bottom navigation
- one primary useful state/action
- dense cards and status strips
- local UI state only, with canonical data kept in source files
- setup/update as a small form, not an admin panel

## Claude Review Request

Please review the requirements before brainstorming architecture.

Focus on:

- Missing constraints or decisions that materially affect the architecture.
- Security/privacy risks in the deployment options.
- FX-rate handling pitfalls, especially historical rates and API fallback.
- Whether the proposed direction is too complex for the five-minutes-per-month constraint.
- Any Stage 2 compatibility concerns that should influence Stage 1 without over-designing Stage 2.

Severity-rate findings as CRITICAL / IMPORTANT / NIT and end with `VERDICT: APPROVE`, `VERDICT: REVISE`, or `VERDICT: REJECT`.
