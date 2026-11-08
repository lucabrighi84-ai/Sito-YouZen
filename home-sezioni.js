// ===== Onboarding mockup (sec-06): demo parlante, sartoria, giornata senza interruzioni =====
(function () {
  var sez = document.querySelector('.yzo');
  if (!sez) return;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function quandoVisibile(el, fn, soglia) {
    if (calmo || !('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: soglia || 0.35 });
    io.observe(el);
  }

  // ---------- 1. anteprima del gestionale per settore ----------
  var SETT = {
    ristorante: { nome: 'Trattoria da Mario', righe: [['Prenotazioni', '12 tavoli stasera'], ['Comande', '5 in preparazione'], ['Clienti', 'Giulia, tavolo vicino alla finestra'], ['Cassa', 'Tavolo 6 pagato']] },
    salone: { nome: 'Salone Aurora', righe: [['Agenda', '8 appuntamenti oggi'], ['Reception', 'Martina è arrivata'], ['Clienti', 'Formula colore ritrovata'], ['Cassa', 'Taglio e piega pagati']] }
  };
  document.querySelectorAll('[data-yzo-demo]').forEach(function (demo) {
    var callNome = demo.querySelector('[data-yzo-callnome]');
    var box = demo.querySelector('[data-yzo-fumetti]');
    function mostra(sett) {
      var s = SETT[sett];
      callNome.textContent = s.nome;
      box.innerHTML = '';
      s.righe.forEach(function (r, i) {
        var d = document.createElement('div');
        d.className = 'yzo-f yzo-f--noi';
        var k = document.createElement('small');
        k.textContent = r[0];
        var v = document.createElement('span');
        v.textContent = r[1];
        d.appendChild(k); d.appendChild(v);
        box.appendChild(d);
      });
    }
    demo.querySelectorAll('[data-yzo-sett]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        demo.querySelectorAll('[data-yzo-sett]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === btn)); });
        mostra(btn.getAttribute('data-yzo-sett'));
      });
    });
    mostra('ristorante');
  });

  // ---------- 2. sartoria: le scelte cambiano la frase ----------
  var FRASI = {
    'r-si': 'Impostiamo sala, menu e turni del team. Ognuno ritrova le sue informazioni.',
    'r-no': 'Impostiamo sala, menu e orari. Parti con quello che ti serve, senza pensieri.',
    's-si': 'Impostiamo listino, operatori e turni. Ognuno ha la sua agenda.',
    's-no': 'Impostiamo listino, orari e agenda. Parti con quello che ti serve, senza pensieri.'
  };
  document.querySelectorAll('[data-yzo-sarto]').forEach(function (s) {
    var stato = { att: 'r', team: 'si' }, n = 1;
    var frase = s.querySelector('[data-yzo-frase]');
    var rit = s.querySelector('[data-yzo-ritocco]');
    var modello = s.querySelector('.yzo-cartamodello');
    function aggiorna() { frase.textContent = FRASI[stato.att + '-' + stato.team]; }
    s.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
        if (stato[k] === v) return;
        stato[k] = v;
        s.querySelectorAll('[data-k="' + k + '"]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        n++; rit.textContent = 'Ritocco n. ' + n;
        aggiorna();
        modello.classList.remove('is-cuce'); void modello.offsetWidth; modello.classList.add('is-cuce');
      });
    });
    aggiorna();
    quandoVisibile(s, function () { modello.classList.add('is-cuce'); });
  });

  // ---------- 3. la giornata: il telefono suona, tu no ----------
  var CHIAMATE = [0.04, 0.09, 0.15, 0.2, 0.27, 0.33, 0.36, 0.44, 0.5, 0.58, 0.63, 0.7, 0.77, 0.83, 0.88, 0.95];
  var AGENDA = [
    { a: 0.15, t: '10:20', n: 'Rossi', c: 'prenotato' },
    { a: 0.5, t: '13:30', n: 'Ferri', c: 'spostato a giovedì' },
    { a: 0.83, t: '17:15', n: 'Conti', c: 'messaggio per te' }
  ];
  document.querySelectorAll('[data-yzo-giorno]').forEach(function (g) {
    var tel = g.querySelector('[data-yzo-tel]');
    var cursore = g.querySelector('[data-yzo-cursore]');
    var prese = g.querySelector('[data-yzo-prese]');
    var agenda = g.querySelector('[data-yzo-agenda]');
    var punti = CHIAMATE.map(function (x) {
      var p = document.createElement('i');
      p.style.left = (x * 100) + '%';
      tel.appendChild(p);
      return p;
    });
    var raf = null;

    function mostra(f) {
      var n = 0;
      punti.forEach(function (p, i) { var on = CHIAMATE[i] <= f; p.classList.toggle('is-on', on); if (on) n++; });
      prese.textContent = n;
      g.style.setProperty('--f', f);
      AGENDA.forEach(function (v, i) {
        var li = agenda.children[i];
        if (v.a <= f && !li) {
          li = document.createElement('li');
          var tm = document.createElement('b'); tm.textContent = v.t;
          var nm = document.createElement('span'); nm.textContent = v.n;
          var cs = document.createElement('em'); cs.textContent = v.c;
          li.appendChild(tm); li.appendChild(nm); li.appendChild(cs);
          agenda.appendChild(li);
        }
      });
    }
    function gira() {
      cancelAnimationFrame(raf);
      agenda.innerHTML = '';
      if (calmo) { mostra(1); return; }
      var t0 = null, durata = 6500;
      g.classList.add('is-gira');
      raf = requestAnimationFrame(function passo(ts) {
        if (t0 === null) t0 = ts;
        var f = Math.min(1, (ts - t0) / durata);
        mostra(f);
        if (f < 1) raf = requestAnimationFrame(passo); else g.classList.remove('is-gira');
      });
    }
    g.querySelector('[data-yzo-rivedi]').addEventListener('click', gira);
    mostra(0);
    quandoVisibile(g, gira, 0.5);
  });

  // ---------- C: ogni scheda si ferma al centro finché arriva la successiva ----------
  var strati = Array.prototype.slice.call(document.querySelectorAll('.yzo-C-strato'));
  if (strati.length) {
    var inCoda = false;
    var pila = sez.querySelector('.yzo-C-pila');
    function centra() {
      var nav = document.getElementById('site-header');
      var margine = (nav ? nav.offsetHeight : 72) + 16;
      var almenoUno = false;
      strati.forEach(function (s) {
        var altezza = s.offsetHeight;
        var top = (window.innerHeight - altezza) / 2;
        // Una scheda più alta dello spazio disponibile resta nel normale flusso.
        var entra = top >= margine;
        s.classList.toggle('is-centered', entra);
        s.style.setProperty('--yzo-pin-top', Math.max(margine, top) + 'px');
        almenoUno = almenoUno || entra;
      });
      pila.classList.toggle('has-centered-slides', almenoUno);
      arretra();
    }
    function arretra() {
      inCoda = false;
      strati.forEach(function (s, i) {
        var dopo = strati[i + 1];
        if (!dopo || calmo || !s.classList.contains('is-centered')) {
          s.style.setProperty('--copre', '0');
          return;
        }
        var a = s.getBoundingClientRect(), b = dopo.getBoundingClientRect();
        var copre = Math.max(0, Math.min(1, (a.bottom - b.top) / a.height));
        s.style.setProperty('--copre', copre.toFixed(3));
      });
    }
    window.addEventListener('scroll', function () { if (!inCoda) { inCoda = true; requestAnimationFrame(arretra); } }, { passive: true });
    window.addEventListener('resize', centra, { passive: true });
    var misure = new ResizeObserver(centra);
    strati.forEach(function (s) { misure.observe(s); });
    document.fonts.ready.then(centra);
    centra();
  }
})();

