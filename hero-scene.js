(() => {
 'use strict';
 const hero=document.querySelector('.yz-scene');
 if(!hero)return;
 const photos=[...hero.querySelectorAll('.yz-scene-photo')];
 const labels=[...hero.querySelectorAll('.yz-scene-sector>a')];
 const sector=hero.querySelector('.yz-scene-sector');
 const pause=hero.querySelector('.yz-scene-pause');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let index=Math.max(0,photos.findIndex(photo=>photo.classList.contains('is-active'))),userPaused=false,visible=false,hoveringLink=false,timer=null;
 function schedule(){
  clearTimeout(timer);
  if(userPaused||reduced.matches||!visible||document.hidden||hoveringLink||hero.matches(':focus-within'))return;
  timer=setTimeout(()=>select((index+1)%photos.length),5500);
 }
 function select(next,manual=false){
  if(photos[next].complete&&photos[next].naturalWidth){
   index=next;
   photos.forEach((photo,i)=>photo.classList.toggle('is-active',i===index));
   labels.forEach((label,i)=>{label.classList.toggle('is-active',i===index);label.setAttribute('aria-hidden',i!==index);label.tabIndex=i===index?0:-1;});
  }
  hero.dispatchEvent(new CustomEvent('yp:scenechange',{detail:{index,manual}}));
  schedule();
 }
 function updatePause(){
  pause.disabled=reduced.matches;
  pause.textContent=reduced.matches?'Movimento ridotto':userPaused?'Riprendi immagini':'Pausa immagini';
  pause.setAttribute('aria-pressed',String(userPaused||reduced.matches));
  pause.setAttribute('aria-label',reduced.matches?'Rotazione automatica disattivata':userPaused?'Riprendi la rotazione delle immagini':'Metti in pausa le immagini');
  schedule();
 }
 hero.querySelectorAll('[data-scene-step]').forEach(button=>button.addEventListener('click',()=>select((index+Number(button.dataset.sceneStep)+photos.length)%photos.length,true)));
 sector.addEventListener('pointerenter',()=>{hoveringLink=true;schedule();});
 sector.addEventListener('pointerleave',()=>{hoveringLink=false;schedule();});
 pause.addEventListener('click',()=>{userPaused=!userPaused;updatePause();});
 hero.addEventListener('focusin',schedule);
 hero.addEventListener('focusout',()=>setTimeout(schedule,0));
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',updatePause);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15});
 observer.observe(hero);
 hero.addEventListener('yp:choose-sector',event=>{userPaused=true;select(event.detail.index);updatePause();});
 updatePause();
})();
