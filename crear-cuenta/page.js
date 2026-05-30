/* ───────── PRODUCT CARDS ───────── */
const PRODUCTS = [
  // Columna 1
  [
    { t:"Motor de reservas", s:"+ Reservas directas", img:"card-motor.jpg", icon:"calendar-search", c:"#CDA7CB", d:"Nuestro motor de reservas está diseñado para incrementar tus reservas directas hasta en un 20 %, eliminando costos innecesarios en comisiones y reduciendo la dependencia de las OTA." },
    { t:"PMS", s:"+ Property Management System", img:"card-pms.png", icon:"building-2", c:"#2A6FDB", d:"El PMS de Pxsol es la solución todo en uno para administrar tu hotel de manera eficiente." },
    { t:"App Conversaciones (WhatsApp, etc.)", s:"+ Conversaciones", img:"card-app.png", icon:"message-circle", c:"#4AB253", d:"Aplica Inteligencia Artificial a la comunicación en el hotel. Integra todos tus canales de chat: Sitio web, WhatsApp, Instagram, Google y más, en una sola aplicación." },
    { t:"Gestor de reputación online", s:"Gestiona tus reseñas", img:"card-gro.png", icon:"message-square-text", c:"#F1C200", d:"El Módulo de Reputación Online es una herramienta integral que te permite gestionar, analizar y mejorar las opiniones de tus huéspedes a través de diversas plataformas." },
  ],
  // Columna 2
  [
    { t:"Channel Manager", s:"+ Sin Overbooking", img:"card-channel.png", icon:"layout-grid", c:"#2A6FDB", d:"Sincroniza tus tarifas, conéctalas a mas de 500 OTAs y Tour operadores, aumenta tus reservas sin sufrir overbooking." },
    { t:"Página web", s:"+ Property Management System", img:"card-web.png", icon:"monitor", c:"#2ECC71", d:"Convierte tu página web en una herramienta que trabaja para tu hotel. Diseños modernos, optimización móvil y estrategias de SEO te ayudarán a atraer más huéspedes, destacar frente a la competencia y maximizar tus ingresos desde el primer clic." },
    { t:"B2B / Integración con agencias", s:"+ Distribución", img:"card-b2b.png", icon:"handshake", c:"#FDAD3E", d:"Es una plataforma gratuita que conecta tu hotel directamente con una amplia red de agencias de viajes, tour operadores, y otros 500 socios de distribución." },
    { t:"POS Punto de venta", s:"Software hoteles", img:"card-pos.png", icon:"map-pin", c:"#AE0FC7", d:"Facilita la gestión de todos tus puntos de venta con un sistema POS diseñado específicamente para el sector hotelero." },
  ],
  // Columna 3
  [
    { t:"CRM & Email Marketing", s:"+ Plataforma de Comunicación", img:"card-crm.png", icon:"user-cog", c:"#2A6FDB", d:"Con la plataforma de Interacción con Huéspedes de Pxsol, tu hotel puede construir relaciones más sólidas, humanas y rentables." },
    { t:"Publicidad en Google", s:"+ Visibilidad", img:"card-ads.png", icon:"megaphone", c:"#D20A11", d:"Muestra tu hotel en los primeros puestos de Google, en Display y Hotel Ads para aumentar tus ventas pagando únicamente por reserva efectiva." },
    { t:"Integración con ChatGPT", s:"+ Distribución", img:"card-b2b.png", icon:"bot", c:"#C6A6FA", d:"Transforma el sitio web de tu hotel en un motor de conversión activo las 24 horas con el Widget. Este chatbot inteligente se integra en tu página para interactuar con los visitantes, responder al instante sus consultas sobre disponibilidad, servicios, precios y políticas, guiándolos hacia la reserva directo." },
    { t:"GDS Sist. de Distribución Global", s:"+ Distribución", img:"card-gds.png", icon:"workflow", c:"#2A6FDB", d:"Este sistema te permite conectar tu hotel con más de 600,000 agencias de viajes en todo el mundo, asegurando que tu propiedad sea vista por agencias y empresas que buscan hacer reservas." },
  ],
];

const productsEl = document.getElementById('products');
PRODUCTS.forEach(col => {
  const colEl = document.createElement('div');
  colEl.className = 'prod-col';
  col.forEach(p => {
    const card = document.createElement('div');
    card.className = 'prod-card';
    card.style.backgroundImage = `url(assets/${p.img})`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    card.innerHTML = `
      <div class="chip"><i data-lucide="${p.icon}" class="lucide" style="color:${p.c}"></i></div>
      <p class="title">${p.t}</p>
      <p class="sub">${p.s}</p>`;
    card.addEventListener('click', () => openProduct(p));
    colEl.appendChild(card);
  });
  productsEl.appendChild(colEl);
});

/* ───────── PRODUCT MODAL ───────── */
const modal = document.createElement('div');
modal.className = 'prod-modal';
modal.innerHTML = `
  <div class="prod-modal__box" role="dialog" aria-modal="true">
    <button class="prod-modal__close" aria-label="Cerrar"><i data-lucide="x" class="lucide"></i></button>
    <div class="prod-modal__media"></div>
    <div class="prod-modal__body">
      <div class="prod-modal__chip"></div>
      <p class="prod-modal__sub"></p>
      <h3 class="prod-modal__title"></h3>
      <p class="prod-modal__desc"></p>
      <button class="btn-submit prod-modal__cta" style="margin-top:24px;">Probar ahora</button>
    </div>
  </div>`;
document.body.appendChild(modal);

const mMedia = modal.querySelector('.prod-modal__media');
const mChip  = modal.querySelector('.prod-modal__chip');
const mSub   = modal.querySelector('.prod-modal__sub');
const mTitle = modal.querySelector('.prod-modal__title');
const mDesc  = modal.querySelector('.prod-modal__desc');

