// Real delivered 2.11 JSON export -> current on a different origin, then
// workspace-backup restore on yet another isolated origin. No port 3000 or
// actual preview-data is read, written, or removed.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),oldRoot=process.env.OLD_ROOT&&path.resolve(process.env.OLD_ROOT),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function preview(data){const port=await freePort(),child=spawn(process.execPath,['preview-server.mjs'],{cwd:root,env:{...process.env,HOST:'127.0.0.1',PORT:String(port),YORU_PREVIEW_DATA_DIR:data},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('server startup '+log)),8000);child.stdout.on('data',d=>{if(String(d).includes('listening')){clearTimeout(t);resolve();}});child.on('exit',c=>{clearTimeout(t);reject(Error('server exited '+c+' '+log));});});return {url:`http://127.0.0.1:${port}/`,child};}
async function stop(s){if(s&&s.child.exitCode===null)await new Promise(r=>{s.child.once('exit',r);s.child.kill('SIGTERM')});}
async function synced(p){await p.waitForFunction(()=>{const b=window.__game?.getBackupInfo();return b?.status==='ready'&&b.revision>=1&&!b.dirty;},null,{timeout:30000});}
(async()=>{
 if(!oldRoot)throw Error('Set OLD_ROOT to the parent of extracted yoru-web-2.11 with released HTML.');const old=path.join(oldRoot,'yoru-web-2.11');
 const E=await import(pathToFileURL(path.join(old,'engine.js')).href),C=await import(pathToFileURL(path.join(old,'catalog.js')).href),L=await import(pathToFileURL(path.join(old,'decor-layout.js')).href),now=Date.now(),s=E.createInitial(now);
 s.started=true;s.settings.demo_showcase=false;s.tutorial={explore:true,discover:true,pet:true};
 for(const [i,n] of ['Thunnus orientalis','Thunnus orientalis','Aurelia coerulea'].entries()){
  const r=E.discover(s,C.idOfScientific(n),'cross211',now,()=>.3+i*.03,'current');const f=s.fish_instances.find(x=>x.uid===r.uid);f.nickname='移行する仲間'+i;if(i<2){f.sex=i?'female':'male';f.growth=50;f.care.satiety=80;}
 }
 E.refreshBreeding(s,now+1,()=>.9);for(const t of Object.values(s.breeding.timers))t.next_at=now+7200000;assert.equal(Object.keys(s.breeding.timers).length,1);
 assert.ok(L.setDecorPosition(s,'current','marine','plants',0,{x:1,z:-2,rotation:90}));s.exploration.has_explored=true;s.exploration.active={destination:'cold-sea',started_at:now,ends_at:now+3600000,first:false,demo:true};s.materials=11;
 const files={'/':'index.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 const oldServer=http.createServer((req,res)=>{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(old,f)));});
 await new Promise(r=>oldServer.listen(0,'127.0.0.1',r));const oldURL=`http://127.0.0.1:${oldServer.address().port}/`,data=fs.mkdtempSync(path.join(os.tmpdir(),'yoru-cross211-'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),contexts=[];let srv1,srv2;
 const core=x=>({fish:x.fish_instances,dex:x.dex,breeding:x.breeding,layouts:x.tank.layouts,active:x.exploration.active,materials:x.materials});
 try{
  const c1=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true});contexts.push(c1);const p=await c1.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed211cross')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed211cross','1');}},{key:E.SAVE_KEY,value:s});await p.goto(oldURL);await p.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await p.locator('[data-action=start]').click();await p.locator('[data-screen=settings].nav-item').click();
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action=export-current]').click()]);const json=fs.readFileSync(await dl.path(),'utf8'),exported=JSON.parse(json);assert.equal(exported.fish_instances.length,3);
  srv1=await preview(data);assert.notEqual(new URL(oldURL).origin,new URL(srv1.url).origin);const c2=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});contexts.push(c2);const q=await c2.newPage();q.on('pageerror',e=>errors.push(e.message));
  await q.goto(srv1.url);await q.waitForFunction(()=>window.__game?.getBackupInfo().status==='ready');assert.equal((await q.evaluate(()=>window.__game.getState())).fish_instances.length,0);
  await q.locator('[data-action=start]').click();await q.locator('[data-screen=settings].nav-item').click();await q.locator('#save-import-file').setInputFiles({name:'2.11-save.json',mimeType:'application/json',buffer:Buffer.from(json)});assert.match(await q.locator('.modal-copy').first().innerText(),/仲間 3体/);await q.locator('[data-action=commit-import]').click();await synced(q);
  const imported=await q.evaluate(()=>window.__game.getState());assert.deepEqual(core(imported),core(exported));assert.equal(imported.importRecovery.original.fish_instances.length,0);
  await c2.close();await pause(400);srv2=await preview(data);assert.notEqual(srv1.url,srv2.url);const c3=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});contexts.push(c3);const r=await c3.newPage();r.on('pageerror',e=>errors.push(e.message));await r.goto(srv2.url);await synced(r);assert.deepEqual(core(await r.evaluate(()=>window.__game.getState())),core(exported));assert.deepEqual(errors,[]);
  console.log('CROSS-ORIGIN 2.11: released JSON → 2.13 explicit import, three individuals, breeding, active trip, layout and isolated preview restore preserved OK');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();await stop(srv1);await stop(srv2);await new Promise(r=>oldServer.close(r));fs.rmSync(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