// ===== Prima vedi come funziona: esempio di conversazione e modulo solo locale =====
(() => {
  'use strict';
  const stage = document.getElementById('demo-stage');
  if (!stage) return;
  const scenes = [
    { key:'food', app:'ristorante', result:'Tavolo per 2', time:'Ore 20:30 · Trattoria del Borgo', wa:'Ciao Giulia, il tuo tavolo per 2 è confermato per venerdì alle 20:30.', title:'Una prenotazione al ristorante', description:'Dal primo squillo al tavolo in agenda.', greeting:'Buonasera, Trattoria del Borgo. Come posso aiutarla?', request:'Vorrei un tavolo per due venerdì alle 20:30.', answer:'Certo, c’è disponibilità. A quale nome posso prenotare?', name:'A nome Giulia, grazie.', confirmation:'Perfetto, Giulia. Tavolo per due confermato, venerdì alle 20:30.' },
    { key:'beauty', app:'salone', result:'Taglio e piega', time:'Ore 15:00 · Salone Aria', wa:'Ciao Giulia, il tuo appuntamento per taglio e piega è confermato per venerdì alle 15:00.', title:'Un appuntamento in salone', description:'Mentre lavori, la tua agenda si aggiorna.', greeting:'Buongiorno, salone Aria. Come posso aiutarla?', request:'Vorrei prenotare taglio e piega venerdì pomeriggio.', answer:'Volentieri. Alle 15:00 c’è un posto libero. Le va bene?', name:'Sì, grazie. Mi chiamo Giulia.', confirmation:'Perfetto, Giulia. Taglio e piega prenotati, venerdì alle 15:00.' },
    { key:'finance', app:'studio', result:'Prima consulenza', time:'Ore 10:00 · Studio Riva', wa:'Buongiorno Giulia, il suo appuntamento in studio è confermato per venerdì alle 10:00.', title:'Una consulenza in studio', description:'La richiesta giusta, nel momento giusto.', greeting:'Buongiorno, studio Riva. Come posso aiutarla?', request:'Vorrei fissare un incontro per parlare della mia attività.', answer:'Certo. Venerdì alle 10:00 c’è disponibilità per una prima consulenza.', name:'Va bene, sono Giulia. Mi segni pure.', confirmation:'Perfetto, Giulia. La aspettiamo in studio venerdì alle 10:00.' },
    { key:'medico', app:'studio', result:'Appuntamento in studio', time:'Ore 11:00 · Studio medico', wa:'Buongiorno Giulia, il suo appuntamento in studio è confermato per venerdì alle 11:00.', title:'Un appuntamento in ambulatorio', description:'Orari e prenotazioni secondo le regole dello studio.', greeting:'Buongiorno, studio medico. Come posso aiutarla?', request:'Vorrei sapere se c’è un appuntamento venerdì mattina.', answer:'C’è disponibilità alle 11:00. Vuole prenotare?', name:'Sì, grazie. Mi chiamo Giulia.', confirmation:'Perfetto, Giulia. Appuntamento fissato per venerdì alle 11:00.' }
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const play = document.getElementById('demo-play');
  const progress = document.getElementById('demo-progress');
  let active = 0, step = 0, playing = false, timer = null, seen = false;
  function row(role, text) {
    const box = document.createElement('div');
    box.className = 'demo-msg ' + role;
    const who = document.createElement('span');
    who.textContent = role === 'assistant' ? 'YouZen' : 'Cliente';
    const p = document.createElement('p');
    p.textContent = text;
    box.append(who, p);
    stage.append(box);
    stage.scrollTop = stage.scrollHeight;
  }
  function reset() {
    clearTimeout(timer); playing = false; step = 0; stage.replaceChildren();
    const scene = scenes[active];
    document.getElementById('demo-title-scene').textContent = scene.title;
    document.getElementById('demo-sub-scene').textContent = scene.description;
    row('assistant', scene.greeting);
    const hint = document.createElement('p');
    hint.className = 'demo-hint';
    hint.textContent = 'Guarda come la richiesta diventa un appuntamento.';
    stage.append(hint);
    play.textContent = 'Avvia l’esempio';
    progress.textContent = 'Pronto';
  }
  function advance() {
    if (!playing) return;
    stage.querySelector('.demo-hint')?.remove();
    const scene = scenes[active];
    const rows = [['customer', scene.request], ['assistant', scene.answer], ['customer', scene.name], ['assistant', scene.confirmation]];
    row(...rows[step++]);
    progress.textContent = step + ' di 4';
    if (step === 4) { playing = false; play.textContent = 'Riguarda l’esempio'; progress.textContent = 'In agenda'; }
    else timer = setTimeout(advance, reduced ? 0 : 1650);
  }
  function start() { if (playing) return; if (step === 4) reset(); playing = true; play.textContent = 'Pausa'; advance(); }
  play.addEventListener('click', () => {
    if (playing) { clearTimeout(timer); playing = false; play.textContent = 'Riprendi'; progress.textContent = 'In pausa'; return; }
    start();
  });
  document.querySelectorAll('[data-demo-scene]').forEach((button) => button.addEventListener('click', () => {
    active = scenes.findIndex((scene) => scene.key === button.dataset.demoScene);
    document.querySelectorAll('[data-demo-scene]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    reset(); start();
  }));
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !seen) { seen = true; start(); }
  }, { threshold: .3 }).observe(stage);
  reset();

  // Modulo vero: stesso webhook e stesso payload del sito precedente (demo-call.js).
  const form = document.getElementById('demo-call-form');
  const webhook = 'https://automate.autocalls.ai/api/v1/webhooks/vtqYxeo58vqqRFbIc5Auh';
  let pending = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const status = document.getElementById('demo-call-status');
    const say = (text) => { status.hidden = false; status.textContent = text; };
    const [nameEl, emailEl, phoneEl] = form.querySelectorAll('input:not([type=checkbox])');
    const settore = form.querySelector('select').value;
    const national = phoneEl.value.trim().replace(/[\s().-]/g, '').replace(/^(?:\+39|0039)/, '');
    if (!/^\d{6,11}$/.test(national)) { say('Inserisci un numero italiano valido, con o senza il prefisso +39.'); phoneEl.focus(); return; }
    pending = true;
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameEl.value.trim(), email: emailEl.value.trim(), phone: '+39' + national, settore, source: 'youzen-demo-call' }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      say('Richiesta inviata. Tieni il telefono vicino: la chiamata demo è prevista entro 60 secondi.');
      if (typeof gtag === 'function') { try { gtag('event', 'demo_call_request', { settore, source: 'demo-call-form' }); } catch (_) {} }
    } catch (error) {
      button.disabled = false;
      say(error.name === 'AbortError' || error instanceof TypeError
        ? 'Non abbiamo ricevuto conferma dell’invio. Attendi un minuto prima di riprovare: la richiesta potrebbe essere già arrivata. Per assistenza scrivi a info@youzen.it.'
        : 'Il servizio non ha confermato la richiesta. Riprova tra poco oppure scrivi a info@youzen.it.');
    } finally {
      clearTimeout(timer);
      pending = false;
    }
  });
})();

