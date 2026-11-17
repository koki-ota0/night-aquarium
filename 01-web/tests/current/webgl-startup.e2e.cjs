// Isolated static server and synthetic saves. Never accesses preview-data.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const E=await import('../../engine.js'),{idOfScientific}=await import('../../catalog.js'),now=Date.now();
 const seed=E.createInitial(now);seed.started=true;seed.tutorial={explore:true,discover:true,pet:true};
 assert.ok(E.discover(seed,idOfScientific('Amphiprion clarkii'),'test',now,()=>.4).ok);
 seed.fish_instances[0].nickname='private-test-fish';seed.pending=[];
 const files={'/':'index.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest'};
 const server=http.createServer((req,res)=>{const file=files[new URL(req.url,'http://test.invalid').pathname];if(!file){res.writeHead(404).end();return;}res.writeHead(200,{'Cache-Control':'no-store','Content-Type':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,file)));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
  for(const [mode,profile,count] of [['normal','preferred',1],['gpu','default-gpu',2],['antialias','compatible',3],['denied',null,3]]){
   const context=await browser.newContext({viewport:{width:320,height:740},serviceWorkers:'block',acceptDownloads:true});
   try{
    await context.route('**/__yoru/preview-save',route=>route.abort());
    await context.addInitScript(({seed,key,mode})=>{
     localStorage.setItem(key,JSON.stringify(seed));window.__startupRequests=[];
     const native=HTMLCanvasElement.prototype.getContext,canvases=new Set();
     HTMLCanvasElement.prototype.getContext=function(type,options,...args){
      if(type==='webgl2'&&options){
       canvases.add(this);window.__startupRequests.push({canvas:canvases.size,powerPreference:options.powerPreference,antialias:options.antialias});
       const denied=mode==='denied'||mode==='gpu'&&options.powerPreference==='high-performance'||mode==='antialias'&&options.antialias;
       if(denied){const event=new Event('webglcontextcreationerror');Object.defineProperty(event,'statusMessage',{value:'Test GPU policy denied <img src=x onerror=alert(1)>'});this.dispatchEvent(event);return null;}
      }
      return native.call(this,type,options,...args);
     };
    },{seed,key:E.SAVE_KEY,mode});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(()=>window.__game&&__game.getBackupInfo().status!=='checking');
    await page.locator('[data-action=start]').click();await page.locator('[data-action=room][data-room=reef]').click();
    const info=await page.evaluate(()=>__game.getGraphicsInfo()),requests=await page.evaluate(()=>window.__startupRequests);
    assert.equal(info.profile,profile);assert.equal(info.attempts.length,count);assert.equal(requests.length,count);assert.deepEqual(requests.map(request=>request.canvas),Array.from({length:count},(_,i)=>i+1));
    if(profile){
     assert.equal(await page.locator('.webgl-fallback').count(),0);
     await page.waitForFunction(()=>{
      const canvas=document.querySelector('canvas.aquarium-canvas');if(!canvas)return false;
      const gl=canvas.getContext('webgl2');if(!gl||gl.isContextLost())return false;
      const sample=document.createElement('canvas');sample.width=sample.height=24;const ctx=sample.getContext('2d');ctx.drawImage(canvas,0,0,24,24);
      return ctx.getImageData(0,0,24,24).data.some((value,index)=>index%4===3&&value>30);
     });
     // preserveDrawingBuffer stays enabled, including the compatibility path.
     const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=share]').click()]);
     const bytes=fs.readFileSync(await download.path());assert.ok(bytes.length>1000);assert.equal(bytes.subarray(1,4).toString(),'PNG');
     await page.locator('[data-screen=settings].nav-item').click();await page.locator('[data-action=graphics-info]').click();
    }else{
     assert.equal(info.status,'unavailable');assert.match(await page.locator('.webgl-fallback').innerText(),/初期化に失敗/);
     await page.locator('[data-action=graphics-info]').click();
    }
    const report=await page.locator('[data-graphics-report]').inputValue();assert.match(report,/WebGL診断 1/);assert.ok(!report.includes('private-test-fish'));assert.ok(!report.includes('yoru_aquarium_save_v5'));
    if(mode!=='normal')assert.match(report,/Test GPU policy denied <img/);
    assert.equal(await page.locator('.sheet img').count(),0,'native errors are text, not executable HTML');
    const link=page.locator('.graphics-open-tab');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
    assert.equal(await page.locator('.sheet').evaluate(element=>element.scrollWidth<=element.clientWidth),true);
    const state=await page.evaluate(()=>__game.getState());assert.deepEqual(state.fish_instances.map(f=>({uid:f.uid,species_id:f.species_id,nickname:f.nickname,size:f.size,growth:f.growth})),seed.fish_instances.map(f=>({uid:f.uid,species_id:f.species_id,nickname:f.nickname,size:f.size,growth:f.growth})));
    assert.deepEqual(errors,[]);console.log(`WEBGL STARTUP: ${mode} → ${profile||'diagnostic fallback'}, ${count} attempt(s), pixels/export or actionable failure, private fish unchanged`);
   }finally{await context.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
