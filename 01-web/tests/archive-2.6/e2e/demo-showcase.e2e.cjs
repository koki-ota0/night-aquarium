const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:3001/';
(async()=>{
 const E=await import('../engine.js'),now=Date.now();
 const s=E.createInitial(now);s.started=true;s.exploration.stock=0;s.exploration.stock_updated_at=now;s.tutorial={explore:true,discover:true,pet:true};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(({key,value,now})=>{if(!sessionStorage.getItem('demo-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('demo-seeded','1');}window.__demoTime=now;Date.now=()=>window.__demoTime;},{key:E.SAVE_KEY,value:s,now});
  await p.goto(BASE);await p.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');assert.equal(await p.locator('[data-action=backup-conflict]').isHidden(),true);await p.locator('[data-action=start]').click();
  for(const room of ['current','beach','reef','deep'])assert.equal(await p.locator(`[data-action=room][data-room=${room}]`).isDisabled(),false);
  assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances.length,0);
  await p.locator('[data-screen=explore].nav-item').click();assert.match(await p.locator('.ad-note').innerText(),/5秒/);
  for(const id of ['coast','fresh','reef','deep'])assert.equal(await p.locator(`[data-action=explore-start][data-id=${id}]`).isDisabled(),true,'stock zero');
  await p.evaluate(t=>window.__demoTime=t,now+4999);await p.waitForTimeout(700);assert.equal((await p.evaluate(()=>window.__game.getState())).exploration.stock,0);
  await p.evaluate(t=>window.__demoTime=t,now+5000);await p.waitForTimeout(700);assert.equal((await p.evaluate(()=>window.__game.getState())).exploration.stock,1);
  for(const id of ['coast','fresh','reef','deep'])assert.equal(await p.locator(`[data-action=explore-start][data-id=${id}]`).isDisabled(),false,'all destinations open');
  await p.evaluate(t=>window.__demoTime=t,now+15000);await p.waitForTimeout(700);assert.equal((await p.evaluate(()=>window.__game.getState())).exploration.stock,3);
  await p.locator('[data-screen=dex].nav-item').click();assert.equal(await p.locator('.dex-cell').count(),100);assert.equal(await p.locator('.dex-cell.unknown').count(),0);assert.equal(await p.locator('.showcase-dex-tag').count(),100);assert.match(await p.locator('.showcase-banner').innerText(),/発見数には加算されません/);
  await p.locator('#dex-search').fill('シャチ');assert.ok((await p.locator('.dex-cell').count())>=1);await p.locator('.dex-cell[data-id=sp_060]').click();assert.match(await p.locator('.modal-heading').innerText(),/シャチ/);assert.match(await p.locator('.modal-copy').innerText(),/まだ獲得していません/);await p.locator('[data-action=view-showcase]').click();
  assert.equal(await p.evaluate(()=>window.__game.getScreen()),'tank');await p.waitForTimeout(500);const scene=await p.evaluate(()=>window.__game.getSceneInfo());assert.ok(scene.entries.some(e=>e.uid==='showcase_sp_060'&&e.shape==='orca'));
  await p.locator('[data-action=view-mode][data-mode=follow]').click();await p.locator('#follow-target').selectOption('showcase_sp_060');assert.equal((await p.evaluate(()=>window.__game.getSceneInfo())).view.uid,'showcase_sp_060');
  const before=await p.evaluate(()=>window.__game.getState());assert.equal(before.fish_instances.length,0);assert.deepEqual(before.dex.discovered,[]);assert.equal(before.daily.pet_count,0);
  await p.locator('.fish-chip[data-id=sp_060]').click();assert.match(await p.locator('.modal-heading').innerText(),/シャチ/);await p.locator('.sheet-close').click();assert.deepEqual((await p.evaluate(()=>window.__game.getState())).fish_instances,[]);
  await p.locator('[data-screen=settings].nav-item').click();await p.locator('[data-key=demo_showcase]').click();await p.locator('[data-screen=dex].nav-item').click();await p.locator('#dex-search').fill('');assert.equal(await p.locator('.dex-cell.unknown').count(),100);await p.locator('#dex-search').fill('シャチ');assert.equal(await p.locator('.dex-cell').count(),0);
  await p.locator('[data-screen=home].nav-item').click();assert.equal(await p.locator('[data-action=room][data-room=deep]').getAttribute('class').then(x=>x.includes('locked')),true);
  await p.locator('[data-screen=settings].nav-item').click();await p.locator('[data-key=demo_showcase]').click();await p.reload();await p.locator('[data-action=start]').click();assert.equal((await p.evaluate(()=>window.__game.getState())).settings.demo_showcase,true);assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances.length,0);
  await p.locator('[data-screen=dex].nav-item').click();await p.locator('#dex-search').fill('#60');await p.locator('.dex-cell[data-id=sp_060]').click();await p.locator('[data-action=adopt-showcase]').click();let adopted=await p.evaluate(()=>window.__game.getState());assert.equal(adopted.fish_instances.length,1);assert.equal(adopted.fish_instances[0].species_id,'sp_060');assert.ok(adopted.dex.discovered.includes('sp_060'));assert.ok(!adopted.fish_instances[0].uid.startsWith('showcase_'));const uid=adopted.fish_instances[0].uid;
  await p.reload();await p.locator('[data-action=start]').click();adopted=await p.evaluate(()=>window.__game.getState());assert.equal(adopted.fish_instances[0].uid,uid);assert.equal(adopted.dex.discovered.length,1);
  assert.deepEqual(errors,[]);console.log('DEMO: exact five-second refill, 100 visible entries, four rooms and destinations, searchable 3D sample, follow, toggle, explicit adoption and persistence OK');
 }finally{await ctx.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