// ===== Settori: due porte, quella scelta si allarga =====
(() => {
  'use strict';
  const doors = [...document.querySelectorAll('[data-door]')];
  function openDoor(door) {
    door.parentElement.querySelectorAll('[data-door]').forEach((other) => {
      const on = other === door;
      other.classList.toggle('is-open', on);
      other.querySelector('.door-hit').setAttribute('aria-expanded', String(on));
    });
  }
  doors.forEach((door) => {
    door.querySelector('.door-hit').addEventListener('click', () => openDoor(door));
    if (matchMedia('(hover:hover) and (min-width:768px)').matches) door.addEventListener('mouseenter', () => openDoor(door));
  });
})();

// ===== FAQ accordion (one-at-a-time, tutto chiuso all'apertura)
document.querySelectorAll('.faq-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // chiudi tutti gli altri
    document.querySelectorAll('.faq-item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
    });
    // toggle quello cliccato
    if (!isOpen) {
      item.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

// ===== Onboarding, seconda versione: tre box a scalare uniti da una linea tratteggiata =====
(() => {
  'use strict';
  const sec = document.getElementById('onboarding');
  const wrap = sec && sec.querySelector('[data-ob-ball]');
  if (!wrap) return;
  const pile = sec.querySelector('.yzo-C-pila');
  const row = wrap.querySelector('[data-ob-row]');
  const svg = row.querySelector('svg');
  const mask = svg.querySelector('mask');
  const masks = [...svg.querySelectorAll('.ob-m')];
  const dashes = [...svg.querySelectorAll('.ob-d')];
  const boxes = [...wrap.querySelectorAll('.ob-box')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DRAW = 900;
  let timers = [], runs = [], played = false, inView = false;

  function trace() {
    const base = row.getBoundingClientRect();
    if (!base.width) return;
    mask.setAttribute('x', -20); mask.setAttribute('y', -20);
    mask.setAttribute('width', base.width + 40); mask.setAttribute('height', base.height + 40);
    const stacked = matchMedia('(max-width: 900px)').matches;
    const r = boxes.map((b) => {
      const q = b.getBoundingClientRect();
      return { l: q.left - base.left, t: q.top - base.top, w: q.width, h: q.height };
    });
    [0, 1].forEach((i) => {
      const a = r[i], b = r[i + 1];
      let d;
      if (stacked) {
        const x1 = a.l + a.w / 2, y1 = a.t + a.h, x2 = b.l + b.w / 2, y2 = b.t, m = (y1 + y2) / 2;
        d = `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
      } else {
        const x1 = a.l + a.w / 2, y1 = a.t + a.h, x2 = b.l, y2 = b.t + b.h / 2;
        d = `M${x1} ${y1} Q${x1} ${y2} ${x2} ${y2}`;
      }
      dashes[i].setAttribute('d', d);
      masks[i].setAttribute('d', d);
    });
  }

  function hide() {
    masks.forEach((m) => {
      const len = m.getTotalLength();
      m.style.strokeDasharray = `${len}`;
      m.style.strokeDashoffset = `${len}`;
    });
  }

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    runs.forEach((a) => a.cancel()); runs = [];
    wrap.classList.remove('is-in', 'is-done');
    boxes.forEach((b) => b.classList.remove('is-lit'));
    trace();
    hide();
  }

  function draw(i) {
    const len = masks[i].getTotalLength();
    runs.push(masks[i].animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: DRAW, easing: 'ease-in-out', fill: 'forwards' }));
  }

  function play() {
    reset();
    if (calm) {
      wrap.classList.add('is-in', 'is-done');
      boxes.forEach((b) => b.classList.add('is-lit'));
      masks.forEach((m) => { m.style.strokeDashoffset = '0'; });
      return;
    }
    played = true;
    timers.push(setTimeout(() => {
      wrap.classList.add('is-in');
      timers.push(setTimeout(() => {
        trace();
        boxes[0].classList.add('is-lit');
        draw(0);
        timers.push(setTimeout(() => { boxes[1].classList.add('is-lit'); draw(1); }, DRAW));
        timers.push(setTimeout(() => { boxes[2].classList.add('is-lit'); wrap.classList.add('is-done'); }, DRAW * 2));
      }, 800));
    }, 2000));
  }

  function version(name) {
    const line = name === 'linea';
    wrap.hidden = !line;
    pile.hidden = line;
    sec.classList.toggle('is-slide', name === 'slide');
    window.dispatchEvent(new Event('ob-mode'));
    sec.querySelectorAll('[data-ob-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.obV === name)));
    played = false;
    reset();
    if (line && inView) play();
  }

  new IntersectionObserver((e) => {
    inView = e[0].isIntersecting;
    if (inView && !wrap.hidden && !played) play();
  }, { threshold: .15 }).observe(wrap);

  sec.querySelectorAll('[data-ob-v]').forEach((b) => b.addEventListener('click', () => version(b.dataset.obV)));
  wrap.querySelector('[data-ob-again]').addEventListener('click', play);
  addEventListener('resize', () => {
    if (wrap.hidden) return;
    trace();
    if (wrap.classList.contains('is-done')) { runs.forEach((a) => a.cancel()); runs = []; masks.forEach((m) => { const l = m.getTotalLength(); m.style.strokeDasharray = `${l}`; m.style.strokeDashoffset = '0'; }); }
  }, { passive: true });
  const askedMode = new URLSearchParams(location.search).get('onboarding');
  if (askedMode === 'linea' || askedMode === 'pila') version(askedMode);
})();

// ===== Onboarding: le schede scorrono di lato mentre la pagina scende =====
(() => {
  'use strict';
  const sec = document.getElementById('onboarding');
  const track = sec && sec.querySelector('.yzo-C-pila');
  if (!track) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const outer = document.createElement('div');
  outer.className = 'ob-slide-outer';
  const stick = document.createElement('div');
  stick.className = 'ob-slide-stick';
  const dots = document.createElement('div');
  dots.className = 'ob-slide-dots';
  dots.setAttribute('aria-hidden', 'true');
  track.parentNode.insertBefore(outer, track);
  outer.appendChild(stick);
  stick.appendChild(track);
  stick.appendChild(dots);
  const cards = [...track.querySelectorAll('.yzo-C-strato')];
  cards.forEach(() => dots.appendChild(document.createElement('i')));
  let dist = 0, on = false, ticking = false;

  function measure() {
    on = sec.classList.contains('is-slide') && !calm && !track.hidden;
    sec.classList.toggle('is-slide-on', on);
    track.style.transform = '';
    if (!on) { outer.style.height = ''; return; }
    const tallest = Math.max(...cards.map((c) => c.offsetHeight));
    if (tallest > innerHeight - 110) { on = false; sec.classList.remove('is-slide-on'); outer.style.height = ''; return; }
    const cs = getComputedStyle(stick);
    const inner = stick.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    dist = Math.max(0, track.scrollWidth - inner);
    outer.style.height = `${innerHeight + dist}px`;
    move();
  }
  function move() {
    ticking = false;
    if (!on) return;
    const room = outer.offsetHeight - innerHeight;
    const p = room > 0 ? Math.min(1, Math.max(0, -outer.getBoundingClientRect().top / room)) : 0;
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    const idx = Math.round(p * (cards.length - 1));
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i === idx));
  }
  addEventListener('scroll', () => { if (on && !ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  track.addEventListener('scroll', () => {
    if (on) return;
    const w = cards[0].offsetWidth + 14;
    const idx = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / w)));
    [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i === idx));
  }, { passive: true });
  if (dots.children[0]) dots.children[0].classList.add('is-on');
  addEventListener('resize', measure, { passive: true });
  addEventListener('ob-mode', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener('load', measure);
  measure();
})();
