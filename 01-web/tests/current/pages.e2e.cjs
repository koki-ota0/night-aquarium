// Static Pages-like hosting under /night-aquarium/, synthetic browser save only.
// Run npm run build:pages first. No preview server or real save API is used.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),dist=path.join(root,'dist'),prefix='/night-aquarium/';
(async()=>{
 const E=await import('../../engine.js'),{idOfScientific}=await import('../../catalog.js'),{PAGES_FILES}=await import('../../tools/package-pages.mjs');
 assert.ok(fs.existsSync(path.join(dist,'index.html')),'Run npm run build:pages first');
 const allowed=new Set(PAGES_FILES),requests=[];
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://test.invalid').pathname;requests.push(pathname);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
  const file=pathname.slice(prefix.length)||'index.html';if(!allowed.has(file)){res.writeHead(404).end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.md':'text/plain; charset=utf-8'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(dist,file)));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}${prefix}`;let browser;
 try{
  for(const file of ['preview-data/current.json','.env','package.json','main.js'])assert.equal((await fetch(base+file)).status,404);
  const seed=E.createInitial(Date.now());seed.started=true;seed.tutorial={explore:true,discover:true,pet:true};
  assert.ok(E.discover(seed,idOfScientific('Amphiprion clarkii'),'test',Date.now(),()=>.4).ok);seed.fish_instances[0].nickname='Pages isolated test';seed.pending=[];
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',acceptDownloads:true});
  await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:E.SAVE_KEY,value:seed});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  async function enter(){await page.waitForFunction(()=>window.__game&&__game.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();assert.equal(await page.locator('.room-card').count(),14);await page.locator('[data-action=room][data-room=reef]').click();await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas.aquarium-canvas');if(!canvas)return false;const gl=canvas.getContext('webgl2');if(!gl||gl.isContextLost())return false;
   const sample=document.createElement('canvas');sample.width=sample.height=24;const ctx=sample.getContext('2d');ctx.drawImage(canvas,0,0,24,24);return ctx.getImageData(0,0,24,24).data.some((value,index)=>index%4===3&&value>30);
  });}
  await page.goto(base);await enter();assert.equal(await page.evaluate(()=>__game.getBackupInfo().status),'local','static hosting falls back to browser-only saves');
  assert.equal(await page.locator('link[rel=manifest]').getAttribute('href'),'./manifest.webmanifest');
  const scope=await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;return registration.scope;});assert.equal(scope,base);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cached=await page.evaluate(async()=>{const urls=[];for(const name of await caches.keys())for(const request of await(await caches.open(name)).keys())urls.push(request.url);return urls;});
  assert.ok(cached.some(url=>url.endsWith(prefix+'manifest.webmanifest')));assert.ok(cached.some(url=>url.endsWith(prefix+'assets/icon-192.png')));assert.ok(!cached.some(url=>url.includes('/__yoru/')));
  await page.locator('[data-screen=settings].nav-item').click();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-current]').click()]);
  const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.fish_instances[0].nickname,'Pages isolated test');assert.equal(exported.fish_instances[0].uid,seed.fish_instances[0].uid);
  await context.setOffline(true);await page.reload();await enter();
  const restored=await page.evaluate(()=>__game.getState().fish_instances[0]);assert.equal(restored.nickname,'Pages isolated test');assert.equal(restored.uid,seed.fish_instances[0].uid);
  assert.ok(!requests.some(url=>['/sw.js','/manifest.webmanifest','/assets/icon-192.png','/__yoru/preview-save'].includes(url)),'app resources stay inside the project path');
  assert.deepEqual(errors,[]);console.log('PAGES: project-path assets, WebGL2 pixels, browser-only save/export, scoped service worker, offline reload and private-file 404s OK');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
