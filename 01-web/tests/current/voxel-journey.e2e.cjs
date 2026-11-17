// This suite uses an isolated server/browser and synthetic saves, never port 3000
// or the player's preview-data. It checks actual pixels and the shared WebGL lifecycle.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.YORU_SCREENSHOT_DIR||os.tmpdir();fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const E=await import('../../engine.js');
 const files={'/':'index.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 const server=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}
  res.writeHead(200,{'Cache-Control':'no-store','Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),contexts=[];
 async function open({dest='reef',viewport={width:390,height:844},reducedMotion='no-preference',noWebGL=false,isMobile=true}={}){
  const now=Date.now(),s=E.createInitial(now);s.started=true;s.tutorial={explore:true,discover:true,pet:true};assert.ok(E.startExplore(s,dest,now).ok);
  s.exploration.active.started_at=now-30000;s.exploration.active.ends_at=now+120000;
  const c=await browser.newContext({viewport,isMobile,hasTouch:isMobile,serviceWorkers:'block',reducedMotion});contexts.push(c);
  if(noWebGL)await c.addInitScript(()=>{const real=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).toLowerCase().includes('webgl'))return null;return real.call(this,type,...args);};});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed','1');}},{key:E.SAVE_KEY,value:s});
  await p.goto(base);await p.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await p.locator('[data-action=start]').click();await p.locator('[data-screen=explore].nav-item').click();return {p,c,errors,s};
 }
 const info=p=>p.evaluate(()=>window.__game.getJourneyInfo());
 const stableState=p=>p.evaluate(()=>{const s=window.__game.getState();return {active:s.exploration.active,fish:s.fish_instances,dex:s.dex,materials:s.materials,pending:s.pending};});
 try{
  const a=await open(),p=a.p;await p.waitForFunction(()=>window.__game.getJourneyInfo().frameCount>=5,null,{timeout:15000});
  const before=await info(p),state=await stableState(p);assert.equal(before.webgl,true);assert.equal(before.destination,'reef');assert.equal(before.creatures.length,5);assert.ok(before.drawCalls>0);
  assert.equal(await p.locator('.journey-canvas').count(),1);assert.equal(await p.locator('.journey-canvas').evaluate(x=>getComputedStyle(x).pointerEvents),'none');
  const pixels=await p.locator('.journey-canvas').evaluate(canvas=>{const sample=document.createElement('canvas');sample.width=80;sample.height=80;const x=sample.getContext('2d');x.drawImage(canvas,0,0,80,80);const d=x.getImageData(0,0,80,80).data,colors=new Set();let solid=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>30){solid++;colors.add(`${d[i]>>3},${d[i+1]>>3},${d[i+2]>>3}`);}return {solid,colors:colors.size};});
  assert.ok(pixels.solid>600&&pixels.colors>30,`canvas has real 3D pixels: ${JSON.stringify(pixels)}`);
  await p.waitForFunction(prev=>{const j=window.__game.getJourneyInfo();return j.frameCount>=prev.frameCount+4&&Math.abs(j.creatures[2].x-prev.creatures[2].x)>.03&&Math.abs(j.propeller-prev.propeller)>.1;},before,{timeout:15000});
  const animated=await info(p);assert.notEqual(animated.ship.y,before.ship.y,'submarine bobs');assert.deepEqual(await stableState(p),state,'animation does not change reward or save fields');
  await p.screenshot({path:path.join(shots,'yoru210-reef-moving.png')});
  // The voyage and aquarium must use the very same canvas, not two contexts.
  await p.evaluate(()=>window.__sharedVoyageCanvas=document.querySelector('.journey-canvas'));
  await p.locator('[data-screen=home].nav-item').click();assert.equal((await info(p)).active,false);assert.equal((await info(p)).running,false);
  await p.locator('[data-action=room][data-room=current]').click();await p.waitForFunction(()=>window.__game.getSceneInfo().entries.length>0);assert.equal(await p.locator('canvas.aquarium-canvas').count(),1);
  assert.equal(await p.evaluate(()=>document.querySelector('canvas.aquarium-canvas')===window.__sharedVoyageCanvas),true);
  await p.locator('[data-screen=explore].nav-item').click();await p.waitForFunction(()=>window.__game.getJourneyInfo().running);assert.equal(await p.evaluate(()=>document.querySelector('.journey-canvas')===window.__sharedVoyageCanvas),true);
  const baseline=await info(p);for(let i=0;i<4;i++){await p.locator('[data-screen=home].nav-item').click();assert.equal((await info(p)).running,false);await p.locator('[data-screen=explore].nav-item').click();assert.equal(await p.locator('canvas').count(),1);}
  const reused=await info(p);assert.equal(reused.buildCount,baseline.buildCount,'navigation reuses the same world');assert.ok(reused.geometries<=baseline.geometries+1,'repeated navigation does not allocate new geometry');
  // Reduced motion can change at runtime; progress remains active but the
  // boat, props and creatures stop rather than running an expensive idle RAF.
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>window.__game.getJourneyInfo().reducedMotion&&!window.__game.getJourneyInfo().running);
  const still=await info(p);await p.waitForTimeout(550);const still2=await info(p);assert.deepEqual(still2.ship,still.ship);assert.equal(still2.propeller,still.propeller);assert.deepEqual(still2.creatures,still.creatures);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!window.__game.getJourneyInfo().reducedMotion&&window.__game.getJourneyInfo().running);
  // Backgrounding stops work. Returning starts the scene without changing the
  // saved exploration timer or rebuilding the diorama.
  await p.evaluate(()=>{window.__mockHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__mockHidden});document.dispatchEvent(new Event('visibilitychange'));});assert.equal((await info(p)).running,false);
  await p.evaluate(()=>{window.__mockHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(()=>window.__game.getJourneyInfo().running);assert.equal((await info(p)).buildCount,baseline.buildCount);
  // Advance the existing timer without resolving it: labels, boat route and
  // turnaround must follow that timer, not a separate animation clock.
  const timer=(await p.evaluate(()=>window.__game.getState())).exploration.active;
  await p.evaluate(t=>{Date.now=()=>t.started_at+(t.ends_at-t.started_at)*.70;},timer);await p.waitForFunction(()=>window.__game.getJourneyInfo().phase===1&&window.__game.getJourneyInfo().progress>.69,null,{timeout:10000});
  await p.waitForFunction(()=>window.__game.getJourneyInfo().ship.x>.5,null,{timeout:10000});const outward=await info(p);assert.match(await p.locator('[data-journey-progress]').getAttribute('aria-valuetext'),/探索/);
  await p.evaluate(t=>{Date.now=()=>t.started_at+(t.ends_at-t.started_at)*.95;},timer);await p.waitForFunction(()=>{const j=window.__game.getJourneyInfo();return j.phase===2&&j.ship.x<-.7&&j.ship.heading<.5;},null,{timeout:10000});
  const home=await info(p);assert.ok(home.ship.x<outward.ship.x-1);assert.match(await p.locator('[data-journey-progress]').getAttribute('aria-valuetext'),/帰り道/);
  const geometriesBeforeRelease=home.geometries;await p.locator('[data-action=skip]').click();await p.waitForSelector('[data-action=ack-pending]');await p.waitForFunction(()=>!window.__game.getJourneyInfo().active&&window.__game.getJourneyInfo().destination===null);
  const released=await info(p);assert.equal(released.running,false);assert.ok(released.geometries<geometriesBeforeRelease,'temporary voxel geometry is released after journey ends');
  assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances.length,1,'skipping resolves first reward exactly once');assert.deepEqual(a.errors,[]);await a.c.close();
  console.log('VOXEL: actual 3D pixels, motion, shared canvas, route phases, reduced motion, visibility and world disposal OK');

  const narrow=await open({dest:'cold-sea',viewport:{width:320,height:640},reducedMotion:'reduce'}),np=narrow.p;await np.waitForFunction(()=>window.__game.getJourneyInfo().frameCount>=1);assert.ok(await np.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  assert.ok(await np.locator('[data-journey-progress]').isVisible());assert.equal((await info(np)).running,false);await np.screenshot({path:path.join(shots,'yoru210-320-reduced.png')});assert.deepEqual(narrow.errors,[]);await narrow.c.close();
  const desktop=await open({dest:'fresh',viewport:{width:1440,height:900},isMobile:false}),dp=desktop.p;await dp.waitForFunction(()=>window.__game.getJourneyInfo().frameCount>=3);assert.ok(await dp.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));await dp.screenshot({path:path.join(shots,'yoru210-desktop.png')});assert.deepEqual(desktop.errors,[]);await desktop.c.close();
  console.log('VOXEL: 320px reduced-motion and desktop layouts OK');

  const fallback=await open({dest:'deep',noWebGL:true}),fp=fallback.p;assert.equal(await fp.locator('[data-journey-scene]').getAttribute('data-renderer'),'fallback');assert.equal((await info(fp)).webgl,false);assert.ok(await fp.locator('.journey-fallback').isVisible());assert.equal(await fp.locator('.journey-canvas').count(),0);assert.ok(await fp.locator('[data-journey-progress]').isVisible());
  await fp.screenshot({path:path.join(shots,'yoru210-no-webgl.png')});await fp.locator('[data-action=skip]').click();await fp.waitForSelector('[data-action=ack-pending]');assert.equal((await fp.evaluate(()=>window.__game.getState())).fish_instances.length,1);assert.deepEqual(fallback.errors,[]);await fallback.c.close();
  console.log('VOXEL: no-WebGL static voxel fallback and actual skip/reward OK');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
