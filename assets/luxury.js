/* Happy Eck luxury interactions – no external libraries */
(()=>{'use strict';
const menu=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
const progress=document.querySelector('.progress');
const toggle=document.querySelector('.effect-toggle');
const heroImage=document.querySelector('.hero-image');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
let motionEnabled=!reduced.matches;
let observer=null;
let framePending=false;
function openMenu(open){
  if(!menu||!nav)return;
  menu.setAttribute('aria-expanded',String(open));
  nav.classList.toggle('open',open);
  menu.textContent=open?'Menü ×':'Menü ☰';
}
menu?.addEventListener('click',()=>openMenu(menu.getAttribute('aria-expanded')!=='true'));
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>openMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){openMenu(false);}});
document.addEventListener('pointerdown',event=>{
  if(nav?.classList.contains('open')&&!nav.contains(event.target)&&!menu?.contains(event.target))openMenu(false);
});
function onScroll(){
  framePending=false;
  const max=document.documentElement.scrollHeight-window.innerHeight;
  if(progress)progress.style.transform='scaleX('+(max>0?Math.max(0,Math.min(1,window.scrollY/max)):1)+')';
  document.querySelector('header')?.classList.toggle('header-scrolled',window.scrollY>20);
}
function scheduleScroll(){if(!framePending){framePending=true;requestAnimationFrame(onScroll);}}
window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',scheduleScroll,{passive:true});
scheduleScroll();
const elements=[...document.querySelectorAll('.reveal')];
elements.forEach((element,index)=>element.dataset.delay=String(index%3));
function setMotion(allow){
  motionEnabled=Boolean(allow)&&!reduced.matches;
  observer?.disconnect();observer=null;
  document.body.classList.toggle('motion',motionEnabled);
  document.body.classList.toggle('off',!motionEnabled);
  if(toggle){
    toggle.setAttribute('aria-pressed',String(motionEnabled));
    toggle.setAttribute('aria-label',motionEnabled?'Animationen ausschalten':'Animationen einschalten');
    toggle.textContent=motionEnabled?'✦ Effekte an':'✧ Effekte aus';
  }
  if(!motionEnabled){
    elements.forEach(element=>element.classList.add('visible'));
    document.querySelectorAll('[data-tilt]').forEach(element=>{element.style.removeProperty('--tilt-x');element.style.removeProperty('--tilt-y');});
    if(heroImage)heroImage.style.removeProperty('transform');
    return;
  }
  if(!('IntersectionObserver' in window)){elements.forEach(element=>element.classList.add('visible'));return;}
  elements.forEach(element=>element.classList.remove('visible'));
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
  }),{threshold:0.075,rootMargin:'0px 0px 40px 0px'});
  elements.forEach(element=>observer.observe(element));
}
setMotion(motionEnabled);
toggle?.addEventListener('click',()=>setMotion(!motionEnabled));
reduced.addEventListener?.('change',event=>{if(event.matches)setMotion(false);});
if(finePointer.matches){
  const tiles=[...document.querySelectorAll('.collection-card,.detail-card,.contact-card')];
  for(const tile of tiles){
    const tiltable=tile.classList.contains('collection-card');
    if(tiltable)tile.dataset.tilt='true';
    let waiting=false,lastX=0,lastY=0;
    tile.addEventListener('pointermove',event=>{
      if(!motionEnabled)return;
      lastX=event.clientX;lastY=event.clientY;
      if(waiting)return;
      waiting=true;
      requestAnimationFrame(()=>{
        waiting=false;
        if(!motionEnabled)return;
        const rect=tile.getBoundingClientRect();
        const x=Math.max(0,Math.min(1,(lastX-rect.left)/rect.width));
        const y=Math.max(0,Math.min(1,(lastY-rect.top)/rect.height));
        tile.style.setProperty('--mx',(x*100).toFixed(1)+'%');
        tile.style.setProperty('--my',(y*100).toFixed(1)+'%');
        if(tiltable){tile.style.setProperty('--tilt-x',((.5-y)*5).toFixed(2)+'deg');tile.style.setProperty('--tilt-y',((x-.5)*5).toFixed(2)+'deg');}
      });
    },{passive:true});
    tile.addEventListener('pointerleave',()=>{
      tile.style.removeProperty('--mx');tile.style.removeProperty('--my');
      tile.style.removeProperty('--tilt-x');tile.style.removeProperty('--tilt-y');
    });
  }
}
window.addEventListener('pagehide',()=>observer?.disconnect(),{once:true});
})();