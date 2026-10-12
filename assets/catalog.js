/* Happy Eck product catalogue. Products are rendered as text, never raw HTML. */
(function(){
 const grid=document.getElementById("catalog-grid");
 const input=document.getElementById("catalog-search");
 const select=document.getElementById("catalog-group");
 const consent=document.getElementById("catalog-adult");
 const status=document.getElementById("catalog-results");
 const total=document.getElementById("catalog-total");
 const more=document.getElementById("catalog-more");
 if(!grid||!input||!select||!consent||!status||!more)return;
 const money=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"});
 let items=[],shown=0,filtered=[];
 const batch=24;
 const normalize=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("de");
 const el=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
 const initials=group=>({"Getränke":"GETRÄNKE","Wasser & Sport":"WASSER","Energy":"ENERGY","Chips":"SNACKS","Süßes & Snacks":"SÜSSES","Nudeln & Nüsse":"FOOD","Kaugummi":"KAUGUMMI","Alkohol":"18+"})[group]||"PRODUKT";
 function card(item){
  const article=el("article","catalog-product");
  const top=el("div","catalog-product-top");
  const tile=el("span","catalog-product-label",initials(item.group));
  const category=el("span","catalog-product-category",item.category);
  top.append(tile,category);
  article.append(top,el("h3","catalog-product-name",item.name),el("div","catalog-product-price",money.format(item.price)));
  article.append(el("small","catalog-product-note","Preis im Kiosk · ggf. zzgl. Pfand"));
  if(item.ageRestricted)article.append(el("span","catalog-product-age","Ab 18 Jahren"));
  return article;
 }
 function appendNext(){
  const subset=filtered.slice(shown,shown+batch),fragment=document.createDocumentFragment();
  subset.forEach(item=>fragment.append(card(item)));
  grid.append(fragment);shown+=subset.length;
  more.hidden=shown>=filtered.length;
  status.textContent=filtered.length===0?"Keine passenden Artikel gefunden.":shown+" von "+filtered.length+" passenden Produkten angezeigt.";
 }
 function render(){
  const query=normalize(input.value.trim());
  const category=select.value;
  filtered=items.filter(item=>(item.group!=="Alkohol"||consent.checked)&&(category==="Alle"||item.group===category)&&(!query||normalize(item.name+" "+item.category+" "+item.group).includes(query)));
  grid.replaceChildren();shown=0;appendNext();
 }
 async function load(){
  try{
   const response=await fetch("assets/products.json",{cache:"no-store"});
   if(!response.ok)throw new Error("products unavailable");
   const json=await response.json();
   items=json.items.filter(item=>typeof item.name==="string"&&typeof item.price==="number"&&Number.isFinite(item.price));
   total.textContent=items.length+" Produkte in unserer Liste";
   const groups=[...new Set(items.map(item=>item.group))].filter(group=>group!=="Vapes").sort((a,b)=>a.localeCompare(b,"de"));
   for(const group of groups){const option=el("option",null,group);option.value=group;select.append(option);}
   render();
  }catch(error){total.textContent="Produktliste derzeit nicht verfügbar";status.textContent="Bitte frage uns nach Preisen und Verfügbarkeit.";more.hidden=true;}
 }
 input.addEventListener("input",render);
 select.addEventListener("change",render);
 consent.addEventListener("change",render);
 more.addEventListener("click",appendNext);
 load();
})();
