/* ───────── UTM PERSIST ─────────
   Los UTMs "persiguen" al usuario por todo el sitio:
   1. Al entrar con utm_* en la URL → se guardan en localStorage (pisan los anteriores).
   2. Al clickear cualquier link a dominios Pxsol → se le agregan los UTMs guardados.
   3. Solo se reemplazan cuando el usuario ingresa con UTMs nuevos.
   Incluir en TODAS las páginas del sitio. */
(function () {
  var KEY = 'pxsol_utms';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  /* 1 — Capturar UTMs frescos de la URL (pisan los guardados) */
  var params = new URLSearchParams(location.search);
  var fresh = {};
  UTM_KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) fresh[k] = v;
  });
  if (Object.keys(fresh).length) {
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (e) {}
  }

  function stored() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  /* 2 — Decorar links en el momento del click (delegación en captura:
     funciona con React y contenido renderizado dinámicamente) */
  function decorate(a) {
    var utms = stored();
    if (!Object.keys(utms).length) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    /* solo dominios propios */
    if (!/(^|\.)pxsol\.com$|(^|\.)getpxsol\.com$/.test(url.hostname)) return;
    /* si el link ya trae sus propios UTMs, se respetan */
    if (url.searchParams.has('utm_source')) return;
    UTM_KEYS.forEach(function (k) {
      if (utms[k]) url.searchParams.set(k, utms[k]);
    });
    a.href = url.href;
  }

  ['click', 'auxclick'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) decorate(a);
    }, true);
  });

  /* 3 — Helper global para leer los UTMs vigentes (URL primero, storage después) */
  window.pxsolUtms = function () {
    var out = {};
    var s = stored();
    UTM_KEYS.forEach(function (k) {
      out[k] = params.get(k) || s[k] || undefined;
    });
    return out;
  };
})();
