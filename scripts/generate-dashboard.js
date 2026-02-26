/**
 * Generates a self-contained HTML dashboard from Playwright JSON test results.
 *
 * Usage: node scripts/generate-dashboard.js [input] [output-dir]
 *   input      – path to test-results.json (default: test-results.json)
 *   output-dir – directory for the generated dashboard (default: dashboard)
 */

const fs = require("fs");
const path = require("path");

const inputFile = process.argv[2] || "test-results.json";
const outputDir = process.argv[3] || "dashboard";

if (!fs.existsSync(inputFile)) {
  console.error(`Error: ${inputFile} not found. Run tests first: npx playwright test`);
  process.exit(1);
}

let raw;
try {
  const fileContents = fs.readFileSync(inputFile, "utf-8");
  raw = JSON.parse(fileContents);
} catch (err) {
  console.error(`Error: Failed to parse JSON from ${inputFile}.`);
  if (err && err.message) {
    console.error(`Reason: ${err.message}`);
  }
  console.error(
    "The test-results.json file may be incomplete or corrupted. " +
      "Try re-running your Playwright tests: npx playwright test"
  );
  process.exit(1);
}

// ── Extract test data ───────────────────────────────────────────────────────
function extractTests(suites) {
  const tests = [];
  for (const suite of suites) {
    if (suite.suites) tests.push(...extractTests(suite.suites));
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const result = test.results?.[test.results.length - 1];
          tests.push({
            suite: suite.title || path.basename(spec.file || "", ".spec.ts"),
            title: spec.title,
            status: test.status,
            duration: result?.duration ?? 0,
          });
        }
      }
    }
  }
  return tests;
}

const tests = extractTests(raw.suites || []);
const stats = {
  total: tests.length,
  passed: tests.filter((t) => t.status === "expected").length,
  failed: tests.filter((t) => t.status === "unexpected").length,
  skipped: tests.filter((t) => t.status === "skipped").length,
  flaky: tests.filter((t) => t.status === "flaky").length,
  duration: (raw.stats?.duration ?? tests.reduce((s, t) => s + t.duration, 0)) / 1000,
};

// Group by suite
const suites = {};
for (const t of tests) {
  const key = t.suite;
  if (!suites[key]) suites[key] = { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0 };
  suites[key].total++;
  if (t.status === "expected") {
    suites[key].passed++;
  } else if (t.status === "unexpected") {
    suites[key].failed++;
  } else if (t.status === "skipped") {
    suites[key].skipped++;
  } else if (t.status === "flaky") {
    suites[key].flaky++;
  } else {
    // Treat any other/unknown status as skipped for suite-level aggregation
    suites[key].skipped++;
  }
}

const timestamp = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

