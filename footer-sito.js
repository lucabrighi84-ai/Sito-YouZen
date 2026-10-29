// Footer del sito: stesso comportamento del footer della homepage
// (email scritta da script e cerchio che si apre con lo scroll).
(function () {
  var email = document.getElementById('footer-email');
  if (email) email.textContent = 'info' + String.fromCharCode(64) + 'youzen.it';

  var stage = document.getElementById('footerStage');
  if (!stage) return;
  var inner = stage.querySelector('.footer-inner');
  var blob  = stage.querySelector('.footer-blob');
  if (!inner || !blob) return;

  var R_MIN = 180;       // raggio di partenza: il cerchio sta nascosto dietro la card
  var CARD_MIN = 0.85;   // la card parte rimpicciolita
  var rMax = 1000;
  var ticking = false;

  function misura() {
    var r = inner.getBoundingClientRect();
    rMax = Math.hypot(r.width, r.height) / 2 + 18;
    stage.style.setProperty('--yzf-r-max', rMax + 'px');
  }

  function disegna() {
    ticking = false;
    var r = inner.getBoundingClientRect();
    var p = (window.innerHeight - r.top) / r.height;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    stage.style.setProperty('--yzf-r', (R_MIN + (rMax - R_MIN) * p) + 'px');
    stage.style.setProperty('--yzf-card', CARD_MIN + (1 - CARD_MIN) * p);
  }

  function chiedi() {
    if (!ticking) { ticking = true; requestAnimationFrame(disegna); }
  }

  misura();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // ci pensa il CSS
  disegna();
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', function () { misura(); disegna(); }, { passive: true });
})();
