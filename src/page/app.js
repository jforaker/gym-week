const URL_ = '/api';
const PEOPLE = ['jake', 'dan'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const statusEl = document.getElementById('status');

let values = {}; // "YYYY-MM-DD_jake" -> "yes" | "no"
let dates = [];
let saving = false;

function computeWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

async function load() {
  const r = await fetch(URL_, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(r.status);
  const data = await r.json();
  return (data && data.slots) || {};
}

async function refresh() {
  if (saving) return;
  try {
    values = await load();
    statusEl.textContent = '';
  } catch {
    statusEl.textContent = "Couldn't load — check your connection.";
  }
  render();
}

async function choose(key, choice) {
  saving = true;
  // optimistic update
  if (choice) values[key] = choice;
  else delete values[key];
  render();
  try {
    const r = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: choice }),
    });
    if (!r.ok) throw new Error(r.status);
    values = (await r.json()).slots || {};
    statusEl.textContent = '';
  } catch {
    statusEl.textContent = "Couldn't save — try again.";
  }
  saving = false;
  render();
}

function render() {
  computeWeek();
  const today = iso(new Date());
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  document.getElementById('range').textContent =
    `${fmt(dates[0])} – ${fmt(dates[6])}`;
  const wrap = document.getElementById('days');
  wrap.innerHTML = '';
  dates.forEach((d, i) => {
    const day = iso(d);
    const row = document.createElement('div');
    row.className =
      'day' + (day === today ? ' today' : day < today ? ' past' : '');
    const both = PEOPLE.every((p) => values[`${day}_${p}`] === 'yes');
    row.innerHTML = `<div class="label">${day === today ? '<span class="now">TODAY</span>' : ''}<b>${DAY_NAMES[i]}</b><small>${d.getDate()}</small>${both ? '<div class="car">' + (day < today ? '💪' : '🚗 going') + '</div>' : ''}</div>`;
    PEOPLE.forEach((p) => {
      const key = `${day}_${p}`,
        v = values[key];
      const slot = document.createElement('div');
      slot.className = 'slot';
      ['yes', 'no'].forEach((c) => {
        const b = document.createElement('button');
        b.className = c + (v === c ? ' on' : '');
        b.textContent = c === 'yes' ? 'Yes' : 'No';
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
setInterval(refresh, 15000); // pick up the other person's taps
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});
