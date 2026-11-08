// ===== I tre problemi: accende il LED sulla scheda in cima alla pila,
// e insieme il trattino corrispondente nell'indice fisso a destra. Stesso
// segnale (quale scheda e' "attiva"), due posti dove si vede.
(function () {
  var schede = Array.prototype.slice.call(document.querySelectorAll('.pb-fascia, .pb-pannello'));
  if (schede.length < 2) return;
  var indice = document.querySelector('.pb-indice');
  var voci = indice ? Array.prototype.slice.call(indice.querySelectorAll('.pb-indice-voce')) : [];
  var pila = document.querySelector('.pb-fasce');
  var ticking = false, ultima = -1;

  function disegna() {
    ticking = false;
    // La scheda "attiva" e quella incollata con l'indice piu alto: essendo
    // l'ultima arrivata, e quella che sta sopra e copre tutte le altre.
    var attiva = 0;
    for (var i = 0; i < schede.length; i++) {
      var quota = parseFloat(window.getComputedStyle(schede[i]).top) || 0;
      if (schede[i].getBoundingClientRect().top <= quota + 2) attiva = i;
    }
    if (attiva === ultima) return;
    if (ultima >= 0) schede[ultima].classList.remove('attiva');
    schede[attiva].classList.add('attiva');
    if (voci[ultima]) voci[ultima].classList.remove('attiva');
    if (voci[attiva]) voci[attiva].classList.add('attiva');
    ultima = attiva;
  }
  function chiedi() { if (!ticking) { ticking = true; requestAnimationFrame(disegna); } }

  disegna();
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi, { passive: true });

  // L'indice si vede solo mentre la pila e' in pagina, non ovunque si scorra.
  if (indice && pila && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (voci2) {
      indice.classList.toggle('visibile', voci2[0].isIntersecting);
    }, { threshold: 0 }).observe(pila);
  }
})();

