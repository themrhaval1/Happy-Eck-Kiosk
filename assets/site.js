/* Happy Eck interactive behavior – intentionally no external JS dependencies. */
"use strict";
(function(){
  const toggle=document.getElementById('menu-toggle');
  const menu=document.getElementById('site-menu');
  const overlay=document.getElementById('menu-backdrop');
  const closeButton=document.getElementById('menu-close');
  if(!toggle||!menu||!overlay)return;
  let lastFocus=null;
  function setOpen(open,restoreFocus=false){
    if(open)lastFocus=document.activeElement;
    menu.hidden=!open;
    overlay.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
    document.body.classList.toggle('menu-is-open',open);
    if(open){if(closeButton)closeButton.focus();}
    else if(restoreFocus){toggle.focus();}
  }
  toggle.addEventListener('click',()=>setOpen(menu.hidden,!menu.hidden));
  if(closeButton)closeButton.addEventListener('click',()=>setOpen(false,true));
  overlay.addEventListener('click',()=>setOpen(false,true));
  menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false)});
  document.addEventListener('keydown',event=>{
    if(menu.hidden)return;
    if(event.key==='Escape'){setOpen(false,true);return;}
    if(event.key==='Tab'){
      const nodes=[...menu.querySelectorAll('a[href],button:not([disabled])')];
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
})();

(function(){
const input=document.getElementById("job-cv");
const birthday=document.querySelector('input[name="Geburtsdatum"]');
if(birthday){const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());birthday.max=today;}
if(!input)return;
function validate(){
  const file=input.files&&input.files[0];
  let message="";
  if(file){
    if(!/\.(jpg|jpeg|pdf)$/i.test(file.name))message="Nur JPG oder PDF ist erlaubt.";
    else if(file.size>10485760)message="Die Datei darf höchstens 10 MB groß sein.";
  }
  input.setCustomValidity(message);
  return !message;
}
input.addEventListener("change",()=>{if(!validate())input.reportValidity()});
input.form.addEventListener("submit",event=>{if(!validate()){event.preventDefault();input.reportValidity()}});
})();

(function(){const contact=document.getElementById('kontakt');if(!contact)return;function reveal(){if(location.hash==='#kontakt'){contact.open=true;}}document.querySelectorAll('a[href="#kontakt"]').forEach(link=>link.addEventListener('click',()=>{contact.open=true;}));window.addEventListener('hashchange',reveal);reveal();})();





(function(){
  // Image failures should never leave a broken visual or misleading empty card.
  const product=document.querySelector('.promo-product-image');
  if(product){
    function fallback(){product.hidden=true;product.closest('.promo-product-photo')?.classList.add('image-unavailable')}
    product.addEventListener('error',fallback);
    if(product.complete&&product.naturalWidth===0)fallback();
  }
  // Prevent repeated form submissions from double-clicks.
  document.querySelectorAll('form[action^="https://formsubmit.co/"]').forEach(form=>{
    form.addEventListener('submit',event=>{
      if(!form.checkValidity()||event.defaultPrevented)return;
      const button=form.querySelector('button[type="submit"]');
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Wird gesendet …';}
    });
  });
})();

(function(){
  // Make failed gallery images graceful instead of showing broken image icons.
  document.querySelectorAll('.normal-category-photo img,.deep-gallery-grid img').forEach(img=>{
    const fallback=()=>{img.hidden=true;img.parentElement?.classList.add('image-failed')};
    img.addEventListener('error',fallback);
    if(img.complete&&!img.naturalWidth)fallback();
  });
  // Status is informational only; opening times can differ on holidays.
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');a.setAttribute('rel',[...rel].join(' '));
  });
})();

(function(){
  // Recover submit buttons after Back navigation and keep messages accessible.
  window.addEventListener("pageshow",()=>{
    document.querySelectorAll('form[action^="https://formsubmit.co/"] button[aria-busy="true"]').forEach(button=>{
      button.disabled=false;
      button.removeAttribute("aria-busy");
      button.textContent=button.closest(".apply-panel")?"Bewerbung senden":"Nachricht senden ↗";
    });
  });
})();
