(() => {
  'use strict';
  const layouts = [['mosaic','01 · Mosaico editoriale'],['pastel','02 · Pastello'],['photo','03 · Foto immersiva'],['studio','04 · Studio prodotto'],['list','05 · Righe editoriali']];
  const requested = new URL(location.href).searchParams.get('layout');
  let layout = layouts.some(item => item[0] === requested) ? requested : document.body.dataset.layout || 'mosaic';
  const sector = document.body.dataset.sector || 'ristoranti';
  const focusDetails = sector === 'saloni' ? {
    accoglienza: [['Prenotazioni web','92% 50%'],['Prenotazione trattamenti','92% 50%'],['Agenda professionisti','50% 50%'],['Listino e team','28% 62%']],
    servizio: [['Stato della visita','94% 45%'],['Scheda tecnica cliente','52% 58%'],['Pagamento e documenti','50% 42%']],
    continuita: [['Prossimo appuntamento','30% 48%'],['Magazzino prodotti','93% 65%']],
    marketing: [['Fidelity card','50% 50%'],['Promozioni','50% 50%'],['Statistiche','50% 50%']]
  } : {
    accoglienza: [['Prenotazioni web e Google','92% 50%'],['Pianta sala','55% 55%'],['Ordini da asporto','55% 58%'],['Menu e varianti','35% 40%']],
    servizio: [['Comanda mobile','32% 60%'],['Stati di preparazione','85% 53%'],['Team e turni','40% 25%']],
    chiusura: [['Conto del tavolo','30% 72%'],['Pagamento e scontrino','95% 55%'],['Documenti commerciali','85% 27%']],
    finanza: [['Incassi e costi','30% 55%'],['Food Cost','94% 30%'],['Scorte e ingredienti','95% 88%'],['Fidelity card','50% 50%'],['Promozioni','50% 50%'],['Statistiche','50% 50%']]
  };
  const groups = [...document.querySelectorAll('[data-phase]')].map((section,sectionIndex) => {
    const grid = section.querySelector('.feature-grid');
    const photo = section.querySelector('.restaurant-photo');
    const staff = section.querySelector('.personnel-box');
    const heading = section.querySelector('.group-heading');
    const headingHome = document.createComment('Original department heading position');
    heading.before(headingHome);
    const caption = photo.querySelector('figcaption');
    const originalCaption = [...caption.childNodes];
    const photoHome = document.createComment('Original photo position');
    photo.before(photoHome);
    let staffHome;
    if (staff) { staffHome = document.createComment('Original personnel position'); staff.before(staffHome); }
    const rail = document.createElement('div'); rail.className = 'immersive-rail'; grid.before(rail);
    const controls = document.createElement('div'); controls.className = 'rail-controls';
    const hint = document.createElement('span'); hint.textContent = 'Dashboard e dettagli · Scorri i box';
    const buttons = document.createElement('div'); buttons.className = 'rail-buttons';
    const back = document.createElement('button'); back.textContent = '←'; back.type = 'button'; back.setAttribute('aria-label','Scorri i box a sinistra: '+section.dataset.phase);
    const next = document.createElement('button'); next.textContent = '→'; next.type = 'button'; next.setAttribute('aria-label','Scorri i box a destra: '+section.dataset.phase);
    buttons.append(back,next); controls.append(hint,buttons); rail.append(controls,grid);
    const cards = [...grid.querySelectorAll('.feature-box'), ...(staff ? [staff] : [])];
    cards.forEach((card,index) => {
      const detail = focusDetails[section.dataset.phase][index];
      const preview = document.createElement('div'); preview.className = 'dashboard-preview';
      preview.setAttribute('role','img'); preview.setAttribute('aria-label','Concept della dashboard: '+detail[0]);
      const marketingKind = ['loyalty','promotions','statistics'].includes(card.dataset.previewKind);
      preview.style.backgroundImage = marketingKind ? 'none' : 'url("/media/'+sector+'-dashboard-'+section.dataset.phase+'.webp")';
      preview.style.backgroundPosition = detail[1];
      if (card.dataset.previewImage) {
        preview.style.backgroundImage='url("/media/'+card.dataset.previewImage+'")';
        preview.style.backgroundSize='cover';
        if (sector === 'ristoranti' && /^ristoranti-(storico-food|asporto|menu-digitale|personale)\.webp$/.test(card.dataset.previewImage)) preview.style.backgroundPosition='60% 50%';
      }
      const label = document.createElement('span'); label.className = 'dashboard-focus-label'; label.textContent = 'FOCUS / '+detail[0];
      preview.append(label); card.prepend(preview);
      if(card.dataset.previewKind==='web-booking'){
        preview.classList.add('web-booking-preview');preview.style.backgroundImage='none';preview.removeAttribute('role');preview.removeAttribute('aria-label');
        const salon=sector==='saloni';
        const slots=salon?['14:30','15:00','15:30']:['19:30','20:00','20:30'];
        preview.innerHTML=`<div class="web-booking-window"><div class="web-browser-bar"><span>● ● ●</span><b>La tua attività / Prenota online</b></div><div class="web-booking-inner"><h4>Prenota il tuo prossimo momento.</h4><div class="web-booking-fields"><span>${salon?'Taglio e piega':'Venerdì sera'}</span><span>${salon?'Professionista':'2 persone'}</span></div><div class="web-time-options"></div><div class="booking-google"><img src="/media/google-g.png" alt="Google" width="22" height="22"><span>Reserve with Google<small>Search e Maps · Provider compatibile</small></span></div><span class="web-booking-feedback" aria-live="polite">Esempio di prenotazione dal tuo sito</span></div></div>`;
        slots.forEach((time,i)=>{const button=document.createElement('button');button.type='button';button.textContent=time;button.setAttribute('aria-label','Scegli le '+time+' per la prenotazione web');button.setAttribute('aria-pressed',String(i===1));button.addEventListener('click',()=>{preview.querySelectorAll('.web-time-options button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));preview.querySelector('.web-booking-feedback').textContent='Orario selezionato: '+time+' · Esempio';});preview.querySelector('.web-time-options').append(button);});
      }
      if(marketingKind){
        preview.classList.add('marketing-preview');preview.removeAttribute('role');preview.removeAttribute('aria-label');
        const views={
          loyalty:'<span class="marketing-kicker">YOUZEN / FIDELITY</span><div class="fidelity-card"><span>CARTA FEDELTÀ DIGITALE</span><strong>Ogni ritorno conta.</strong><div class="fidelity-stamps" aria-label="4 punti raccolti su 6"><i>✓</i><i>✓</i><i>✓</i><i>✓</i><i>5</i><i>6</i></div><small>4 punti su 6 · Anteprima</small></div>',
          promotions:'<span class="marketing-kicker">YOUZEN / PROMOZIONI</span><h4>Un invito a tornare.</h4><div class="promotion-example"><span>CLIENTI ABITUALI</span><b>Il tuo prossimo momento.</b><small>Una proposta dedicata, dal tuo CRM.</small><em>Campagna in anteprima ↗</em></div>',
          statistics:'<span class="marketing-kicker">YOUZEN / STATISTICHE</span><h4>La relazione, nei numeri.</h4><div class="marketing-metrics"><span>Clienti che tornano<b>68%</b></span><span>Visite<b>124</b></span></div><div class="marketing-chart" aria-label="Grafico illustrativo delle visite"><i style="height:35%"></i><i style="height:53%"></i><i style="height:42%"></i><i style="height:68%"></i><i style="height:80%"></i><i style="height:92%"></i></div><small class="marketing-example">Dati illustrativi</small>'
        };
        preview.innerHTML='<div class="marketing-screen">'+views[card.dataset.previewKind]+'</div>';
      }
      if (sector === 'ristoranti' && section.dataset.phase === 'servizio' && index === 0) {
        card.classList.add('mobile-order-box');
        preview.removeAttribute('role'); preview.removeAttribute('aria-label');
        preview.classList.add('mobile-order-preview');
        preview.style.backgroundImage = 'none';
        preview.innerHTML = `<div class="waiter-phone"><span class="phone-speaker" aria-hidden="true"></span><div class="waiter-screen"><div class="phone-appbar"><b>youzen.</b><span>Comanda mobile</span></div><div class="phone-table"><span>Tavolo 08</span><b>Menu</b></div><div class="phone-menu-tags"><span class="active">Tutti</span><span>Primi</span><span>Bevande</span></div><div class="phone-products"></div><div class="phone-order-total" aria-live="polite"><span data-order-count></span><b data-order-total></b></div><button type="button" class="phone-send">Invia in cucina ↗</button><span class="phone-order-feedback" aria-live="polite">Esempio di comanda al tavolo</span></div></div>`;
        const products = [{name:'Ravioli del giorno',price:14,quantity:2,category:'Primi'}, {name:'Risotto ai funghi',price:16,quantity:1,category:'Primi'}, {name:'Acqua naturale',price:3,quantity:0,category:'Bevande'}];
        let sent = false;
        const list = preview.querySelector('.phone-products');
        const rows = products.map(product => {
          const row = document.createElement('div'); row.className='phone-product';
          const info=document.createElement('div'); info.className='phone-product-info';
          const name=document.createElement('b'); name.textContent=product.name;
          const price=document.createElement('span'); price.textContent='€ '+product.price.toFixed(2).replace('.',','); info.append(name,price);
          const quantity=document.createElement('div'); quantity.className='phone-quantity';
          const minus=document.createElement('button'); minus.type='button'; minus.textContent='−'; minus.setAttribute('aria-label','Rimuovi '+product.name);
          const count=document.createElement('span'); count.setAttribute('aria-label','Quantità '+product.name);
          const plus=document.createElement('button'); plus.type='button'; plus.textContent='+'; plus.setAttribute('aria-label','Aggiungi '+product.name);
          quantity.append(minus,count,plus); row.append(info,quantity); list.append(row);
          minus.addEventListener('click',()=>{product.quantity=Math.max(0,product.quantity-1);sent=false;renderOrder();});
          plus.addEventListener('click',()=>{product.quantity+=1;sent=false;renderOrder();});
          return {product,row,minus,count};
        });
        function renderOrder(){
          rows.forEach(({product,row,minus,count})=>{row.classList.toggle('is-selected',product.quantity>0);count.textContent=product.quantity;minus.disabled=product.quantity===0;});
          const count=products.reduce((sum,item)=>sum+item.quantity,0);
          const total=products.reduce((sum,item)=>sum+item.quantity*item.price,0);
          preview.querySelector('[data-order-count]').textContent=count+' articoli';
          preview.querySelector('[data-order-total]').textContent='€ '+total.toFixed(2).replace('.',',');
          preview.querySelector('.phone-send').textContent=sent?'Modifica comanda ↺':'Invia in cucina ↗';
          preview.querySelector('.phone-send').disabled=count===0;
          preview.querySelector('.phone-order-feedback').textContent=sent?'✓ Comanda inviata · Esempio':'Esempio di comanda al tavolo';
        }
        preview.querySelector('.phone-send').addEventListener('click',()=>{sent=!sent;renderOrder();});
        renderOrder();
      }
    });
    function updateScroll() {
      back.disabled = grid.scrollLeft < 4;
      next.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
    }
    function move(direction) {
      const first = grid.firstElementChild;
      const step = (first?.getBoundingClientRect().width || 300) + 16;
      grid.scrollBy({left:direction*step,behavior:document.body.classList.contains('is-animated-rows')||matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
    back.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
    grid.addEventListener('scroll',updateScroll,{passive:true});
    grid.addEventListener('keydown',event=>{if(layout!=='photo')return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
    if ('ResizeObserver' in window) new ResizeObserver(updateScroll).observe(grid);
    return {section,sectionIndex,grid,photo,staff,photoHome,staffHome,heading,headingHome,caption,originalCaption,updateScroll,cards,manualUntil:0,focused:false,inView:false,autoReady:false,carry:0};
  });
  function update() {
    document.body.dataset.layout = layout;
    document.querySelectorAll('[data-layout-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layoutChoice===layout)));
    groups.forEach(group=>{
      group.section.hidden = false;
      group.cards.filter(card=>card!==group.staff).forEach(card=>group.grid.append(card));
      if(layout==='photo') {
        group.caption.replaceChildren(group.heading);
        if(group.staff) group.grid.append(group.staff);
        group.photo.remove();
        group.grid.insertBefore(group.photo,group.cards[Math.min(group.sectionIndex,group.cards.length)] || null);
        const order=[...group.grid.children];
        group.grid.style.setProperty('--photo-columns',order.map(item=>item===group.photo?'minmax(300px,1.15fr)':'minmax(260px,1fr)').join(' '));
        group.grid.style.setProperty('--photo-columns-mobile',order.map(item=>item===group.photo?'300px':'285px').join(' '));
        group.photo.classList.add('photo-story-card');
        group.grid.style.setProperty('--feature-count',group.cards.length);
        group.grid.tabIndex=0; group.grid.setAttribute('role','region');
        group.grid.setAttribute('aria-label','Box del reparto '+group.section.dataset.phase+', scorri orizzontalmente');
      } else {
        group.headingHome.after(group.heading);
        group.caption.replaceChildren(...group.originalCaption);
        group.photoHome.after(group.photo); group.photo.classList.remove('photo-story-card');
        if(group.staff) group.staffHome.after(group.staff);
        group.grid.removeAttribute('tabindex'); group.grid.removeAttribute('role'); group.grid.removeAttribute('aria-label');
      }
      group.grid.scrollLeft=0;
      requestAnimationFrame(()=>{prepareMotion(group);group.updateScroll();});
    });
    const state=document.querySelector('[data-lab-state]');
    if(state)state.textContent=layouts.find(item=>item[0]===layout)[1]+' / Tutti i reparti nella stessa pagina';
  }
  document.querySelectorAll('[data-layout-choice]').forEach(button=>button.addEventListener('click',()=>{layout=button.dataset.layoutChoice;update();}));
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const intersection='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const group=groups.find(item=>item.grid===entry.target);if(group)group.inView=entry.isIntersecting;});
  },{rootMargin:'80px'}) : null;
  groups.forEach(group=>{
    if(intersection)intersection.observe(group.grid);else group.inView=true;
    const editingControl=target=>target instanceof Element&&target.matches('button,input,select,textarea')&&!!target.closest('.feature-box');
    group.grid.addEventListener('focusin',event=>{group.focused=editingControl(event.target)&&event.target.matches(':focus-visible');if(!group.focused)group.manualUntil=0;});
    group.grid.addEventListener('focusout',event=>{group.focused=editingControl(event.relatedTarget)&&event.relatedTarget.matches(':focus-visible');});
    group.grid.addEventListener('pointerdown',event=>{const editing=editingControl(event.target);group.focused=false;group.manualUntil=editing?performance.now()+600:0;},{passive:true});
    group.grid.parentElement.querySelectorAll('.rail-buttons button').forEach(button=>button.addEventListener('click',()=>{group.focused=false;group.manualUntil=0;}));
  });
  function setAutoWidth(group){
    const style=getComputedStyle(group.grid);
    const padding=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
    const gap=parseFloat(style.columnGap)||16;
    const visible=Math.max(1,group.grid.children.length-1);
    const width=innerWidth<=700?285:Math.max(260,(group.grid.clientWidth-padding-gap*(visible-1))/visible);
    group.grid.style.setProperty('--auto-card-width',width+'px');
  }
  addEventListener('resize',()=>{groups.forEach(group=>{if(group.autoReady)setAutoWidth(group);});},{passive:true});
  function prepareMotion(group){
    const enabled=layout==='photo'&&!motionPreference.matches;
    document.body.classList.toggle('is-animated-rows',enabled);
    group.autoReady=enabled;group.carry=0;
    if(enabled)setAutoWidth(group);
    group.grid.style.setProperty('--auto-visible',Math.max(1,group.grid.children.length-1));
    if(enabled && group.sectionIndex%2===1){
      const last=group.grid.lastElementChild;
      const step=last.getBoundingClientRect().width+parseFloat(getComputedStyle(group.grid).columnGap);
      group.grid.prepend(last);group.grid.scrollLeft=step;
    }else group.grid.scrollLeft=0;
  }
  motionPreference.addEventListener('change',()=>update());
  let lastFrame=0;
  function animateRows(time){
    const elapsed=lastFrame?Math.min(64,time-lastFrame):0;lastFrame=time;
    if(!document.hidden){
      groups.forEach(group=>{
        if(!group.autoReady||!group.inView||group.focused||time<group.manualUntil)return;
        group.carry+=elapsed*.024;const distance=Math.floor(group.carry);group.carry-=distance;if(!distance)return;
        const gap=parseFloat(getComputedStyle(group.grid).columnGap)||16;
        if(group.sectionIndex%2===0){
          const first=group.grid.firstElementChild;const step=first.getBoundingClientRect().width+gap;
          const next=group.grid.scrollLeft+distance;
          if(next>=step){group.grid.append(first);group.grid.scrollLeft=next-step;}else group.grid.scrollLeft=next;
        }else{
          const next=group.grid.scrollLeft-distance;
          if(next<=0){const last=group.grid.lastElementChild;const step=last.getBoundingClientRect().width+gap;group.grid.prepend(last);group.grid.scrollLeft=next+step;}else group.grid.scrollLeft=next;
        }
      });
    }
    requestAnimationFrame(animateRows);
  }
  update();requestAnimationFrame(animateRows);
})();
