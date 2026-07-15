/*
 * YouZen — cookie banner (concept "Glass Bar") + registro consensi.
 * File unico incluso su tutte le pagine con GA4. Niente dipendenze, niente build.
 *
 * Cosa fa:
 *  - mostra il banner se non c'e' ancora una scelta salvata;
 *  - su Accetta/Rifiuta: salva in localStorage, aggiorna Google Consent Mode v2,
 *    e invia un record (non bloccante) alla Edge Function per l'accountability GDPR;
 *  - espone window.yzConsent.open() e auto-aggancia i link [data-yz-manage]
 *    ("Gestisci cookie") per riaprire il banner e cambiare/revocare la scelta.
 *
 * Nota: il segnale di consenso (localStorage 'yz-consent') e' gia' letto in <head>
 * da ogni pagina per ripristinare GA4 al load. Qui usiamo la stessa chiave.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://ysjdjotxinmfeimpfqhq.supabase.co/functions/v1/consent-log";
  var BANNER_VERSION = "v1";
  var KEY = "yz-consent";        // 'granted' | 'denied'
  var ID_KEY = "yz-consent-id";  // pseudonimo random
  var PRIVACY_URL = "/GDPR/";

  function ls(get, k, v) {
    try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); }
    catch (e) { return null; }
  }

  function consentId() {
    var id = ls(true, ID_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "yz-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      ls(false, ID_KEY, id);
    }
    return id;
  }

  function injectStyles() {
    if (document.getElementById("yz-cookie-css")) return;
    var css = ""
      + ".yz-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:640px;margin:0 auto;"
      + "background:rgba(13,21,48,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);"
      + "border:1px solid rgba(249,115,22,.45);border-radius:14px;padding:14px 18px;"
      + "box-shadow:0 20px 50px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:12px;"
      + "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}"
      + ".yz-cookie[hidden]{display:none;}"
      + ".yz-cookie p{margin:0;font-size:13px;color:rgba(255,255,255,.85);line-height:1.5;}"
      + ".yz-cookie a{color:#F97316;text-decoration:underline;}"
      + ".yz-cookie-btns{display:flex;gap:10px;justify-content:flex-end;}"
      + ".yz-cb-rej,.yz-cb-acc{font-size:13px;font-weight:600;padding:10px 20px;border-radius:999px;"
      + "cursor:pointer;border:1px solid transparent;font-family:inherit;}"
      + ".yz-cb-rej{background:transparent;color:rgba(255,255,255,.72);border-color:rgba(255,255,255,.24);}"
      + ".yz-cb-acc{background:#F97316;color:#0a0a0a;}"
      + ".yz-cb-acc:hover{filter:brightness(1.05);}"
      + "@media(min-width:560px){.yz-cookie{flex-direction:row;align-items:center;justify-content:space-between;}"
      + ".yz-cookie-btns{flex-shrink:0;}}";
    var s = document.createElement("style");
    s.id = "yz-cookie-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  var box = null;
  var placeTimer = null;
  var placeRO = null;
  var widgetEl = null;

  function widget() {
    if (widgetEl && document.contains(widgetEl)) return widgetEl;
    widgetEl = document.querySelector('iframe[title="Voice Assistant Widget"]');
    return widgetEl;
  }

  // Tiene il banner cookie sopra il widget assistenza (iframe Autocalls: z-index
  // massimo, cattura i click su tutta la sua area). Lo solleva quanto basta, in
  // modo adattivo (segue collasso bolla / apertura chat a tutto schermo).
  function placeBanner() {
    if (!box || box.hidden) return;
    box.style.bottom = "";            // torna al baseline CSS, poi misura
    var f = widget();
    if (!f) return;
    var fr = f.getBoundingClientRect();
    if (!fr.width || !fr.height) return;
    var br = box.getBoundingClientRect();
    var hOverlap = br.left < fr.right && br.right > fr.left;
    var widgetAtBottom = fr.bottom >= window.innerHeight - 8;
    var vOverlap = fr.top < br.bottom;
    if (hOverlap && widgetAtBottom && vOverlap) {
      var lift = (window.innerHeight - fr.top) + 12;
      lift = Math.min(lift, Math.round(window.innerHeight * 0.6));
      box.style.bottom = lift + "px";
    }
  }

  function startPlacement() {
    placeBanner();
    window.addEventListener("resize", placeBanner);
    if (placeTimer) clearInterval(placeTimer);
    var ticks = 0;
    placeTimer = setInterval(function () {
      placeBanner();
      ticks++;
      var f = widget();
      if (f && typeof ResizeObserver === "function" && !placeRO) {
        placeRO = new ResizeObserver(placeBanner);
        try { placeRO.observe(f); } catch (e) {}
      }
      if ((placeRO || ticks > 40) && placeTimer) { clearInterval(placeTimer); placeTimer = null; }
    }, 300);
  }

  function stopPlacement() {
    if (placeTimer) { clearInterval(placeTimer); placeTimer = null; }
    if (placeRO) { try { placeRO.disconnect(); } catch (e) {} placeRO = null; }
    window.removeEventListener("resize", placeBanner);
    if (box) box.style.bottom = "";
  }

  function build() {
    if (box) return box;
    injectStyles();
    box = document.createElement("div");
    box.id = "yz-cookie";
    box.className = "yz-cookie";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Preferenze cookie");
    box.hidden = true;
    box.innerHTML =
      '<p>Usiamo cookie tecnici e, solo col tuo consenso, cookie di analisi (Google Analytics) '
      + 'per migliorare il sito. <a href="' + PRIVACY_URL + '">Privacy &amp; Cookie</a></p>'
      + '<div class="yz-cookie-btns">'
      + '<button type="button" class="yz-cb-rej">Rifiuta</button>'
      + '<button type="button" class="yz-cb-acc">Accetta</button>'
      + '</div>';
    box.querySelector(".yz-cb-acc").addEventListener("click", function () { choose(true); });
    box.querySelector(".yz-cb-rej").addEventListener("click", function () { choose(false); });
    document.body.appendChild(box);
    return box;
  }

  function updateGtag(granted) {
    if (typeof window.gtag !== "function") return;
    var v = granted ? "granted" : "denied";
    window.gtag("consent", "update", {
      analytics_storage: v,
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v
    });
  }

  function logConsent(granted, action) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consent_id: consentId(),
          analytics: granted,
          action: action,
          banner_version: BANNER_VERSION,
          page_url: location.href.slice(0, 2048),
          lang: (document.documentElement.lang || "it").slice(0, 12)
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* il banner funziona comunque */ }
  }

  function choose(granted) {
    var prev = ls(true, KEY);
    var action;
    if (!prev) action = granted ? "grant" : "deny";
    else if (prev === "granted" && !granted) action = "withdraw";
    else action = "change";

    ls(false, KEY, granted ? "granted" : "denied");
    updateGtag(granted);
    logConsent(granted, action);
    if (box) box.hidden = true;
    document.documentElement.classList.remove("yz-cookie-open");
    stopPlacement();
  }

  // La classe segnala alla pagina che il banner occupa la zona bassa: elementi
  // fissi come la barra telefono si tolgono di mezzo finche' non c'e' una scelta.
  function open() {
    build().hidden = false;
    document.documentElement.classList.add("yz-cookie-open");
    startPlacement();
  }

  function init() {
    // aggancia i link "Gestisci cookie"
    var links = document.querySelectorAll("[data-yz-manage]");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) { e.preventDefault(); open(); });
    }
    // mostra il banner solo se non c'e' ancora una scelta
    var saved = ls(true, KEY);
    if (saved !== "granted" && saved !== "denied") open();
  }

  window.yzConsent = { open: open };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
