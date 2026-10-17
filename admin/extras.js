"use strict";
(()=>{
 const byId=id=>document.getElementById(id);
 const eur=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"});
 const number=new Intl.NumberFormat("de-DE",{maximumFractionDigits:1});
 const isFinitePositive=n=>Number.isFinite(n)&&n>=0&&n<=100000000;
 const setValue=(id,value,negative=false)=>{
  const node=byId(id);node.textContent=value;node.classList.toggle("negative-result",Boolean(negative));
 };
 function switchTab(name){
  if(byId("dashboard-view").hidden)return;
  for(const btn of document.querySelectorAll("[data-admin-tab]")){
   const active=btn.dataset.adminTab===name;
   btn.setAttribute("aria-selected",String(active));btn.tabIndex=active?0:-1;
  }
  byId("analytics-tab").hidden=name!=="analytics";
  byId("tools-tab").hidden=name!=="tools";
 }
 const tabButtons=[...document.querySelectorAll("[data-admin-tab]")];
 tabButtons.forEach((btn,index)=>{
  btn.addEventListener("click",()=>switchTab(btn.dataset.adminTab));
  btn.addEventListener("keydown",event=>{
   if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
   event.preventDefault();
   const target=event.key==="Home"?0:event.key==="End"?tabButtons.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabButtons.length)%tabButtons.length;
   switchTab(tabButtons[target].dataset.adminTab);tabButtons[target].focus();
  });
 });
 function parseAmount(id){
  const field=byId(id);
  const raw=field.value.trim().replace(",",".");
  if(!raw)return NaN;
  const value=Number(raw);
  return isFinitePositive(value)?value:NaN;
 }
 function readVat(id){
  const n=Number(byId(id).value);
  return [0,7,19].includes(n)?n/100:NaN;
 }
 function empty(...ids){for(const id of ids)setValue(id,"–")}
 function marginCalculator(){
  const buy=parseAmount("calc-buy"),sell=parseAmount("calc-sell"),qty=parseAmount("calc-qty");
  const purchaseVat=readVat("calc-buy-vat"),saleVat=readVat("calc-sell-vat");
  const note=byId("margin-note");
  if([buy,sell,qty,purchaseVat,saleVat].some(x=>!Number.isFinite(x))||qty<1||!Number.isInteger(qty)){
   empty("margin-unit","margin-total","margin-percent","margin-net-buy","margin-net-sell");
   note.textContent="Einkaufs- und Verkaufspreis sowie Stückzahl eingeben.";return;
  }
  const netBuy=buy/(1+purchaseVat),netSell=sell/(1+saleVat);
  const unit=netSell-netBuy;
  const margin=netSell>0?unit/netSell*100:0;
  setValue("margin-unit",eur.format(unit),unit<0);
  setValue("margin-total",eur.format(unit*qty),unit<0);
  setValue("margin-percent",number.format(margin)+" %",margin<0);
  setValue("margin-net-buy",eur.format(netBuy));
  setValue("margin-net-sell",eur.format(netSell));
  note.textContent=unit<0?"Achtung: Der Verkaufspreis liegt unter deinem Nettowareneinsatz.":"Unverbindlicher Deckungsbeitrag vor Miete, Personal und sonstigen Kosten. Ohne Pfand.";
 }
 for(const id of ["calc-buy","calc-sell","calc-qty","calc-buy-vat","calc-sell-vat"]){
  byId(id).addEventListener("input",marginCalculator);
  byId(id).addEventListener("change",marginCalculator);
 }
 byId("calc-reset").addEventListener("click",()=>{byId("margin-form").reset();marginCalculator()});
 function cashCalculator(){
  const keys=["cash-start","cash-income","card-income","cash-expenses","cash-add","cash-take","cash-counted"];
  const values=keys.map(parseAmount);
  if(values.some(v=>!Number.isFinite(v))){
   empty("cash-expected","cash-diff","cash-sales");
   byId("cash-note").textContent="Trage alle Beträge ein (auch 0,00), um den Kassenstand zu berechnen.";return;
  }
  const [opening,cash,card,expenses,added,withdrawn,counted]=values;
  const expected=opening+cash-expenses+added-withdrawn;
  const diff=counted-expected;
  setValue("cash-expected",eur.format(expected),expected<0);
  setValue("cash-diff",eur.format(diff),Math.abs(diff)>.005);
  setValue("cash-sales",eur.format(cash+card));
  byId("cash-note").textContent=Math.abs(diff)<.005?"Kasse stimmt rechnerisch.":diff>0?"Gezähltes Bargeld liegt über dem errechneten Soll.":"Gezähltes Bargeld liegt unter dem errechneten Soll.";
 }
 for(const id of ["cash-start","cash-income","card-income","cash-expenses","cash-add","cash-take","cash-counted"])byId(id).addEventListener("input",cashCalculator);
 byId("cash-reset").addEventListener("click",()=>{byId("cash-form").reset();cashCalculator()});
 function targetCalculator(){
  const goal=parseAmount("target-goal"),current=parseAmount("target-current"),left=parseAmount("target-days");
  if([goal,current,left].some(v=>!Number.isFinite(v))||goal<=0||left<1||!Number.isInteger(left)||left>366){
   empty("target-left","target-daily","target-progress");
   byId("target-note").textContent="Umsatzziel, bisherigen Umsatz und verbleibende Tage eingeben.";return;
  }
  const remaining=Math.max(0,goal-current);
  setValue("target-left",eur.format(remaining));
  setValue("target-daily",eur.format(remaining/left));
  setValue("target-progress",number.format(current/goal*100)+" %");
  byId("target-note").textContent=remaining===0?"Umsatzziel erreicht.": "Nur als Planung: Das ist Umsatz, nicht Gewinn.";
 }
 for(const id of ["target-goal","target-current","target-days"])byId(id).addEventListener("input",targetCalculator);
 byId("target-reset").addEventListener("click",()=>{byId("target-form").reset();targetCalculator()});
 // Only checklist checkmarks are saved locally, never financial inputs or login data.
 const checklistKey="happy-eck-admin-daily-checklist-v1";
 const berlinDay=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const checkboxes=[...document.querySelectorAll(".daily-check input[type=checkbox]")];
 function readChecklist(){
  let payload=null;
  try{payload=JSON.parse(localStorage.getItem(checklistKey)||"null")}catch{}
  const valid=payload&&payload.day===berlinDay()&&Array.isArray(payload.checked);
  checkboxes.forEach((input,i)=>{input.checked=Boolean(valid&&payload.checked[i]===true)});
  refreshChecklist();
 }
 function refreshChecklist(){
  const done=checkboxes.filter(input=>input.checked).length;
  byId("check-progress").textContent=done+" von "+checkboxes.length+" erledigt";
  byId("check-progress-fill").style.width=(checkboxes.length?done/checkboxes.length*100:0)+"%";
  byId("check-date").textContent=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",day:"2-digit",month:"long",year:"numeric"}).format(new Date());
 }
 function saveChecklist(){
  const payload={day:berlinDay(),checked:checkboxes.map(input=>input.checked)};
  try{localStorage.setItem(checklistKey,JSON.stringify(payload))}catch{}
  refreshChecklist();
 }
 checkboxes.forEach(input=>input.addEventListener("change",saveChecklist));
 byId("check-reset").addEventListener("click",()=>{checkboxes.forEach(input=>{input.checked=false});saveChecklist()});
 readChecklist();
 // Re-render weekly analytics only with already-authorized aggregates, never request raw visitor information.
 let cachedRows=[],dateUTC="";
 const dayFormat=new Intl.DateTimeFormat("de-DE",{weekday:"short",timeZone:"UTC"});
 const dayNames=["So","Mo","Di","Mi","Do","Fr","Sa"];
 function shiftDate(day,offset){
  const d=new Date(day+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);
 }
 function pageCountBetween(start,end){
  return cachedRows.filter(r=>r&&r.event_kind==="page"&&r.day>=start&&r.day<=end).reduce((s,r)=>s+(Number(r.total)||0),0);
 }
 function weeklyInsights(){
  const parent=byId("admin-new-insights");
  if(!dateUTC||!cachedRows.length){parent.hidden=true;return;}
  const selectedDays=byId("time-preset").value==="90d"?90:30;
  const cutoff=shiftDate(dateUTC,1-selectedDays);
  const relevant=cachedRows.filter(r=>r&&r.event_kind==="page"&&r.day>=cutoff&&r.day<=dateUTC);
  if(!relevant.length){parent.hidden=true;return;}
  parent.hidden=false;
  const current=pageCountBetween(shiftDate(dateUTC,-6),dateUTC);
  const earlier=pageCountBetween(shiftDate(dateUTC,-13),shiftDate(dateUTC,-7));
  setValue("week-this",new Intl.NumberFormat("de-DE").format(current));
  setValue("week-last",new Intl.NumberFormat("de-DE").format(earlier));
  const oldPeriodHasData=cachedRows.some(r=>r&&r.day>=shiftDate(dateUTC,-13)&&r.day<=shiftDate(dateUTC,-7));
  const change=oldPeriodHasData&&earlier>0?(current-earlier)/earlier*100:null;
  setValue("week-change",change===null?"–":(change>0?"+":"")+number.format(change)+" %",change!==null&&change<0);
  byId("week-note").textContent=change===null?"Kein verlässlicher Vergleich zur Vorwoche verfügbar.":"Vergleich der erfassten Seitenaufrufe; keine eindeutigen Besucher.";
  const counts=Array(7).fill(0);
  for(const r of relevant){
   const date=new Date(r.day+"T00:00:00Z");
   if(Number.isFinite(date.getTime()))counts[date.getUTCDay()]+=Number(r.total)||0;
  }
  const max=Math.max(1,...counts),list=byId("weekday-bars");list.replaceChildren();
  for(let offset=0;offset<7;offset++){
   const index=(offset+1)%7,bar=document.createElement("div"),label=document.createElement("span"),track=document.createElement("span"),fill=document.createElement("span"),count=document.createElement("strong");
   bar.className="weekday-row";label.textContent=dayNames[index];track.className="weekday-track";fill.style.width=(100*counts[index]/max)+"%";count.textContent=new Intl.NumberFormat("de-DE").format(counts[index]);track.append(fill);bar.append(label,track,count);list.append(bar);
  }
  byId("weekday-note").textContent="Summe der Aufrufe nach Wochentag, letzte "+selectedDays+" UTC-Tage.";
 }
 document.addEventListener("happy-eck:stats",event=>{
  cachedRows=Array.isArray(event.detail?.rows)?event.detail.rows.filter(r=>r&&typeof r.day==="string"):[];
  dateUTC=typeof event.detail?.utcToday==="string"?event.detail.utcToday:"";
  weeklyInsights();
 });
 byId("time-preset").addEventListener("change",weeklyInsights);
 document.addEventListener("happy-eck:logout",()=>{
  cachedRows=[];dateUTC="";byId("admin-new-insights").hidden=true;switchTab("analytics");
  byId("margin-form").reset();byId("cash-form").reset();byId("target-form").reset();
  marginCalculator();cashCalculator();targetCalculator();
 });
 marginCalculator();cashCalculator();targetCalculator();
})();