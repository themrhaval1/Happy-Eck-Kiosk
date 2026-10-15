"use strict";
// Aggregated event counts only: no cookies, storage, IP or fingerprint collection.
(()=>{
 const BASE="https://jhoueubxgwerbwxyfhml.supabase.co/functions/v1/happy-eck-track";
 const pages={"":"startseite","index.html":"startseite","kontakt.html":"kontakt","jobs.html":"jobs","gls.html":"gls","guthaben.html":"guthaben","oeffnungszeiten.html":"oeffnungszeiten","kontakt-erfolg.html":"kontakt_erfolg","bewerbung-erfolg.html":"bewerbung_erfolg"};
 const key=location.pathname.split("/").filter(Boolean).pop()||"";
 if(!(key in pages))return;
 const post=(kind,eventKey)=>{try{fetch(BASE,{method:"POST",mode:"cors",keepalive:true,headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,key:eventKey})}).catch(()=>{});}catch{}};
 post("page",pages[key]);
 const external=link=>{try{return new URL(link,location.href)}catch{return null}};
 const classify=a=>{
  const href=(a.getAttribute("href")||"").trim();const u=external(href);
  const title=((a.textContent||"")+" "+(a.getAttribute("aria-label")||"")+" "+(a.getAttribute("title")||"")).toLowerCase();
  const dest=(u?.hostname||"").toLowerCase(),path=(u?.pathname||"").toLowerCase();
  if(href.startsWith("tel:"))return"anrufen";
  if(dest.includes("instagram.com"))return"instagram";
  if(dest.includes("tiktok.com"))return"tiktok";
  if(dest.includes("wa.me")||dest.includes("whatsapp.com")||title.includes("whatsapp"))return"whatsapp";
  if(dest.includes("lieferando."))return"lieferando";
  if(dest.includes("maps.apple.com")||title.includes("apple karten"))return"apple_karten";
  if(dest.includes("google.")&&path.includes("maps")||dest.includes("maps.google."))return"google_maps";
  if(dest.includes("gls-")||dest.includes("gls-group.")){
    if(title.includes("verfol")||title.includes("tracking")||path.includes("tracking"))return"sendung_verfolgen";
    if(title.includes("versend")||title.includes("paketmarke")||title.includes("frankier"))return"paket_versenden";
    return"gls";
  }
  if(href.includes("guthaben.html"))return"guthaben";
  if(href.includes("gls.html"))return"gls";
  if(href.includes("jobs.html")||href.includes("bewerbung.html"))return"jobs";
  if(href.includes("kontakt.html"))return"kontakt";
  if(href.includes("oeffnungszeiten.html"))return"oeffnungszeiten";
  if(a.closest("nav"))return"navigation";
  return null;
 };
 document.addEventListener("click",e=>{
  const a=e.target.closest?.("a[href]");
  if(a){const category=classify(a);if(category)post("click",category);return;}
  const b=e.target.closest?.("button");
  if(!b)return;
  const t=((b.textContent||"")+" "+(b.getAttribute("aria-label")||"")).toLowerCase();
  if(t.includes("google maps"))post("click","google_maps");
  else if(t.includes("apple karten"))post("click","apple_karten");
 },{capture:true,passive:true});
 document.addEventListener("submit",e=>{
  const form=e.target;if(!(form instanceof HTMLFormElement))return;
  if(key==="kontakt.html")post("click","kontaktformular");
  if(key==="jobs.html")post("click","bewerbung");
 },{capture:true});
})();
