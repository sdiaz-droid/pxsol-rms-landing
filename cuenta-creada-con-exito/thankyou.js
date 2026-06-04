/* Página "¡Gracias!" — réplica fiel del diseño de Claude Design.
   El widget de agenda es el calendario REAL de Nexus embebido (iframe):
   Nexus habilitó frame-ancestors para *.pxsol.com (2026-06-04), así que
   el booking ocurre dentro de la página. El widget simulado del mockup
   (calendario/slots/toggle) fue reemplazado por el iframe. */

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
