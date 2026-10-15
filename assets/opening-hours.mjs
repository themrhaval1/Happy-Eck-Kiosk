/* Happy Eck opening hours, always evaluated in Europe/Berlin time. */
const berlinClock=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
const days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
/** Day: Sunday=0 ... Saturday=6; hour is local Berlin 0..23. */
export function getOpeningStatus(day,hour,minute){
  if(!Number.isInteger(day)||day<0||day>6||!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)throw new RangeError("Invalid day or time");
  const t=hour*60+minute;
  const daytime=t>=8*60+30;
  // Overnight opening after Friday and Saturday is on Saturday/Sunday mornings.
  return {kiosk:daytime||((day===6||day===0)&&t<90),gls:daytime};
}
export function getBerlinOpeningStatus(now=new Date()){
  const parts=berlinClock.formatToParts(now);
  const find=type=>parts.find(part=>part.type===type)?.value;
  const day=days[find("weekday")];
  const hour=Number(find("hour"))%24;
  const minute=Number(find("minute"));
  return getOpeningStatus(day,hour,minute);
}
function updateLiveStatus(element,open){
  if(!element)return;
  element.dataset.status=open?"open":"closed";
  const label=element.querySelector(".hours-live-label");
  if(label)label.textContent=open?"Jetzt geöffnet":"Jetzt geschlossen · ab 08:30 Uhr";
}
export function startOpeningHours(){
  const kiosk=document.getElementById("kiosk-live");
  const gls=document.getElementById("gls-live");
  if(!kiosk||!gls)return;
  const refresh=()=>{
    try{
      const status=getBerlinOpeningStatus();
      updateLiveStatus(kiosk,status.kiosk);
      updateLiveStatus(gls,status.gls);
    }catch{
      for(const el of [kiosk,gls]){
        el.dataset.status="loading";
        const label=el.querySelector(".hours-live-label");
        if(label)label.textContent="Öffnungszeiten siehe unten";
      }
    }
  };
  refresh();
  window.setInterval(refresh,60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
}
if(typeof document!=="undefined")startOpeningHours();
