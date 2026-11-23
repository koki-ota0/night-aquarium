// Uses an isolated HTTP server and fresh browser contexts; never accesses the
// user's 3000 preview or its workspace backup.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.YORU_SCREENSHOT_DIR||os.tmpdir();fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const E=await import('../../engine.js'),{idOfScientific:id,CATALOG}=await import('../../catalog.js');
 const map={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/DESIGN_GALLERY.html':'DESIGN_GALLERY.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 const server=http.createServer((req,res)=>{const f=map[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}res.writeHead(200,{'Cache-Control':'no-store','Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':f.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),contexts=[];
 async function open(state,options={}){
  const c=await browser.newContext({viewport:options.viewport||{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:options.reducedMotion||'no-preference'});contexts.push(c);
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(state)await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('fixture-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('fixture-seeded','1');}},{key:E.SAVE_KEY,value:state});
  if(options.offline)await c.route(/^https?:\/\//,r=>r.abort());
  await p.goto(options.offline?pathToFileURL(path.join(root,'yoru-no-suizokukan.html')).href:base);await p.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await p.locator('[data-action=start]').click();
  return {p,c,errors};
 }
 const snapState=p=>p.evaluate(()=>{const s=window.__game.getState();return {active:s.exploration.active,fish:s.fish_instances,dex:s.dex,materials:s.materials,pending:s.pending};});
 try{
  // The visual sizes are the same values used by the 3D scene, and the second
  // comparison mode uses the reference dimensions without compression.
  const now=Date.now(),s=E.createInitial(now);s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
  const names=['Amphiprion clarkii','Scomber japonicus','Heterodontus japonicus','Thunnus orientalis','Orcinus orca','Balaenoptera musculus','Gobiodon okinawae'];
  for(let i=0;i<names.length;i++){const r=E.discover(s,id(names[i]),'test',now,()=>.4,'beach');assert.ok(r.ok);const f=s.fish_instances.find(x=>x.uid===r.uid);f.uid='scale_'+i;f.size=1;f.hue_shift=0;}s.pending=[];for(const sp of CATALOG.filter(x=>x.referenceCm<30))if(E.currentDiscoveredCount(s)<10&&!s.dex.discovered.includes(sp.id))s.dex.discovered.push(sp.id);
  const scale=await open(s),p=scale.p;await p.locator('[data-action=room][data-room=beach]').click();await p.waitForTimeout(900);
  const scene=await p.evaluate(()=>window.__game.getSceneInfo()),find=i=>scene.entries.find(x=>x.uid==='scale_'+i);
  assert.deepEqual(names.map((_,i)=>find(i).sizeClass),['small','medium','large','large','giant','colossal','small']);
  assert.ok(find(3).displayLength>find(2).displayLength*1.9);assert.ok(find(4).displayLength>find(3).displayLength*1.5);assert.ok(find(5).displayLength>find(4).displayLength*1.45);
  await p.screenshot({path:path.join(shots,'yoru28-tank.png')});
  await p.locator('[data-action=toggle-tank-tools]').click();await p.locator('[data-action=open-size-compare]').click();assert.equal(await p.locator('.compare-row').count(),7);assert.match(await p.locator('.compare-note').innerText(),/圧縮/);
  const model=await p.locator('.compare-row').evaluateAll(rs=>rs.map(r=>({cm:+r.dataset.referenceCm,value:+r.dataset.comparisonValue,width:parseFloat(r.querySelector('.compare-track span').style.width)})));
  assert.deepEqual(model.map(x=>x.cm),[2500,600,250,100,50,14,4]);assert.ok(model[1].width>60&&model[1].width<75);assert.ok(model[2].width>35&&model[2].width<50);
  await p.screenshot({path:path.join(shots,'yoru28-size-compare.png')});await p.locator('[data-action=size-compare-mode][data-mode=real]').click();
  const real=await p.locator('.compare-row').evaluateAll(rs=>rs.map(r=>({cm:+r.dataset.referenceCm,width:parseFloat(r.querySelector('.compare-track span').style.width),rendered:r.querySelector('.compare-track span').getBoundingClientRect().width,track:r.querySelector('.compare-track').getBoundingClientRect().width})));
  assert.ok(Math.abs(real[1].width-24)<.01);assert.ok(Math.abs(real[2].width-10)<.01);assert.ok(Math.abs(real[6].width-.16)<.001,'4cm vs 25m remains proportional below half a percent');assert.ok(Math.abs(real[6].rendered/real[6].track*100-.16)<.02,'no CSS minimum visually inflates the smallest bar');assert.match(await p.locator('.compare-note').innerText(),/甲長・体盤幅/);
  await p.screenshot({path:path.join(shots,'yoru28-size-real.png')});await p.locator('.sheet-close').click();assert.deepEqual(scale.errors,[]);
  // Several animation frames must not send the 25m whale off the tank at 1x.
  for(let i=0;i<6;i++){const fit=await p.evaluate(()=>{const canvas=document.querySelector('#room-scene canvas').getBoundingClientRect(),b=window.__game.getFishBounds('scale_5');return {left:b.left-canvas.left,right:canvas.right-b.right,top:b.top-canvas.top,bottom:canvas.bottom-b.bottom};});for(const [side,space] of Object.entries(fit))assert.ok(space>=-12,`whale ${side}: ${space}px`);await p.waitForTimeout(600);}
  console.log('SIZE: five classes, actual 3D scale, whale fit and two comparison modes OK');await scale.c.close();

  // Four locations render distinct real-model voxel worlds; text-only observation stays removed.
  const art=[];
  for(const dest of ['cold-sea','fresh','reef','deep']){
   const start=Date.now(),j=E.createInitial(start);j.started=true;j.tutorial={explore:true,discover:true,pet:true};assert.ok(E.startExplore(j,dest,start).ok);
   // Long enough to inspect safely, while preserving a valid saved timer.
   j.exploration.active.started_at=start-30000;j.exploration.active.ends_at=start+120000;
   const v=await open(j),q=v.p;await q.locator('[data-screen=explore].nav-item').click();assert.equal(await q.locator('[data-journey-scene]').getAttribute('data-destination'),dest);
   await q.waitForFunction(()=>window.__game.getJourneyInfo().frameCount>=3);const info=await q.evaluate(()=>window.__game.getJourneyInfo());
   assert.equal(info.destination,dest);assert.equal(info.webgl,true);assert.equal(info.usesAquariumCanvas,true);assert.equal(info.creatures.length,5);assert.equal(await q.locator('[data-journey-scene]').getAttribute('data-renderer'),'webgl');
   const canvasArt=await q.locator('.journey-canvas').evaluate(el=>el.toDataURL());assert.ok(canvasArt.length>2000);art.push(canvasArt);
   const progress=+await q.locator('[data-journey-progress]').getAttribute('aria-valuenow');assert.ok(progress>=15&&progress<=45,`${dest}: ${progress}`);assert.match(await q.locator('[data-journey-progress]').getAttribute('aria-valuetext'),/出発|探索/);
   const before=await snapState(q);assert.equal(await q.locator('[data-action=journey-observe], [data-journey-note], .journey-log').count(),0);
   await q.screenshot({path:path.join(shots,`yoru28-journey-${dest}.png`)});
   if(dest==='reef'){
    await q.locator('[data-screen=home].nav-item').click();assert.deepEqual(await snapState(q),before);await q.locator('[data-screen=explore].nav-item').click();assert.equal(await q.locator('[data-journey-scene]').getAttribute('data-destination'),'reef');
    await q.reload();await q.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await q.locator('[data-action=start]').click();await q.locator('[data-screen=explore].nav-item').click();assert.deepEqual(await snapState(q),before);
   }
   assert.deepEqual(v.errors,[]);await v.c.close();
  }
  assert.equal(new Set(art).size,4);console.log('JOURNEY: four distinct voxel destinations, timed phases, no text-only observation and navigation/reload OK');

  // Narrow layout, maximum text size, normal-time skip restrictions, and
  // platform reduced-motion preference must all remain usable.
  const time=Date.now(),n=E.createInitial(time);n.started=true;n.settings.text_size='larger';n.settings.demo=false;n.settings.demo_showcase=false;n.exploration.active={destination:'cold-sea',started_at:time-3600000,ends_at:time+7200000,first:false,demo:false};n.exploration.has_explored=true;
  const narrow=await open(n,{viewport:{width:320,height:640},reducedMotion:'reduce'}),np=narrow.p;await np.locator('[data-screen=explore].nav-item').click();assert.equal(await np.locator('[data-action=skip]').count(),0);assert.equal(await np.locator('[data-action=journey-observe]').count(),0);
  const reduced=await np.evaluate(()=>window.__game.getJourneyInfo());assert.equal(reduced.reducedMotion,true);assert.equal(reduced.running,false);assert.equal(reduced.webgl,true);assert.equal(await np.locator('.journey-canvas').count(),1);assert.ok(await np.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  assert.ok(await np.locator('[data-journey-progress]').isVisible());assert.deepEqual(narrow.errors,[]);await np.screenshot({path:path.join(shots,'yoru28-journey-narrow.png')});
  console.log('JOURNEY: 320px, larger text, reduced motion and normal-time skip restriction OK');await narrow.c.close();

  // Advance the page's wall clock after the player reaches the waiting screen.
  // The ordinary refresh timer, not the skip action, must resolve exactly once.
  const when=Date.now(),a=E.createInitial(when);a.started=true;assert.ok(E.startExplore(a,'cold-sea',when).ok);
  const aut=await open(a),ap=aut.p;await ap.locator('[data-screen=explore].nav-item').click();assert.ok(await ap.locator('[data-journey-scene]').isVisible());await ap.evaluate(()=>{const realNow=Date.now;Date.now=()=>realNow()+31000;});await ap.waitForSelector('[data-action=ack-pending]',{timeout:15000});assert.match(await ap.locator('.modal-heading').innerText(),/新しい仲間/);
  let after=await ap.evaluate(()=>window.__game.getState());assert.equal(after.fish_instances.length,1);assert.equal(after.fish_instances[0].species_id,id('Amphiprion clarkii'));await ap.waitForTimeout(1200);after=await ap.evaluate(()=>window.__game.getState());assert.equal(after.fish_instances.length,1);assert.equal(after.exploration.active,null);assert.deepEqual(aut.errors,[]);await aut.c.close();console.log('JOURNEY: clock-advanced timer completion awards exactly once and preserves first-clownfish guarantee OK');

  const off=await open(null,{offline:true}),op=off.p;await op.locator('[data-screen=explore].nav-item').click();await op.locator('[data-action=explore-start][data-id=deep]').click();assert.equal(await op.locator('[data-journey-scene]').getAttribute('data-renderer'),'webgl');assert.equal((await op.evaluate(()=>window.__game.getJourneyInfo())).creatures.length,5);assert.equal(await op.locator('[data-action=journey-observe]').count(),0);assert.ok(await op.locator('[data-action=skip]').count());assert.deepEqual(off.errors,[]);console.log('JOURNEY: self-contained HTML, art and interaction work offline OK');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
