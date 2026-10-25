(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const put = (id, value) => { $(id).textContent = value; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [
    { key:'food', app:'ristorante', result:'Tavolo per 2', time:'Ore 20:30 · Trattoria del Borgo', wa:'Ciao Giulia, il tuo tavolo per 2 è confermato per venerdì alle 20:30.', title:'Una prenotazione al ristorante', description:'Dal primo squillo al tavolo in agenda.', greeting:'Buonasera, Trattoria del Borgo. Come posso aiutarla?', request:'Vorrei un tavolo per due venerdì alle 20:30.', answer:'Certo, c’è disponibilità. A quale nome posso prenotare?', name:'A nome Giulia, grazie.', confirmation:'Perfetto, Giulia. Tavolo per due confermato, venerdì alle 20:30.' },
    { key:'beauty', app:'salone', result:'Taglio e piega', time:'Ore 15:00 · Salone Aria', wa:'Ciao Giulia, il tuo appuntamento per taglio e piega è confermato per venerdì alle 15:00.', title:'Un appuntamento in salone', description:'Mentre lavori, la tua agenda si aggiorna.', greeting:'Buongiorno, salone Aria. Come posso aiutarla?', request:'Vorrei prenotare taglio e piega venerdì pomeriggio.', answer:'Volentieri. Alle 15:00 c’è un posto libero. Le va bene?', name:'Sì, grazie. Mi chiamo Giulia.', confirmation:'Perfetto, Giulia. Taglio e piega prenotati, venerdì alle 15:00.' },
    { key:'finance', app:'studio', result:'Prima consulenza', time:'Ore 10:00 · Studio Riva', wa:'Buongiorno Giulia, il suo appuntamento in studio è confermato per venerdì alle 10:00.', title:'Una consulenza in studio', description:'La richiesta giusta, nel momento giusto.', greeting:'Buongiorno, studio Riva. Come posso aiutarla?', request:'Vorrei fissare un incontro per parlare della mia attività.', answer:'Certo. Venerdì alle 10:00 c’è disponibilità per una prima consulenza.', name:'Va bene, sono Giulia. Mi segni pure.', confirmation:'Perfetto, Giulia. La aspettiamo in studio venerdì alle 10:00.' },
    { key:'medico', app:'studio', result:'Appuntamento in studio', time:'Ore 11:00 · Studio medico', wa:'Buongiorno Giulia, il suo appuntamento in studio è confermato per venerdì alle 11:00.', title:'Un appuntamento in ambulatorio', description:'Orari e prenotazioni secondo le regole dello studio.', greeting:'Buongiorno, studio medico. Come posso aiutarla?', request:'Vorrei sapere se c’è un appuntamento venerdì mattina.', answer:'C’è disponibilità alle 11:00. Vuole prenotare?', name:'Sì, grazie. Mi chiamo Giulia.', confirmation:'Perfetto, Giulia. Appuntamento fissato per venerdì alle 11:00.' }
  ];
  const hero = $('hero');
  let activeExample = 0, step = 0, playing = false, timer = null;
  let exampleVisible = false, manuallyPaused = false;
  const stage = $('conversation-stage'), play = $('example-play');
  function message(role, content) {
    const row = document.createElement('div'); row.className = 'message '+role;
    const label = document.createElement('span'); label.textContent = role === 'assistant' ? 'YouZen' : 'Cliente';
    const p = document.createElement('p'); p.textContent = content; row.append(label,p); stage.append(row);
    stage.scrollTo({top:stage.scrollHeight,behavior:reduced.matches?'instant':'smooth'});
  }
  function playLabel(value) { play.querySelector('span').textContent = value; }
  function resetExample() {
    clearTimeout(timer); playing = false; step = 0; stage.replaceChildren();
    message('assistant',scenes[activeExample].greeting);
    const rest = document.createElement('div'); rest.className = 'example-rest';
    const p = document.createElement('p'); p.textContent = 'Guarda come la richiesta diventa un appuntamento.'; rest.append(p); stage.append(rest);
    stage.scrollTop = 0; playLabel('Avvia l’esempio'); put('example-progress','Pronto');
  }
  function pause() { if (!playing) return; clearTimeout(timer); playing = false; playLabel('Riprendi'); put('example-progress','In pausa'); }
  function advance() {
    if (!playing) return;
    stage.querySelector('.example-rest')?.remove();
    const data = scenes[activeExample];
    const rows = [['customer',data.request],['assistant',data.answer],['customer',data.name],['assistant',data.confirmation]];
    message(...rows[step++]); put('example-progress',`${step} di 4`);
    if (step === 4) { playing = false; playLabel('Riguarda l’esempio'); put('example-progress','In agenda'); }
    else timer = setTimeout(advance,reduced.matches?0:1650);
  }
  function startExample() {
    if (playing || step===4 || document.hidden) return;
    playing=true; playLabel('Pausa'); advance();
  }
  function autoStartExample() {
    if (exampleVisible && !manuallyPaused) startExample();
  }
  play.addEventListener('click',() => {
    if (playing) { manuallyPaused=true; pause(); return; }
    manuallyPaused=false;
    if (step===4) resetExample();
    startExample();
  });
  document.addEventListener('visibilitychange',() => { if (document.hidden) pause(); else autoStartExample(); });
  new IntersectionObserver(entries => {
    exampleVisible=entries[0].isIntersecting && entries[0].intersectionRatio>=.1;
    if (exampleVisible) autoStartExample(); else pause();
  },{threshold:.1}).observe($('esempio'));
  function formCopy() { $('demoCallForm').dispatchEvent(new CustomEvent('yp:sectorchange')); }
  function chooseExample(index,updateForm=true,updateHero=false) {
    activeExample=index; const scene=scenes[index];
    put('example-title',scene.title); put('example-description',scene.description);
    all('[data-yp-sector]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.ypSector===scene.key)));
    if (updateForm) $('dc-settore').value=scene.key;
    formCopy(); resetExample(); manuallyPaused=false; autoStartExample();
    if (updateHero) hero.dispatchEvent(new CustomEvent('yp:choose-sector',{detail:{index}}));
  }
  hero.addEventListener('yp:scenechange',event => {
    const {index,manual}=event.detail, scene=scenes[index];
    put('yp-hero-result',scene.result); put('yp-hero-time',scene.time); put('yp-hero-wa',scene.wa);
    if (manual) chooseExample(index);
  });
  all('[data-yp-sector]').forEach(button => button.addEventListener('click',() => chooseExample(scenes.findIndex(x=>x.key===button.dataset.ypSector),true,true)));
  $('dc-settore').addEventListener('change',() => {
    const value=$('dc-settore').value;
    const index=scenes.findIndex(x=>x.key===value);
    chooseExample(index<0?2:index,false,true);
  });
  $('demoCallForm').addEventListener('input',event => { event.target.removeAttribute('aria-invalid'); event.target.removeAttribute('aria-describedby'); });
  formCopy();

  const catalog=window.YouZenGestionCatalog;
  let appSector='ristorante', appView='agenda';
  const names={ristorante:['Trattoria del Borgo','TB'],salone:['Salone Aria','SA'],studio:['Studio Riva','SR']};
  function appTab(key,focus=false) {
    const info=catalog.find(item=>item.key===key); if (!info) return;
    appView=key;
    all('[data-yp-tab]').forEach(button=>{ const active=button.dataset.ypTab===key; button.setAttribute('aria-selected',String(active)); button.tabIndex=active?0:-1; });
    all('[data-yp-panel]').forEach(panel=>{ panel.hidden=panel.dataset.ypPanel!==key; });
    put('yp-app-title',key==='agenda'?'La tua agenda':info.label);
    put('yp-app-description',info.description);
    $('yp-week').hidden=key!=='agenda';
    if (focus) $('yp-tab-'+key).focus();
  }
  function appSectorChange(value) {
    appSector=value;
    document.querySelector('.yp-app-window').dataset.ypActiveSector=value;
    put('yp-app-business',names[value][0]); put('yp-app-avatar',names[value][1]);
    all('[data-yp-app-sector]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ypAppSector===value)));
    all('.yp-app-window .yzg-s[data-s]').forEach(panel=>{ panel.hidden=panel.dataset.s!==value; });
    all('[data-yp-tab]').forEach(button=>{ button.hidden=!!button.dataset.ypOnly&&button.dataset.ypOnly!==value; });
    if ($('yp-tab-'+appView).hidden) appTab('agenda');
  }
  all('[data-yp-app-sector]').forEach(button=>button.addEventListener('click',()=>appSectorChange(button.dataset.ypAppSector)));
  all('[data-yp-tab]').forEach(button=> {
    button.addEventListener('click',()=>appTab(button.dataset.ypTab));
    button.addEventListener('keydown',event=>{
      if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const visible=all('[data-yp-tab]').filter(tab=>!tab.hidden&&(!tab.closest('details')||tab.closest('details').open));
      let next=visible.indexOf(button);
      if(event.key==='Home')next=0;
      else if(event.key==='End')next=visible.length-1;
      else next=(next+(['ArrowDown','ArrowRight'].includes(event.key)?1:-1)+visible.length)%visible.length;
      appTab(visible[next].dataset.ypTab,true);
    });
  });
  // The additional functions are local illustrations, including these two controls.
  all('[data-yzg-salva]').forEach(button=>button.addEventListener('click',()=>{
    const root=button.closest('.yzg-s')||button.closest('.yzg-pannello');
    const status=root.querySelector('[data-yzg-salvato]');
    status.textContent='Modifica simulata. Nessun orario reale è stato aggiornato.';status.classList.add('is-on');status.setAttribute('role','status');
  }));
  all('[data-yzg-pronto]').forEach(button=>button.addEventListener('click',()=>{
    const ready=button.getAttribute('aria-pressed')==='true';
    button.setAttribute('aria-pressed',String(!ready));button.textContent=ready?'Pronto':'Pronto ✓ · annulla';button.closest('.yzg-ticket').classList.toggle('is-ready',!ready);
  }));
  appSectorChange('ristorante'); appTab('agenda');
})();

(function (root) {
  'use strict';
  const steps = Object.freeze([0, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000]);
  const round = n => Math.round(n * 100) / 100;
  function calculate({ minutes, billing = 3, centralino = false, dm = false, date = new Date() }) {
    if (!steps.includes(minutes) || ![3, 12].includes(billing)) throw new RangeError('Pacchetto non valido');
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    const localDate = `${part('year')}-${part('month')}-${part('day')}`;
    const setup = localDate <= '2026-12-31' ? 500 : 1000;
    const discount = billing === 12 ? 0.9 : 1;
    const rate = minutes >= 1500 ? 0.25 : 0.30;
    const base = round(minutes * rate * discount);
    const dmCost = dm ? round(5 * discount) : 0;
    const monthly = round(base + dmCost + (centralino ? 25 : 0));
    const period = round(monthly * billing);
    return { selected: minutes > 0, minutes, billing, base, rate, extra: 0.35, dmCost, monthly, period, setup, first: round(period + setup) };
  }
  const api = Object.freeze({ steps, calculate });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.YouZenPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

(() => {
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll('#prezzi ' + selector)];
  const text = (id, value) => { $(id).textContent = value; };
  const { calculate, steps } = YouZenPricing;
  let minutes = 0, billing = 3, selectedPlan = null;
  const count = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rateLabel = n => '€' + n.toFixed(3).replace(/0$/, '').replace('.', ',') + '/min';
  const euro = value => { const [units, cents] = value.toFixed(2).split('.'); return '€' + count(units) + (cents === '00' ? '' : ',' + cents); };
  function updatePricing() {
    const result = calculate({ minutes, billing, centralino: $('centralino').checked, dm: $('dm').checked });
    $('price-empty').hidden = result.selected; $('price-values').hidden = !result.selected;
    text('price-300', euro(calculate({ minutes: 300, billing }).base));
    text('price-1500', euro(calculate({ minutes: 1500, billing }).base));
    all('[data-plan]').forEach(card => {
      const custom = card.dataset.plan === 'custom';
      const chosen = custom && selectedPlan === 'custom' && minutes > 0;
      const amount = custom ? (chosen ? minutes : 0) : Number(card.dataset.plan);
      const volume = amount >= 1500;
      const factor = billing === 12 ? .9 : 1;
      card.querySelector('[data-plan-rate]').textContent = custom && !chosen
        ? rateLabel(.30 * factor) + ' · da 1.500: ' + rateLabel(.25 * factor)
        : rateLabel((volume ? .25 : .30) * factor);
      card.querySelector('[data-plan-was]').hidden = !volume;
      card.querySelector('[data-plan-was]').textContent = rateLabel(.30 * factor);
      card.querySelector('[data-plan-saving]').hidden = !volume;
      if (custom) {
        text('price-custom', chosen ? euro(calculate({minutes, billing}).base) : 'Su misura');
        text('custom-price-caption', chosen ? '/mese di base' : 'Scegli i minuti');
        card.querySelector('[data-plan-minutes]').textContent = chosen ? count(minutes) + ' minuti al mese' : 'Scegli i tuoi minuti';
      }
    });
    text('dm-price', euro(billing === 12 ? 4.5 : 5) + '/mese');
    text('minutes-output', minutes ? count(minutes) + ' minuti' : 'Scegli i minuti');
    $('minutes-range').setAttribute('aria-valuetext', minutes ? `${minutes} minuti al mese` : 'Nessun pacchetto selezionato');
    text('monthly-total', euro(result.monthly));
    text('minutes-summary', `${count(minutes)} minuti inclusi ogni mese`);
    text('setup-total', euro(result.setup));
    const extras = [];
    if ($('centralino').checked) extras.push(`Centralino AI: ${euro(25)}/mese`);
    if ($('dm').checked) extras.push(`DM: ${euro(result.dmCost)}/mese`);
    text('options-summary', extras.length ? 'Optional inclusi nel totale. ' + extras.join(' · ') : 'Nessun optional selezionato');
    text('setup-note', result.setup === 500 ? 'Attivazione a €500 anziché €1.000 fino al 31 dicembre 2026. Numero VoIP, agente, calendario e WhatsApp.' : 'Attivazione una tantum: €1.000. Numero VoIP, agente, calendario e WhatsApp.');
  }
  all('[data-plan]').forEach(button => button.addEventListener('click', () => {
    all('[data-plan]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    selectedPlan = button.dataset.plan;
    const custom = selectedPlan === 'custom';
    $('custom-minutes').hidden = !custom;
    if (!custom) minutes = Number(button.dataset.plan);
    $('minutes-range').value = String(steps.indexOf(minutes));
    updatePricing(); if (custom) $('minutes-range').focus();
  }));
  $('minutes-range').addEventListener('input', event => { minutes = steps[Number(event.target.value)]; updatePricing(); });
  all('[data-billing]').forEach(button => button.addEventListener('click', () => {
    billing = Number(button.dataset.billing);
    all('[data-billing]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    updatePricing();
  }));
  ['centralino', 'dm'].forEach(id => $(id).addEventListener('change', updatePricing));
  all('[data-extra-help]').forEach(button => button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    $(button.getAttribute('aria-controls')).hidden = expanded;
  }));
  updatePricing();

})();
