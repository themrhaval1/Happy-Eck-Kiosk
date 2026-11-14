import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {getOpeningStatus,getBerlinOpeningStatus} from "../assets/opening-hours.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const read=(path)=>readFileSync(join(root,path),"utf8");
const html=read("index.html");
const pages=["index.html","bestellen.html","guthaben.html","gls.html","kontakt.html",
  "kontakt-erfolg.html","jobs.html","bewerbung-erfolg.html","oeffnungszeiten.html","anfahrt/index.html"];
const matchAll=(text,regex)=>[...text.matchAll(regex)].map(m=>m[1]);

test("Homepage includes essential information, sections and subpage links",()=>{
  for(const item of ["Dein Kiosk.","Dein Eck.","Caldenhofer Weg 207","59063 Hamm","0176 61020308","happyeck10@gmail.com"]){
    assert.ok(html.includes(item),item);
  }
  for(const id of ["main","ueber-uns","sortiment","services","bewertungen","anfahrt"]){
    assert.ok(html.includes(`id="${id}"`),`Missing #${id}`);
  }
  for(const page of ["gls","guthaben","bestellen","oeffnungszeiten","jobs","kontakt"]){
    assert.ok(html.includes(`href="${page}.html"`),`Missing link to ${page}`);
  }
  assert.match(html,/href="\/anfahrt\/" id="open-directions"/);
  assert.match(html,/href="tel:\+4917661020308" style="color:#000!important;background:#f4d9a3!important"/);
});

test("Internal pages, anchors and resources resolve",()=>{
  const site="https://happyeck.de";
  for(const page of pages){
    const source=read(page);
    const ids=matchAll(source,/\bid="([^"]+)"/g);
    assert.equal(ids.length,new Set(ids).size,`${page} has duplicate IDs`);
    for(const value of matchAll(source,/\b(?:src|href|poster)="([^"]+)"/g)){
      const url=new URL(value,`${site}/${page}`);
      if(url.origin!==site)continue;
      let path=decodeURIComponent(url.pathname.slice(1));
      if(!path||path.endsWith("/"))path+="index.html";
      assert.ok(existsSync(join(root,path)),`${page} links to missing resource ${value}`);
      if(url.hash&&path.endsWith(".html")){
        const id=decodeURIComponent(url.hash.slice(1));
        assert.ok(matchAll(read(path),/\bid="([^"]+)"/g).includes(id),`${page} has a broken link to ${value}`);
      }
    }
  }
});

test("The contact and job forms point to their respective success pages",()=>{
  for(const [page,success] of [["kontakt","kontakt"],["jobs","bewerbung"]]){
    const source=read(page+".html");
    const forms=matchAll(source,/<form\b([^>]*)>/g);
    assert.equal(forms.length,1);
    assert.match(forms[0],/method="POST"/);
    assert.match(forms[0],/action="https:\/\/formsubmit\.co\//);
    assert.ok(source.includes(`name="_next" value="https://happyeck.de/${success}-erfolg.html"`));
  }
  const jobs=read("jobs.html");
  assert.match(jobs,/id="app-cv"[^>]*accept="[^"]*\.pdf/);
  assert.match(jobs,/name="Geburtsdatum"/);
});

test("Links opening a new tab are protected",()=>{
  for(const page of pages){
    for(const match of read(page).matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)){
      assert.match(match[0],/rel="[^"]*noopener/,`${page}: missing noopener: ${match[0].slice(0,140)}`);
    }
  }
});

test("Homepage hero shows the real storefront and four customer actions",()=>{
  const hero=html.match(/<section class="hero kiosk-hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero);
  assert.match(hero,/src="assets\/happy-eck-real-kiosk\.jpg"/);
  assert.match(hero,/href="assets\/happy-eck-real-kiosk\.jpg"/);

  for(const path of ["bestellen.html","/anfahrt/","oeffnungszeiten.html","gls.html"]){
    assert.ok(hero.includes(`href="${path}"`),path);
  }
});

test("Hours: weekday opens 08:30 and closes at midnight",()=>{
  assert.deepEqual(getOpeningStatus(1,8,29),{kiosk:false,gls:false});
  assert.deepEqual(getOpeningStatus(1,8,30),{kiosk:true,gls:true});
  assert.deepEqual(getOpeningStatus(1,23,59),{kiosk:true,gls:true});
  assert.deepEqual(getOpeningStatus(2,0,0),{kiosk:false,gls:false});
});
test("Hours: both weekend overnight intervals close precisely at 01:30",()=>{
  for(const day of [6,0]){
    assert.deepEqual(getOpeningStatus(day,0,0),{kiosk:true,gls:false});
    assert.deepEqual(getOpeningStatus(day,1,29),{kiosk:true,gls:false});
    assert.deepEqual(getOpeningStatus(day,1,30),{kiosk:false,gls:false});
  }
  assert.deepEqual(getOpeningStatus(5,0,45),{kiosk:false,gls:false});
});
test("Europe/Berlin timezone works in both summer and winter",()=>{
  assert.deepEqual(getBerlinOpeningStatus(new Date("2026-07-03T22:45:00Z")),{kiosk:true,gls:false});
  assert.deepEqual(getBerlinOpeningStatus(new Date("2026-12-04T23:45:00Z")),{kiosk:true,gls:false});
});
test("Invalid hours are rejected",()=>{
  assert.throws(()=>getOpeningStatus(9,10,0),RangeError);
  assert.throws(()=>getOpeningStatus(1,24,0),RangeError);
});
test("External design files are populated",()=>{
  for(const path of ["assets/home-shop.css"]){
    assert.ok(read(path).length>1000,path);
  }
});

test("Archived catalog data is well-formed and excludes vape entries",()=>{
  const products=JSON.parse(readFileSync(join(root,"assets/products.json"),"utf8")).items;
  assert.equal(products.length,414);
  assert.equal(products.filter(item=>item.group==="Vapes").length,0);
  assert.ok(products.some(item=>item.name==="Red Bull Original 0,25 l"&&item.price===3));
  assert.ok(products.some(item=>item.name==="Pringles Original"&&item.price===4));
  assert.equal(new Set(products.map(item=>item.group+"|"+item.name+"|"+item.price)).size,products.length);
});

test("Homepage gallery contains eight viewable images clearly labeled as illustrations",()=>{
  const gallery=html.match(/<section class="section shop-gallery"[\s\S]*?<\/section>/)?.[0];
  assert.ok(gallery);
  assert.equal((gallery.match(/class="gallery-zoom"/g)||[]).length,8);
  assert.match(gallery,/Illustrationen und keine Originalfotos/);
});

test("Homepage hours match the published kiosk hours, not the GLS hours",()=>{
  const details=read("oeffnungszeiten.html").match(/<h3>Happy Eck Kiosk<\/h3>(<dl>.*?<\/dl>)/)?.[1];
  const summary=html.match(/<aside class="kiosk-hours"[\s\S]*?(<dl>.*?<\/dl>)/)?.[1];
  assert.ok(details);
  assert.equal(summary,details);
});
