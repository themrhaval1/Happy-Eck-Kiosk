import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium,firefox,webkit} from "playwright";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
let server,origin;
before(async()=>{
  server=createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
      const path=resolve(root,"."+pathname.replace(/\/$/,"/index.html"));
      if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
      const content=await readFile(path);
      const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".jpg":"image/jpeg",".svg":"image/svg+xml"}[extname(path)]||"application/octet-stream";
      res.writeHead(200,{"Content-Type":mime,"Cache-Control":"no-store"}).end(content);
    }catch{res.writeHead(404).end();}
  });
  await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
  origin="http://127.0.0.1:"+server.address().port;
});
after(async()=>{if(server)await new Promise(ok=>server.close(ok));});

for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
  test(engineName+": desktop and mobile layout, menu and assets",async()=>{
    const browser=await engine.launch({headless:true});
    try{
      for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:768,height:1024}]){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on("response",response=>{
          if(new URL(response.url()).origin===origin&&response.status()>=400)
            errors.push(response.status()+" "+response.url());
        });
        page.on("pageerror",error=>errors.push(error.message));
        // Prevent all real contacts with third-party hosts in browser tests.
        await page.route("**/*",route=>{
          const url=new URL(route.request().url());
          return url.origin===origin?route.continue():route.abort();
        });
        const response=await page.goto(origin,{waitUntil:"load"});
        assert.equal(response.status(),200);
        const heading=await page.locator("h1").innerText();
        assert.match(heading,/Dein Kiosk\./);
        assert.match(heading,/Dein Eck\./);
        const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
        assert.ok(dims.scroll<=dims.viewport+3,engineName+" "+viewport.width+"px horizontal overflow: "+JSON.stringify(dims));
        assert.deepEqual(errors,[],engineName+" runtime errors");
        const toggle=page.locator(".menu-btn");
        const nav=page.locator("#nav-links");
        if(await toggle.isVisible()){
          await toggle.click();
          assert.equal(await toggle.getAttribute("aria-expanded"),"true");
          assert.equal(await nav.isVisible(),true);
          await page.keyboard.press("Escape");
          assert.equal(await toggle.getAttribute("aria-expanded"),"false");
          assert.equal(await nav.isVisible(),false);
        }else{
          assert.equal(await nav.isVisible(),true);
        }
        await page.locator("#open-directions").click();
        assert.equal(await page.locator("#directions-dialog").isVisible(),true);
        assert.equal(await page.locator("#directions-dialog a").count(),2);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#directions-dialog").isVisible(),false);
        await page.locator(".gallery-zoom").first().click();
        assert.equal(await page.locator("#gallery-dialog").isVisible(),true);
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#gallery-count").innerText(),"2 / 8");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#gallery-dialog").isVisible(),false);
        const photo=page.locator(".kiosk-storefront > img");
        assert.ok(await photo.evaluate(img=>img.complete && img.naturalWidth>0));
        const photoLink=page.getByRole("link",{name:"Kioskfoto in einem neuen Tab öffnen"});
        assert.equal(await photoLink.getAttribute("href"),"assets/happy-eck-real-kiosk.jpg");
        assert.deepEqual(errors,[],engineName+" runtime errors after interactions");
        await page.close();
      }
    }finally{await browser.close();}
  });
  test(engineName+": job file-size validation without sending data",async()=>{
    const browser=await engine.launch({headless:true});
    try{
      const page=await browser.newPage();
      await page.route("**/*",route=>{
        const url=new URL(route.request().url());
        return url.origin===origin?route.continue():route.abort();
      });
      await page.goto(origin+"/jobs.html",{waitUntil:"load"});
      const input=page.locator("#app-cv");
      await input.setInputFiles({name:"lebenslauf.pdf",mimeType:"application/pdf",buffer:Buffer.alloc(10*1024*1024+1)});
      const invalid=await input.evaluate(el=>el.validationMessage);
      assert.match(invalid,/10 MB/);
      assert.equal(await page.locator("form").count(),1);
      await page.close();
    }finally{await browser.close();}
  });
}