// ── Build HTML ──────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Restful-Booker API Test Dashboard</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --green: #3fb950;
    --red: #f85149;
    --yellow: #d29922;
    --blue: #58a6ff;
    --purple: #bc8cff;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 2rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Header */
  .header { text-align: center; margin-bottom: 2rem; }
  .header h1 { font-size: 1.75rem; margin-bottom: .25rem; }
  .header .meta { color: var(--muted); font-size: .85rem; }

  /* Summary Cards */
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    text-align: center;
  }
  .card .value { font-size: 2rem; font-weight: 700; }
  .card .label { color: var(--muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; }
  .card.passed .value { color: var(--green); }
  .card.failed .value { color: var(--red); }
  .card.skipped .value { color: var(--yellow); }
  .card.flaky .value { color: var(--purple); }
  .card.duration .value { color: var(--blue); }

  /* Pass Rate */
  .pass-rate { text-align: center; margin-bottom: 2rem; }
  .progress-ring { display: inline-block; position: relative; width: 140px; height: 140px; }
  .progress-ring svg { transform: rotate(-90deg); }
  .progress-ring .track { fill: none; stroke: var(--border); stroke-width: 10; }
  .progress-ring .fill { fill: none; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset .6s ease; }
  .progress-ring .pct {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-size: 1.6rem; font-weight: 700;
  }

  /* Section */
  .section { margin-bottom: 2rem; }
  .section h2 { font-size: 1.15rem; margin-bottom: .75rem; border-bottom: 1px solid var(--border); padding-bottom: .35rem; }

  /* Suite bars */
  .suite-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
  .suite-name { width: 130px; font-size: .85rem; text-align: right; flex-shrink: 0; }
  .suite-bar { flex: 1; height: 22px; background: var(--border); border-radius: 4px; overflow: hidden; display: flex; }
  .suite-bar .seg { height: 100%; }
  .suite-bar .seg.p { background: var(--green); }
  .suite-bar .seg.f { background: var(--red); }
  .suite-bar .seg.s { background: var(--yellow); }
  .suite-count { font-size: .8rem; color: var(--muted); width: 50px; flex-shrink: 0; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: .85rem; }
  th { text-align: left; color: var(--muted); font-weight: 600; border-bottom: 2px solid var(--border); padding: .5rem .75rem; }
  td { padding: .5rem .75rem; border-bottom: 1px solid var(--border); }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: .75rem; font-weight: 600;
  }
  .badge.pass { background: rgba(63,185,80,.15); color: var(--green); }
  .badge.fail { background: rgba(248,81,73,.15); color: var(--red); }
  .badge.skip { background: rgba(210,153,34,.15); color: var(--yellow); }
  .badge.flaky { background: rgba(188,140,255,.15); color: var(--purple); }
  tr:hover { background: rgba(88,166,255,.04); }

  /* Footer */
  .footer { text-align: center; color: var(--muted); font-size: .75rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <h1>🏨 Restful-Booker API Test Dashboard</h1>
  <p class="meta">Last run: ${timestamp}</p>
</div>

<!-- Summary Cards -->
<div class="cards">
  <div class="card"><div class="value">${stats.total}</div><div class="label">Total Tests</div></div>
  <div class="card passed"><div class="value">${stats.passed}</div><div class="label">Passed</div></div>
  <div class="card failed"><div class="value">${stats.failed}</div><div class="label">Failed</div></div>
  <div class="card skipped"><div class="value">${stats.skipped}</div><div class="label">Skipped</div></div>
  <div class="card flaky"><div class="value">${stats.flaky}</div><div class="label">Flaky</div></div>
  <div class="card duration"><div class="value">${stats.duration.toFixed(1)}s</div><div class="label">Duration</div></div>
</div>

<!-- Pass Rate Ring -->
${(() => {
  const pct = stats.total ? Math.round((stats.passed / stats.total) * 100) : 0;
  const r = 55;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct === 100 ? "var(--green)" : pct >= 80 ? "var(--yellow)" : "var(--red)";
  return `
<div class="pass-rate">
  <div class="progress-ring">
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle class="track" cx="70" cy="70" r="${r}" />
      <circle class="fill" cx="70" cy="70" r="${r}" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
    </svg>
    <span class="pct">${pct}%</span>
  </div>
  <p class="meta" style="margin-top:.5rem">Pass Rate</p>
</div>`;
})()}

<!-- Suite Breakdown -->
<div class="section">
  <h2>Suite Breakdown</h2>
  ${Object.entries(suites)
    .map(([name, s]) => {
      const pPct = (s.passed / s.total) * 100;
      const fPct = (s.failed / s.total) * 100;
      const sPct = (s.skipped / s.total) * 100;
      return `
  <div class="suite-row">
    <span class="suite-name">${name}</span>
    <div class="suite-bar">
      ${s.passed ? `<div class="seg p" style="width:${pPct}%"></div>` : ""}
      ${s.failed ? `<div class="seg f" style="width:${fPct}%"></div>` : ""}
      ${s.skipped ? `<div class="seg s" style="width:${sPct}%"></div>` : ""}
    </div>
    <span class="suite-count">${s.passed}/${s.total}</span>
  </div>`;
    })
    .join("")}
</div>

<!-- Test Details -->
<div class="section">
  <h2>Test Details</h2>
  <table>
    <thead><tr><th>Suite</th><th>Test</th><th>Status</th><th>Duration</th></tr></thead>
    <tbody>
      ${tests
        .map((t) => {
          const badge =
            t.status === "expected"
              ? '<span class="badge pass">PASS</span>'
              : t.status === "unexpected"
              ? '<span class="badge fail">FAIL</span>'
              : t.status === "flaky"
              ? '<span class="badge flaky">FLAKY</span>'
              : '<span class="badge skip">SKIP</span>';
          return `<tr><td>${t.suite}</td><td>${t.title}</td><td>${badge}</td><td>${(t.duration / 1000).toFixed(2)}s</td></tr>`;
        })
        .join("\n      ")}
    </tbody>
  </table>
</div>

<div class="footer">
  Generated from <a href="https://github.com/kiefertaylorland/restful-booker-api-tests">restful-booker-api-tests</a> ·
  Powered by <a href="https://playwright.dev">Playwright</a>
</div>

</body>
</html>`;

// ── Write output ────────────────────────────────────────────────────────────
try {
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, "index.html");
  fs.writeFileSync(outPath, html);
  console.log(`Dashboard generated → ${outPath}`);
} catch (err) {
  console.error(
    `Error: Failed to generate dashboard in "${outputDir}". ${err && err.message ? err.message : err}`
  );
  process.exit(1);
}
