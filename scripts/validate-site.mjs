#!/usr/bin/env node
// Offline structural checks for Happy Eck Kiosk. No third-party packages.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const cwd=process.cwd();
const pages=['index.html','sortiment.html','angebote.html','paketshop.html','ueber-uns.html','kontakt.html','bewerbung.html','impressum.html','datenschutz.html'];
const errors=[];
const complain=(page,msg)=>errors.push(page+': '+msg);
for(const page of pages){
  const file=path.join(cwd,page);
  if(!fs.existsSync(file)){complain(page,'file missing');continue;}
  const html=fs.readFileSync(file,'utf8');
  for(const [regexp,msg] of [
    [/<html[^>]+lang="de"/i,'German page language missing'],
    [/<meta[^>]+name="viewport"/i,'responsive viewport missing'],
    [/<main\b/i,'main landmark missing'],
    [/<h1\b/i,'H1 heading missing'],
    [/href="impressum.html"/i,'Impressum link missing'],
    [/href="datenschutz.html"/i,'privacy link missing']
  ]) if(!regexp.test(html))complain(page,msg);
  const h1=(html.match(/<h1\b/gi)||[]).length;
  if(h1!==1)complain(page,'expected one H1, got '+h1);
  for(const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g)){
    const url=m[1];
    if(!url || url.startsWith('#') || /^(https?:|mailto:|tel:|data:)/i.test(url))continue;
    const pathname=decodeURIComponent(url.split(/[?#]/)[0]);
    const dest=path.resolve(cwd,pathname);
    if(!dest.startsWith(cwd+path.sep)||!fs.existsSync(dest))complain(page,'broken local link: '+url);
  }
  for(const m of html.matchAll(/<img\b([^>]+)>/gi)) if(!/\balt="/.test(m[1]))complain(page,'image without alt text');
  for(const m of html.matchAll(/<a\b([^>]+)>/gi)){
    if(/target="_blank"/.test(m[1])&&!/rel="[^"]*noopener[^"]*"/.test(m[1]))complain(page,'target blank without noopener');
  }
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc=/.test(m[1]) || /\btype="application\//.test(m[1]))continue;
    try{new vm.Script(m[2],{filename:page});}catch(e){complain(page,'JavaScript error: '+e.message)}
  }
  if(/4\s*[×x]\s*Red Bull\s*für\s*8\s*€/i.test(html))complain(page,'expired offer is present');
}
for(const file of ['website.css','site.js']) if(!fs.existsSync(path.join(cwd,file)))errors.push('missing '+file);
if(fs.existsSync('site.js')){try{new vm.Script(fs.readFileSync('site.js','utf8'),{filename:'site.js'});}catch(e){errors.push('site.js: '+e.message)}}
if(errors.length){console.error('Website checks failed:\n'+errors.map(x=>' - '+x).join('\n'));process.exitCode=1}
else console.log('Website checks passed: '+pages.length+' pages, all local links, image alt tags, privacy links, and inline JavaScript syntax.');
