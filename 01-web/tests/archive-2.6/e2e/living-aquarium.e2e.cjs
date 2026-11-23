const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:3000/';

(async()=>{
 const E=await import('../engine.js');const now=Date.now(),rng=()=>.25;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const contexts=[];
 async function seeded(state,viewport={width:390,height:844},url=BASE){
  state.settings.demo_showcase=false; // Exercise actual owned fish, not demo specimens.
  const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});contexts.push(ctx);
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('yoru-fixture-loaded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('yoru-fixture-loaded','1');}},{key:E.SAVE_KEY,value:state});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__game);return {ctx,page,errors};
 }
 async function openCurrent(page){await page.locator('[data-action=start]').click();await page.locator('[data-action=room][data-room=current]').click();}
 try{
  // Existing pair: personality is stable; affinity is capped but contact and
  // its visible reaction remain available. Replay moves real 3D objects.
  const s=E.createInitial(now);s.started=true;s.tutorial={explore:true,discover:true,pet:true};s.settings.demo=false;
  for(const id of ['sp_030','sp_001','sp_076','sp_011'])E.discover(s,id,'test',now,rng);
  s.pending=[];s.tank.inventory=['plants','rock','sand'];s.tank.quantities={plants:2,rock:1,sand:1};s.tank.decor=['plants','rock','sand'];s.daily.pet_count=10;
  const clown=s.fish_instances.find(f=>f.species_id==='sp_030'),anemone=s.fish_instances.find(f=>f.species_id==='sp_001');clown.affinity=5;
  const c=await seeded(s);let p=c.page;await openCurrent(p);
  let info=await p.evaluate(()=>window.__game.getSceneInfo());assert.ok(info.entries.find(x=>x.uid===clown.uid).personality);assert.ok(info.momentPairs.some(x=>x.key==='clown_anemone'));
  await p.locator(`.fish-chip[data-uid="${clown.uid}"]`).click();assert.match(await p.locator('.personality-note').innerText(),/性格/);assert.match(await p.locator('.personality-note').innerText(),/有利・不利はありません/);
  assert.equal(await p.locator('[data-action=pet-modal]').isDisabled(),false);
  // Read the reaction in the same click event, before its 1.6s animation can expire on slow software-rendered CI.
  await p.evaluate(uid=>{const layer=document.getElementById('modal-layer');layer.addEventListener('click',function observe(e){if(e.target.closest('[data-action=pet-modal]')){window.__reactionAtPet=window.__game.getSceneInfo().entries.find(x=>x.uid===uid)?.reaction;layer.removeEventListener('click',observe);} });},clown.uid);
  await p.locator('[data-action=pet-modal]').click();
  assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances.find(f=>f.uid===clown.uid).affinity,5);assert.match(await p.locator('#toast').innerText(),/いつでも/);assert.equal(await p.evaluate(()=>window.__reactionAtPet),true);
  await p.locator('.sheet-close').click();await p.locator('[data-action=moments]').click();assert.match(await p.locator('.moment-list').innerText(),/クマノミとアカイソギンチャク/);
  await p.locator('[data-action=moment-play][data-key=clown_anemone]').click();await p.waitForFunction(()=>window.__game.getSceneInfo().moment?.key==='clown_anemone');
  const start=await p.evaluate(uid=>window.__game.getSceneInfo().entries.find(x=>x.uid===uid).position,clown.uid);await p.waitForTimeout(2300);
  info=await p.evaluate(()=>window.__game.getSceneInfo());const during=info.entries.find(x=>x.uid===clown.uid).position;
  assert.ok(during.y<start.y-1,'replay actually moves the 3D clownfish toward the environment');assert.equal(await p.locator('#moment-caption').isVisible(),true);
  assert.ok((await p.evaluate(()=>window.__game.getState())).dex.moments.some(m=>m.key==='clown_anemone'));
  await p.locator('[data-action=water][data-water=fresh]').click();assert.equal((await p.evaluate(()=>window.__game.getSceneInfo())).momentPairs.length,0,'no cross-water scene');
  await p.locator('[data-action=water][data-water=marine]').click();await p.locator(`.fish-chip[data-uid="${anemone.uid}"]`).click();await p.locator('[data-action=toggle-env]').click();await p.locator('.sheet-close').click();
  assert.equal((await p.evaluate(()=>window.__game.getSceneInfo())).momentPairs.length,0);await p.locator('[data-action=moments]').click();assert.equal(await p.locator('[data-action=moment-play][data-key=clown_anemone]').count(),0);assert.match(await p.locator('.moment-list').innerText(),/同じ水槽に展示/);await p.locator('.sheet-close').click();

  // Separate editable layout, pointer dragging, rotation, actual mesh transforms,
  // counts/evolution unaffected, and independent water-specific storage.
  const before=await p.evaluate(()=>window.__game.getState().tank.quantities);await p.locator('[data-action=decor]').click();await p.locator('[data-action=layout]').click();
  assert.equal(await p.locator('[data-layout-item]').count(),4);let map=await p.locator('#layout-map').boundingBox(),item=await p.locator('[data-layout-item][data-id=plants][data-index="0"]').boundingBox();
  await p.mouse.move(item.x+item.width/2,item.y+item.height/2);await p.mouse.down();await p.mouse.move(map.x+map.width*.68,map.y+map.height*.65,{steps:12});await p.mouse.up();
  let state=await p.evaluate(()=>window.__game.getState());let saved=state.tank.layouts['current:marine']['plants:0'];assert.ok(saved.x>1&&saved.z>0,'drag stores the chosen position');assert.deepEqual(state.tank.quantities,before);
  await p.locator('[data-action=layout-rotate]').click();state=await p.evaluate(()=>window.__game.getState());saved=state.tank.layouts['current:marine']['plants:0'];assert.equal(saved.rotation,45);
  info=await p.evaluate(()=>window.__game.getSceneInfo());let rendered=info.decorRendered.find(x=>x.type==='plants'&&x.index===0);assert.equal(rendered.x,saved.x);assert.equal(rendered.z,saved.z);assert.ok(Math.abs(rendered.rotation-45)<.001);
  await p.locator('.layout-chip[data-id=rock]').click();await p.locator('[data-action=layout-nudge][data-dir=right]').click();assert.ok((await p.evaluate(()=>window.__game.getState())).tank.layouts['current:marine']['rock:0']);
  await p.locator('.sheet-close').click();await p.locator('[data-action=water][data-water=fresh]').click();await p.locator('[data-action=decor]').click();await p.locator('[data-action=layout]').click();
  const fresh=await p.evaluate(()=>window.__game.getSceneInfo().decor.find(x=>x.type==='plants'&&x.index===0));assert.notEqual(fresh.x,saved.x,'marine layout is not copied into the fresh-water tank');
  await p.locator('[data-action=layout-preset][data-preset=wide]').click();assert.ok((await p.evaluate(()=>window.__game.getState())).tank.layouts['current:fresh']);
  await p.locator('[data-action=layout-preset][data-preset=default]').click();assert.equal((await p.evaluate(()=>window.__game.getState())).tank.layouts['current:fresh'],undefined);
  await p.locator('.sheet-close').click();await p.reload({waitUntil:'domcontentloaded'});await openCurrent(p);await p.locator('[data-action=water][data-water=marine]').click();
  state=await p.evaluate(()=>window.__game.getState());assert.deepEqual(state.tank.layouts['current:marine']['plants:0'],saved);assert.ok(state.dex.moments.some(m=>m.key==='clown_anemone'));
  rendered=(await p.evaluate(()=>window.__game.getSceneInfo())).decorRendered.find(x=>x.type==='plants'&&x.index===0);assert.equal(rendered.x,saved.x);assert.ok(Math.abs(rendered.rotation-45)<.001);
  // Exercise the actual JSON export/import UI with the 2.4 fields.
  await p.locator('.nav-item[data-screen=settings]').click();const [download]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action=export-current]').click()]);
  const portable=fs.readFileSync(await download.path()),exported=JSON.parse(portable.toString());assert.deepEqual(exported.tank.layouts['current:marine']['plants:0'],saved);assert.ok(exported.dex.moments.some(m=>m.key==='clown_anemone'));
  const destination=E.createInitial(Date.now());destination.started=true;const tc=await seeded(destination);const transfer=tc.page;await transfer.locator('[data-action=start]').click();await transfer.locator('.nav-item[data-screen=settings]').click();
  await transfer.locator('#save-import-file').setInputFiles({name:'yoru-24.json',mimeType:'application/json',buffer:portable});await transfer.locator('[data-action=commit-import]').click();
  const imported=await transfer.evaluate(()=>window.__game.getState());assert.deepEqual(imported.tank.layouts['current:marine']['plants:0'],saved);assert.ok(imported.dex.moments.some(m=>m.key==='clown_anemone'));assert.deepEqual(tc.errors,[]);
  assert.deepEqual(c.errors,[]);console.log('LIVING: personality, capped cosmetic petting, pair replay and actual 3D decor transforms persist and stay water-scoped OK');
  console.log('LIVING: JSON export and import retain layouts and moment memories OK');

  // Automatic, not merely manual, scene; it must be observed in the visible
  // aquarium before the independent scene memory is written.
  const auto=E.createInitial(Date.now());auto.started=true;auto.tutorial={explore:true,discover:true,pet:true};for(const id of ['sp_030','sp_001'])E.discover(auto,id,'test',Date.now(),rng);auto.pending=[];
  const ac=await seeded(auto);await openCurrent(ac.page);await ac.page.waitForFunction(()=>window.__game.getState().dex.moments.some(x=>x.key==='clown_anemone'),null,{timeout:14000});
  assert.equal((await ac.page.evaluate(()=>window.__game.getSceneInfo())).moment?.key,'clown_anemone');assert.deepEqual(ac.errors,[]);console.log('LIVING: visible automatic scene starts and records without a prompt OK');

  // All four game-only combinations play in 3D. The bottom-dwelling slug
  // stays at the bottom instead of being lifted unrealistically into the water.
  const allPairs=E.createInitial(Date.now());allPairs.started=true;allPairs.tutorial={explore:true,discover:true,pet:true};
  for(const id of ['sp_001','sp_002','sp_009','sp_010','sp_030','sp_037','sp_088','sp_078'])E.discover(allPairs,id,'test',Date.now(),rng);allPairs.pending=[];
  const pc=await seeded(allPairs);p=pc.page;await openCurrent(p);assert.equal((await p.evaluate(()=>window.__game.getSceneInfo())).momentPairs.length,4);
  for(const key of ['clown_anemone','slug_anemone','squid_ascidian','dugong_mussel']){
   await p.locator('[data-action=moments]').click();await p.locator(`[data-action=moment-play][data-key=${key}]`).click();await p.waitForFunction(k=>window.__game.getSceneInfo().moment?.key===k,key);
   await p.waitForTimeout(1800);const st=await p.evaluate(()=>window.__game.getSceneInfo()),m=st.moment,actor=st.entries.find(x=>x.uid===m.fishUid);
   assert.ok((await p.evaluate(()=>window.__game.getState())).dex.moments.some(x=>x.key===key));
   if(key==='slug_anemone'){assert.equal(actor.benthic,true);assert.equal(actor.position.y,-3.75);}else assert.ok(actor.position.y<-1.5,`${key} approaches its partner near the bottom`);
  }
  assert.deepEqual(pc.errors,[]);console.log('LIVING: all four game-only pairs replay in 3D; bottom-dweller remains on the bottom OK');

  // Older save + a genuine absence: results are real, actionable and dismissal
  // does not recreate the card on a quick reload.
  const old=Date.now()-10*E.HOUR,returned=E.createInitial(old);returned.started=true;returned.settings.demo=false;returned.tutorial={explore:true,discover:true,pet:true};
  E.discover(returned,'sp_011','test',old,rng);returned.fish_instances[0].growth=39;returned.pending=[];E.startExplore(returned,'coast',old);returned.last_seen=old;
  delete returned.tank.layouts;delete returned.dex.moments;delete returned.welcome_back;
  const rc=await seeded(returned);p=rc.page;await p.locator('[data-action=start]').click();await p.locator('[data-action=ack-pending]').click();await p.locator('.nav-item[data-screen=home]').click();
  assert.match(await p.locator('.welcome-card').innerText(),/クマノミ/);assert.match(await p.locator('.welcome-card').innerText(),/育成度がA/);assert.equal(await p.locator('.welcome-item').count(),2);
  await p.locator('.welcome-item[data-kind=growth]').click();assert.equal(await p.evaluate(()=>window.__game.getWater()),'fresh');await p.locator('.nav-item[data-screen=home]').click();await p.locator('[data-action=welcome-dismiss]').click();await p.reload({waitUntil:'domcontentloaded'});await p.locator('[data-action=start]').click();assert.equal(await p.locator('.welcome-card').count(),0);assert.deepEqual(rc.errors,[]);console.log('WELCOME: genuine return report uses actual results, targets correct water and dismissal survives reload OK');

  // A backgrounded tab also records the beginning of absence and refreshes
  // only on return. Fake time/visibility are controlled in the test browser.
  const clock=Date.now(),background=E.createInitial(clock);background.started=true;background.tutorial={explore:true,discover:true,pet:true};E.startExplore(background,'coast',clock);
  const vc=await seeded(background);p=vc.page;await p.locator('[data-action=start]').click();
  await p.evaluate(()=>{window.__fakeNow=Date.now();Date.now=()=>window.__fakeNow;Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenSeen=await p.evaluate(()=>window.__game.getState().last_seen);await p.waitForTimeout(650);assert.equal((await p.evaluate(()=>window.__game.getState())).last_seen,hiddenSeen);
  await p.evaluate(()=>{window.__fakeNow+=4*3600000;Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await p.locator('[data-action=ack-pending]').click();await p.locator('.nav-item[data-screen=home]').click();assert.match(await p.locator('.welcome-card').innerText(),/クマノミ/);assert.deepEqual(vc.errors,[]);
  console.log('WELCOME: hidden tab stops periodic ticks and produces a return report on visibility change OK');

  // 320px, largest text and touch drag. Also verify the offline self-contained
  // file runs without accessing a network.
  const small=E.createInitial(Date.now());small.started=true;small.settings.text_size='larger';small.tutorial={explore:true,discover:true,pet:true};E.discover(small,'sp_030','test',Date.now(),rng);small.pending=[];
  const sc=await seeded(small,{width:320,height:680});p=sc.page;await openCurrent(p);await p.locator('[data-action=decor]').click();await p.locator('[data-action=layout]').click();
  const dims=await p.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,sheet:document.querySelector('.sheet').scrollWidth,client:document.querySelector('.sheet').clientWidth}));assert.ok(dims.scroll<=dims.width);assert.ok(dims.sheet<=dims.client);
  await p.locator('#layout-map').scrollIntoViewIfNeeded();map=await p.locator('#layout-map').boundingBox();item=await p.locator('[data-layout-item]').first().boundingBox();const client=await sc.ctx.newCDPSession(p),pt=(x,y)=>({x,y,id:1,radiusX:2,radiusY:2,force:1});
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt(item.x+item.width/2,item.y+item.height/2)]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[pt(map.x+map.width*.65,map.y+map.height*.65)]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok((await p.evaluate(()=>window.__game.getState())).tank.layouts['current:marine']['plants:0'].x>1);await p.locator('.sheet-close').click();assert.deepEqual(sc.errors,[]);
  const oc=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});contexts.push(oc);await oc.route('http**/*',r=>r.abort());p=await oc.newPage();const oe=[];p.on('pageerror',e=>oe.push(e.message));await p.goto(pathToFileURL(path.resolve('yoru-no-suizokukan.html')).href);await p.locator('[data-action=start]').click();await p.locator('[data-action=room][data-room=current]').click();await p.locator('[data-action=decor]').click();await p.locator('[data-action=layout]').click();assert.equal(await p.locator('[data-layout-item]').count(),1);assert.deepEqual(oe,[]);
  console.log('LIVING: touch drag and large-text 320px layout; standalone file works offline OK');
 }finally{for(const ctx of contexts)await ctx.close().catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
