// Real old v2.5 shell/v8 worker -> v2.6/v9, then new origin and offline.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),net=require('node:net');
const {pathToFileURL}=require('node:url'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
(async()=>{
 if(!process.env.OLD_WEB_DIR)throw Error('Set OLD_WEB_DIR to an extracted Web 2.5 project.');
 const old=path.resolve(process.env.OLD_WEB_DIR),cur=path.resolve(__dirname,'..'),E=await import(pathToFileURL(path.join(old,'engine.js')).href),L=await import(pathToFileURL(path.join(old,'decor-layout.js')).href);
 const port=await freePort(),data=fs.mkdtempSync(path.join(os.tmpdir(),'yoru-upgrade-')),child=spawn(process.execPath,['preview-server.mjs'],{cwd:cur,env:{...process.env,HOST:'127.0.0.1',PORT:String(port),YORU_PREVIEW_DATA_DIR:data},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,bad)=>{const timer=setTimeout(()=>bad(Error('backup did not start')),8000);child.stdout.on('data',d=>{if(String(d).includes('listening')){clearTimeout(timer);ok();}});child.on('exit',()=>{clearTimeout(timer);bad(Error('backup exited'));});});
 let gen=25;const files={'/':'index.html','/index.html':'index.html','/yoru-no-suizokukan.html':'yoru-no-suizokukan.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 function proxyServer(){return http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;
  if(name.startsWith('/__yoru/')){if(gen===25){res.writeHead(404).end();return;}const r=http.request({host:'127.0.0.1',port,path:req.url,method:req.method,headers:req.headers},x=>{res.writeHead(x.statusCode,x.headers);x.pipe(res);});r.on('error',()=>res.writeHead(502).end());req.pipe(r);return;}
  const file=files[name];if(!file){res.writeHead(404).end();return;}const ct=file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';res.writeHead(200,{'Content-Type':ct,'Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(gen===25?old:cur,file)));
 });}
 const a=proxyServer();await new Promise(r=>a.listen(0,'127.0.0.1',r));let b,browser,ctx;
 try{
  const url=`http://127.0.0.1:${a.address().port}/`,now=Date.now(),s=E.createInitial(now);s.started=true;s.tutorial={explore:true,discover:true,pet:true};for(const id of ['sp_030','sp_058','sp_001'])E.discover(s,id,'test',now,()=>.4);s.fish_instances[0].nickname='更新前の子';s.pending=[];L.setDecorPosition(s,'current','marine','plants',0,{x:1,z:-1,rotation:90});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({key,value,origin})=>{if(location.origin===origin&&!sessionStorage.getItem('old-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('old-seeded','1');}},{key:E.SAVE_KEY,value:s,origin:new URL(url).origin});
  await p.goto(url);await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(async()=>(await caches.keys()).includes('night-aquarium-v8'));await p.locator('[data-action=start]').click();
  const before=await p.evaluate(()=>window.__game.getState());gen=26;await p.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).update());await p.waitForFunction(async()=>{const k=await caches.keys();return k.includes('night-aquarium-v9')&&!k.includes('night-aquarium-v8');},{},{timeout:20000});
  await p.reload();await p.waitForFunction(()=>{let b=window.__game?.getBackupInfo();return b?.status==='ready'&&b.revision>=1&&!b.dirty;},null,{timeout:30000});const after=await p.evaluate(()=>window.__game.getState());
  assert.deepEqual(after.fish_instances.map(f=>[f.uid,f.species_id,f.nickname]),before.fish_instances.map(f=>[f.uid,f.species_id,f.nickname]));assert.deepEqual(after.tank.layouts,before.tank.layouts);assert.deepEqual(after.dex.discovered,before.dex.discovered);
  // A new origin starts with no localStorage; same workspace backup restores it.
  b=proxyServer();await new Promise(r=>b.listen(0,'127.0.0.1',r));const url2=`http://127.0.0.1:${b.address().port}/`,p2=await ctx.newPage();p2.on('pageerror',e=>errors.push(e.message));await p2.goto(url2);await p2.waitForFunction(()=>window.__game?.getBackupInfo().status==='ready',null,{timeout:30000});const recovered=await p2.evaluate(()=>window.__game.getState());
  assert.deepEqual(recovered.fish_instances.map(f=>[f.uid,f.species_id,f.nickname]),before.fish_instances.map(f=>[f.uid,f.species_id,f.nickname]));assert.deepEqual(recovered.tank.layouts,before.tank.layouts);
  await p2.evaluate(()=>navigator.serviceWorker.ready);await ctx.setOffline(true);await p2.reload();await p2.locator('[data-action=start]').click();assert.equal((await p2.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'更新前の子');assert.deepEqual(errors,[]);
  console.log('UPDATE: actual 2.5/v8 -> 2.6/v9 -> workspace backup -> different origin -> offline reload: all original fish, nickname, discoveries and layout preserved OK');
 }finally{if(ctx)await ctx.close();if(browser)await browser.close();if(b)await new Promise(r=>b.close(r));await new Promise(r=>a.close(r));await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM');});fs.rmSync(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