function openProduct(p){
  mMedia.style.backgroundImage = `linear-gradient(rgba(0,0,23,.35),rgba(0,0,23,.55)), url(assets/${p.img})`;
  mChip.innerHTML = `<i data-lucide="${p.icon}" class="lucide" style="color:${p.c}"></i>`;
  mSub.textContent = p.s;
  mTitle.textContent = p.t;
  mDesc.textContent = p.d;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}
function closeProduct(){
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('.prod-modal__close')) closeProduct();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProduct(); });

/* ───────── FAQ ───────── */
const FAQ = [
  { q:"¿Quiénes pueden usar esta aplicación?", a:"Pxsol está diseñado para hoteles, hostels, cabañas, aparts y todo tipo de alojamiento turístico que quiera centralizar su gestión, vender más y comunicarse mejor con sus huéspedes." },
  { q:"¿Qué ocurre cuando finaliza la prueba gratuita?", a:"¡Claro! Sabemos que las necesidades de tu hotel pueden variar con el tiempo. Para que cuentes con las herramientas necesarias en cada etapa, podrás cambiar de plan cuando lo solicites." },
  { q:"Si necesito ayuda para configurar mi hotel, ¿qué puedo hacer?", a:"Para ayudarte a seleccionar el mejor plan de acuerdo a tus necesidades, necesitamos conocer los desafíos que encuentras en tu hotel y los objetivos que persigues a corto y largo plazo. Así podremos indicarte cuál es el plan adecuado para tu propiedad. Ponte en contacto con nuestro equipo de ventas. Habla con ventas aquí." },
  { q:"¿Debo elegir un plan para comenzar mi prueba gratuita?", a:"Tu descuento de bienvenida estará disponible durante tu primer año de contrato." },
  { q:"Aún tengo dudas sobre Pxsol...", a:"Tu descuento de bienvenida estará disponible durante tu primer año de contrato." },
];

const faqList = document.getElementById('faq-list');
FAQ.forEach((f, i) => {
  const item = document.createElement('div');
  item.className = 'faq-item' + (i === 0 ? ' open' : '');
  item.innerHTML = `
    <button class="faq-q" type="button">
      <span>${f.q}</span>
      <i data-lucide="chevron-down" class="lucide"></i>
    </button>
    <div class="faq-a"><p>${f.a}</p></div>`;
  faqList.appendChild(item);
});
faqList.addEventListener('click', e => {
  const q = e.target.closest('.faq-q');
  if (!q) return;
  const item = q.parentElement;
  const ans = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  faqList.querySelectorAll('.faq-item').forEach(it => {
    it.classList.remove('open');
    it.querySelector('.faq-a').style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add('open');
    ans.style.maxHeight = ans.scrollHeight + 'px';
  }
});

/* ───────── FOOTER LINK COLUMNS ───────── */
const F_PRODUCTOS = ["Motor de reservas","Channel Manager","CRM & Email Marketing","PMS","Página web","Pxsol ADS","Gestor de Reputación Online","App Conversaciones","Pxsol B2B","Sistema de Distribución Global","POS Punto de venta","ERP Control de Costos","Chatbot con IA","Huésped + Guest App"];
const F_RECURSOS = ["Hotel Summit 2024","Programa de referidos","Clientes","Blog Hotelero","Eventos y Capacitaciones Gratuitas para Hoteles","Pxsol Universidades","Demos grabadas","Developers (API)","E-books y guías","Iniciativa Plantar un Árbol","Capacitaciones para Asociaciones Hoteleras","¿Cómo aumentar tu ocupación?","Spotlight | Actualizaciones de Sistema"];
const F_EQUIPO = ["Contáctanos","¿Quiénes somos?","Trabaja en Pxsol"];
const F_EMPRESA = ["Términos y condiciones del servicio","Políticas de privacidad"];

function fillCol(id, items){
  const el = document.getElementById(id);
  items.forEach(t => { const a=document.createElement('a'); a.href='#'; a.textContent=t; el.appendChild(a); });
}
fillCol('f-productos', F_PRODUCTOS);
fillCol('f-recursos', F_RECURSOS);

const equipoCol = document.getElementById('f-equipo');
function fillGroup(parent, title, items){
  const g = document.createElement('div'); g.className='group';
  const h = document.createElement('h4'); h.textContent = title; g.appendChild(h);
  items.forEach(t => { const a=document.createElement('a'); a.href='#'; a.textContent=t; g.appendChild(a); });
  parent.appendChild(g);
}
fillGroup(equipoCol, 'Equipo', F_EQUIPO);
fillGroup(equipoCol, 'Empresa', F_EMPRESA);

/* ───────── FORM ───────── */
/* El formulario es un iframe embebido de Nexus (backend real). No requiere JS. */

/* ───────── COUNTDOWN (FOMO perpetuo) ─────────
   Arranca siempre en 3 días, 10 h, 11 min en cada carga y baja segundo a
   segundo. Al llegar a cero se reinicia solo, así nunca "termina". */
const OFFSET_MS = ((3 * 24 + 10) * 60 + 11) * 60 * 1000; // 3d 10h 11m
let target = Date.now() + OFFSET_MS;
const pad = n => String(n).padStart(2, '0');
function tick(){
  let diff = target - Date.now();
  if (diff <= 0){ target = Date.now() + OFFSET_MS; diff = OFFSET_MS; }
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  document.getElementById('cd-d').textContent = d;
  document.getElementById('cd-h').textContent = pad(h);
  document.getElementById('cd-m').textContent = pad(m);
  document.getElementById('cd-s').textContent = pad(s);
}
tick();
setInterval(tick, 1000);

/* ───────── ICONS ───────── */
if (window.lucide) lucide.createIcons();
