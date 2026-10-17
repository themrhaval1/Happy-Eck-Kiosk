"use strict";
const URL="https://jhoueubxgwerbwxyfhml.supabase.co";
const KEY="sb_publishable_5NWg7hn7iNYqYx_Kvg9dQw_pNxquHJv";
const el=id=>document.getElementById(id);
const labels={startseite:"Startseite",kontakt:"Kontakt",jobs:"Jobs & Bewerbung",gls:"GLS Paketshop",guthaben:"Guthaben & Gutscheine",oeffnungszeiten:"Öffnungszeiten",kontakt_erfolg:"Kontaktbestätigung",bewerbung_erfolg:"Bewerbungsbestätigung",navigation:"Navigation",lieferando:"Lieferando",google_maps:"Google Maps",apple_karten:"Apple Karten",instagram:"Instagram",tiktok:"TikTok",whatsapp:"WhatsApp",anrufen:"Anrufen",kontaktformular:"Kontaktformular",bewerbung:"Bewerbung senden",paket_versenden:"GLS Paket versenden",sendung_verfolgen:"Sendung verfolgen",andere_aktion:"Weitere Aktionen"};
let token="",rows=[],minuteRows=[],days=30,utcToday=new Date().toISOString().slice(0,10);
const num=new Intl.NumberFormat("de-DE");
function showLogin(msg=""){token="";rows=[];minuteRows=[];el("login-view").hidden=false;el("dashboard-view").hidden=true;el("reset-view").hidden=true;for(const id of ["daily-chart","time-chart","top-clicks","top-pages"]){el(id).replaceChildren();}for(const id of ["views-total","clicks-total","today-total","avg-views","best-day","best-page","best-click","time-views","time-clicks","time-buckets"]){el(id).textContent="–";}el("login-error").textContent=msg;el("login-error").hidden=!msg;document.dispatchEvent(new Event("happy-eck:logout"));}
function showDashboard(){el("login-view").hidden=true;el("dashboard-view").hidden=false;el("admin-password").value="";renderTime();}
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
 const res=await fetch(URL+"/functions/v1/happy-eck-statistics",{method:"GET",cache:"no-store",headers:{Authorization:"Bearer "+token,apikey:KEY}});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok){if(res.status===401||res.status===403)throw new Error(res.status===403?"Nicht berechtigt":"Sitzung abgelaufen. Bitte erneut anmelden.");throw new Error(data.error||"Statistik ist momentan nicht erreichbar.");}
 rows=Array.isArray(data.rows)?data.rows:[];minuteRows=Array.isArray(data.minutes)?data.minutes:[];utcToday=(data.updated_at||new Date().toISOString()).slice(0,10);render();renderTime();document.dispatchEvent(new CustomEvent("happy-eck:stats",{detail:{rows,utcToday}}));
}
function recent(r){const start=new Date(utcToday+"T00:00:00Z");start.setUTCDate(start.getUTCDate()-(days-1));return r.day>=start.toISOString().slice(0,10);}
function sum(a){return a.reduce((s,x)=>s+Number(x.total||0),0)}
function render(){
 const data=rows.filter(recent),pages=data.filter(r=>r.event_kind==="page"),clicks=data.filter(r=>r.event_kind==="click");
 el("views-total").textContent=num.format(sum(pages));el("clicks-total").textContent=num.format(sum(clicks));el("today-total").textContent=num.format(sum(pages.filter(r=>r.day===utcToday)));
 el("chart-period").textContent=days+" Tage";
 const grouped=(records)=>{const o=new Map();for(const r of records)o.set(r.event_key,(o.get(r.event_key)||0)+Number(r.total||0));return [...o].sort((a,b)=>b[1]-a[1]);};
 renderRanks("top-clicks",grouped(clicks));renderRanks("top-pages",grouped(pages));renderChart(pages);
 renderInsights(pages,grouped(pages),grouped(clicks));
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

function showRecoveryStatus(message,isError=false){
 const node=el("recovery-request-status");node.textContent=message;node.hidden=!message;
 node.style.color=isError?"#923e38":"#285b3d";
}
el("forgot-password").addEventListener("click",async()=>{
 const address=el("admin-email").value.trim();
 if(!address||!el("admin-email").checkValidity()){
  showRecoveryStatus("Bitte gib zuerst deine Admin-E-Mail-Adresse ein.",true);el("admin-email").focus();return;
 }
 const btn=el("forgot-password");btn.disabled=true;showRecoveryStatus("Einen Moment, wir senden den Link …");
 try{
  const redirect=location.origin+"/admin/";
  const res=await fetch(URL+"/auth/v1/recover?redirect_to="+encodeURIComponent(redirect),{
   method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},
   body:JSON.stringify({email:address})
  });
  if(!res.ok)throw new Error(res.status===429?"Bitte warte etwas, bevor du erneut einen Link anforderst.":"Der Link konnte gerade nicht versendet werden. Bitte versuche es später erneut.");
  showRecoveryStatus("Wenn die E-Mail registriert ist, erhältst du einen Link zum Zurücksetzen. Prüfe auch deinen Spam-Ordner.");
 }catch(e){showRecoveryStatus(errorMessage(e),true)}
 finally{btn.disabled=false;}
});
function openReset(tokenFromLink){
 token=tokenFromLink;el("login-view").hidden=true;el("dashboard-view").hidden=true;el("reset-view").hidden=false;
 el("reset-status").hidden=true;
}
async function handleRecoveryLink(){
 const hash=new URLSearchParams(location.hash.slice(1));
 const query=new URLSearchParams(location.search);
 const type=hash.get("type")||query.get("type");
 const access=hash.get("access_token");
 const refresh=hash.get("refresh_token");
 const code=query.get("code");
 const error=hash.get("error_description")||query.get("error_description")||hash.get("error")||query.get("error");
 // Remove sensitive tokens immediately, including browser history.
 if(location.hash||query.has("code")||query.has("error"))history.replaceState(null,"",location.pathname);
 if(error){showLogin("Der Link ist abgelaufen oder ungültig. Fordere bitte einen neuen Link an.");return;}
 if(type==="recovery"&&access){openReset(access);return;}
 // PKCE recovery links may return an authorization code rather than a hash.
 if(code){
  try{
   const verifier=sessionStorage.getItem("happy_eck_recovery_verifier");
   if(!verifier)throw new Error("Bitte fordere auf diesem Gerät einen neuen Passwort-Link an.");
   sessionStorage.removeItem("happy_eck_recovery_verifier");
   const res=await fetch(URL+"/auth/v1/token?grant_type=pkce",{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify({auth_code:code,code_verifier:verifier})});
   const data=await res.json();if(!res.ok||!data.access_token)throw new Error("Der Link konnte nicht bestätigt werden.");
   openReset(data.access_token);
  }catch(e){showLogin(errorMessage(e));}
  return;
 }
 showLogin();
}
el("reset-form").addEventListener("submit",async event=>{
 event.preventDefault();const a=el("new-password").value,b=el("confirm-password").value,node=el("reset-status");
 node.hidden=false;
 if(a.length<12){node.textContent="Bitte mindestens 12 Zeichen verwenden.";return;}
 if(a!==b){node.textContent="Die beiden Passwörter stimmen nicht überein.";return;}
 if(!token){node.textContent="Der Link ist ungültig. Fordere bitte einen neuen an.";return;}
 const btn=el("reset-submit");btn.disabled=true;node.textContent="Passwort wird gespeichert …";
 try{
  const res=await fetch(URL+"/auth/v1/user",{method:"PUT",headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},body:JSON.stringify({password:a})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.msg||data.message||"Das Passwort konnte nicht gespeichert werden. Bitte fordere einen neuen Link an.");
  el("new-password").value="";el("confirm-password").value="";
  showLogin();
  el("login-error").hidden=false;el("login-error").textContent="Dein Passwort wurde geändert. Du kannst dich jetzt mit dem neuen Passwort anmelden.";
  el("login-error").style.color="#285b3d";
  el("login-error").style.background="#e8f3e9";
 }catch(e){node.textContent=errorMessage(e)}
 finally{btn.disabled=false;}
});

