import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {getOpeningStatus,getBerlinOpeningStatus} from "../assets/opening-hours.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(join(root,"index.html"),"utf8");
const js=readFileSync(join(root,"assets/site.js"),"utf8");
const css=readFileSync(join(root,"assets/site.css"),"utf8");
const matchAll=(text,regex)=>[...text.matchAll(regex)].map(m=>m[1]);

test("HTML includes essential kiosk information and all business areas",()=>{
  for(const item of ["Dein Kiosk.","Dein Eck.","Caldenhofer Weg 207","59063 Hamm","0176 61020308","happyeck10@gmail.com"]){
    assert.ok(html.includes(item),item);
  }
  for(const id of ["main","angebot","sortiment","galerie","paketshop","oeffnungszeiten","bewertungen","jobs","kontakt","fragen","anfahrt"]){
    assert.ok(html.includes(`id="${id}"`),`Missing #${id}`);
  }
});

test("All internal anchors resolve to exactly one ID",()=>{
  const ids=matchAll(html,/\bid="([^"]+)"/g);
  assert.equal(ids.length,new Set(ids).size,"Duplicate HTML IDs");
  for(const hash of matchAll(html,/href="#([^"]+)"/g)){
    assert.ok(ids.includes(hash),`Broken anchor #${hash}`);
  }
});

test("Local style, image and script resources are present",()=>{
  const resources=[
    ...matchAll(html,/\bsrc="(assets\/[^"]+)"/g),
    ...matchAll(html,/\bhref="(assets\/[^"]+)"/g)
  ];
  assert.ok(resources.length>=12);
  for(const name of resources){
    assert.ok(existsSync(join(root,decodeURIComponent(name))),`Missing ${name}`);
  }
});

test("Required forms exist and do not transmit during tests",()=>{
  const forms=matchAll(html,/<form\b([^>]*)>/g);
  assert.equal(forms.length,2);
  for(const form of forms){
    assert.match(form,/method="POST"/);
    assert.match(form,/action="https:\/\/formsubmit\.co\//);
  }
  assert.match(html,/id="job-cv"[^>]*accept="[^"]*\.pdf/);
  assert.match(js,/10485760/,"The 10 MB upload limit is enforced in the browser");
  assert.match(html,/name="Geburtsdatum"/);
});

test("Links opening a new tab are protected",()=>{
  for(const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)){
    assert.match(match[0],/rel="[^"]*noopener/,`Missing noopener: ${match[0].slice(0,140)}`);
  }
});

test("Only one mobile action bar exists",()=>{
  assert.equal((html.match(/class="mobile-action-bar"/g)||[]).length,1);
  assert.equal((html.match(/class="mobile-bottom-nav"/g)||[]).length,0);
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
  assert.ok(css.length>10000);
  assert.ok(js.length>1000);
});

test("Catalog data is present, accurately priced and excludes vape advertising",()=>{
  const products=JSON.parse(readFileSync(join(root,"assets/products.json"),"utf8")).items;
  assert.equal(products.length,414);
  assert.equal(products.filter(item=>item.group==="Vapes").length,0);
  assert.ok(products.some(item=>item.name==="Red Bull Original 0,25 l"&&item.price===3));
  assert.ok(products.some(item=>item.name==="Pringles Original"&&item.price===4));
  assert.equal(new Set(products.map(item=>item.group+"|"+item.name+"|"+item.price)).size,products.length);
  assert.ok(html.includes('id="catalog-search"'));
  assert.ok(html.includes('id="catalog-grid"'));
  assert.ok(html.includes('src="assets/catalog.js"'));
});
