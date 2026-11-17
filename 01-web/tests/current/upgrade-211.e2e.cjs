// Uses the actual released 2.11 standalone HTML on an isolated same-origin
// test server. Never reads or writes the user's preview-data or port 3000.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const current=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT);
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to a folder containing the released yoru-web-2.11 source and built HTML.');
 const old=path.join(oldRoot,'yoru-web-2.11');if(!fs.existsSync(path.join(old,'index.html')))throw Error('Missing released 2.11 HTML: '+old);
 const E=await import(pathToFileURL(path.join(old,'engine.js')).href),C=await import(pathToFileURL(path.join(old,'catalog.js')).href),L=await import(pathToFileURL(path.join(old,'decor-layout.js')).href),now=Date.now(),s=E.createInitial(now);
 s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
 const names=['Thunnus orientalis','Thunnus orientalis','Rhincodon typus','Aurelia coerulea','Amphiprion clarkii','Oryzias latipes','Toxotes jaculatrix'];
 for(const [i,name] of names.entries()){
  const r=E.discover(s,C.idOfScientific(name),'old-211',now,()=>.2+i*.01,'current');assert.equal(r.type,'fish');const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname='2.11の仲間'+i;
  if(i<2){f.sex=i?'female':'male';f.growth=50;f.care.satiety=83;}
 }
 const archived=structuredClone(s.fish_instances[0]);archived.uid='archived_211_unknown';archived.species_id='old_unknown_211';archived.nickname='保管した旧個体';s.fish_instances.push(archived);s.dex.discovered.push('old_unknown_211');
 assert.ok(L.setDecorPosition(s,'current','marine','plants',0,{x:1,z:-1,rotation:45}));assert.ok(L.setDecorPosition(s,'current','fresh','plants',0,{x:2,z:1,rotation:90}));
 E.refreshBreeding(s,now+1,()=>.9);for(const timer of Object.values(s.breeding.timers))timer.next_at=now+7200000;assert.equal(Object.keys(s.breeding.timers).length,1);
 s.daily.fed_by_tank={'current:marine':1,'current:fresh':1};s.materials=7;
 s.exploration.has_explored=true;s.exploration.active={destination:'cold-sea',started_at:now,ends_at:now+7200000,first:false,demo:true};
 s.pending=[{type:'discovery',destination:'fresh',result:{ok:true,type:'material',amount:1}}];
 const files={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 let generation='old';const server=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}const type=f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':f.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Cache-Control':'no-store','Content-Type':type});res.end(fs.readFileSync(path.join(generation==='old'?old:current,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const core=x=>({fish:x.fish_instances,dex:x.dex,layouts:x.tank.layouts,breeding:x.breeding,active:x.exploration.active,pending:x.pending,materials:x.materials,fed:x.daily.fed_by_tank});
 try{
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed211actual')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed211actual','1');}},{key:E.SAVE_KEY,value:s});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>caches.keys().then(k=>k.includes('night-aquarium-v14')));await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
  const before=await page.evaluate(()=>window.__game.getState());assert.equal(before.fish_instances.length,8);assert.equal(before.pending.length,1);assert.equal(before.exploration.active.destination,'cold-sea');
  generation='new';await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await page.waitForFunction(async()=>{const k=await caches.keys();return k.includes('night-aquarium-v16')&&!k.includes('night-aquarium-v14');},null,{timeout:25000});
  await page.reload();await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();const after=await page.evaluate(()=>window.__game.getState());assert.deepEqual(core(after),core(before));
  assert.match(await page.locator('.modal-heading').innerText(),/キューブ/);await page.locator('[data-action=ack-pending]').click();
  await page.locator('.room-card[data-room=current]').click();assert.equal(await page.locator('[data-action=exhibit-section]').count(),4);
  for(const [section,expected] of [['cool',[s.fish_instances[0].uid,s.fish_instances[1].uid]],['warm',[s.fish_instances[2].uid]],['review',[s.fish_instances[3].uid,s.fish_instances[4].uid]]]){
   await page.locator(`[data-action=exhibit-section][data-section=${section}]`).click();const scene=await page.evaluate(()=>window.__game.getSceneInfo());assert.deepEqual(new Set(scene.entries.map(e=>e.uid)),new Set(expected));
  }
  const nowState=await page.evaluate(()=>window.__game.getState());assert.deepEqual(nowState.fish_instances,before.fish_instances);assert.deepEqual(nowState.breeding,before.breeding);assert.deepEqual(nowState.tank.layouts,before.tank.layouts);assert.deepEqual(nowState.exploration.active,before.exploration.active);
  await page.locator('[data-screen=explore].nav-item').click();assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-destination'),'cold-sea');assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-spot'),'');
  await page.locator('[data-screen=settings].nav-item').click();const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-current]').click()]);const exported=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.deepEqual(exported.fish_instances,before.fish_instances);assert.deepEqual(exported.breeding,before.breeding);assert.deepEqual(exported.exploration.active,before.exploration.active);
  await ctx.setOffline(true);await page.reload();await page.locator('[data-action=start]').click();const offline=await page.evaluate(()=>window.__game.getState());assert.deepEqual(offline.fish_instances,before.fish_instances);assert.deepEqual(offline.exploration.active,before.exploration.active);assert.deepEqual(offline.breeding,before.breeding);assert.deepEqual(errors,[]);
  console.log('UPGRADE 2.11: real v14 → v16, 8 individual records, three ocean views, timers, active old trip, inventory, layouts, pending, JSON and offline all preserved OK');
 }finally{await ctx.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
