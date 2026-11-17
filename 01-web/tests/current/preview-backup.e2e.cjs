const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const net=require('node:net');const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function serve(data){const port=await freePort(),child=spawn(process.execPath,['preview-server.mjs'],{cwd:path.resolve(__dirname,'../..'),env:{...process.env,HOST:'127.0.0.1',PORT:String(port),YORU_PREVIEW_DATA_DIR:data},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server did not start: '+log)),8000);child.stdout.on('data',d=>{if(String(d).includes('listening')){clearTimeout(timer);resolve();}});child.on('exit',c=>{clearTimeout(timer);reject(Error('server exited '+c+' '+log));});});return {port,child,url:`http://127.0.0.1:${port}/`};}
async function stop(s){if(!s||s.child.exitCode!==null)return;await new Promise(resolve=>{s.child.once('exit',resolve);s.child.kill('SIGTERM');});}
async function current(url){const r=await fetch(new URL('__yoru/preview-save',url),{headers:{'X-Yoru-Preview':'1'}});assert.equal(r.status,200);return r.json();}
async function waitSynced(page,min=1){await page.waitForFunction(min=>{const s=window.__game?.getBackupInfo();return s?.status==='ready'&&s.revision>=min&&!s.dirty;},min,{timeout:30000});}
(async()=>{
 const E=await import('../../engine.js'),L=await import('../../decor-layout.js'),now=Date.now(),data=fs.mkdtempSync(path.join(os.tmpdir(),'yoru-persist-test-'));
 let server=await serve(data),browser;
 try{
  const originA=server.url,old=E.createInitial(now);old.started=true;old.settings.demo_showcase=false;old.tutorial={explore:true,discover:true,pet:true};
  for(const id of ['real_170','sp_058','real_160'])E.discover(old,id,'test',now,()=>.4);old.fish_instances[0].nickname='最初の子';old.fish_instances.push({...structuredClone(old.fish_instances[0]),uid:'old_archived_01',species_id:'sp_039',nickname:'保管した旧個体',size:1.11});old.dex.discovered.push('sp_039');old.pending=[];old.exploration.has_explored=true;old.exploration.active={destination:'river',started_at:now,ends_at:now+3600000,first:false,demo:true};L.setDecorPosition(old,'cold-sea','marine','plants',0,{x:1.5,z:-1,rotation:45});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
  let ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value,origin})=>{if(location.origin===origin&&!sessionStorage.getItem('persist-seed')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('persist-seed','1');}},{key:E.SAVE_KEY,value:old,origin:new URL(originA).origin});
  await page.goto(originA);await waitSynced(page);let stored=await current(originA);assert.equal(stored.state.fish_instances[0].uid,old.fish_instances[0].uid);assert.equal(stored.state.fish_instances[0].nickname,'最初の子');assert.deepEqual(stored.state.exploration.active,old.exploration.active);
  await page.locator('[data-action=start]').click();await page.locator('[data-screen=dex].nav-item').click();await page.locator('.dex-cell[data-id="real_170"]').click();await page.locator(`[data-action=fish][data-uid="${old.fish_instances[0].uid}"]`).click();await page.locator('#nickname-input').fill('保存した子');await page.locator('[data-action=rename]').click();await waitSynced(page,2);
  stored=await current(originA);assert.equal(stored.state.fish_instances[0].nickname,'保存した子');assert.deepEqual(stored.state.tank.layouts,old.tank.layouts);assert.deepEqual(stored.state.dex.discovered,old.dex.discovered);
  const cacheUrls=await page.evaluate(async()=>{const out=[];for(const key of await caches.keys())for(const req of await (await caches.open(key)).keys())out.push(req.url);return out;});assert.ok(!cacheUrls.some(x=>x.includes('/__yoru/')),'backup API must never be cached');
  await ctx.close();await delay(500);await stop(server);
  // A new server process and origin use the same persisted workspace data.
  server=await serve(data);assert.notEqual(server.url,originA);const originB=server.url;
  ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(originB);await waitSynced(page);const restored=await page.evaluate(()=>window.__game.getState());
  assert.equal(restored.fish_instances[0].uid,old.fish_instances[0].uid);assert.equal(restored.fish_instances[0].nickname,'保存した子');assert.deepEqual(restored.tank.layouts,old.tank.layouts);assert.deepEqual(restored.dex.discovered,old.dex.discovered);assert.deepEqual(restored.exploration.active,old.exploration.active);await page.locator('[data-action=start]').click();await page.locator('[data-screen=explore].nav-item').click();assert.equal(await page.locator('[data-journey-scene]').getAttribute('data-destination'),'river');assert.deepEqual(restored.fish_instances.find(f=>f.uid==='old_archived_01'),old.fish_instances.find(f=>f.uid==='old_archived_01'));
  await ctx.close();await delay(500);let prior=await current(originB);
  // A different local save is never overwritten or uploaded without a choice.
  const local=E.createInitial(now);local.started=true;local.settings.demo_showcase=false;E.discover(local,'real_067','test',now,()=>.3);local.fish_instances[0].nickname='端末の子';local.pending=[];
  const conflictCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true}),cp=await conflictCtx.newPage();cp.on('pageerror',e=>errors.push(e.message));
  await cp.addInitScript(({key,value})=>{if(!sessionStorage.getItem('conflict-seed')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('conflict-seed','1');}},{key:E.SAVE_KEY,value:local});await cp.goto(originB);
  await cp.waitForFunction(()=>window.__game?.getBackupInfo().status==='conflict',null,{timeout:15000});assert.equal(await cp.locator('[data-action=start]').isDisabled(),true);
  assert.equal((await current(originB)).state.fish_instances[0].nickname,'保存した子');assert.equal((await cp.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'端末の子');
  await cp.locator('[data-action=backup-conflict]').click();assert.match(await cp.locator('.backup-compare').innerText(),/端末/);
  const [localDownload]=await Promise.all([cp.waitForEvent('download'),cp.locator('.sheet [data-action=export-current]').click()]);assert.equal(JSON.parse(fs.readFileSync(await localDownload.path(),'utf8')).fish_instances[0].nickname,'端末の子');
  const [remoteDownload]=await Promise.all([cp.waitForEvent('download'),cp.locator('[data-action=backup-export-remote]').click()]);assert.equal(JSON.parse(fs.readFileSync(await remoteDownload.path(),'utf8')).fish_instances[0].nickname,'保存した子');
  await cp.locator('[data-action=backup-choose-remote]').click();const resolved=await cp.evaluate(()=>window.__game.getState());assert.equal(resolved.fish_instances[0].nickname,'保存した子');assert.equal(resolved.importRecovery.original.fish_instances[0].nickname,'端末の子');
  await conflictCtx.close();await delay(500);prior=await current(originB);
  // Choosing local is explicit, and a revision check preserves the prior file.
  const chooseCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),lp=await chooseCtx.newPage();lp.on('pageerror',e=>errors.push(e.message));
  await lp.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:E.SAVE_KEY,value:local});await lp.goto(originB);await lp.waitForFunction(()=>window.__game?.getBackupInfo().status==='conflict');await lp.locator('[data-action=backup-conflict]').click();await lp.locator('[data-action=backup-choose-local]').click();await waitSynced(lp,prior.revision+1);
  assert.equal((await current(originB)).state.fish_instances[0].nickname,'端末の子');const prev=JSON.parse(fs.readFileSync(path.join(data,'previous.json'),'utf8'));assert.equal(prev.state.fish_instances[0].nickname,'保存した子');
  await chooseCtx.close();await delay(500);
  // API does not reveal its files as static assets and refuses stale or invalid writes.
  const noHeader=await fetch(new URL('__yoru/preview-save',originB));assert.equal(noHeader.status,403);assert.equal((await fetch(new URL('preview-data/current.json',originB))).status,404);
  const good=await current(originB),send=body=>fetch(new URL('__yoru/preview-save',originB),{method:'POST',headers:{'Content-Type':'application/json','X-Yoru-Preview':'1'},body:JSON.stringify(body)});
  assert.equal((await send({baseRevision:0,state:old})).status,409);assert.equal((await send({baseRevision:good.revision,state:{...old,fish_instances:[null]}})).status,400);assert.equal((await current(originB)).revision,good.revision);
  // A full new collection plus archived old generations may exceed 1500.
  // Such a valid save must still round-trip through the preview and reload.
  const bulky=structuredClone(old),archived=bulky.fish_instances.find(f=>f.uid==='old_archived_01');bulky.fish_instances=bulky.fish_instances.filter(f=>f.uid!==archived.uid);for(let i=0;i<1601;i++)bulky.fish_instances.push({...structuredClone(archived),uid:`archived_many_${i}`});
  assert.equal((await send({baseRevision:good.revision,state:bulky})).status,200);assert.equal((await current(originB)).state.fish_instances.length,1604);
  const bigCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),bigPage=await bigCtx.newPage();await bigPage.goto(originB);await waitSynced(bigPage);assert.equal((await bigPage.evaluate(()=>window.__game.getState())).fish_instances.length,1604);await bigCtx.close();
  // The new waiting flag and per-individual section must round-trip through
  // the actual preview validator as well as through portable JSON.
  const waiting=structuredClone(old),held=waiting.fish_instances.find(f=>f.uid===old.fish_instances[0].uid);held.placed=false;held.exhibit_section='review';
  const afterBulky=await current(originB);assert.equal((await send({baseRevision:afterBulky.revision,state:waiting})).status,200);
  const ready=await current(originB),restoredHeld=ready.state.fish_instances.find(f=>f.uid===held.uid);assert.equal(restoredHeld.placed,true,'2.14 has no waiting state: fish are placed in a compatible room');assert.equal(restoredHeld.exhibit_section,undefined);
  const waitingCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),waitingPage=await waitingCtx.newPage();await waitingPage.goto(originB);await waitSynced(waitingPage);const fromBrowser=await waitingPage.evaluate(()=>window.__game.getState());assert.equal(fromBrowser.fish_instances.find(f=>f.uid===held.uid).placed,true);await waitingCtx.close();
  // If the server file is unreadable, it must not replace the bytes with a new save.
  const corrupt='not-json-user-data';fs.writeFileSync(path.join(data,'current.json'),corrupt);assert.equal((await fetch(new URL('__yoru/preview-save',originB),{headers:{'X-Yoru-Preview':'1'}})).status,503);assert.equal((await send({baseRevision:0,state:old})).status,503);assert.equal(fs.readFileSync(path.join(data,'current.json'),'utf8'),corrupt);
  assert.deepEqual(errors,[]);console.log('PERSISTENCE: old local fish/nickname/layout and focused active trip synced, restored after server restart and new origin; conflict exports + both choices; private files, >1500 archived individuals, waiting/section fields, stale/invalid/corrupt writes protected OK');
 }finally{if(browser)await browser.close();await stop(server);fs.rmSync(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
