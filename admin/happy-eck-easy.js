"use strict";
/* Simple timeframe controls; works with the existing authorized admin statistics only. */
(()=>{
 const select=document.getElementById("time-preset");
 const buttons=[...document.querySelectorAll("[data-happy-period]")];
 const note=document.getElementById("admin-simple-period-note");
 const refresh=document.getElementById("refresh");
 if(!select||!buttons.length||!note)return;
 const texts={
  "30d":"Du siehst die letzten 30 Tage.",
  "90d":"Du siehst die letzten 90 Tage.",
  "7d":"Du siehst die letzten 7 Tage.",
  "today":"Du siehst die heutigen Daten nach Hammer Uhrzeit.",
  "60m":"Du siehst die letzte Stunde.",
  "15m":"Du siehst die letzten 15 Minuten.",
  "6h":"Du siehst die letzten 6 Stunden.",
  "24h":"Du siehst die letzten 24 Stunden.",
  "custom":"Du hast einen eigenen Zeitraum ausgewählt."
 };
 function updateLabels(){
  const value=select.value;
  buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.happyPeriod===value)));
  note.textContent=(texts[value]||"Du siehst den gewählten Zeitraum.")+" Seitenaufrufe sind keine einzelnen Personen.";
 }
 for(const button of buttons){
  button.addEventListener("click",()=>{
   if(select.value!==button.dataset.happyPeriod){
    select.value=button.dataset.happyPeriod;
    select.dispatchEvent(new Event("change",{bubbles:true}));
   }
   updateLabels();
  });
 }
 select.addEventListener("change",updateLabels);
 document.addEventListener("happy-eck:logout",updateLabels);

 const freshness=document.getElementById("admin-freshness");
 if(freshness){
  const clock=new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});
  document.addEventListener("happy-eck:stats",()=>{
   freshness.textContent="Daten geladen · "+clock.format(new Date())+" Uhr";
   freshness.dataset.loaded="true";
  });
  document.addEventListener("happy-eck:logout",()=>{
   freshness.textContent="Statistik wird nach der Anmeldung geladen";
   freshness.dataset.loaded="false";
  });
 }

 // The existing dashboard updates its own numbers; we only simplify presentation.
 updateLabels();
})();
