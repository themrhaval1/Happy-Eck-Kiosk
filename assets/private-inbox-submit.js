"use strict";
(()=>{
 const form=document.querySelector("#kontaktformular,#apply-form");
 if(!form)return;
 let sending=false;
 form.addEventListener("submit",async e=>{
  if(sending)return;
  if(!form.reportValidity())return;
  e.preventDefault();
  const fd=new FormData(form),isJob=form.id==="apply-form";
  const button=form.querySelector('button[type="submit"]');
  const original=button?.textContent||"Senden";
  if(button){button.disabled=true;button.textContent="Wird sicher übermittelt …";}
  const payload={kind:isJob?"bewerbung":"kontakt",name:String(fd.get("Name")||""),email:String(fd.get("email")||""),phone:String(fd.get(isJob?"Telefonnummer":"Telefon")||""),topic:String(fd.get(isJob?"Beschaeftigung":"Anliegen")||""),message:isJob?"Bewerbung eingegangen. Lebenslauf und Geburtsdatum ausschließlich in der E-Mail.":String(fd.get("Nachricht")||""),website:String(fd.get("_honey")||"")};
  try{
   const res=await fetch("https://jhoueubxgwerbwxyfhml.supabase.co/functions/v1/happy-eck-inbox-submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   if(!res.ok)throw Error("Speichern fehlgeschlagen");
   sending=true;
   // Continue existing FormSubmit workflow (email + CV) without changing its destination.
   HTMLFormElement.prototype.submit.call(form);
  }catch{
   if(button){button.disabled=false;button.textContent=original;}
   let note=form.querySelector(".inbox-save-error");
   if(!note){note=document.createElement("p");note.className="inbox-save-error";note.setAttribute("role","alert");note.style.color="#a33030";button?.after(note);}
   note.textContent="Deine Angaben konnten gerade nicht sicher gespeichert werden. Bitte versuche es erneut oder kontaktiere uns telefonisch.";
  }
 });
})();
