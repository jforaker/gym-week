// Gym Week — Cloudflare Worker. Needs a KV namespace bound as GYM.
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gym Week — Jake & Dan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f6f5f1; --card: #ffffff; --ink: #1b1b1b; --muted: #8a877f; --line: #e7e4dc;
    --yes: #1f9d55; --yes-bg: #e3f5ea; --no: #c2412d; --no-bg: #fbe7e3; --today: #2563eb;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#141414; --card:#1e1e1e; --ink:#f2f2f2; --muted:#8d8d8d; --line:#2c2c2c;
      --yes:#4ade80; --yes-bg:#173322; --no:#f87171; --no-bg:#3a1c1a; --today:#60a5fa; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:Inter,system-ui,sans-serif;
    -webkit-tap-highlight-color: transparent; }
  main { max-width: 520px; margin: 0 auto; padding: 20px 14px 40px; }
  header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px; }
  h1 { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
  .range { color: var(--muted); font-size: 14px; }
  .cols { display:grid; grid-template-columns: 74px 1fr 1fr; gap:8px; padding: 0 10px 6px;
    font-size:20px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
  .cols span:not(:first-child) { text-align:center; }
  .day { display:grid; grid-template-columns: 74px 1fr 1fr; gap:8px; align-items:center;
    background:var(--card); border:1px solid var(--line); border-radius:14px; padding:10px; margin-bottom:8px; }
  .day.today { border:2px solid var(--today); padding:9px; box-shadow:0 0 0 3px color-mix(in srgb, var(--today) 25%, transparent); }
  .label .now { display:block; font-size:10px; font-weight:800; letter-spacing:.08em; color:var(--today); }
  .day.past { opacity:.5; }
  .label b { display:block; font-size:16px; }
  .label small { color:var(--muted); font-size:12px; }
  .label .car { font-size:12px; color:var(--yes); font-weight:600; }
  .slot { display:flex; gap:4px; }
  .slot button { flex:1; border:1px solid var(--line); background:transparent; color:var(--muted);
    border-radius:10px; padding:10px 0; font: 600 14px Inter,system-ui,sans-serif; cursor:pointer; }
  .slot button.yes.on { background:var(--yes-bg); border-color:var(--yes); color:var(--yes); }
  .slot button.no.on { background:var(--no-bg); border-color:var(--no); color:var(--no); }
  .slot button:disabled { cursor:default; }
  .status { text-align:center; color:var(--muted); font-size:13px; margin-top:14px; min-height:18px; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Gym week 🏋️</h1>
    <span class="range" id="range"></span>
  </header>
  <div class="cols"><span></span><span>Jake</span><span>Dan</span></div>
  <div id="days"></div>
  <div class="status" id="status">Loading…</div>
</main>
<script>
const URL_ = "/api";
const PEOPLE = ["jake", "dan"];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const pad = n => String(n).padStart(2, "0");
const iso = d => \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;
const statusEl = document.getElementById("status");

let values = {};   // "YYYY-MM-DD_jake" -> "yes" | "no"
let dates = [];
let saving = false;

function computeWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  dates = Array.from({length:7}, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d; });
}

async function load() {
  const r = await fetch(URL_, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!r.ok) throw new Error(r.status);
  const data = await r.json();
  return (data && data.slots) || {};
}

async function refresh() {
  if (saving) return;
  try { values = await load(); statusEl.textContent = ""; }
  catch { statusEl.textContent = "Couldn't load — check your connection."; }
  render();
}

async function choose(key, choice) {
  saving = true;
  // optimistic update
  if (choice) values[key] = choice; else delete values[key];
  render();
  try {
    const r = await fetch(URL_, { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: choice }) });
    if (!r.ok) throw new Error(r.status);
    values = (await r.json()).slots || {}; statusEl.textContent = "";
  } catch { statusEl.textContent = "Couldn't save — try again."; }
  saving = false; render();
}

function render() {
  computeWeek();
  const today = iso(new Date());
  const fmt = d => d.toLocaleDateString(undefined, {month:"short", day:"numeric"});
  document.getElementById("range").textContent = \`\${fmt(dates[0])} – \${fmt(dates[6])}\`;
  const wrap = document.getElementById("days");
  wrap.innerHTML = "";
  dates.forEach((d, i) => {
    const day = iso(d);
    const row = document.createElement("div");
    row.className = "day" + (day === today ? " today" : day < today ? " past" : "");
    const both = PEOPLE.every(p => values[\`\${day}_\${p}\`] === "yes");
    row.innerHTML = \`<div class="label">\${day === today ? '<span class="now">TODAY</span>' : ''}<b>\${DAY_NAMES[i]}</b><small>\${d.getDate()}</small>\${both ? '<div class="car">' + (day < today ? "💪" : "🚗 going") + '</div>' : ""}</div>\`;
    PEOPLE.forEach(p => {
      const key = \`\${day}_\${p}\`, v = values[key];
      const slot = document.createElement("div");
      slot.className = "slot";
      ["yes","no"].forEach(c => {
        const b = document.createElement("button");
        b.className = c + (v === c ? " on" : "");
        b.textContent = c === "yes" ? "Yes" : "No";
        b.onclick = () => choose(key, v === c ? null : c);
        slot.appendChild(b);
      });
      row.appendChild(slot);
    });
    wrap.appendChild(row);
  });
}

render();
refresh();
setInterval(refresh, 15000);                                   // pick up the other person's taps
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
</script>
</body>
</html>
`;

const KEY_RE = /^\d{4}-\d{2}-\d{2}_(jake|dan)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api") {
      if (request.method === "GET") {
        const slots = (await env.GYM.get("slots", "json")) || {};
        return Response.json({ slots }, { headers: { "Cache-Control": "no-store" } });
      }
      if (request.method === "POST") {
        let body;
        try { body = await request.json(); } catch { return new Response("bad json", { status: 400 }); }
        const { key, value } = body || {};
        if (!KEY_RE.test(key) || ![null, "yes", "no"].includes(value)) return new Response("bad input", { status: 400 });
        const slots = (await env.GYM.get("slots", "json")) || {};
        if (value) slots[key] = value; else delete slots[key];
        await env.GYM.put("slots", JSON.stringify(slots));
        return Response.json({ slots });
      }
      return new Response("method not allowed", { status: 405 });
    }
    return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
