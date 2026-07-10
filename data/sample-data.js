window.LEDGER_DATA = {
  meta: {
    app: "Ledger",
    dataset: "Example data from current inputs",
    household_label: "Household",
    base_currency: "AUD",
    current_age: 36,
    generated_at: "2026-07-10T00:00:00Z"
  },
  snapshots: [
    {
      schema_version: 1,
      as_of: "2026-07-31",
      fx: { pair: "NZD/AUD", rate: 0.8357894736842105, requested_date: "2026-07-31", rate_date: "2026-07-31", mode: "manual", source: "sample" },
      line_items: [
        { id: "cash", name: "AUD cash", category: "cash", type: "asset", currency: "AUD", amount: 360000 },
        { id: "super_a", name: "My super", category: "super", type: "asset", currency: "AUD", amount: 219000 },
        { id: "super_b", name: "Her super", category: "super", type: "asset", currency: "AUD", amount: 206000 },
        { id: "property_au", name: "AUD property", category: "property", type: "asset", currency: "AUD", amount: 3500000 },
        { id: "property_nz", name: "NZD property", category: "property", type: "asset", currency: "NZD", amount: 1900000 },
        { id: "shares", name: "Shares / ETFs", category: "shares", type: "asset", currency: "AUD", amount: 5000 },
        { id: "loan_au", name: "AUD debts", category: "debt", type: "debt", currency: "AUD", amount: 2750000 },
        { id: "loan_nz", name: "NZD debt", category: "debt", type: "debt", currency: "NZD", amount: 850000 }
      ],
      notes: "Current input anchor. Prior months are backfilled from this point using return assumptions."
    }
  ],
  cashflow: [
    { schema_version: 1, month: "2026-07", inflow: 0, outflow: 6000, notes: "Current burn rate: negative $6,000 per month" }
  ],
  benchmarks: {
    source: "ABS-style household wealth age references",
    reference_period: "2019-20",
    cohort_label: "35-39",
    values: [
      { label: "35-39", age: 36, value_aud: 555000, type: "reference" },
      { label: "40-44", age: 40, value_aud: 841000, type: "reference" },
      { label: "45-49", age: 45, value_aud: 1100000, type: "reference" },
      { label: "50-54", age: 50, value_aud: 1300000, type: "reference" }
    ],
    notes: "Prototype references for comparison layout. Replace with sourced ABS detailed age-band values before production use."
  },
  projection: {
    years: 10,
    property_return_pct: 4.5,
    share_return_pct: 7,
    inflation_pct: 2.5,
    notes: "Debt is held flat in nominal terms. Cash is held flat. Property grows by property return. Super and shares grow by sharemarket return. Inflation is used to show today's-dollar net worth."
  }
};
