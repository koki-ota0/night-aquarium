// Isolated browser tests: never connect to the user's preview-data service.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.YORU_SCREENSHOT_DIR||os.tmpdir();fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const E=await import('../../engine.js'),{BY_ID,idOfScientific:id}=await import('../../catalog.js');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const contexts=[];
 async function open({state,viewport={width:390,height:844},reduced=false,noWebgl=false}={}){
  const c=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference'});contexts.push(c);await c.route(/^https?:\/\//,r=>r.abort());const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(state)await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed211')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed211','1');}},{key:E.SAVE_KEY,value:state});
  if(noWebgl)await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).startsWith('webgl'))return null;return get.call(this,type,...args);};});
  await p.goto(pathToFileURL(path.join(root,'yoru-no-suizokukan.html')).href);await p.locator('[data-action=start]').click();return {p,c,errors};
 }
 const info=p=>p.evaluate(()=>window.__game.getSceneInfo()),state=p=>p.evaluate(()=>window.__game.getState());
 async function home(p){await p.locator('[data-screen=home].nav-item').click();}
 try{
  const a=await open(),p=a.p;assert.equal(await p.locator('[data-action=room]').count(),6);await p.screenshot({path:path.join(shots,'yoru211-home.png')});
  const before=await state(p),expected={current:'海水',beach:'海水',reef:'海水',deep:'海水',river:'淡水',estuary:'汽水'};
  for(const room of Object.keys(expected)){
   await p.locator(`[data-action=room][data-room=${room}]`).click();assert.equal(await p.locator('.exhibit-water').innerText(),expected[room]);assert.equal(await p.locator('[data-action=water]').count(),0,'water is not a selectable tab');
   await p.waitForFunction(()=>window.__game.getSceneInfo().entries.length>0);const v=await info(p);assert.equal(v.room,room);assert.equal(v.habitat,room==='current'?'current-cool':room);assert.deepEqual(v.habitatObjects.map(x=>x.id),[room==='current'?'current-cool':room]);assert.ok(v.habitatObjects[0].blocks>0);
   assert.equal(v.floorVisible,room!=='current');if(room==='deep')assert.equal(v.bubblesVisible,false);
   if(room==='current'){assert.ok(v.entries.length<=12,'each open-water page is bounded');assert.ok(v.entries.every(x=>BY_ID[x.uid.replace(/^showcase_/, '')]?.kind!=='environment'));}
   if(room==='beach'){assert.ok(v.entries.some(x=>x.uid==='showcase_'+id('Heterodontus japonicus')));assert.ok(v.entries.some(x=>x.benthic));}
   if(room==='estuary'){
    assert.equal(v.section,'mangrove');assert.equal(v.entries.length,3);assert.ok(v.entries.every(x=>x.uid.startsWith('showcase_'+id('Toxotes jaculatrix'))));
    assert.equal(await p.locator('[data-action=exhibit-section]').count(),2);await p.locator('[data-action=exhibit-section][data-section=cool]').click();await p.waitForFunction(()=>window.__game.getSceneInfo().entries[0]?.position.y < -4);const cold=await info(p);assert.equal(cold.section,'cool');assert.equal(cold.habitat,'estuary-cool');assert.deepEqual(cold.entries.map(x=>x.uid),['showcase_'+id('Platichthys stellatus')]);assert.ok(cold.entries[0].rotationX>.20,'dorsal camouflage remains visible instead of an edge-on flatfish');assert.ok(cold.entries[0].position.y<-4,'flatfish remains close to the sandy bottom');assert.equal(await p.locator('.exhibit-water').innerText(),'汽水');
    await p.screenshot({path:path.join(shots,'yoru211-estuary-cool.png')});
   }else await p.screenshot({path:path.join(shots,`yoru211-${room}.png`)});
   const oldLight=await p.locator('#room-scene').getAttribute('data-light');await p.locator('[data-action=open-light]').first().click();assert.notEqual(await p.locator('#room-scene').getAttribute('data-light'),oldLight);
   await home(p);
  }
  const after=await state(p);assert.deepEqual(after.fish_instances,before.fish_instances);assert.deepEqual(after.dex.discovered,before.dex.discovered);assert.deepEqual(a.errors,[]);console.log('EXHIBITS: 6 fixed-water galleries, voxel habitats, school, tropical/temperate isolation, light, demo no rewards OK');
  // Opening a cool-water species from the catalogue selects its correct tank.
  await p.locator('[data-screen=dex].nav-item').click();await p.locator('[data-action=filter][data-filter=estuary]').click();assert.equal(await p.locator('.dex-cell').count(),2);await p.locator('[data-action=filter][data-filter="すべて"]').click();await p.locator('#dex-search').fill('ヌマガレイ');await p.locator(`.dex-cell[data-id="${id('Platichthys stellatus')}"]`).click();assert.match(await p.locator('.modal-copy').innerText(),/河口（汽水）/);await p.locator('[data-action=view-showcase]').click();assert.equal((await info(p)).section,'cool');assert.ok((await info(p)).entries.some(x=>x.uid==='showcase_'+id('Platichthys stellatus')));
  await p.locator('[data-screen=dex].nav-item').click();await p.locator('#dex-search').fill('ヌマガレイ');await p.locator(`.dex-cell[data-id="${id('Platichthys stellatus')}"]`).click();await p.locator('[data-action=adopt-showcase]').click();
  let earned=await state(p);assert.equal(earned.fish_instances.length,1);assert.equal(earned.fish_instances[0].room,'estuary');assert.equal((await info(p)).section,'cool');if(await p.locator('[data-action=ack-pending]').count())await p.locator('[data-action=ack-pending]').click();
  await p.reload();await p.locator('[data-action=start]').click();earned=await state(p);assert.equal(earned.fish_instances.length,1);assert.equal(earned.fish_instances[0].species_id,id('Platichthys stellatus'));assert.deepEqual(a.errors,[]);console.log('EXHIBITS: cool-fish catalogue routing, adoption and reload OK');

  // Real old records remain visible and only their active sub-tank is fed.
  const now=Date.now(),s=E.createInitial(now);s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
  for(const [name,room] of [['Toxotes jaculatrix','current'],['Platichthys stellatus','reef'],['Oryzias latipes','deep']]){const r=E.discover(s,id(name),'legacy-fixture',now,()=>.4,room);assert.ok(r.ok);}s.pending=[];
  const b=await open({state:s}),q=b.p;await q.locator('[data-action=room][data-room=estuary]').click();await q.locator('[data-action=toggle-tank-tools]').click();assert.deepEqual((await info(q)).entries.map(x=>x.uid),[s.fish_instances[0].uid]);assert.ok(await q.locator('.legacy-exhibit-note').count());
  await q.locator('[data-action=feed]').click();let got=await state(q);assert.equal(got.fish_instances[0].growth,8);assert.equal(got.fish_instances[1].growth,0);assert.equal(got.fish_instances[2].growth,0);
  await q.locator('[data-action=exhibit-section][data-section=cool]').click();assert.deepEqual((await info(q)).entries.map(x=>x.uid),[s.fish_instances[1].uid]);await q.locator('[data-action=feed]').click();got=await state(q);assert.equal(got.fish_instances[1].growth,8);assert.deepEqual(got.fish_instances.map(f=>f.room),['current','reef','deep']);assert.equal(got.daily.fed_by_tank['current:brackish'],2);assert.equal(got.daily.fed_by_tank['reef:brackish'],2);
  await home(q);await q.locator('[data-action=room][data-room=river]').click();assert.equal((await info(q)).entries[0].uid,s.fish_instances[2].uid);assert.deepEqual(b.errors,[]);console.log('EXHIBITS: old rooms unchanged, old water isolated, independent section feeding, shared conservative budget OK');

  // Previously earned marine individuals stay put; an explicit suggestion
  // makes the more suitable room discoverable without moving them silently.
  const m=E.createInitial(now);m.started=true;m.settings.demo_showcase=false;m.dex.discovered=Object.keys(BY_ID).slice(0,31);const mr=E.discover(m,id('Amphiprion clarkii'),'old-placement',now,()=>.4,'current');m.pending=[];
  const moved=await open({state:m}),mp=moved.p;await mp.locator('.room-card[data-action=room][data-room=current]').click();await mp.locator('[data-action=toggle-tank-tools]').click();assert.ok(await mp.locator('.exhibit-suggestion').count());await mp.locator('.exhibit-suggestion summary').click();await mp.locator(`.exhibit-suggestion [data-action=exhibit-suggest-fish][data-uid="${mr.uid}"]`).click();await mp.locator('[data-action=move-dialog]').click();assert.equal(await mp.locator('[data-action=move][data-room=river]').count(),0);assert.equal(await mp.locator('[data-action=move][data-room=estuary]').count(),0);assert.ok(await mp.locator('[data-action=move][data-room=reef]').isEnabled());await mp.locator('[data-action=move][data-room=reef]').click();assert.equal((await state(mp)).fish_instances[0].room,'reef');assert.deepEqual(moved.errors,[]);console.log('EXHIBITS: marine legacy placement is suggested, never silently moved; incompatible water is disabled OK');

  const narrowState=E.createInitial(Date.now());narrowState.settings.text_size='larger';const n=await open({state:narrowState,viewport:{width:320,height:700},reduced:true}),np=n.p;await np.locator('[data-action=room][data-room=estuary]').click();
  assert.ok(await np.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));assert.equal(await np.locator('[data-action=exhibit-section]').count(),2);await np.locator('[data-action=exhibit-section][data-section=cool]').click();
  const fits=await np.evaluate(()=>{const a=document.querySelector('.water-hint').getBoundingClientRect(),b=document.querySelector('.zoom-controls').getBoundingClientRect();return a.right<=b.left+1||a.bottom<=b.top;});assert.ok(fits);await np.screenshot({path:path.join(shots,'yoru211-320-cool.png')});assert.deepEqual(n.errors,[]);console.log('EXHIBITS: offline 320px, enlarged type and reduced motion fit OK');

  const no=await open({noWebgl:true}),ng=no.p;await ng.locator('[data-action=room][data-room=estuary]').click();assert.ok(await ng.locator('.webgl-fallback').isVisible());await ng.locator('[data-action=exhibit-section][data-section=cool]').click();assert.ok(await ng.locator('.webgl-fallback').isVisible());assert.deepEqual(no.errors,[]);console.log('EXHIBITS: no-WebGL fallback and section navigation OK');
 }finally{for(const c of contexts)await c.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
