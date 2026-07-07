# Comparison Benchmarking Page

## Scope

Ledger should include a comparison page that answers:

> How does our household compare with Australian households around our age?

This page is for context only. It should not feel like a scorecard, financial advice tool, or competitive leaderboard.

## Recommended MVP Behaviour

Use a static benchmark dataset checked into the repo, not a live API.

The page should show:

- household net worth versus selected Australian age cohort benchmarks
- optional income/cashflow context once cashflow data exists
- benchmark source and reference year
- clear caveat that household composition, city, home ownership, children, and inheritances materially affect comparisons

The default view should be readable without interaction:

- one headline comparison, such as "Above / near / below median for selected cohort"
- one compact bar or percentile-style chart
- one source/caveat line

## Data Source Direction

Prioritise official or transparent sources:

- ABS Household Income and Wealth / Survey of Income and Housing for household wealth concepts and age-of-reference-person cuts.
- ABS distributional household accounts for wealth by age of household reference person when available.
- HILDA-derived public reports can be useful for longitudinal wealth context, but avoid making them the hidden canonical source unless the dataset is easy to reproduce.
- Media interactives and finance blogs can inspire UX, but should not be the canonical data source unless their methodology and source data are transparent.

Known source candidates identified during initial research:

- ABS Household Income and Wealth, Australia, 2019-20: https://www.abs.gov.au/statistics/economy/finance/household-income-and-wealth-australia/latest-release
- ABS Measuring What Matters household income and wealth indicator: https://www.abs.gov.au/statistics/measuring-what-matters/measuring-what-matters-themes-and-indicators/prosperous/household-income-and-wealth
- ABS Distribution of Household Income, Consumption and Wealth: https://www.abs.gov.au/statistics/economy/national-accounts/australian-national-accounts-distribution-household-income-consumption-and-wealth/latest-release
- Guardian wealth comparison interactive methodology as UX reference, not canonical source: https://www.theguardian.com/news/ng-interactive/2024/may/13/australia-average-earnings-interactive-wealth-comparison-tool-salary

## Schema Implication

Benchmarks should live beside, not inside, household snapshot data:

```text
data/
  net-worth/
    snapshots/*.json
  cashflow/
    months/*.json
  benchmarks/
    au-household-wealth-age-cohorts.json
    sources.json
```

Benchmark records should include:

- `source_id`
- `source_name`
- `source_url`
- `reference_period`
- `published_at`
- `cohort_dimension`, e.g. `age_of_reference_person`
- `cohort_label`, e.g. `35-44`
- `metric`, e.g. `net_worth`
- `currency`
- `values`, such as median, mean, quintile, or percentile values where available
- `notes`

Do not mix benchmarks with personal line items. Personal data and external comparison data have different provenance and update cadence.

## Design Implication

The comparison page should be a quiet context page in the bottom nav, not a prominent judgement on the home screen.

Possible nav for MVP:

- Home
- Net Worth
- Cashflow
- Compare
- Data

If five tabs feels cramped on phone, use:

- Home
- Net Worth
- Cashflow
- More

with Compare and Data under More.

## Risks

- Age comparison can be misleading if the source is based on age of household reference person rather than both partners.
- Household wealth is heavily distorted by property, city, household size, and lifecycle stage.
- Mean wealth is much less useful than median or percentile bands because wealth is skewed.
- Benchmark data may lag by years; the app must show reference period clearly.
- Overemphasising percentile rank could make the app emotionally noisy. Use calm language.

