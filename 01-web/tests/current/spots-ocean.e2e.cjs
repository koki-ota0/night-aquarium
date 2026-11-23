// All contexts use a standalone file and deny network: no access to the real
// port-3000 preview or its saved data. Screenshots are optional test artefacts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.YORU_SCREENSHOT_DIR||os.tmpdir();fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const E=await import('../../engine.js'),D=await import('../../demo-showcase.js'),C=await import('../../catalog.js'),S=await import('../../exploration-spots.js');
 const id=C.idOfScientific,now=Date.now();
 // Separate ephemeral origin for reload assertions; nothing connects to 3000.
 const server=http.createServer((req,res)=>{if(req.url.split('?')[0]!=='/'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(root,'index.html')));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),contexts=[];
 async function open(state,{viewport={width:390,height:844},reduced=false,noWebgl=false,httpOrigin=false}={}){
  const c=await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference'});contexts.push(c);await c.route(/^https?:\/\//,r=>httpOrigin&&r.request().url().startsWith(base)?r.continue():r.abort());
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(state)await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed212')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed212','1');}},{key:E.SAVE_KEY,value:state});
  if(noWebgl)await p.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){if(String(t).startsWith('webgl'))return null;return orig.call(this,t,...args);};});
  await p.goto(httpOrigin?base:pathToFileURL(path.join(root,'yoru-no-suizokukan.html')).href);await p.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await p.locator('[data-action=start]').click();return {p,c,errors};
 }
 const info=p=>p.evaluate(()=>window.__game.getSceneInfo()),state=p=>p.evaluate(()=>window.__game.getState());
 const snap=s=>({fish:s.fish_instances,dex:s.dex,tank:s.tank,breeding:s.breeding});
 try{
  // Direct navigation requires one tap and retains the last sub-tank in-session.
  const a=await open(),p=a.p;assert.equal(await p.locator('.room-card[data-action=room]').count(),6);const before=snap(await state(p));
  await p.locator('.room-card[data-room=current]').click();assert.equal(await p.locator('[data-action=quick-room]').count(),6);assert.equal((await info(p)).section,'cool');assert.equal((await info(p)).habitat,'current-cool');assert.equal((await info(p)).floorVisible,false);
  assert.equal(await p.locator('[data-action=exhibit-section]').count(),3);assert.match(await p.locator('.section-note').innerText(),/分布は重なり/);
  const observed=new Set();
  for(const section of ['cool','warm','large']){
   if(section!=='cool')await p.locator(`[data-action=exhibit-section][data-section=${section}]`).click();
   const expected=D.waterDisplay(E.createInitial(now),'current','marine',section).map(f=>f.uid),found=[];
   for(;;){const v=await info(p);assert.equal(v.section,section);assert.equal(v.floorVisible,false);found.push(...v.entries.map(e=>e.uid));const next=p.locator('[data-action=tank-page][data-delta="1"]');if(!await next.count()||await next.isDisabled())break;await next.click();}
   assert.deepEqual(new Set(found),new Set(expected));for(const uid of found){assert.ok(!observed.has(uid));observed.add(uid);}
  }
  assert.equal(observed.size,32);await p.screenshot({path:path.join(shots,'yoru212-open-warm.png')});
  await p.locator('[data-action=quick-room][data-room=reef]').click();assert.equal((await info(p)).room,'reef');
  await p.locator('[data-action=quick-room][data-room=estuary]').click();assert.equal((await info(p)).room,'estuary');
  await p.locator('[data-action=quick-room][data-room=current]').click();assert.equal((await info(p)).section,'large');
  await p.locator('[data-action=quick-room][data-room=river]').click();assert.equal((await info(p)).room,'river');assert.equal(await p.locator('[data-action=exhibit-section]').count(),2,'fresh river and lake are separate tanks');
  assert.deepEqual(snap(await state(p)),before);assert.deepEqual(a.errors,[]);await a.c.close();console.log('2.12 NAV: six direct rooms, 32 unique ocean samples across real separate scenes, shared budgets, remembered section, no data changes OK');

  // Real pre-existing mixed occupants get a provisional view instead of
  // being silently rehomed. Only the active ocean section is actually fed.
  const old=E.createInitial(now);old.started=true;old.settings.demo_showcase=false;old.tutorial={explore:true,discover:true,pet:true};
  for(const name of ['Thunnus orientalis','Rhincodon typus','Aurelia coerulea']){const r=E.discover(old,id(name),'old',now,()=>.4,'current');const oldFish=old.fish_instances.find(f=>f.uid===r.uid);delete oldFish.exhibit_section;oldFish.nickname='旧 '+name;}old.pending=[];
  const b=await open(old),q=b.p;await q.locator('.room-card[data-room=current]').click();assert.equal(await q.locator('[data-action=exhibit-section]').count(),4);assert.equal((await info(q)).section,'cool');
  assert.ok(await q.locator('[data-action=quick-room][data-room=reef]').isDisabled(),'locked rooms cannot be bypassed');
  await q.locator('[data-action=exhibit-section][data-section=review]').click();assert.deepEqual((await info(q)).entries.map(x=>x.uid),[old.fish_instances[2].uid]);assert.match(await q.locator('.section-note').innerText(),/保存先は変えていません/);await q.locator('[data-action=toggle-tank-tools]').click();assert.ok(await q.locator('.exhibit-suggestion').count());
  await q.locator('[data-action=exhibit-section][data-section=warm]').click();await q.locator('[data-action=feed]').click();let got=await state(q);assert.equal(got.fish_instances[1].growth,8);assert.equal(got.fish_instances[0].growth,0);assert.equal(got.fish_instances[2].growth,0);
  await q.locator('[data-action=exhibit-section][data-section=cool]').click();await q.locator('[data-action=feed]').click();got=await state(q);assert.equal(got.fish_instances[0].growth,8);assert.equal(got.fish_instances[2].growth,0);assert.deepEqual(got.fish_instances.map(x=>[x.uid,x.room,x.nickname]),old.fish_instances.map(x=>[x.uid,x.room,x.nickname]));assert.ok(await q.locator('[data-action=feed]').isDisabled());assert.deepEqual(b.errors,[]);await b.c.close();console.log('2.12 SAVE: legacy/provisional placements accessible, locked room enforced, section-scoped feeding and shared limit OK');

  // With demo samples enabled, a real old resident takes precedence when
  // initially opening the room; the user's fish cannot disappear behind samples.
  const owned=E.createInitial(Date.now());owned.started=true;owned.tutorial={explore:true,discover:true,pet:true};
  E.discover(owned,id('Aurelia coerulea'),'old',Date.now(),()=>.3,'current');owned.pending=[];
  const own=await open(owned),op=own.p;await op.locator('.room-card[data-room=current]').click();assert.equal((await info(op)).section,'review');assert.deepEqual((await info(op)).entries.map(e=>e.uid),[owned.fish_instances[0].uid]);
  await op.locator('[data-action=exhibit-section][data-section=warm]').click();assert.equal((await info(op)).section,'warm');assert.deepEqual(own.errors,[]);await own.c.close();console.log('2.12 OWNED FIRST: real old resident is initially visible before demo-only sections OK');

  // Initial guarantee remains visible even when a focused pool is chosen.
  const first=await open(),fp=first.p;await fp.locator('[data-screen=explore].nav-item').click();assert.equal(await fp.locator('[data-action=explore-start]').count(),4);assert.match(await fp.locator('.first-journey-note').innerText(),/どこを選んでもクマノミ/);
  await fp.locator('[data-action=explore-spot][data-id=fresh][data-spot=lake]').click();assert.equal(await fp.locator('[data-action=explore-spot][data-id=fresh][data-spot=lake]').getAttribute('aria-pressed'),'true');
  assert.match(await fp.locator('[data-action=explore-start][data-id=fresh] .destination-focus').innerText(),/湖・池.*14種/);
  await fp.locator('.destination').nth(1).locator('summary').click();const odds=await fp.locator('.destination').nth(1).locator('.pool-copy').innerText();assert.match(odds,/初回.*クマノミが100%/);assert.match(odds,/80%/);assert.match(odds,/コイ/);assert.doesNotMatch(odds,/メコンオオナマズ/);
  await fp.locator('[data-action=explore-start][data-id=fresh]').click();assert.equal((await state(fp)).exploration.active.spot,'lake');assert.match(await fp.locator('.journey-heading h2').innerText(),/湖・池/);await fp.locator('[data-action=skip]').click();assert.match(await fp.locator('.modal-heading').innerText(),/新しい仲間/);assert.equal((await state(fp)).fish_instances[0].species_id,id('Amphiprion clarkii'));assert.deepEqual(first.errors,[]);await first.c.close();console.log('2.12 FIRST: scoped candidate list, honest first guarantee, focused journey and one clownfish OK');

  // A non-first focused trip persists through reload and awards only its pool.
  const focused=E.createInitial(now);focused.started=true;focused.settings.demo_showcase=false;focused.exploration.has_explored=true;focused.tutorial={explore:true,discover:true,pet:true};
  const j=await open(focused,{httpOrigin:true}),jp=j.p;await jp.locator('[data-screen=explore].nav-item').click();await jp.locator('[data-action=explore-spot][data-id=fresh][data-spot=lake]').click();await jp.locator('[data-action=explore-start][data-id=fresh]').click();const active=(await state(jp)).exploration.active;
  assert.equal(active.spot,'lake');assert.equal(await jp.locator('[data-journey-scene]').getAttribute('data-spot'),'lake');assert.equal((await jp.evaluate(()=>window.__game.getJourneyInfo())).spot,'lake');
  await jp.reload();await jp.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await jp.locator('[data-action=start]').click();await jp.locator('[data-screen=explore].nav-item').click();assert.deepEqual((await state(jp)).exploration.active,active);assert.equal((await jp.evaluate(()=>window.__game.getJourneyInfo())).spot,'lake');
  await jp.evaluate(()=>{Math.random=()=>.12;});await jp.locator('[data-action=skip]').click();const result=await state(jp);assert.equal(result.fish_instances.length,1);assert.ok(S.explorationPool('fresh','lake').includes(result.fish_instances[0].species_id));assert.equal(result.pending[0].spot,'lake');assert.deepEqual(j.errors,[]);await j.c.close();console.log('2.12 FOCUSED SAVE: reload restores exact selected spot, timer and its actual reward pool OK');

  // All four additional 3D presentations use candidate animals. Their images
  // are scenery and do not advance progress or award anything.
  const art=[];for(const [destination,spots] of Object.entries(S.EXPLORATION_SPOTS))for(const spot of spots){
   const s=E.createInitial(Date.now());s.started=true;s.exploration.has_explored=true;s.tutorial={explore:true,discover:true,pet:true};assert.ok(E.startExplore(s,destination,Date.now(),spot.id).ok);
   const v=await open(s),x=v.p;await x.locator('[data-screen=explore].nav-item').click();await x.waitForFunction(()=>window.__game.getJourneyInfo().frameCount>=2);
   const world=await x.evaluate(()=>window.__game.getJourneyInfo());assert.equal(world.spot,spot.id);assert.equal(world.creatures.length,5);assert.ok(world.creatures.every(c=>spot.pool.includes(id(c.scientific))));assert.equal(world.usesAquariumCanvas,true);
   art.push(await x.locator('.journey-canvas').evaluate(el=>el.toDataURL()));await x.screenshot({path:path.join(shots,`yoru212-journey-${destination}-${spot.id}.png`)});assert.deepEqual(v.errors,[]);await v.c.close();
  }assert.equal(new Set(art).size,4);console.log('2.12 JOURNEYS: four focused 3D worlds, matching representative animals, distinct pixels and shared canvas OK');

  const n=E.createInitial(now);n.settings.text_size='larger';const narrow=await open(n,{viewport:{width:320,height:700},reduced:true}),np=narrow.p;await np.locator('.room-card[data-room=current]').click();
  assert.ok(await np.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));assert.equal(await np.locator('[data-action=quick-room]').count(),6);assert.ok(await np.locator('.room-switcher').evaluate(el=>el.scrollWidth>el.clientWidth));
  for(const box of await np.locator('[data-action=exhibit-section], [data-action=quick-room]').evaluateAll(els=>els.map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height}))))assert.ok(box.w>=38&&box.h>=42,JSON.stringify(box));
  await np.locator('[data-action=quick-room][data-room=estuary]').click();assert.equal((await info(np)).room,'estuary');await np.locator('[data-screen=explore].nav-item').click();assert.ok(await np.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  for(const box of await np.locator('[data-action=explore-spot]').evaluateAll(els=>els.map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height}))))assert.ok(box.w>=55&&box.h>=44,JSON.stringify(box));
  await np.screenshot({path:path.join(shots,'yoru212-narrow.png')});assert.deepEqual(narrow.errors,[]);await narrow.c.close();console.log('2.12 ACCESS: 320px larger text, touch targets, reduced motion and offline direct navigation OK');

  const fallbackAt=Date.now(),f=E.createInitial(fallbackAt);f.started=true;f.exploration.has_explored=true;E.startExplore(f,'cold-sea',fallbackAt,'open');const fallback=await open(f,{noWebgl:true}),xp=fallback.p;await xp.locator('[data-screen=explore].nav-item').click();assert.equal(await xp.locator('[data-journey-scene]').getAttribute('data-renderer'),'fallback');assert.ok(await xp.locator('.journey-fallback').isVisible());assert.equal(await xp.locator('.voyage-bottom').evaluate(el=>getComputedStyle(el).display),'none');assert.deepEqual(fallback.errors,[]);await fallback.c.close();console.log('2.12 FALLBACK: offline open-water SVG has no false seabed when WebGL is unavailable OK');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
