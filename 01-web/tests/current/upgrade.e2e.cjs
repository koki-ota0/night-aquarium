// Uses real previously shipped HTML/engine files; never accesses the user's
// normal preview server or workspace backup. See README for OLD_ROOT setup.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const current=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT);
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to a directory containing extracted yoru-web-2.4, yoru-web-2.5 and built yoru-web-2.6 projects.');
 const files={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{for(const [version,cache] of [['2.4','v7'],['2.5','v8'],['2.6','v9']]){
  const old=path.join(oldRoot,'yoru-web-'+version);if(!fs.existsSync(path.join(old,'index.html')))throw Error(`Missing built previous version: ${old}`);
  const E=await import(pathToFileURL(path.join(old,'engine.js')).href),L=await import(pathToFileURL(path.join(old,'decor-layout.js')).href),now=Date.now(),s=E.createInitial(now);
  s.started=true;s.tutorial={explore:true,discover:true,pet:true};s.settings.demo_showcase=false;
  for(const species of ['sp_030','sp_058','sp_054','sp_001','sp_039','sp_014']){const r=E.discover(s,species,'upgrade_fixture',now,()=>.4);assert.ok(r.ok,`${version} ${species}`);const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname='旧_'+species;f.size=1.07;f.growth=45;}
  s.pending=[{type:'evolution',result:{ok:true,type:'fish',id:'sp_039',uid:s.fish_instances.find(f=>f.species_id==='sp_039').uid}},{type:'award',threshold:25}];s.dex.awards=[25];
  L.setDecorPosition(s,'current','marine','plants',0,{x:1.5,z:-1,rotation:45});s.exploration.has_explored=true;s.exploration.active={destination:'cold-sea',started_at:now,ends_at:now+1800000,first:false,demo:true};
  s.breeding.timers['current|marine|sp_039']={male:s.fish_instances[0].uid,female:s.fish_instances[4].uid,next_at:now+1800000,interval:60000,demo:true,last_result:null};
  let generation='old';const server=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}const source=generation==='old'?old:current;const type=f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':f.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Cache-Control':'no-store','Content-Type':type});res.end(fs.readFileSync(path.join(source,f)));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('old-fixture-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('old-fixture-seeded','1');}},{key:E.SAVE_KEY,value:s});
   await page.goto(url);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(c=>caches.keys().then(keys=>keys.includes('night-aquarium-'+c)),cache);
   if(version==='2.6')await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
   const before=await page.evaluate(()=>window.__game.getState());assert.equal(before.pending.length,2);assert.equal(before.fish_instances.length,6);
   generation='new';await page.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await page.waitForFunction(async()=>{const k=await caches.keys();return k.includes('night-aquarium-v16')&&!k.includes('night-aquarium-v14')&&!k.includes('night-aquarium-v12')&&!k.includes('night-aquarium-v11')&&!k.includes('night-aquarium-v7')&&!k.includes('night-aquarium-v8')&&!k.includes('night-aquarium-v9')&&!k.includes('night-aquarium-v10')},null,{timeout:25000});
   await page.reload();await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();
   const after=await page.evaluate(()=>window.__game.getState());const identity=state=>state.fish_instances.map(f=>[f.uid,f.species_id,f.nickname,f.size,f.growth]);
   assert.deepEqual(identity(after),identity(before),`${version} individual identity`);assert.deepEqual(after.dex.discovered,before.dex.discovered);assert.deepEqual(after.tank.layouts,before.tank.layouts);assert.equal(after.exploration.active.ends_at,before.exploration.active.ends_at);assert.deepEqual(after.breeding.timers['current|marine|sp_039'],before.breeding.timers['current|marine|sp_039']);
   assert.match(await page.locator('.modal-heading').innerText(),/前版の仲間を保管/);assert.equal(await page.locator('[data-action=ack-pending]').getAttribute('data-route'),'');await page.locator('[data-action=ack-pending]').click();assert.match(await page.locator('.modal-heading').innerText(),/前版の館長賞/);await page.locator('[data-action=ack-pending]').click();
   assert.match(await page.locator('.archive-banner').innerText(),/仲間 3体/);await page.locator('[data-screen=settings].nav-item').click();await page.locator('.archive-box summary').click();assert.equal(await page.locator('.archive-list li').count(),3);assert.match(await page.locator('.archive-list').innerText(),/旧_sp_039/);
   const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=export-current]').click()]);const exported=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.deepEqual(identity(exported),identity(after));
   await ctx.setOffline(true);await page.reload();await page.locator('[data-action=start]').click();await page.locator('[data-screen=settings].nav-item').click();assert.equal(await page.locator('.archive-box summary').count(),1);assert.deepEqual(identity(await page.evaluate(()=>window.__game.getState())),identity(after));
   assert.deepEqual(errors,[]);console.log(`UPGRADE ${version}: ${cache} → v16, 3 current + 3 archived IDs, pending, timer, layouts, export and offline preserved OK`);
  }finally{await ctx.close();await new Promise(r=>server.close(r));}
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
