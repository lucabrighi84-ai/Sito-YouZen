(() => {
  'use strict';
  const root=document.querySelector('.homepage-service-slides');
  if(!root)return;
  const designs=[['editoriale','Chiara editoriale'],['pastello','Pastello'],['immersiva','Fotografica'],['fisarmonica','Fisarmonica'],['carosello','Carosello']];
  const requested=new URL(location.href).searchParams.get('schede');
  const slides=[...root.querySelectorAll('.service-slide')];
  root.dataset.serviceDesign=designs.some(([key])=>key===requested)?requested:'immersiva';
  const measure=slide=>{const height=Math.ceil(slide.getBoundingClientRect().height)+'px';if(slide.style.getPropertyValue('--service-card-height')!==height)slide.style.setProperty('--service-card-height',height);};
  if('ResizeObserver' in window){const sizes=new ResizeObserver(entries=>entries.forEach(entry=>measure(entry.target)));slides.forEach(slide=>sizes.observe(slide));}
  requestAnimationFrame(()=>slides.forEach(measure));
  if(!designs.some(([key])=>key===requested))return;
  const titles=slides.map(slide=>slide.querySelector('.copy-top>p').textContent);
  const picker=document.createElement('div');picker.className='service-design-picker';picker.innerHTML='<div class="design-picker-caption"><span>LE SCHEDE DELLA HOME / 5 PROPOSTE</span><a href="./#strumenti">Chiudi confronto ↗</a></div><nav aria-label="Scegli lo stile delle schede"></nav><p data-design-description></p>';
  const descriptions={editoriale:'Tipografia ampia, pannelli chiari e immagini alternate. Una lettura ariosa, sul bianco della home.',pastello:'Rosa, azzurro, salvia e crema. Quattro servizi, ciascuno con il proprio colore.',immersiva:'Foto a tutta scheda e interfacce in primo piano. Una presentazione più immersiva.',fisarmonica:'Quattro titoli sempre visibili. Apri un servizio alla volta e prova gli strumenti.',carosello:'Una scheda in primo piano. Scorri lateralmente o passa al servizio dai pulsanti.'};
  root.before(picker);
  let current=requested,openIndex=0;
  const chooseButtons=designs.map(([key,label],i)=>{const button=document.createElement('button');button.type='button';button.innerHTML='<span>0'+(i+1)+'</span>'+label;button.setAttribute('aria-pressed',String(key===current));button.addEventListener('click',()=>apply(key));picker.querySelector('nav').append(button);return button;});
  const headers=slides.map((slide,index)=>{
    const visual=slide.querySelector('.slide-visual'),copy=slide.querySelector('.slide-copy');
    visual.id=slide.id+'-visual';copy.id=slide.id+'-copy';
    const button=document.createElement('button');button.type='button';button.className='service-accordion-toggle';button.innerHTML='<span class="accordion-index">0'+(index+1)+'</span><span>'+titles[index]+'</span><i aria-hidden="true">+</i>';
    button.setAttribute('aria-controls',visual.id+' '+copy.id);button.hidden=true;
    button.addEventListener('click',()=>{openIndex=openIndex===index?-1:index;updateAccordion();});slide.prepend(button);return button;
  });
  const carouselNav=document.createElement('nav');carouselNav.className='service-carousel-nav';carouselNav.setAttribute('aria-label','Scegli il servizio nel carosello');root.prepend(carouselNav);
  const carouselButtons=titles.map((title,index)=>{const button=document.createElement('button');button.type='button';button.innerHTML='<span>0'+(index+1)+'</span>'+title;button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',()=>{slides[index].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest',inline:'start'});});carouselNav.append(button);return button;});
  function updateAccordion(){slides.forEach((slide,index)=>{const open=index===openIndex;slide.classList.toggle('service-is-open',open);headers[index].setAttribute('aria-expanded',String(open));headers[index].querySelector('i').textContent=open?'−':'+';slide.querySelector('.slide-visual').hidden=!open;slide.querySelector('.slide-copy').hidden=!open;});}
  function apply(key){
    current=key;root.dataset.serviceDesign=key;
    chooseButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(designs[index][0]===key)));
    picker.querySelector('[data-design-description]').textContent=descriptions[key];
    headers.forEach(button=>button.hidden=key!=='fisarmonica');carouselNav.hidden=key!=='carosello';
    slides.forEach(slide=>{slide.querySelector('.slide-visual').hidden=false;slide.querySelector('.slide-copy').hidden=false;slide.classList.remove('service-is-open');});
    if(key==='fisarmonica'){openIndex=0;updateAccordion();}
    const url=new URL(location.href);url.searchParams.set('schede',key);history.replaceState(null,'',url);
    root.querySelector('.slides').scrollLeft=0;
  }
  root.querySelectorAll('.copy-bottom>a').forEach(link=>link.addEventListener('click',event=>{const index=slides.findIndex(slide=>'#'+slide.id===link.getAttribute('href'));if(index<0)return;if(current==='fisarmonica'){openIndex=index;updateAccordion();}if(current==='carosello'){event.preventDefault();slides[index].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest',inline:'start'});}}));
  const observer=new IntersectionObserver(entries=>{if(current!=='carosello')return;const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible){const index=slides.indexOf(visible.target);carouselButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));}},{root:root.querySelector('.slides'),threshold:[.55,.8]});slides.forEach(slide=>observer.observe(slide));
  apply(current);
})();
