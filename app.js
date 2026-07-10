const starterData = {
  meta: {
    app: "Ledger",
    dataset: "Fictional starter data",
    household_label: "Household",
    base_currency: "AUD",
    current_age: 36,
    generated_at: "2026-07-10T00:00:00Z"
  },
  snapshots: [
    {
      schema_version: 1,
      as_of: "2026-07-31",
      fx: { pair: "NZD/AUD", rate: 0.92, requested_date: "2026-07-31", rate_date: "2026-07-31", mode: "manual", source: "starter" },
      line_items: [
        { id: "cash", name: "Cash", category: "cash", type: "asset", currency: "AUD", amount: 20000 },
        { id: "super", name: "Super", category: "super", type: "asset", currency: "AUD", amount: 85000 },
        { id: "property", name: "Property", category: "property", type: "asset", currency: "AUD", amount: 650000 },
        { id: "shares", name: "Shares / ETFs", category: "shares", type: "asset", currency: "AUD", amount: 15000 },
        { id: "debt", name: "Mortgage / debt", category: "debt", type: "debt", currency: "AUD", amount: 420000 }
      ],
      notes: "Fictional starter values. Replace them in Inputs."
    }
  ],
  cashflow: [
    { schema_version: 1, month: "2026-07", inflow: 9000, outflow: 6500, notes: "Fictional starter month." }
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
const baseData = window.LEDGER_DATA || starterData;
const dataVersion = "current-inputs-fx082-burn6000-compare-age36-v5";
const stateKey = `ledger-example-data-${dataVersion}`;
const categories = ["cash", "super", "property", "shares", "debt"];
const categoryLabels = {
  cash: "Cash",
  super: "Super",
  property: "Property",
  shares: "Shares",
  debt: "Debt"
};
const categoryColors = {
  cash: "#86B8D0",
  super: "#CBA97E",
  property: "#9AC7A7",
  shares: "#B8A3D8",
  debt: "#D08B7C"
};

const els = {
  periodLabel: document.querySelector("#periodLabel"),
  refreshButton: document.querySelector("#refreshButton"),
  panels: {
    home: document.querySelector("#homePanel"),
    networth: document.querySelector("#netWorthPanel"),
    cashflow: document.querySelector("#cashflowPanel"),
    projection: document.querySelector("#projectionPanel"),
    compare: document.querySelector("#comparePanel"),
    sheet: document.querySelector("#sheetPanel")
  },
  navButtons: document.querySelectorAll(".nav-button")
};

let activeTab = "home";
let ledger = loadLedger();

function loadLedger() {
  clearLegacyStorage();
  registerServiceWorker();
  try {
    const stored = JSON.parse(localStorage.getItem(stateKey));
    if (stored?.meta?.data_version === dataVersion && stored?.snapshots?.length) return normalizeLedger(stored);
  } catch {
    // Fall through to sample data.
  }
  const fresh = normalizeLedger(structuredClone(baseData));
  fresh.meta.data_version = dataVersion;
  localStorage.setItem(stateKey, JSON.stringify(fresh));
  return fresh;
}

function normalizeLedger(value) {
  value.meta ||= {};
  value.meta.data_version = dataVersion;
  value.projection ||= structuredClone(baseData.projection);
  value.benchmarks = {
    ...structuredClone(baseData.benchmarks),
    ...(value.benchmarks || {})
  };
  if (value.benchmarks.cohort_label !== "35-39") {
    value.benchmarks = structuredClone(baseData.benchmarks);
  }
  value.cashflow = (value.cashflow || []).map((row) => ({
    schema_version: row.schema_version || 1,
    month: row.month,
    inflow: cashInflow(row),
    outflow: cashOutflow(row),
    notes: row.notes || ""
  }));
  value.meta.trend_anchor_as_of ||= value.snapshots?.at(-1)?.as_of;
  return value;
}

function clearLegacyStorage() {
  [
    "ledger-example-data-v1",
    "ledger-example-data-v2",
    "ledger-example-data-v3",
    "ledger-example-data-current-inputs-fx082-burn6000-v1",
    "ledger-example-data-current-inputs-fx082-burn6000-compare-v2",
    "ledger-example-data-current-inputs-fx082-burn6000-compare-v3",
    "ledger-example-data-current-inputs-fx082-burn6000-compare-v4",
    "ledger-example-data-current-inputs-fx082-burn6000-compare-age36-v5"
  ].forEach((key) => {
    if (key !== stateKey) localStorage.removeItem(key);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function saveLedger() {
  localStorage.setItem(stateKey, JSON.stringify(ledger));
}

function resetLedger() {
  if (!confirm("Reset the example sheet to the bundled sample data?")) return;
  clearLegacyStorage();
  ledger = normalizeLedger(structuredClone(baseData));
  saveLedger();
  render();
}

function latestSnapshot() {
  return ledger.snapshots.at(-1);
}

function previousSnapshot() {
  return ledger.snapshots.at(-2) || latestSnapshot();
}

function latestCashflow() {
  return ledger.cashflow.at(-1);
}

function cashInflow(row) {
  return Number(row.inflow ?? row.income ?? 0);
}

function cashOutflow(row) {
  return Number(row.outflow ?? row.expenses ?? 0);
}

function currency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function percent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function monthLabel(value) {
  return new Intl.DateTimeFormat("en-AU", { month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 7)}-15T12:00:00`));
}

function toAud(item, snapshot) {
  return item.amount * (item.currency === "AUD" ? 1 : snapshot.fx.rate);
}

function summarize(snapshot) {
  const summary = {
    assets: 0,
    debt: 0,
    netWorth: 0,
    property: 0,
    liquid: 0,
    nzdExposure: 0,
    byCategory: Object.fromEntries(categories.map((category) => [category, 0]))
  };

  snapshot.line_items.forEach((item) => {
    const amountAud = toAud(item, snapshot);
    summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + amountAud;
    if (item.type === "asset") summary.assets += amountAud;
    if (item.type === "debt") summary.debt += amountAud;
    if (item.category === "property" && item.type === "asset") summary.property += amountAud;
    if (item.category === "cash" || item.category === "shares") summary.liquid += amountAud;
    if (item.currency === "NZD") summary.nzdExposure += item.type === "debt" ? -amountAud : amountAud;
  });
  summary.netWorth = summary.assets - summary.debt;
  summary.lvr = summary.property ? summary.debt / summary.property : 0;
  return summary;
}

function historyRows() {
  const anchorDate = ledger.meta?.trend_anchor_as_of || latestSnapshot().as_of;
  const anchorSnapshot = ledger.snapshots.find((snapshot) => snapshot.as_of === anchorDate) || latestSnapshot();
  const syntheticRows = syntheticBackcastRows(anchorSnapshot, 5);
  const actualRows = ledger.snapshots
    .filter((snapshot) => snapshot.as_of >= anchorSnapshot.as_of)
    .map((snapshot) => ({
      snapshot,
      synthetic: false,
      label: monthLabel(snapshot.as_of),
      summary: summarize(snapshot)
    }));

  return [...syntheticRows, ...actualRows];
}

function previousTrendRow() {
  const rows = historyRows();
  return rows.at(-2) || rows.at(-1);
}

function syntheticBackcastRows(anchorSnapshot, months) {
  const settings = projectionSettings();
  const anchor = summarize(anchorSnapshot);
  const propertyRate = ((Number(settings.property_return_pct) || 0) / 100);
  const shareRate = ((Number(settings.share_return_pct) || 0) / 100);
  const propertyMonthly = (1 + propertyRate) ** (1 / 12) - 1;
  const shareMonthly = (1 + shareRate) ** (1 / 12) - 1;
  const anchorDate = new Date(`${anchorSnapshot.as_of}T12:00:00`);

  return Array.from({ length: months }, (_, index) => {
    const monthsBack = months - index;
    const date = new Date(anchorDate);
    date.setMonth(date.getMonth() - monthsBack);
    const property = (anchor.byCategory.property || 0) / ((1 + propertyMonthly) ** monthsBack);
    const superValue = (anchor.byCategory.super || 0) / ((1 + shareMonthly) ** monthsBack);
    const shares = (anchor.byCategory.shares || 0) / ((1 + shareMonthly) ** monthsBack);
    const cash = anchor.byCategory.cash || 0;
    const debt = anchor.debt || 0;
    const assets = property + superValue + shares + cash;
    const netWorth = assets - debt;
    return {
      snapshot: anchorSnapshot,
      synthetic: true,
      label: monthLabel(date.toISOString().slice(0, 10)),
      summary: {
        assets,
        debt,
        netWorth,
        property,
        liquid: cash + shares,
        nzdExposure: anchor.nzdExposure || 0,
        lvr: property ? debt / property : 0,
        byCategory: {
          cash,
          super: superValue,
          property,
          shares,
          debt
        }
      }
    };
  });
}

function rawHistoryRows() {
  return ledger.snapshots.map((snapshot) => ({
    snapshot,
    label: monthLabel(snapshot.as_of),
    summary: summarize(snapshot)
  }));
}

function cashflowRows() {
  return ledger.cashflow.map((row) => ({
    ...row,
    inflow: cashInflow(row),
    outflow: cashOutflow(row),
    surplus: cashInflow(row) - cashOutflow(row),
    savings: cashInflow(row) - cashOutflow(row),
    savingsRate: cashInflow(row) ? (cashInflow(row) - cashOutflow(row)) / cashInflow(row) : 0
  }));
}

function cashflowGuidance(summary, cashflow) {
  if (cashflow.surplus >= 0) {
    return `Savings rate is positive at ${percent(cashflow.savingsRate)}. Think about investing the surplus.`;
  }
  const monthlyBurn = Math.abs(cashflow.surplus);
  const cashSavings = summary.byCategory.cash || 0;
  const years = monthlyBurn ? cashSavings / monthlyBurn / 12 : Infinity;
  if (!Number.isFinite(years)) return "Cash runway is stable at this rate.";
  return `At this deficit, liquid savings would be depleted in ${years.toFixed(1)} years.`;
}

function cashRunway(summary, cashflow) {
  if (cashflow.surplus >= 0) {
    return { value: "Stable", note: "no monthly deficit" };
  }
  const monthlyBurn = Math.abs(cashflow.surplus);
  const months = monthlyBurn ? (summary.byCategory.cash || 0) / monthlyBurn : Infinity;
  if (!Number.isFinite(months)) return { value: "Stable", note: "cash / monthly deficit" };
  const value = months >= 12 ? `${(months / 12).toFixed(1)} yrs` : `${months.toFixed(1)} mo`;
  return { value, note: `${currency(summary.byCategory.cash || 0)} cash / ${currency(monthlyBurn)} burn` };
}

function benchmarkComparison(summary) {
  const benchmark = ledger.benchmarks.values.find((item) => item.label === ledger.benchmarks.cohort_label) || ledger.benchmarks.values[0];
  const multiple = benchmark?.value_aud ? summary.netWorth / benchmark.value_aud : 0;
  const betterPct = benchmark?.value_aud ? ((summary.netWorth / benchmark.value_aud) - 1) * 100 : 0;
  return {
    benchmark,
    multiple,
    betterPct,
    sentence: `You are ${multiple.toFixed(1)}x the median household net worth in the ${ledger.benchmarks.cohort_label} age category.`
  };
}

function projectedValueForAge(age) {
  const currentAge = Number(ledger.meta?.current_age || baseData.meta?.current_age || 36);
  const yearsForward = Math.max(0, age - currentAge);
  return projectedValueForYears(yearsForward).netWorth;
}

function projectedValueForYears(yearsForward) {
  const settings = projectionSettings();
  const current = summarize(latestSnapshot());
  const propertyBase = current.byCategory.property || 0;
  const superBase = current.byCategory.super || 0;
  const sharesBase = current.byCategory.shares || 0;
  const cashBase = current.byCategory.cash || 0;
  const debtBase = current.debt || 0;
  const propertyRate = (Number(settings.property_return_pct) || 0) / 100;
  const shareRate = (Number(settings.share_return_pct) || 0) / 100;
  const inflationRate = (Number(settings.inflation_pct) || 0) / 100;
  const property = propertyBase * ((1 + propertyRate) ** yearsForward);
  const superValue = superBase * ((1 + shareRate) ** yearsForward);
  const shares = sharesBase * ((1 + shareRate) ** yearsForward);
  const cash = cashBase;
  const assets = property + superValue + shares + cash;
  const netWorth = assets - debtBase;
  const realNetWorth = netWorth / ((1 + inflationRate) ** yearsForward);
  return { assets, debt: debtBase, netWorth, realNetWorth };
}

function comparisonRows() {
  return ledger.benchmarks.values.map((benchmark) => {
    const ledgerValue = projectedValueForAge(benchmark.age || 39);
    const multiple = benchmark.value_aud ? ledgerValue / benchmark.value_aud : 0;
    const betterPct = benchmark.value_aud ? ((ledgerValue / benchmark.value_aud) - 1) * 100 : 0;
    return {
      label: benchmark.age ? `Age ${benchmark.age}` : benchmark.label,
      absLabel: benchmark.label,
      ledgerValue,
      benchmarkValue: benchmark.value_aud,
      multiple,
      betterPct
    };
  });
}

function projectionSettings() {
  ledger.projection ||= {
    years: 10,
    property_return_pct: 4.5,
    share_return_pct: 7,
    inflation_pct: 2.5,
    notes: ""
  };
  return ledger.projection;
}

function delta(current, previous) {
  const change = current - previous;
  return {
    change,
    pct: previous ? change / previous : 0,
    className: change >= 0 ? "positive" : "negative",
    sign: change >= 0 ? "+" : ""
  };
}

function renderMetric(label, value, sub, tone = "") {
  return `
    <article class="metric ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(sub || "")}</small>
    </article>
  `;
}

function renderTrend(rows, key = "netWorth") {
  const values = rows.map((row) => row.summary[key]);
  const comparison = benchmarkComparison(summarize(latestSnapshot()));
  const benchmarkValues = rows.map(() => comparison.benchmark.value_aud);
  const title = rows.some((row) => row.synthetic) ? "Net worth · backfilled" : "Net worth";
  return renderDualLineChart(values, benchmarkValues, rows.map((row) => row.label), title, "Ledger", `${ledger.benchmarks.cohort_label} median`, { baseline: 0 });
}

function renderLineChart(values, labels, title, options = {}) {
  const width = 640;
  const height = 210;
  const padding = 26;
  const min = options.baseline ?? Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return [x, y];
  });
  const path = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L${points.at(-1)[0].toFixed(1)} ${height - padding} L${points[0][0].toFixed(1)} ${height - padding} Z`;
  return `
    <div class="chart-shell">
      <div class="chart-head">
        <span>${escapeHtml(title)}</span>
        <strong>${currency(values.at(-1))}</strong>
      </div>
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} chart">
        <path class="area" d="${area}"></path>
        <path class="line" d="${path}"></path>
        ${points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle>`).join("")}
      </svg>
      <div class="axis-labels"><span>${escapeHtml(labels[0])}</span><span>${escapeHtml(labels.at(-1))}</span></div>
    </div>
  `;
}

function renderDualLineChart(primaryValues, secondaryValues, labels, title, primaryLabel, secondaryLabel, options = {}) {
  const width = 640;
  const height = 230;
  const padding = 28;
  const values = [...primaryValues, ...secondaryValues];
  const min = options.baseline ?? Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pointsFor = (series) => series.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return [x, y];
  });
  const pathFor = (points) => points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return `
    <div class="chart-shell">
      <div class="chart-head">
        <span>${escapeHtml(title)}</span>
        <strong>${currency(primaryValues.at(-1))}</strong>
      </div>
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} chart">
        <path class="line secondary-line" d="${pathFor(pointsFor(secondaryValues))}"></path>
        <path class="line" d="${pathFor(pointsFor(primaryValues))}"></path>
      </svg>
      <div class="legend-row">
        <span><i style="background:#86B8D0"></i>${escapeHtml(primaryLabel)}</span>
        <span><i style="background:#CBA97E"></i>${escapeHtml(secondaryLabel)}</span>
      </div>
      <div class="axis-labels"><span>${escapeHtml(labels[0])}</span><span>${escapeHtml(labels.at(-1))}</span></div>
    </div>
  `;
}

function renderBars(items, maxValue) {
  return `
    <div class="bar-list">
      ${items.map((item) => `
        <div class="bar-row">
          <div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.valueLabel || currency(item.value))}</strong></div>
          <div class="bar-track"><i style="width:${Math.max(2, (item.value / maxValue) * 100).toFixed(1)}%; background:${escapeHtml(item.color || "#86B8D0")}"></i></div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderComparisonBars(rows, compact = false) {
  const maxValue = Math.max(...rows.flatMap((row) => [row.ledgerValue, row.benchmarkValue]), 1);
  return `
    <div class="compare-bars ${compact ? "compact-compare" : ""}">
      ${rows.map((row) => `
        <article class="compare-group">
          <div class="compare-head">
            <span>${escapeHtml(row.label)}</span>
            <strong>${currency(row.ledgerValue)} · ${row.multiple.toFixed(1)}x median</strong>
          </div>
          <p class="compare-note">Projected Ledger ${currency(row.ledgerValue)} vs median ${currency(row.benchmarkValue)} (${Math.round(row.betterPct)}% higher).</p>
          <div class="paired-bars">
            <div class="paired-row">
              <span>Ledger projected</span>
              <div class="bar-track"><i style="width:${Math.max(2, (row.ledgerValue / maxValue) * 100).toFixed(1)}%; background:#86B8D0"></i></div>
              <strong>${currency(row.ledgerValue)}</strong>
            </div>
            <div class="paired-row benchmark-row">
              <span>Median ${escapeHtml(row.absLabel)}</span>
              <div class="bar-track"><i style="width:${Math.max(2, (row.benchmarkValue / maxValue) * 100).toFixed(1)}%; background:#CBA97E"></i></div>
              <strong>${currency(row.benchmarkValue)}</strong>
            </div>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderDonut(items, title) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 25;
  const radius = 15.9155;
  const rings = items.map((item) => {
    const pct = (item.value / total) * 100;
    const stroke = `<circle r="${radius}" cx="18" cy="18" fill="transparent" stroke="${escapeHtml(item.color)}" stroke-width="8" stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>`;
    offset -= pct;
    return stroke;
  }).join("");
  const largest = [...items].sort((a, b) => b.value - a.value)[0];
  return `
    <section class="panel donut-panel">
      <div>
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h2>${escapeHtml(largest.label)} concentration</h2>
        <p class="fine-print">${escapeHtml(largest.label)} is ${percent(largest.value / total)} of gross assets.</p>
      </div>
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 36 36" role="img" aria-label="${escapeHtml(title)} pie chart">
          ${rings}
        </svg>
      </div>
      <div class="legend-list">
        ${items.map((item) => `<span><i style="background:${escapeHtml(item.color)}"></i>${escapeHtml(item.label)} ${percent(item.value / total)}</span>`).join("")}
      </div>
    </section>
  `;
}

function projectionRows() {
  const settings = projectionSettings();
  const current = summarize(latestSnapshot());
  const propertyBase = current.byCategory.property || 0;
  const superBase = current.byCategory.super || 0;
  const sharesBase = current.byCategory.shares || 0;
  const cashBase = current.byCategory.cash || 0;
  const debtBase = current.debt || 0;
  const propertyRate = (Number(settings.property_return_pct) || 0) / 100;
  const shareRate = (Number(settings.share_return_pct) || 0) / 100;
  const inflationRate = (Number(settings.inflation_pct) || 0) / 100;
  const years = Math.max(1, Math.min(40, Number(settings.years) || 10));
  const backYears = 5;

  return Array.from({ length: years + backYears + 1 }, (_, index) => {
    const year = index - backYears;
    const property = propertyBase * ((1 + propertyRate) ** year);
    const superValue = superBase * ((1 + shareRate) ** year);
    const shares = sharesBase * ((1 + shareRate) ** year);
    const cash = cashBase;
    const assets = property + superValue + shares + cash;
    const netWorth = assets - debtBase;
    const realNetWorth = netWorth / ((1 + inflationRate) ** year);
    return {
      year,
      label: year === 0 ? "Now" : year < 0 ? `${Math.abs(year)}y ago` : `Y${year}`,
      property,
      super: superValue,
      shares,
      cash,
      assets,
      debt: debtBase,
      netWorth,
      realNetWorth
    };
  });
}

function renderHome() {
  const current = summarize(latestSnapshot());
  const previous = previousTrendRow()?.summary || summarize(previousSnapshot());
  const change = delta(current.netWorth, previous.netWorth);
  const cash = cashflowRows().at(-1);
  const compareRows = comparisonRows();

  els.panels.home.innerHTML = `
    <section class="hero-panel">
      <p class="eyebrow">Latest snapshot</p>
      <h2>${currency(current.netWorth)}</h2>
      <p class="delta ${change.className}">${change.sign}${currency(change.change)} · ${change.sign}${percent(change.pct)} month on month</p>
    </section>
    <section class="status-strip">
      <div><span>${monthLabel(latestSnapshot().as_of)}</span><small>snapshot</small></div>
      <div><span>${latestSnapshot().fx.rate.toFixed(4)}</span><small>NZD/AUD</small></div>
      <div><span>${latestSnapshot().fx.mode}</span><small>FX mode</small></div>
    </section>
    <section class="panel">
      <p class="eyebrow">Age comparison</p>
      ${renderComparisonBars(compareRows, true)}
    </section>
    <section class="metric-grid">
      ${renderMetric("Assets", currency(current.assets), "gross household assets")}
      ${renderMetric("Debt", currency(current.debt), `LVR ${percent(current.lvr)}`)}
      ${renderMetric("Cashflow", currency(cash.surplus), cashflowGuidance(current, cash))}
      ${renderMetric("Liquid cash", currency(current.byCategory.cash || 0), "total cash balance")}
    </section>
    <p class="sample-note">Fictional sample data only.</p>
  `;
}

function renderNetWorth() {
  const snapshot = latestSnapshot();
  const summary = summarize(snapshot);
  const runway = cashRunway(summary, cashflowRows().at(-1));
  const categoryItems = categories
    .map((category) => ({
      label: categoryLabels[category],
      value: summary.byCategory[category] || 0,
      color: categoryColors[category]
    }))
    .filter((item) => item.value > 0);
  const maxValue = Math.max(...categoryItems.map((item) => item.value), 1);

  els.panels.networth.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Net worth</p>
      <h2>Assets minus debts</h2>
    </div>
    <section class="metric-grid">
      ${renderMetric("Net worth", currency(summary.netWorth), "consolidated to AUD", "primary")}
      ${renderMetric("Property", currency(summary.property), "gross value")}
      ${renderMetric("Liquid", currency(summary.liquid), "cash + shares")}
      ${renderMetric("Cash runway", runway.value, runway.note)}
    </section>
    <section class="panel">
      <p class="eyebrow">Category mix</p>
      ${renderBars(categoryItems, maxValue)}
    </section>
    <section class="panel">
      <p class="eyebrow">Line items</p>
      <div class="table compact-table">
        ${snapshot.line_items.map((item) => `
          <div class="table-row">
            <span>${escapeHtml(item.name)}</span>
            <span>AUD</span>
            <strong>${currency(toAud(item, snapshot))}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCashflow() {
  const rows = cashflowRows();
  const latest = rows.at(-1);
  const summary = summarize(latestSnapshot());
  const maxValue = Math.max(...rows.flatMap((row) => [row.inflow, row.outflow, Math.abs(row.surplus)]), 1);

  els.panels.cashflow.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Cashflow</p>
      <h2>${monthLabel(`${latest.month}-01`)}</h2>
    </div>
    <section class="metric-grid">
      ${renderMetric("Cash inflow", currency(latest.inflow), "monthly")}
      ${renderMetric("Cash outflow", currency(latest.outflow), "monthly")}
      ${renderMetric(latest.surplus >= 0 ? "Surplus" : "Deficit", currency(latest.surplus), "derived", "primary")}
      ${renderMetric("Savings rate", percent(latest.savingsRate), "derived")}
    </section>
    <section class="panel">
      <p class="eyebrow">Runway</p>
      <h2>${escapeHtml(cashflowGuidance(summary, latest))}</h2>
    </section>
    <section class="panel">
      <p class="eyebrow">Monthly run rate</p>
      ${renderBars(rows.map((row) => ({
        label: monthLabel(`${row.month}-01`),
        value: Math.max(Math.abs(row.surplus), 1),
        valueLabel: `${currency(row.surplus)} surplus`,
        color: row.surplus >= 0 ? "#9AC7A7" : "#D08B7C"
      })), maxValue)}
    </section>
  `;
}

function renderProjection() {
  const settings = projectionSettings();
  const rows = projectionRows();
  const final = rows.at(-1);
  const current = rows.find((row) => row.year === 0) || rows[0];
  const gain = delta(final.netWorth, current.netWorth);
  const assetItems = [
    { label: "Property", value: final.property, color: categoryColors.property },
    { label: "Super", value: final.super, color: categoryColors.super },
    { label: "Shares", value: final.shares, color: categoryColors.shares },
    { label: "Cash", value: final.cash, color: categoryColors.cash }
  ].filter((item) => item.value > 0);
  const maxBar = Math.max(final.assets, final.debt, final.netWorth, 1);

  els.panels.projection.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Projection</p>
      <h2>${settings.years} year view</h2>
    </div>
    <section class="metric-grid">
      ${renderMetric("Projected net worth", currency(final.netWorth), `${gain.sign}${currency(gain.change)} nominal`, "primary")}
      ${renderMetric("Today dollars", currency(final.realNetWorth), `${settings.inflation_pct}% inflation`)}
      ${renderMetric("Property return", `${settings.property_return_pct}%`, "annual assumption")}
      ${renderMetric("Shares / super", `${settings.share_return_pct}%`, "annual assumption")}
    </section>
    ${renderDualLineChart(
      rows.map((row) => row.netWorth),
      rows.map((row) => row.realNetWorth),
      rows.map((row) => row.label),
      "Projected net worth",
      "Nominal",
      "Today's dollars"
    )}
    <section class="panel">
      <p class="eyebrow">Future balance sheet</p>
      ${renderBars([
        { label: "Gross assets", value: final.assets, color: "#86B8D0" },
        { label: "Debt held flat", value: final.debt, color: "#D08B7C" },
        { label: "Net worth", value: final.netWorth, color: "#9AC7A7" }
      ], maxBar)}
    </section>
    ${renderDonut(assetItems, "Projected allocation")}
    <p class="sample-note">Projection is a simple scenario model, not advice. The left side backcasts from today using the current return assumptions; the right side projects forward using the manual inputs. Debt is held flat in nominal terms.</p>
  `;
}

function renderCompare() {
  const current = summarize(latestSnapshot());
  const comparison = benchmarkComparison(current);
  const rows = comparisonRows();

  els.panels.compare.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Compare</p>
      <h2>Age band benchmarks</h2>
    </div>
    <section class="hero-panel compact-hero">
      <p class="eyebrow">${escapeHtml(ledger.benchmarks.cohort_label)} now</p>
      <h2>${currency(current.netWorth)} · ${comparison.multiple.toFixed(1)}x median</h2>
      <p class="delta positive">${escapeHtml(comparison.sentence)}</p>
    </section>
    <section class="panel">
      <p class="eyebrow">Now and future ages</p>
      ${renderComparisonBars(rows)}
      <p class="fine-print">${escapeHtml(ledger.benchmarks.source)} · ${escapeHtml(ledger.benchmarks.reference_period)} · ${escapeHtml(ledger.benchmarks.notes)}</p>
    </section>
  `;
}

function renderSheet() {
  const snapshot = latestSnapshot();
  const cash = latestCashflow();
  const summary = summarize(snapshot);
  const benchmarkMax = Math.max(summary.netWorth, ...ledger.benchmarks.values.map((item) => item.value_aud));

  els.panels.sheet.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Inputs</p>
      <h2>Edit the sample month</h2>
    </div>
    <section class="panel">
      <div class="sheet-toolbar">
        <button class="secondary-button" type="button" id="addMonthButton">Add month</button>
        <button class="secondary-button" type="button" id="exportButton">Export JSON</button>
        <button class="secondary-button" type="button" id="resetButton">Reset sample</button>
      </div>
      <label class="field-row"><span>Snapshot date</span><input id="snapshotDateInput" type="date" value="${escapeHtml(snapshot.as_of)}"></label>
      <label class="field-row"><span>NZD/AUD frozen FX</span><input id="fxInput" type="number" inputmode="decimal" step="0.0001" value="${snapshot.fx.rate}"></label>
    </section>
    <section class="panel">
      <p class="eyebrow">Net worth rows</p>
      <div class="sheet-table">
        <div class="sheet-row sheet-head"><span>Name</span><span>Cur</span><span>Amount</span></div>
        ${snapshot.line_items.map((item, index) => `
          <div class="sheet-row">
            <span>${escapeHtml(item.name)}</span>
            <span>${escapeHtml(item.currency)}</span>
            <input data-line-index="${index}" type="number" inputmode="decimal" value="${item.amount}">
          </div>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Cashflow</p>
      <div class="cash-inputs">
        <label class="field-row"><span>Month</span><input id="cashMonthInput" type="month" value="${escapeHtml(cash.month)}"></label>
        <label class="field-row"><span>Monthly cash inflow</span><input id="inflowInput" type="number" inputmode="decimal" value="${cashInflow(cash)}"></label>
        <label class="field-row"><span>Monthly cash outflow</span><input id="outflowInput" type="number" inputmode="decimal" value="${cashOutflow(cash)}"></label>
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Projection assumptions</p>
      <div class="cash-inputs">
        <label class="field-row"><span>Years</span><input id="projectionYearsInput" type="number" inputmode="numeric" min="1" max="40" value="${projectionSettings().years}"></label>
        <label class="field-row"><span>Property return %</span><input id="propertyReturnInput" type="number" inputmode="decimal" step="0.1" value="${projectionSettings().property_return_pct}"></label>
        <label class="field-row"><span>Shares / super %</span><input id="shareReturnInput" type="number" inputmode="decimal" step="0.1" value="${projectionSettings().share_return_pct}"></label>
        <label class="field-row"><span>Inflation %</span><input id="inflationInput" type="number" inputmode="decimal" step="0.1" value="${projectionSettings().inflation_pct}"></label>
      </div>
      <p class="fine-print">Debt stays flat. Cash stays flat. Inflation is used for today's-dollar comparison.</p>
    </section>
    <section class="panel">
      <p class="eyebrow">Compare 35-39</p>
      ${renderBars([
        { label: "Ledger sample", value: summary.netWorth, color: "#86B8D0" },
        ...ledger.benchmarks.values.map((item) => ({ label: item.label, value: item.value_aud, color: "#CBA97E" }))
      ], benchmarkMax)}
      <p class="fine-print">${escapeHtml(benchmarkComparison(summary).sentence)}</p>
      <p class="fine-print">${escapeHtml(ledger.benchmarks.source)} · ${escapeHtml(ledger.benchmarks.reference_period)} · ${escapeHtml(ledger.benchmarks.notes)}</p>
    </section>
  `;

  bindSheetEvents();
}

function bindSheetEvents() {
  document.querySelector("#snapshotDateInput").addEventListener("change", (event) => {
    latestSnapshot().as_of = event.target.value;
    latestSnapshot().fx.requested_date = event.target.value;
    saveLedger();
    render();
  });
  document.querySelector("#fxInput").addEventListener("change", (event) => {
    latestSnapshot().fx.rate = Number(event.target.value) || 0;
    latestSnapshot().fx.mode = "manual";
    saveLedger();
    render();
  });
  document.querySelectorAll("[data-line-index]").forEach((input) => {
    input.addEventListener("change", (event) => {
      latestSnapshot().line_items[Number(event.target.dataset.lineIndex)].amount = Number(event.target.value) || 0;
      saveLedger();
      render();
    });
  });
  document.querySelector("#cashMonthInput").addEventListener("change", (event) => {
    latestCashflow().month = event.target.value;
    saveLedger();
    render();
  });
  document.querySelector("#inflowInput").addEventListener("change", (event) => {
    latestCashflow().inflow = Number(event.target.value) || 0;
    delete latestCashflow().income;
    saveLedger();
    render();
  });
  document.querySelector("#outflowInput").addEventListener("change", (event) => {
    latestCashflow().outflow = Number(event.target.value) || 0;
    delete latestCashflow().expenses;
    saveLedger();
    render();
  });
  document.querySelector("#projectionYearsInput").addEventListener("change", (event) => {
    projectionSettings().years = Math.max(1, Math.min(40, Number(event.target.value) || 10));
    saveLedger();
    render();
  });
  document.querySelector("#propertyReturnInput").addEventListener("change", (event) => {
    projectionSettings().property_return_pct = Number(event.target.value) || 0;
    saveLedger();
    render();
  });
  document.querySelector("#shareReturnInput").addEventListener("change", (event) => {
    projectionSettings().share_return_pct = Number(event.target.value) || 0;
    saveLedger();
    render();
  });
  document.querySelector("#inflationInput").addEventListener("change", (event) => {
    projectionSettings().inflation_pct = Number(event.target.value) || 0;
    saveLedger();
    render();
  });
  document.querySelector("#addMonthButton").addEventListener("click", addMonth);
  document.querySelector("#exportButton").addEventListener("click", exportJson);
  document.querySelector("#resetButton").addEventListener("click", resetLedger);
}

function addMonth() {
  const lastSnapshot = latestSnapshot();
  const nextSnapshot = structuredClone(lastSnapshot);
  const date = new Date(`${lastSnapshot.as_of}T12:00:00`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
  nextSnapshot.as_of = date.toISOString().slice(0, 10);
  nextSnapshot.fx.requested_date = nextSnapshot.as_of;
  nextSnapshot.fx.rate_date = nextSnapshot.as_of;
  nextSnapshot.fx.mode = "manual";
  ledger.snapshots.push(nextSnapshot);

  const lastCash = latestCashflow();
  const cashDate = new Date(`${lastCash.month}-15T12:00:00`);
  cashDate.setMonth(cashDate.getMonth() + 1);
  ledger.cashflow.push({ ...structuredClone(lastCash), month: cashDate.toISOString().slice(0, 7) });
  saveLedger();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ledger-example-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  const latest = latestSnapshot();
  els.periodLabel.textContent = monthLabel(latest.as_of);
  Object.entries(els.panels).forEach(([name, panel]) => {
    panel.hidden = name !== activeTab;
  });
  renderHome();
  renderNetWorth();
  renderCashflow();
  renderProjection();
  renderCompare();
  renderSheet();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    els.navButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

els.refreshButton.addEventListener("click", render);

render();
