(() => {
  'use strict';
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const euro = (n) => '€' + n.toLocaleString('it-IT', { useGrouping: 'always', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  const steps = [300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000];
  const fiscalButton = q('[data-fiscal]');
  const state = { sector: 'r', plan: 'all', fiscal: false, voice: 'notte', pack: '100', billing: 3, crmBilling: 3, custom: 500, extras: new Set() };
  // Stessa tariffa di youzen.it; lo sconto annuale vale sui minuti.
  const tariffa = (min) => (min >= 4000 ? 0.20 : min >= 1500 || state.billing === 12 ? 0.25 : 0.30);
  const prezzoMinuti = (min) => Math.round(min * tariffa(min) * 100) / 100;

  function setupVoce(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = (type) => parts.find((p) => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}` <= '2026-12-31' ? 500 : 1000;
  }

  function prezzoFiscale() {
    return Number(state.plan === 'all' && state.crmBilling === 12
      ? fiscalButton.dataset.annual : fiscalButton.dataset.price);
  }

  function conto() {
    const plan = q(`[data-plan="${state.plan}"]`);
    const voice = state.voice ? q(`[data-voice="${state.voice}"]`) : null;
    const pack = state.pack ? q(`[data-pack="${state.pack}"]`) : null;
    const planPrice = plan ? Number(state.crmBilling === 12 ? plan.dataset.annual : plan.dataset.price) : 0;
    const fiscalPrice = plan && state.fiscal ? prezzoFiscale() : 0;
    const minutes = voice ? (state.voice === 'misura' ? state.custom : Number(voice.dataset.min)) : 0;
    const voicePrice = voice ? prezzoMinuti(minutes) : 0;
    const packPrice = pack ? Number(pack.dataset.price) : 0;
    // La voce parte senza setup solo con il gestionale in formula annuale.
    const setup = voice && !(plan && state.crmBilling === 12) ? setupVoce() : 0;
    const extras = voice ? [...state.extras].map((k) => q(`[data-extra="${k}"]`)).map((b) => ({ name: b.dataset.name, price: Number(b.dataset.price) })) : [];
    const extrasPrice = extras.reduce((sum, e) => sum + e.price, 0);
    return {
      sector: state.sector === 'r' ? 'Ristoranti' : 'Saloni',
      plan: plan ? plan.dataset.name : '',
      planPrice,
      fiscalPrice,
      voice: voice ? voice.dataset.name : '',
      minutes,
      bundle: Boolean(voice && plan && state.crmBilling === 12),
      voicePrice,
      pack: pack ? Number(pack.dataset.pack) : 0,
      packPrice,
      setup,
      extras,
      month: Math.round(((state.crmBilling === 12 ? 0 : planPrice + fiscalPrice) + (state.billing === 12 ? 0 : voicePrice) + extrasPrice) * 100) / 100,
      year: Math.round(((state.crmBilling === 12 ? planPrice + fiscalPrice : 0) + (state.billing === 12 ? voicePrice : 0)) * 12 * 100) / 100,
      once: setup + packPrice,
    };
  }

  function righe(c) {
    const out = [];
    if (c.plan) out.push(state.crmBilling === 12 ? `Gestionale ${c.plan}, annuale: ${euro(c.planPrice * 12)}/anno` : `Gestionale ${c.plan}, trimestrale: ${euro(c.planPrice)}/mese`);
    if (c.fiscalPrice) {
      const billing = state.crmBilling === 12 ? 'all’anno' : 'a trimestre';
      out.push(`Modulo fiscale per partita IVA: ${euro(c.fiscalPrice * state.crmBilling)} ${billing} (pari a ${euro(c.fiscalPrice)}/mese)`);
    }
    if (c.voice) out.push(`Voce ${c.voice}, ${c.minutes.toLocaleString('it-IT', { useGrouping: 'always' })} minuti${state.billing === 12 ? `, annuale: ${euro(c.voicePrice * 12)}/anno` : `: ${euro(c.voicePrice)}/mese`}`);
    if (c.voice) out.push(c.bundle ? 'Attivazione voce: gratis con il gestionale annuale' : `Attivazione voce: ${euro(c.setup)} una tantum`);
    c.extras.forEach((e) => out.push(`${e.name}: ${euro(e.price)}/mese`));
    if (c.pack) out.push(`${c.pack.toLocaleString('it-IT', { useGrouping: 'always' })} messaggi: ${euro(c.packPrice)} una tantum`);
    return out;
  }

  function render() {
    const c = conto();
    qa('[data-crm-bill]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.crmBill) === state.crmBilling)));
    qa('[data-period]').forEach((e) => {
      const price = Number(e.dataset.period);
      const year = Number(e.dataset.annual);
      const box = e.previousElementSibling;
      const annual = state.crmBilling === 12;
      box.querySelector('b').textContent = euro(annual ? year * 12 : price);
      box.querySelector('span').textContent = annual ? '/anno' : '/mese';
      const was = box.querySelector('.pr-was');
      was.hidden = !(annual && year < price);
      was.textContent = euro(price * 12);
      e.textContent = annual ? `pari a ${euro(year)} al mese` : `${euro(price * 3)} ogni 3 mesi`;
    });
    qa('[data-plan]').forEach((b) => {
      const on = b.dataset.plan === state.plan;
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? `${b.dataset.name} scelto` : `Scegli ${b.dataset.name}`;
    });
    if (fiscalButton) {
      fiscalButton.disabled = !state.plan;
      fiscalButton.setAttribute('aria-pressed', String(Boolean(c.fiscalPrice)));
      const fiscalRate = prezzoFiscale();
      const fiscalBilling = state.crmBilling === 12 ? 'l’anno' : 'a trimestre';
      q('[data-fiscal-billing]').textContent = `${euro(fiscalRate * state.crmBilling)} ${fiscalBilling}, pari a ${euro(fiscalRate)}/mese + IVA per partita IVA.`;
    }
    qa('[data-card]').forEach((card) => card.classList.toggle('is-on', card.dataset.card === state.plan));
    qa('[data-voice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.voice === state.voice)));
    qa('[data-pack]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pack === state.pack)));
    qa('[data-sector]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sector === state.sector)));
    qa('[data-table]').forEach((t) => { t.hidden = t.dataset.table !== state.sector; });
    qa('[data-r]').forEach((e) => { e.textContent = e.dataset[state.sector]; });
    qa('[data-extra]').forEach((b) => {
      b.disabled = !state.voice;
      b.setAttribute('aria-pressed', String(Boolean(state.voice) && state.extras.has(b.dataset.extra)));
    });
    q('[data-setup-label]').textContent = euro(setupVoce());
    qa('[data-bill]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.bill) === state.billing)));
    const annualVoice = state.billing === 12;
    const voiceShown = (min) => euro(Math.round(prezzoMinuti(min) * (annualVoice ? 12 : 1) * 100) / 100);
    qa('[data-vp]').forEach((e) => { e.textContent = voiceShown(Number(e.dataset.vp)); });
    q('[data-vc]').textContent = voiceShown(state.custom);
    qa('.pr-opts i').forEach((e) => { e.textContent = annualVoice ? '/anno' : '/mese'; });
    q('[data-vcm]').textContent = `${state.custom.toLocaleString('it-IT', { useGrouping: 'always' })} minuti, scegli tu quanti`;
    q('[data-range-out]').textContent = state.custom.toLocaleString('it-IT', { useGrouping: 'always' });
    q('[data-range-box]').hidden = state.voice !== 'misura';
    const mesi = annualVoice ? 12 : 1;
    const risparmio = c.minutes ? Math.round((c.minutes * 0.30 - c.voicePrice) * mesi * 100) / 100 : 0;
    q('[data-save]').textContent = risparmio ? `Risparmi ${euro(risparmio)} ${annualVoice ? 'all’anno' : 'al mese'} rispetto a €0,30/min.` : 'Con l’annuale i minuti passano da €0,30 a €0,25.';
    const quota = c.minutes ? Math.round(tariffa(c.minutes) * 100) : 0;
    qa('[data-tier]').forEach((e) => e.classList.toggle('is-on', Number(e.dataset.tier) === quota));
    qa('[data-was]').forEach((e) => {
      const min = e.dataset.was === 'custom' ? state.custom : Number(e.dataset.was);
      e.hidden = tariffa(min) >= 0.30;
      e.textContent = euro(Math.round(min * 0.30 * mesi * 100) / 100);
    });
    qa('[data-rate]').forEach((e) => {
      const min = e.dataset.rate === 'custom' ? state.custom : Number(e.dataset.rate);
      const r = tariffa(min);
      const label = `€${r.toFixed(2).replace('.', ',')}/min`;
      if (r < 0.30) e.innerHTML = `<s>€0,30</s> ${label}`;
      else e.textContent = label;
    });
    q('[data-month]').textContent = euro(c.month);
    q('[data-once]').textContent = euro(c.once);
    q('[data-year]').textContent = euro(c.year);
    q('[data-year-box]').hidden = !c.year;
    q('[data-month-box]').hidden = !c.month && Boolean(c.year);
    q('[data-lines]').textContent = righe(c).join(' · ') || 'Scegli un piano, i minuti o i messaggi.';
    q('[data-call]').disabled = !c.month && !c.year && !c.once;
  }

  qa('[data-sector]').forEach((b) => b.addEventListener('click', () => { state.sector = b.dataset.sector; render(); }));
  qa('[data-plan]').forEach((b) => b.addEventListener('click', () => {
    state.plan = state.plan === b.dataset.plan ? null : b.dataset.plan;
    if (!state.plan) state.fiscal = false;
    render();
  }));
  fiscalButton?.addEventListener('click', () => {
    if (!state.plan) return;
    state.fiscal = !state.fiscal;
    render();
  });
  qa('[data-voice]').forEach((b) => b.addEventListener('click', () => { state.voice = state.voice === b.dataset.voice ? null : b.dataset.voice; render(); }));
  qa('[data-extra]').forEach((b) => b.addEventListener('click', () => {
    if (state.extras.has(b.dataset.extra)) state.extras.delete(b.dataset.extra); else state.extras.add(b.dataset.extra);
    render();
  }));
  function layout(n) {
    q('.pr-board').dataset.layout = n;
    qa('[data-layout-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layoutPick === n)));
  }
  qa('[data-layout-pick]').forEach((b) => b.addEventListener('click', () => {
    layout(b.dataset.layoutPick);
    history.replaceState(null, '', `?mockup=${b.dataset.layoutPick}`);
  }));
  const asked = new URLSearchParams(location.search).get('mockup');
  if (/^[1-5]$/.test(asked || '')) layout(asked);
  qa('[data-bill]').forEach((b) => b.addEventListener('click', () => { state.billing = Number(b.dataset.bill); render(); }));
  qa('[data-crm-bill]').forEach((b) => b.addEventListener('click', () => { state.crmBilling = Number(b.dataset.crmBill); render(); }));
  q('[data-range]').addEventListener('input', (event) => { state.custom = steps[Number(event.target.value)]; render(); });
  qa('[data-pack]').forEach((b) => b.addEventListener('click', () => { state.pack = state.pack === b.dataset.pack ? null : b.dataset.pack; render(); }));

  qa('.pr-plus').forEach((b) => b.addEventListener('click', () => {
    const desc = b.closest('th').querySelector('.pr-desc');
    desc.hidden = !desc.hidden;
    b.setAttribute('aria-expanded', String(!desc.hidden));
  }));

  const dialog = q('#pr-call');
  const form = q('#pr-call-form');
  function step(name) {
    qa('[data-step]').forEach((s) => { s.hidden = s.dataset.step !== name; });
  }
  q('[data-call]').addEventListener('click', () => {
    const c = conto();
    q('[data-recap]').innerHTML = `<strong>${[c.month ? `Al mese ${euro(c.month)}` : '', c.year ? `All’anno ${euro(c.year)}` : '', `Una tantum ${euro(c.once)}`].filter(Boolean).join(' · ')}</strong><br>${righe(c).join('<br>')}`;
    step('form');
    dialog.showModal();
  });
  q('[data-call-close]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const c = conto();
    const nome = form.elements.nome.value.trim();
    const telefono = form.elements.telefono.value.trim();
    // Nessun servizio di invio sul sito statico: la richiesta parte da WhatsApp, già scritta.
    const testo = [
      'Ciao, vorrei essere richiamato.',
      `Nome: ${nome}`,
      `Telefono: ${telefono}`,
      `Settore: ${c.sector}`,
      '',
      ...righe(c),
      ...(c.month ? [`Totale al mese: ${euro(c.month)}`] : []),
      ...(c.year ? [`Totale all’anno: ${euro(c.year)}`] : []),
      `Totale una tantum: ${euro(c.once)}`,
    ].join('\n');
    const wa = `https://wa.me/393883681715?text=${encodeURIComponent(testo)}`;
    q('[data-wa]').href = wa;
    window.open(wa, '_blank', 'noopener');
    step('done');
    form.reset();
  });

  render();
})();
