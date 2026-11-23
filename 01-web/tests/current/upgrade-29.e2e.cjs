// Real shipped Web 2.9 -> current, including its active journey. Everything is
// isolated from the user's localStorage and workspace preview backup.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const current=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT);
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to a folder containing the built yoru-web-2.9 source ZIP.');
 const old=path.join(oldRoot,'yoru-web-2.9');if(!fs.existsSync(path.join(old,'index.html')))throw Error(`Missing built old version: ${old}`);
 const E=await import(pathToFileURL(path.join(old,'engine.js')).href),C=await import(pathToFileURL(path.join(old,'catalog.js')).href),now=Date.now(),s=E.createInitial(now);
 s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
 for(const [i,name] of ['Amphiprion clarkii','Chromodoris annae','Thunnus orientalis','Balaenoptera musculus'].entries()){
  const r=E.discover(s,C.idOfScientific(name),'upgrade29',now,()=>.4);assert.ok(r.ok);const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname=`2.9の仲間${i}`;f.size=1.07;f.growth=44;f.care.satiety=81;f.care.meals=3;
 }
 const archived=structuredClone(s.fish_instances[0]);archived.uid='archive_from_29';archived.species_id='sp_030';archived.nickname='2.9からの保管個体';s.fish_instances.push(archived);s.dex.discovered.push('sp_030');
 s.materials=13;s.breeding.partnerGiftUsed=true;s.daily.fed_count=1;s.daily.fed_by_tank={'current:marine':1};s.exploration.has_explored=true;
 s.pending=[{type:'discovery',destination:'cold-sea',result:{ok:true,type:'material',amount:1}}];
 assert.ok(E.startExplore(s,'reef',now).ok);s.exploration.active.started_at=now-60000;s.exploration.active.ends_at=now+1800000;const timer={...s.exploration.active};
 const files={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 let generation='old';const server=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}
  const type=f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':f.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Cache-Control':'no-store','Content-Type':type});res.end(fs.readFileSync(path.join(generation==='old'?old:current,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed29')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed29','1');}},{key:E.SAVE_KEY,value:s});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>caches.keys().then(keys=>keys.includes('night-aquarium-v12')));await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
  const before=await page.evaluate(()=>window.__game.getState());assert.match(await page.locator('.modal-heading').innerText(),/栄養キューブ/);assert.deepEqual(before.exploration.active,timer);
  generation='new';await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await page.waitForFunction(async()=>{const keys=await caches.keys();return keys.includes('night-aquarium-v16')&&!keys.includes('night-aquarium-v14')&&!keys.includes('night-aquarium-v12');},null,{timeout:25000});
  await page.reload();await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();const after=await page.evaluate(()=>window.__game.getState());
  const identity=x=>x.fish_instances.map(f=>[f.uid,f.species_id,f.nickname,f.size,f.growth,f.care?.satiety,f.care?.meals]);
  assert.deepEqual(identity(after),identity(before));assert.deepEqual(after.dex.discovered,before.dex.discovered);assert.deepEqual(after.exploration.active,timer);assert.equal(after.materials,13);assert.equal(after.daily.fed_count,1);assert.equal(after.daily.fed_by_tank['current:marine'],1);assert.equal(after.breeding.partnerGiftUsed,true);assert.deepEqual(after.pending,before.pending);
  assert.match(await page.locator('.modal-heading').innerText(),/栄養キューブ/);await page.locator('[data-action=ack-pending]').click();await page.locator('[data-screen=explore].nav-item').click();
  assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-destination'),'reef');assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-renderer'),'webgl');assert.equal(await page.locator('.journey-canvas').count(),1);assert.equal((await page.evaluate(()=>window.__game.getJourneyInfo())).creatures.length,5);
  await page.locator('[data-screen=home].nav-item').click();await page.locator('[data-screen=settings].nav-item').click();await page.locator('.archive-box summary').click();assert.match(await page.locator('.archive-list').innerText(),/2.9からの保管個体/);
  await ctx.setOffline(true);await page.reload();await page.locator('[data-action=start]').click();await page.locator('[data-screen=explore].nav-item').click();assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-renderer'),'webgl');
  const offline=await page.evaluate(()=>window.__game.getState());assert.deepEqual(identity(offline),identity(after));assert.deepEqual(offline.exploration.active,timer);assert.equal(offline.materials,13);assert.deepEqual(errors,[]);
  console.log('UPGRADE 2.9: actual v12 → v16, fish, materials, pending, timer, archive, 3D voyage and offline preserved OK');
 }finally{await ctx.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
