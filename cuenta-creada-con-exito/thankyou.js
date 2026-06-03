/* Página "¡Gracias!" — réplica fiel del diseño de Claude Design.
   El widget de agenda es la UI del diseño; el booking real ocurre en el
   calendario de Nexus (no se puede iframear → x-frame-options: DENY), así
   que "Agendar sesión" abre el calendario de Nexus en una pestaña nueva. */
const NEXUS_CAL = "https://nexus.getpxsol.com/reuniones/cynthia-maciel-presentacion-pxsol";

/* ───────── CALENDAR ───────── */
const DOW = ["D","L","M","M","J","V","S"];
const calGrid = document.getElementById('cal-grid');
DOW.forEach(d => {
  const el = document.createElement('div');
  el.className = 'cal-dow';
  el.textContent = d;
  calGrid.appendChild(el);
});
for (let d = 1; d <= 31; d++) {
  const el = document.createElement('div');
  el.className = 'cal-day' + (d === 19 ? ' selected' : '');
  el.textContent = d;
  el.dataset.day = d;
  calGrid.appendChild(el);
}
calGrid.addEventListener('click', e => {
  const day = e.target.closest('.cal-day');
  if (!day || day.classList.contains('muted')) return;
  calGrid.querySelectorAll('.cal-day').forEach(x => x.classList.remove('selected'));
  day.classList.add('selected');
});

/* ───────── TIME SLOTS ───────── */
const SLOTS = ["9:00","9:30","10:00","10:30","11:00","11:30","12:00","12:30","15:00","15:30","16:00","16:30"];
const slotsEl = document.getElementById('slots');
SLOTS.forEach(t => {
  const el = document.createElement('div');
  el.className = 'slot';
  el.textContent = t;
  slotsEl.appendChild(el);
});
slotsEl.addEventListener('click', e => {
  const slot = e.target.closest('.slot');
  if (!slot) return;
  slotsEl.querySelectorAll('.slot').forEach(x => x.classList.remove('selected'));
  slot.classList.add('selected');
});

/* ───────── DURATION TOGGLE ───────── */
const durToggle = document.getElementById('dur-toggle');
durToggle.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  durToggle.querySelectorAll('button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
});

/* ───────── AGENDAR → calendario de Nexus ───────── */
document.getElementById('btn-agendar').addEventListener('click', () => {
  window.open(NEXUS_CAL, '_blank', 'noopener');
});

/* ───────── ARTICLES CAROUSEL ───────── */
const ARTICLES = [
  { img:"blog-1.png", date:"marzo 19, 2026", author:"Nicolás Escudero" },
  { img:"blog-1.png", date:"marzo 12, 2026", author:"Nicolás Escudero" },
  { img:"blog-1.png", date:"marzo 05, 2026", author:"Nicolás Escudero" },
];
const track = document.getElementById('art-track');
const dotsEl = document.getElementById('art-dots');
ARTICLES.forEach((a, i) => {
  const card = document.createElement('div');
  card.className = 'art-card';
  card.innerHTML = `
    <div class="art-img" style="background-image:url(assets/${a.img})"></div>
    <div class="art-meta">
      <div class="l"><i data-lucide="calendar" class="lucide"></i> ${a.date}</div>
      <div class="r"><span class="dot"></span> ${a.author}</div>
    </div>`;
  track.appendChild(card);

  const dot = document.createElement('div');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.dataset.idx = i;
  dotsEl.appendChild(dot);
});
let artIdx = 0;
function goArticle(i){
  artIdx = (i + ARTICLES.length) % ARTICLES.length;
  track.style.transform = `translateX(-${artIdx * 404}px)`;
  dotsEl.querySelectorAll('.dot').forEach((d, k) => d.classList.toggle('active', k === artIdx));
}
dotsEl.addEventListener('click', e => {
  const d = e.target.closest('.dot');
  if (d) goArticle(+d.dataset.idx);
});
setInterval(() => goArticle(artIdx + 1), 5000);

/* ───────── ICONS ───────── */
if (window.lucide) lucide.createIcons();
