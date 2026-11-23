// Upgrade the actual delivered Web 2.7 build to this version, in isolated data.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const current=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT);
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to a folder containing the built yoru-web-2.7 source ZIP.');
 const old=path.join(oldRoot,'yoru-web-2.7');if(!fs.existsSync(path.join(old,'index.html')))throw Error(`Missing built old version: ${old}`);
 const E=await import(pathToFileURL(path.join(old,'engine.js')).href),C=await import(pathToFileURL(path.join(old,'catalog.js')).href);
 const now=Date.now(),s=E.createInitial(now);s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
 const names=['Amphiprion clarkii','Heterodontus japonicus','Thunnus orientalis','Orcinus orca','Balaenoptera musculus'];
 for(const [i,name] of names.entries()){const r=E.discover(s,C.idOfScientific(name),'upgrade27',now,()=>.4);assert.ok(r.ok);const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname=`前版${i}`;f.size=1.07;f.growth=44;}
 const archived=structuredClone(s.fish_instances[0]);archived.uid='archive_from_27';archived.species_id='sp_030';archived.nickname='保管した旧個体';s.fish_instances.push(archived);s.dex.discovered.push('sp_030');s.pending=[];
 assert.ok(E.startExplore(s,'cold-sea',now).ok);s.exploration.active.ends_at=now+1800000;const oldTimer={...s.exploration.active};
 const files={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 let generation='old';const server=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}const type=f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':f.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Cache-Control':'no-store','Content-Type':type});res.end(fs.readFileSync(path.join(generation==='old'?old:current,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed27')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed27','1');}},{key:E.SAVE_KEY,value:s});
  await page.goto(url);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>caches.keys().then(keys=>keys.includes('night-aquarium-v10')));await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
  const before=await page.evaluate(()=>window.__game.getState());const identity=x=>x.fish_instances.map(f=>[f.uid,f.species_id,f.nickname,f.size,f.growth]);assert.equal(before.fish_instances.length,6);assert.deepEqual(before.exploration.active,oldTimer);
  generation='new';await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await page.waitForFunction(async()=>{const keys=await caches.keys();return keys.includes('night-aquarium-v16')&&!keys.includes('night-aquarium-v14')&&!keys.includes('night-aquarium-v12')&&!keys.includes('night-aquarium-v10')&&!keys.includes('night-aquarium-v11')},null,{timeout:25000});
  await page.reload();await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();const after=await page.evaluate(()=>window.__game.getState());
  assert.deepEqual(identity(after),identity(before));assert.deepEqual(after.dex.discovered,before.dex.discovered);assert.deepEqual(after.exploration.active,oldTimer);
  await page.locator('[data-screen=explore].nav-item').click();assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-destination'),'cold-sea');assert.ok(await page.locator('[data-journey-progress]').isVisible());assert.equal(await page.locator('[data-action=journey-observe]').count(),0);
  await page.locator('[data-screen=dex].nav-item').click();await page.locator('#dex-search').fill('クロマグロ');await page.locator('.dex-cell').click();assert.equal(await page.locator('.detail-size-label').innerText(),'大型');await page.locator('.sheet-close').click();
  await page.locator('[data-screen=settings].nav-item').click();await page.locator('.archive-box summary').click();assert.match(await page.locator('.archive-list').innerText(),/保管した旧個体/);
  await ctx.setOffline(true);await page.reload();await page.locator('[data-action=start]').click();await page.locator('[data-screen=explore].nav-item').click();assert.ok(await page.locator('[data-journey-progress]').isVisible());assert.equal(await page.locator('[data-action=journey-observe]').count(),0);assert.deepEqual(identity(await page.evaluate(()=>window.__game.getState())),identity(after));
  assert.deepEqual(errors,[]);console.log('UPGRADE 2.7: v10 → v16, fish identity, archive, in-progress timer, reclassified tuna and offline journey preserved OK');
 }finally{await ctx.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