// ===== I tre problemi: ogni scheda con classe pb-fascia--film mette insieme il
// problema e la sua soluzione, e l'immagine (o la scrivania) cambia mentre si
// scorre. La clip e' ridotta a 61 fotogrammi (12 al secondo) e il film e' un
// flipbook: due <img> sovrapposti, uno col fotogramma corrente e uno col
// successivo con un'opacita' pari alla frazione fra i due, cosi' scorre morbido
// anche a 12 al secondo. Il testo cambia con la stessa posizione, cosi' parola e
// immagine non si separano mai. Con "meno animazioni" non c'e' film: si passa da
// una foto all'altra a meta' corsa.
//
// Perche' non un canvas: la prima versione disegnava i fotogrammi su un canvas
// (con e senza ImageBitmap) e faceva crashare Chrome 154 sul PC di Luca ("Uffa!",
// STATUS_ACCESS_VIOLATION: lettura di un puntatore nullo nella cache di decodifica
// delle immagini, chiamata dal thread principale, cioe' dal percorso del canvas),
// in modo ripetibile in circa quindici secondi di scroll avanti e indietro. Con gli
// <img> in pagina si usa il percorso normale di ogni sito. Non reintrodurre il canvas.
//
// Cosa cambia da una scheda all'altra sta negli attributi della scheda:
//   data-film    percorso dei fotogrammi, senza numero ne' estensione
//   data-film-n  quanti sono
//   data-film-t  tre tempi del testo, da 0 a 1 lungo la corsa: quando il problema
//                comincia a uscire, quando entra la soluzione, quando entrano i box
// e dalla sentinella pb-film-ancora messa subito prima della scheda.
(function () {
  var schede = document.querySelectorAll('.pb-fascia--film');
  if (!schede.length) return;
  var stretto = window.matchMedia('(max-width:980px)');
  var FERMO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__pbFilm = window.__pbFilm || {};

  function limita(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function liscia(x) { x = limita(x); return x * x * (3 - 2 * x); }

  // Due sonde invisibili che misurano 100vh e 100svh in pixel: vh e' l'unita' del CSS
  // (la corsa e i distanziatori), svh e' l'altezza dello schermo con la barra degli
  // indirizzi aperta, stabile, e serve a dimensionare le schede sul telefono.
  function sonda(unita) {
    var d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:100' + unita + ';visibility:hidden;pointer-events:none';
    document.body.appendChild(d);
    return d;
  }
  var sondaVh = sonda('vh'), sondaSvh = sonda('svh');
  function vhPx() { return (sondaVh.offsetHeight || window.innerHeight) / 100; }

  Array.prototype.forEach.call(schede, function (scheda) {
    var ancora = scheda.previousElementSibling;
    if (!ancora || !ancora.classList.contains('pb-film-ancora')) return;
    var foto = scheda.querySelector('.pb-foto');
    var fine = scheda.querySelector('.pb-foto-fine');
    var faseP = scheda.querySelector('.pb-fase--problema');
    var faseS = scheda.querySelector('.pb-fase--soluzione');
    var dato = scheda.querySelector('.pb-film-dato');
    var box = Array.prototype.slice.call(scheda.querySelectorAll('.pb-fase--soluzione .pb-box'));
    if (!foto || !faseP || !faseS) return;

    var PERCORSO = scheda.getAttribute('data-film') || '';
    var N = parseInt(scheda.getAttribute('data-film-n'), 10) || 61;
    var ESTENSIONE = '.webp';
    var T = (scheda.getAttribute('data-film-t') || '0.30,0.56,0.66').split(',').map(parseFloat);
    scheda.classList.add('pb-film-on');
    scheda.parentNode.classList.add('pb-film-attiva');

    // legge una misura in vh dal CSS (--film-corsa: 100vh) e la da' in pixel. Con la
    // stessa unita' del CSS (vh), non con innerHeight: sul telefono la barra degli
    // indirizzi cambia innerHeight mentre si scorre e corsa e distanziatori non
    // combacerebbero piu'.
    function vhDa(nome) {
      var v = parseFloat(window.getComputedStyle(scheda).getPropertyValue(nome));
      return (isNaN(v) ? 0 : v) * vhPx();
    }

    // Da 0 a 1. Da 981px la scheda e' incollata: conta quanto ha corso da quando
    // si e' incollata, e la sentinella (un distanziatore, subito prima) e' l'unico
    // punto che non si muove con lei: la scheda comincia dove finisce lei. Sotto, la
    // scheda scorre normale e conta la sua posizione: parte quando entra dal basso,
    // arriva quando e' a un decimo dallo schermo.
    function progresso() {
      var corsa = vhDa('--film-corsa');
      if (corsa <= 0) return 0;
      var tetto = parseFloat(window.getComputedStyle(scheda).top) || 0;
      return limita((tetto - ancora.getBoundingClientRect().bottom) / corsa);
    }

    if (FERMO) {
      scheda.classList.add('pb-film-fermo');
      scheda.parentNode.classList.add('pb-film-fermo');
      if (fine && fine.getAttribute('data-src')) fine.src = fine.getAttribute('data-src');
      var fermo = function () { scheda.classList.toggle('pb-film-sol', progresso() >= 0.5); };
      window.addEventListener('scroll', fermo, { passive: true });
      window.addEventListener('resize', fermo, { passive: true });
      fermo();
      return;
    }

    // I due livelli del flipbook, sopra la foto di partenza e sotto il testo.
    function livello() {
      var im = new Image();
      im.className = 'pb-frame';
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      // Decodifica sincrona: il browser non disegna lo schermo finche' il fotogramma nuovo
      // non e' pronto. Con 'async' (e su Safari anche con 'auto', per immagini grandi) lo
      // disegna prima, il livello resta vuoto per un istante e sotto compare la foto di
      // partenza: i "frame che appaiono" su telefono e tablet.
      im.decoding = 'sync';
      im.style.opacity = '0';
      im.style.transition = 'none';
      foto.appendChild(im);
      return im;
    }
    var elA = livello(), elB = livello();
    var indA = -1, indB = -1;                    // quale fotogramma mostra ciascuno
    var imm = new Array(N), richiesti = new Array(N);
    var caricati = 0, testa = 0, inVolo = 0, partito = false, mostrato = false;
    var MAX_VOLO = 6;
    var ultimo = '';
    var pc = 0, rAF = 0;     // pc: posizione del film, smorzata, da 0 a 1

    function nome(i) { var n = String(i + 1); while (n.length < 4) n = '0' + n; return PERCORSO + n + ESTENSIONE; }
    function pronta(i) { var im = imm[i]; return !!(im && im.complete && im.naturalWidth > 0); }

    // I due fotogrammi gia' caricati che stanno attorno alla posizione (uno prima, uno dopo).
    // A rete lenta mancano dei fotogrammi: invece di tenere fermo uno lontano e farlo
    // scattare quando arriva quello giusto, si sfuma fra i due piu' vicini che ci sono.
    function attorno(pos) {
      var a = Math.floor(pos), lo = -1, hi = -1, d;
      for (d = a; d >= 0; d--) if (pronta(d)) { lo = d; break; }
      for (d = a + 1; d < N; d++) if (pronta(d)) { hi = d; break; }
      return [lo, hi];
    }
    function metti(el, ind) {
      el.src = nome(ind);
      return ind;
    }
    function disegna(pos) {
      if (pos >= N - 1) pos = N - 1;
      var lh = attorno(pos), ia = lh[0], ib = lh[1], t = 0;
      if (ia < 0) { ia = ib; ib = -1; }                    // niente prima di noi: solo quello dopo
      if (ia < 0) return;                                  // niente di caricato
      if (ib >= 0) {
        t = (pos - ia) / (ib - ia);                        // con tutti i fotogrammi caricati e' la parte frazionaria
        if (t <= 0.06) { ib = -1; t = 0; }
      }
      var chiave = ia + ':' + ib + ':' + Math.round(t * 50);
      if (chiave === ultimo) return;
      ultimo = chiave;
      // Se uno dei due livelli mostra gia' il fotogramma che serve all'altro posto, si
      // scambiano i ruoli invece di ricaricare tutti e due (avanti e indietro).
      if ((indB === ia && indA !== ia) || (ib >= 0 && indA === ib && indB !== ib)) {
        var x = elA; elA = elB; elB = x; var y = indA; indA = indB; indB = y;
      }
      if (indA !== ia) indA = metti(elA, ia);
      if (ib >= 0 && indB !== ib) indB = metti(elB, ib);
      elA.style.zIndex = '1'; elB.style.zIndex = '2';
      // Il livello di sotto e' sempre opaco, anche dopo uno scambio di ruoli: se restasse con
      // l'opacita' parziale che aveva da livello di sopra, la foto di partenza (il telefono
      // bruciato, le notifiche) trasparirebbe sotto il fotogramma giusto.
      elB.style.opacity = ib >= 0 ? t.toFixed(3) : '0';
      if (!mostrato) {
        mostrato = true;
        elA.style.transition = 'opacity .4s ease';      // la prima volta entra sfumando sulla foto di partenza
        elA.style.opacity = '1';
        window.setTimeout(function () { elA.style.transition = 'none'; elB.style.transition = 'none'; }, 500);
        scheda.classList.add('pb-film-pronto');
      } else {
        elA.style.opacity = '1';
      }
    }

    // Il testo segue la stessa posizione del film. Il problema se ne va prima che
    // arrivi la soluzione, cosi' non si sovrappongono mai, e in mezzo resta solo
    // l'immagine che cambia. I box della soluzione entrano uno dopo l'altro.
    function testo(p) {
      var a = 1 - liscia((p - T[0]) / 0.12);
      var b = liscia((p - T[1]) / 0.12);
      faseP.style.opacity = a.toFixed(3);
      faseP.style.transform = 'translateY(' + (-(1 - a) * 14).toFixed(1) + 'px)';
      faseS.style.opacity = b.toFixed(3);
      faseS.style.transform = 'translateY(' + ((1 - b) * 14).toFixed(1) + 'px)';
      if (dato) dato.style.opacity = liscia((p - T[2]) / 0.10).toFixed(3);
      for (var i = 0; i < box.length; i++) {
        var k = liscia((p - (T[2] + i * 0.055)) / 0.08);
        box[i].style.opacity = k.toFixed(3);
        box[i].style.transform = 'translateY(' + ((1 - k) * 12).toFixed(1) + 'px)';
      }
    }

    // Caricamento a concorrenza limitata e solo quando la scheda e' vicina: e' sotto
    // la piega e non deve rubare banda all'hero. Prima un fotogramma ogni dieci, poi ogni
    // cinque, ogni due, poi tutti: su una rete lenta, anche se si scorre di corsa, c'e'
    // sempre un fotogramma non lontano da quello giusto. Dentro ogni giro si parte dai
    // piu' vicini al punto in cui sta il film (all'inizio, il primo), cosi' se si arriva a
    // meta' scheda per un'ancora o un ricaricamento non si aspetta che passino gli altri.
    // Gli oggetti Image restano in mano a questa funzione: tengono i fotogrammi nella
    // cache del browser, cosi' cambiare src sui due livelli e' quasi istantaneo.
    var GIRI = [10, 5, 2, 1];
    function scegli() {
      for (var g = 0; g < GIRI.length; g++) {
        for (var d = 0; d < N; d++) {
          var su = testa + d, giu = testa - d;
          if (su < N && su % GIRI[g] === 0 && !richiesti[su]) return su;
          if (giu >= 0 && giu % GIRI[g] === 0 && !richiesti[giu]) return giu;
        }
      }
      return -1;
    }
    function pompa() {
      var i;
      while (inVolo < MAX_VOLO && (i = scegli()) >= 0) {
        richiesti[i] = true;
        inVolo++;
        (function (i) {
          var im = new Image();
          im.onload = im.onerror = function () {
            im.onload = im.onerror = null;
            inVolo--; caricati++;
            ultimo = '';
            chiedi();
            pompa();
          };
          im.src = nome(i);
          imm[i] = im;
        })(i);
      }
    }

    function tick() {
      rAF = 0;
      var vh = window.innerHeight;
      var r = { top: ancora.getBoundingClientRect().bottom };
      var oltre = vhDa('--film-corsa') + vhDa('--film-sosta') + vh;
      if (r.top > vh * 2.4 || r.top < -oltre) return;                // lontana, davanti o dietro: niente da fare
      if (!partito && document.readyState === 'complete') { partito = true; pompa(); }
      var p = progresso();
      pc += (p - pc) * 0.2;
      if (Math.abs(p - pc) < 0.0008) pc = p;
      testo(pc);
      var pos = limita((pc - 0.04) / 0.92) * (N - 1);
      testa = Math.round(pos);
      disegna(pos);
      if (pc !== p) chiedi();
    }
    function chiedi() { if (!rAF) rAF = window.requestAnimationFrame(tick); }

    window.addEventListener('scroll', chiedi, { passive: true });
    window.addEventListener('resize', chiedi, { passive: true });
    window.addEventListener('load', chiedi);
    pc = progresso();
    chiedi();
    // solo per le verifiche da riga di comando
    window.__pbFilm[scheda.id || 'film'] = { N: N, caricati: function () { return caricati; }, p: function () { return pc; },
      stato: function () { return { pc: +pc.toFixed(3), testa: testa, indA: indA, indB: indB, ultimo: ultimo }; } };
  });

  // Sul telefono la scheda incollata deve stare nello schermo: sotto l'intestazione, con
  // immagine e testo insieme. Il testo piu' lungo (le due fasi stanno nella stessa cella) fissa
  // quanto resta all'immagine; l'altezza e' la stessa per tutte, cosi' le schede si coprono
  // del tutto. Si rimisura al cambio di dimensione e quando i caratteri sono arrivati.
  function adatta() {
    var pila = schede[0].parentNode;
    if (!stretto.matches) { pila.style.removeProperty('--film-h'); pila.style.removeProperty('--film-img'); return; }
    var vh = sondaSvh.offsetHeight || window.innerHeight;
    var libero = vh - 84 - 14;                        // sotto l'intestazione fissa e un respiro in fondo
    var testoMax = 0;
    Array.prototype.forEach.call(schede, function (c) {
      var t = c.querySelector('.pb-film-testi');
      if (t) testoMax = Math.max(testoMax, t.offsetHeight);
    });
    var larg = schede[0].clientWidth - 36;           // meno il padding laterale
    var img = Math.max(140, Math.min(libero - 52 - testoMax, larg, 480));
    var h = Math.min(libero, Math.ceil(52 + img + testoMax));
    pila.style.setProperty('--film-img', Math.floor(img) + 'px');
    pila.style.setProperty('--film-h', h + 'px');
  }
  adatta();
  window.addEventListener('resize', adatta, { passive: true });
  window.addEventListener('orientationchange', adatta);
  window.addEventListener('load', adatta);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(adatta);
  window.__pbAdatta = adatta;
})();
