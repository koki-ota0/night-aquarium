// Actual shipped 2.12 engine + v15 HTML/SW → 2.13, isolated origin only.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const current=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT);
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to a folder containing the built shipped yoru-web-2.12 source.');
 const old=path.join(oldRoot,'yoru-web-2.12');if(!fs.existsSync(path.join(old,'index.html')))throw Error('Missing shipped 2.12 HTML: '+old);
 const E=await import(pathToFileURL(path.join(old,'engine.js')).href),C=await import(pathToFileURL(path.join(old,'catalog.js')).href),L=await import(pathToFileURL(path.join(old,'decor-layout.js')).href),now=Date.now();
 const s=E.createInitial(now);s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
 // 25 genuinely old warm-tank occupants; 2.12 allowed an over-cap tank.
 const warm=C.CATALOG.filter(sp=>sp.kind!=='environment'&&C.preferredRoom(sp)==='current'&&C.exhibitSection(sp,'current')==='warm'),whale=C.idOfScientific('Rhincodon typus');
 const choices=[whale,whale,...Array.from({length:23},(_,i)=>warm.filter(sp=>sp.id!==whale)[i%(warm.length-1)].id)];
 for(const [i,id] of choices.entries()){const r=E.discover(s,id,'2.12 fixture',now+i,()=>.2+i*.005,'current');assert.equal(r.type,'fish');const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname=`大切な仲間${i}`;f.size=1.04;if(i<2){f.sex=i?'female':'male';f.growth=50;f.care.satiety=85;}}
 assert.equal(s.fish_instances.length,25);assert.ok(s.fish_instances.every(f=>f.placed!==false&&!('exhibit_section' in f)));
 E.refreshBreeding(s,now+30,()=>.9);const oldKey=`current|marine|${whale}`;assert.ok(s.breeding.timers[oldKey]);s.breeding.timers[oldKey].next_at=now+7200000;
 s.daily.fed_by_tank={'current:marine':1};s.materials=17;assert.ok(L.setDecorPosition(s,'current','marine','plants',0,{x:1,z:-1,rotation:45}));
 s.exploration.has_explored=true;s.exploration.active={destination:'fresh',spot:'lake',started_at:now,ends_at:now+7200000,first:false,demo:true};s.pending=[{type:'discovery',destination:'cold-sea',result:{ok:true,type:'material',amount:1}}];
 const map={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 let generation='old';const server=http.createServer((req,res)=>{const file=map[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404).end();return;}const type=file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Cache-Control':'no-store','Content-Type':type});res.end(fs.readFileSync(path.join(generation==='old'?old:current,file)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const core=x=>({fish:x.fish_instances,dex:x.dex,timers:x.breeding.timers,layouts:x.tank.layouts,pending:x.pending,active:x.exploration.active,materials:x.materials,fed:x.daily.fed_by_tank});
 try{
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('real212-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('real212-seeded','1');}},{key:E.SAVE_KEY,value:s});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>caches.keys().then(x=>x.includes('night-aquarium-v15')));await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
  const before=await page.evaluate(()=>window.__game.getState());assert.equal(before.fish_instances.length,25);assert.equal(before.breeding.timers[oldKey].next_at,now+7200000);
  generation='new';await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await page.waitForFunction(async()=>{const keys=await caches.keys();return keys.includes('night-aquarium-v16')&&!keys.includes('night-aquarium-v15');},null,{timeout:25000});
  await page.reload();await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();let after=await page.evaluate(()=>window.__game.getState());assert.deepEqual(core(after),core(before));
  assert.match(await page.locator('.modal-heading').innerText(),/キューブ/);await page.locator('[data-action=ack-pending]').click();await page.locator('.room-card[data-room=current]').click();
  assert.equal((await page.evaluate(()=>window.__game.getSceneInfo())).section,'warm');assert.match(await page.locator('[data-action=exhibit-section][data-section=warm]').innerText(),/25 \/ 20/);
  await page.locator('[data-action=open-collection]').first().click();assert.match(await page.locator('.collection-warning').innerText(),/そのまま/);assert.ok(await page.locator(`.collection-subject[data-uid="${s.fish_instances[0].uid}"]`).count(),'old whale remains in warm tank');await page.locator('[data-action=close-modal]').click();
  after=await page.evaluate(()=>window.__game.getState());assert.deepEqual(after.fish_instances,before.fish_instances);assert.deepEqual(after.breeding.timers,before.breeding.timers);assert.deepEqual(after.exploration.active,before.exploration.active);
  await page.locator('[data-screen=settings].nav-item').click();const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-current]').click()]);const exported=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.deepEqual(exported.fish_instances,before.fish_instances);assert.deepEqual(exported.breeding.timers,before.breeding.timers);
  await ctx.setOffline(true);await page.reload();await page.locator('[data-action=start]').click();const offline=await page.evaluate(()=>window.__game.getState());assert.deepEqual(offline.fish_instances,before.fish_instances);assert.deepEqual(offline.breeding.timers,before.breeding.timers);assert.deepEqual(offline.exploration.active,before.exploration.active);assert.deepEqual(errors,[]);
  console.log('UPGRADE 2.12: actual v15 → v16, 25 warm-tank individuals unchanged, legacy whale timer, pending, names, active trip, layout, export and offline OK');
 }finally{await ctx.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
