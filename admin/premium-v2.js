"use strict";
/* UI-only enhancements for the protected Happy Eck business desk.
   Reuse the existing time-preset change event; never touch session tokens or analytics payloads. */
(()=>{
 const timeSelect=document.getElementById("time-preset");
 const quickRanges=[...document.querySelectorAll("[data-quick-range]")];
 const lastUpdated=document.getElementById("admin-last-update");
 if(!timeSelect||!quickRanges.length||!lastUpdated)return;
 const format=new Intl.DateTimeFormat("de-DE",{
  timeZone:"Europe/Berlin",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 });
 function synchronize(){
  const current=timeSelect.value;
  for(const button of quickRanges){
   button.setAttribute("aria-pressed",String(button.dataset.quickRange===current));
  }
 }
 for(const button of quickRanges){
  button.addEventListener("click",()=>{
   if(timeSelect.value!==button.dataset.quickRange){
    timeSelect.value=button.dataset.quickRange;
    timeSelect.dispatchEvent(new Event("change",{bubbles:true}));
   }
   synchronize();
  });
 }
 timeSelect.addEventListener("change",synchronize);
 document.addEventListener("happy-eck:stats",()=>{
  lastUpdated.textContent="Daten geladen · "+format.format(new Date())+" Uhr";
  lastUpdated.dataset.ready="true";
 });
 document.addEventListener("happy-eck:logout",()=>{
  lastUpdated.textContent="Noch keine Daten geladen";
  lastUpdated.dataset.ready="false";
  synchronize();
 });
 synchronize();
})();
