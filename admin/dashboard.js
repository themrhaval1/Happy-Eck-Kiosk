"use strict";
const URL="https://jhoueubxgwerbwxyfhml.supabase.co";
const KEY="sb_publishable_5NWg7hn7iNYqYx_Kvg9dQw_pNxquHJv";
const el=id=>document.getElementById(id);
const labels={startseite:"Startseite",kontakt:"Kontakt",jobs:"Jobs & Bewerbung",gls:"GLS Paketshop",guthaben:"Guthaben & Gutscheine",oeffnungszeiten:"Öffnungszeiten",kontakt_erfolg:"Kontaktbestätigung",bewerbung_erfolg:"Bewerbungsbestätigung",navigation:"Navigation",lieferando:"Lieferando",google_maps:"Google Maps",apple_karten:"Apple Karten",instagram:"Instagram",tiktok:"TikTok",whatsapp:"WhatsApp",anrufen:"Anrufen",kontaktformular:"Kontaktformular",bewerbung:"Bewerbung senden",paket_versenden:"GLS Paket versenden",sendung_verfolgen:"Sendung verfolgen",andere_aktion:"Weitere Aktionen"};
let token="",rows=[],days=30,utcToday=new Date().toISOString().slice(0,10);
const num=new Intl.NumberFormat("de-DE");
function showLogin(msg=""){token="";el("login-view").hidden=false;el("dashboard-view").hidden=true;el("login-error").textContent=msg;el("login-error").hidden=!msg;}
function showDashboard(){el("login-view").hidden=true;el("dashboard-view").hidden=false;el("admin-password").value="";}
function setBusy(b){el("login-submit").disabled=b;el("login-label").textContent=b?"Anmeldung läuft …":"Sicher anmelden";}
function errorMessage(e){return e?.message||"Bitte versuche es erneut.";}
async function login(event){
 event.preventDefault();el("login-error").hidden=true;setBusy(true);
 try{
 const res=await fetch(URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify({email:el("admin-email").value.trim(),password:el("admin-password").value})});
 const data=await res.json();if(!res.ok||!data.access_token)throw new Error("E-Mail oder Passwort ist nicht richtig.");
 token=data.access_token;
 await fetchStats();showDashboard();
 }catch(e){showLogin(e.message==="Nicht berechtigt"?"Dieses Konto hat keine Admin-Berechtigung.":errorMessage(e));}
 finally{setBusy(false);}
}
async function fetchStats(){
 if(!token)throw new Error("Bitte melde dich an.");
 const res=await fetch(URL+"/functions/v1/happy-eck-statistics",{method:"GET",headers:{Authorization:"Bearer "+token,apikey:KEY}});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok){if(res.status===401||res.status===403)throw new Error(res.status===403?"Nicht berechtigt":"Sitzung abgelaufen. Bitte erneut anmelden.");throw new Error(data.error||"Statistik ist momentan nicht erreichbar.");}
 rows=Array.isArray(data.rows)?data.rows:[];utcToday=(data.updated_at||new Date().toISOString()).slice(0,10);render();
}
function recent(r){const start=new Date(utcToday+"T00:00:00Z");start.setUTCDate(start.getUTCDate()-(days-1));return r.day>=start.toISOString().slice(0,10);}
function sum(a){return a.reduce((s,x)=>s+Number(x.total||0),0)}
function render(){
 const data=rows.filter(recent),pages=data.filter(r=>r.event_kind==="page"),clicks=data.filter(r=>r.event_kind==="click");
 el("views-total").textContent=num.format(sum(pages));el("clicks-total").textContent=num.format(sum(clicks));el("today-total").textContent=num.format(sum(pages.filter(r=>r.day===utcToday)));
 el("chart-period").textContent=days+" Tage";
 const grouped=(records)=>{const o=new Map();for(const r of records)o.set(r.event_key,(o.get(r.event_key)||0)+Number(r.total||0));return [...o].sort((a,b)=>b[1]-a[1]);};
 renderRanks("top-clicks",grouped(clicks));renderRanks("top-pages",grouped(pages));renderChart(pages);
 el("dashboard-status").textContent="Letzte Aktualisierung: "+new Date().toLocaleString("de-DE")+" · Zeitraum: "+days+" Tage";
}
function renderRanks(id,items){
 const parent=el(id);parent.replaceChildren();
 if(!items.length){const p=document.createElement("p");p.className="empty";p.textContent="Noch keine Daten erfasst. Die Zahlen erscheinen nach dem Start der Erfassung.";parent.append(p);return;}
 const max=items[0][1]||1;
 for(const [key,value] of items.slice(0,9)){
 const row=document.createElement("div");row.className="rank-row";
 const head=document.createElement("div");head.className="rank-title";
 const title=document.createElement("span");title.textContent=labels[key]||key.replaceAll("_"," ");
 const count=document.createElement("strong");count.textContent=num.format(value);
 head.append(title,count);
 const bar=document.createElement("div");bar.className="rank-progress";const fill=document.createElement("span");fill.style.width=(value/max*100)+"%";bar.append(fill);row.append(head,bar);parent.append(row);
 }
}
function renderChart(pages){
 const parent=el("daily-chart");parent.replaceChildren();const counts=new Map();
 for(const r of pages)counts.set(r.day,(counts.get(r.day)||0)+Number(r.total||0));
 const end=new Date(utcToday+"T00:00:00Z"),points=[];
 for(let i=days-1;i>=0;i--){const d=new Date(end);d.setUTCDate(d.getUTCDate()-i);const date=d.toISOString().slice(0,10);points.push({date,count:counts.get(date)||0});}
 const max=Math.max(1,...points.map(p=>p.count));parent.setAttribute("aria-label","Tägliche Seitenaufrufe, insgesamt "+num.format(sum(pages))+" im gewählten Zeitraum");
 for(let i=0;i<points.length;i++){const p=points[i],wrap=document.createElement("div");wrap.className="chart-bar-wrap";wrap.title=new Date(p.date+"T00:00:00Z").toLocaleDateString("de-DE",{timeZone:"UTC"})+": "+num.format(p.count)+" Aufrufe";
 const bar=document.createElement("div");bar.className="chart-bar";bar.style.height=Math.max(2,p.count/max*172)+"px";const label=document.createElement("span");label.className="chart-label";label.textContent=i===0||i===points.length-1||i%Math.max(1,Math.ceil(days/6))===0?p.date.slice(8,10)+"."+p.date.slice(5,7):"";wrap.append(bar,label);parent.append(wrap);}
}
el("login-form").addEventListener("submit",login);
el("logout").addEventListener("click",()=>showLogin());
el("refresh").addEventListener("click",async()=>{el("refresh").disabled=true;try{await fetchStats()}catch(e){el("dashboard-status").textContent="Fehler: "+errorMessage(e);if(e.message.includes("abgelaufen")||e.message==="Nicht berechtigt")showLogin(e.message);}finally{el("refresh").disabled=false}});
for(const btn of document.querySelectorAll("[data-days]"))btn.addEventListener("click",()=>{days=Number(btn.dataset.days);for(const b of document.querySelectorAll("[data-days]"))b.setAttribute("aria-pressed",String(b===btn));render()});
showLogin();
