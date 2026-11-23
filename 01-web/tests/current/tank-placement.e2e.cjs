// Isolated temporary origin only: never reads or writes the real preview backup.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.YORU_SCREENSHOT_DIR||os.tmpdir();fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const E=await import('../../engine.js'),C=await import('../../catalog.js'),now=Date.now();
 const server=http.createServer((req,res)=>{if(req.url.split('?')[0]!=='/'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(root,'index.html')));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}),contexts=[];
 async function open(initial,{width=390,height=844,httpOrigin=false,reduced=false,noWebgl=false}={}){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference'});contexts.push(context);
  await context.route(/^https?:\/\//,r=>httpOrigin&&r.request().url().startsWith(base)?r.continue():r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(initial)await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seed213')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seed213','yes');}},{key:E.SAVE_KEY,value:initial});
  if(noWebgl)await page.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return String(t).startsWith('webgl')?null:orig.call(this,t,...args);};});
  await page.goto(httpOrigin?base:pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');await page.locator('[data-action=start]').click();return {page,context,errors};
 }
 const game=p=>p.evaluate(()=>window.__game.getState()),scene=p=>p.evaluate(()=>window.__game.getSceneInfo()),id=C.idOfScientific;
 try{
  const demo=await open(),p=demo.page;await p.locator('.room-card[data-room=current]').click();
  assert.equal(await p.locator('[data-action=exhibit-section]').count(),3);assert.deepEqual(await p.locator('.section-name').allTextContents(),['冷たい海','暖かい海','大型生物の海']);
  assert.equal(await p.locator('[data-action=open-collection]').first().innerText().then(t=>/0 \/ 20/.test(t)),true);
  await p.locator('[data-action=exhibit-section][data-section=large]').click();await p.waitForFunction(()=>window.__game.getSceneInfo().entries.length>0);
  let v=await scene(p);assert.equal(v.habitat,'current-large');assert.equal(v.floorVisible,false);assert.ok(v.entries.some(e=>e.shape==='whaleShark'||e.shape==='orca'));
  await p.locator('[data-action=quick-room][data-room=river]').click();assert.equal(await p.locator('[data-action=exhibit-section]').count(),2);
  await p.locator('[data-action=exhibit-section][data-section=lake]').click();v=await scene(p);assert.equal(v.habitat,'river-lake');assert.ok(v.floorVisible);assert.ok(v.habitatObjects[0].blocks>0);
  assert.deepEqual((await game(p)).fish_instances,[],'demo samples are not earned');assert.deepEqual(demo.errors,[]);await demo.context.close();console.log('2.13 NAV: independent large ocean and river/lake voxel scenes, demo capacity excludes samples OK');

  const full=E.createInitial(now);full.started=true;full.settings.demo_showcase=false;full.tutorial={explore:true,discover:true,pet:true};
  const types=C.CATALOG.filter(sp=>sp.kind!=='environment'&&C.preferredRoom(sp)==='current'&&C.exhibitSection(sp,'current')==='warm');
  for(let i=0;i<20;i++){const r=E.discover(full,types[i%types.length].id,'old',now+i,()=>.25,'current');const f=full.fish_instances.find(x=>x.uid===r.uid);delete f.exhibit_section;f.placed=true;f.nickname=`旧${i}`;}
  const old=structuredClone(full.fish_instances),receipt=E.discover(full,types[0].id,'explore',now+40,()=>.25,'current');assert.equal(receipt.stored,true);full.pending=[{type:'discovery',destination:'cold-sea',result:receipt}];
  const placed=await open(full,{httpOrigin:true}),q=placed.page;assert.match(await q.locator('.modal-copy').innerText(),/お迎え待ち/);await q.locator('[data-action=ack-pending]').click();
  assert.equal(await q.locator('.collection-row.is-waiting').count(),1);assert.match(await q.locator('.collection-cap').innerText(),/20 \/ 20/);
  await q.locator('.collection-row.is-waiting [data-action=move-dialog]').click();assert.ok(await q.locator('[data-action=move][data-room=current][data-section=warm]').isDisabled());assert.ok(await q.locator('[data-action=move][data-room=current][data-section=cool]').isEnabled());
  await q.locator('[data-action=close-modal]').click();await q.locator('[data-action=open-collection]').first().click();
  await q.locator(`.collection-row [data-action=move-dialog][data-uid="${old[0].uid}"]`).click();await q.locator('[data-action=move][data-room=current][data-section=cool]').click();await q.locator('[data-action=back-collection]').click();
  assert.match(await q.locator('.collection-cap').innerText(),/19 \/ 20/);await q.locator('.collection-row.is-waiting [data-action=move-dialog]').click();await q.locator('[data-action=move][data-room=current][data-section=warm]').click();
  assert.equal(await q.locator('[data-action=follow-fish]').isEnabled(),true);await q.locator('#nickname-input').fill('ミルクちゃん');await q.locator('[data-action=rename]').click();assert.match(await q.locator('.detail-name').innerText(),/ミルクちゃん/);
  let saved=await game(q),earned=saved.fish_instances.find(f=>f.uid===receipt.uid);assert.equal(earned.placed,true);assert.equal(earned.exhibit_section,'warm');assert.equal(earned.nickname,'ミルクちゃん');assert.equal(saved.fish_instances.find(f=>f.uid===old[0].uid).exhibit_section,'cool');
  assert.deepEqual(saved.fish_instances.slice(1,20).map(f=>[f.uid,f.room,f.nickname]),old.slice(1).map(f=>[f.uid,f.room,f.nickname]));
  await q.locator('[data-action=close-modal]').click();await q.reload();await q.locator('[data-action=start]').click();saved=await game(q);earned=saved.fish_instances.find(f=>f.uid===receipt.uid);assert.equal(earned.nickname,'ミルクちゃん');assert.equal(earned.exhibit_section,'warm');assert.equal(earned.placed,true);assert.deepEqual(placed.errors,[]);await placed.context.close();console.log('2.13 PLACEMENT: full reward waits, cannot enter full tank, space made by moving one, individual named and persisted after reload OK');

  const over=E.createInitial(now);over.started=true;over.settings.demo_showcase=false;over.tutorial={explore:true,discover:true,pet:true};
  for(let i=0;i<25;i++){const r=E.discover(over,types[i%types.length].id,'old',now+i,()=>.25,'current'),f=over.fish_instances.find(x=>x.uid===r.uid);delete f.exhibit_section;f.placed=true;}
  over.pending=[];const before=structuredClone(over.fish_instances),o=await open(over),op=o.page;await op.locator('.room-card[data-room=current]').click();assert.equal((await scene(op)).section,'warm');await op.locator('[data-action=open-collection]').first().click();assert.match(await op.locator('.collection-warning').innerText(),/そのまま/);assert.deepEqual((await game(op)).fish_instances,before);assert.deepEqual(o.errors,[]);await o.context.close();console.log('2.13 UPGRADE: 25 old occupants are shown unchanged with honest over-cap warning OK');

  const fresh=E.createInitial(now);fresh.started=true;fresh.settings.demo_showcase=false;fresh.tutorial={explore:true,discover:true,pet:true};const r=E.discover(fresh,id('Cyprinus carpio'),'test',now,()=>.3,'river');fresh.pending=[];
  const m=await open(fresh),mp=m.page;await mp.locator('.room-card[data-room=river]').click();assert.equal((await scene(mp)).section,'river');await mp.locator('[data-action=open-collection]').first().click();await mp.locator(`[data-action=move-dialog][data-uid="${r.uid}"]`).click();assert.equal(await mp.locator('[data-action=move][data-room=current]').count(),0);await mp.locator('[data-action=move][data-room=river][data-section=lake]').click();await mp.locator('#nickname-input').fill('コメ');await mp.locator('[data-action=rename]').click();await mp.locator('[data-action=follow-fish]').click();v=await scene(mp);assert.equal(v.section,'lake');assert.equal(v.habitat,'river-lake');assert.equal(v.view.uid,r.uid);assert.equal((await game(mp)).fish_instances[0].nickname,'コメ');assert.deepEqual(m.errors,[]);await m.context.close();console.log('2.13 FRESH: individual moved river→lake, named and followed in correct 3D tank OK');

  const narrow=E.createInitial(now);narrow.settings.text_size='larger';const n=await open(narrow,{width:320,height:700,reduced:true}),np=n.page;await np.locator('.room-card[data-room=current]').click();assert.equal(await np.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const box=await np.locator('[data-action=open-collection]').first().boundingBox(),view=await np.locator('#screen-content').boundingBox();assert.ok(box.y+box.height<=view.y+view.height+1,'primary actions visible without scrolling at 320×700');
  await np.screenshot({path:path.join(shots,'yoru213-320.png')});await np.locator('[data-action=open-collection]').first().click();assert.ok(await np.locator('.collection-list').count());assert.deepEqual(n.errors,[]);await n.context.close();
  const fallback=await open(null,{width:320,height:700,noWebgl:true}),fp=fallback.page;await fp.locator('.room-card[data-room=current]').click();await fp.locator('[data-action=exhibit-section][data-section=large]').click();assert.ok(await fp.locator('.webgl-fallback').isVisible());assert.deepEqual(fallback.errors,[]);await fallback.context.close();console.log('2.13 ACCESS: narrow enlarged text, visible primary actions, reduced motion, offline and no-WebGL fallback OK');
 }finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