handleRecoveryLink();

function renderInsights(pages,topPages,topClicks){
 const daily=new Map();for(const r of pages)daily.set(r.day,(daily.get(r.day)||0)+Number(r.total||0));
 const best=[...daily].sort((a,b)=>b[1]-a[1])[0];
 el("avg-views").textContent=num.format(Math.round(sum(pages)/days));
 el("best-day").textContent=best?new Date(best[0]+"T12:00:00Z").toLocaleDateString("de-DE",{day:"2-digit",month:"short",timeZone:"UTC"})+" · "+num.format(best[1]):"–";
 el("best-page").textContent=topPages.length?(labels[topPages[0][0]]||topPages[0][0]):"–";
 el("best-click").textContent=topClicks.length?(labels[topClicks[0][0]]||topClicks[0][0]):"–";
}
el("export-csv").addEventListener("click",()=>{
 if(!token)return;
 const safe=v=>'"'+String(v??"").replace(/^[=+@\-\t\r]/,"'").replaceAll('"','""')+'"';
 const selected=rows.filter(recent);
 const csv="Datum;Art;Bereich;Anzahl\r\n"+selected.map(r=>[r.day,r.event_kind,labels[r.event_key]||r.event_key,r.total].map(safe).join(";")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
 const link=document.createElement("a");link.href=window.URL.createObjectURL(blob);link.download="happy-eck-statistik-"+days+"-tage.csv";link.click();setTimeout(()=>window.URL.revokeObjectURL(link.href),1000);
});

const berlinTime=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"});
const timeSelect=el("time-preset");
timeSelect.addEventListener("change",()=>{
 el("custom-time").hidden=timeSelect.value!=="custom";
 if(timeSelect.value!=="custom")renderTime();
});
el("time-apply").addEventListener("click",renderTime);
function localInputToDate(v){
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v))return null;
 // Convert the selected Hamm wall-clock time to an instant, accounting for daylight-saving time.

 const stamp=Date.parse(v+"Z");if(!Number.isFinite(stamp))return null;
 const format=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 const asWall=d=>format.format(d).replace(" ","T");
 const target=v;let guess=stamp-3600000;
 for(let i=0;i<3;i++){const actual=asWall(new Date(guess));const delta=Date.parse(target+"Z")-Date.parse(actual+"Z");guess+=delta;if(!delta)break;}
 return asWall(new Date(guess))===target?new Date(guess):null;
}
function renderTime(){
 if(!el("dashboard-view")||!minuteRows)return;
 const now=Date.now(),preset=timeSelect.value;let start,end=now;
 const dailyMode=preset==="30d"||preset==="90d";
 el("daily-summary").hidden=!dailyMode;el("daily-details").hidden=!dailyMode;
 el("time-summary").hidden=dailyMode;el("time-chart-section").hidden=dailyMode;
 if(dailyMode){days=preset==="90d"?90:30;render();el("time-note").textContent="Tagesstatistik der letzten "+days+" Tage · Für Minuten oder Stunden oben einen kürzeren Zeitraum auswählen.";return;}
 const durations={"15m":900000,"60m":3600000,"6h":21600000,"24h":86400000,"7d":604800000};
 if(preset==="custom"){
  const a=localInputToDate(el("time-from").value),b=localInputToDate(el("time-to").value);
  if(!a||!b||a>b){el("time-note").textContent="Bitte einen gültigen Zeitraum von–bis eingeben.";return;}
  start=a.getTime();end=b.getTime();
  if(end-start>7*86400000){el("time-note").textContent="Für minutengenaue Auswertungen maximal 7 Tage auswählen.";return;}
 }else if(preset==="today"){
  const parts=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  start=localInputToDate(parts+"T00:00")?.getTime()??now-86400000;
 }else start=now-(durations[preset]||3600000);
 const selected=minuteRows.filter(r=>{const t=Date.parse(r.bucket);return Number.isFinite(t)&&t>=start&&t<=end;});
 const pages=selected.filter(r=>r.event_kind==="page"),clicks=selected.filter(r=>r.event_kind==="click");
 el("time-summary").hidden=false;el("time-chart-section").hidden=false;
 el("time-views").textContent=num.format(sum(pages));el("time-clicks").textContent=num.format(sum(clicks));
 el("time-buckets").textContent=num.format(new Set(selected.map(r=>r.bucket)).size);
 const hourly=end-start>6*3600000;const interval=hourly?3600000:60000;
 const points=new Map();
 for(const r of pages){const t=Math.floor(Date.parse(r.bucket)/interval)*interval;points.set(t,(points.get(t)||0)+Number(r.total||0));}
 const chart=el("time-chart");chart.replaceChildren();
 const first=Math.floor(start/interval)*interval,last=Math.floor(end/interval)*interval;
 const totalPoints=Math.max(1,Math.floor((last-first)/interval)+1);
 const step=Math.max(1,Math.ceil(totalPoints/80));
 const entries=[];for(let t=first;t<=last;t+=interval*step){let count=0;for(let i=0;i<step;i++)count+=points.get(t+i*interval)||0;entries.push([t,count]);}
 const max=Math.max(1,...entries.map(x=>x[1]));
 for(let i=0;i<entries.length;i++){const [t,count]=entries[i];const wrap=document.createElement("div");wrap.className="chart-bar-wrap";wrap.title=berlinTime.format(new Date(t))+": "+num.format(count)+" Aufrufe";
 const bar=document.createElement("div");bar.className="chart-bar";bar.style.height=Math.max(2,count/max*172)+"px";
 const label=document.createElement("span");label.className="chart-label";label.textContent=(i===0||i===entries.length-1||i%Math.max(1,Math.ceil(entries.length/6))===0)?berlinTime.format(new Date(t)).split(", ").pop():"";
 wrap.append(bar,label);chart.append(wrap);}
 el("time-chart-title").textContent=hourly?"Aufrufe pro Stunde":"Aufrufe pro Minute";
 el("time-note").textContent=(selected.length?"":"Noch keine minutengenauen Daten in diesem Zeitraum. Die bisherigen Aufrufe findest du unter „Letzte 30 Tage“. · ")+"Zeitraum: "+berlinTime.format(new Date(start))+" bis "+berlinTime.format(new Date(end))+" · Uhrzeit Hamm.";
}

// Aktualisiere die Zahlen jede Minute, solange das Dashboard geöffnet ist.
window.setInterval(async()=>{
 if(!token||el("dashboard-view").hidden||document.hidden)return;
 try{await fetchStats()}catch(e){el("dashboard-status").textContent="Aktualisierung fehlgeschlagen: "+errorMessage(e);}
},60000);
