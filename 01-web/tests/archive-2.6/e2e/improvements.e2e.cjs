const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');const path=require('node:path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:3000/';
const buffer=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x));

(async()=>{
 const E=await import('../engine.js');const now=Date.now(),rng=()=>.5;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const mixed=E.createInitial(now);mixed.settings.demo_showcase=false;mixed.started=true;mixed.tutorial={explore:true,discover:true,pet:true};
  for(const id of ['sp_030','sp_033','sp_037','sp_077','sp_057','sp_011'])E.discover(mixed,id,'test',now,rng);
  mixed.pending=[];const clown=mixed.fish_instances.find(f=>f.species_id==='sp_030');clown.care.satiety=0;clown.care.satiety_at=now;
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('care-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('care-seeded','1');}},{key:E.SAVE_KEY,value:mixed});
  await page.goto(BASE);await page.locator('[data-action=start]').click();await page.locator('[data-action=room][data-room=current]').click();
  assert.match(await page.locator('.care-summary').innerText(),/1匹/);await page.locator('[data-action=breed-panel]').click();
  assert.match(await page.locator('.breed-content').innerText(),/お相手が必要/);const open=page.locator(`.pair-unready [data-action=fish][data-uid="${clown.uid}"]`);await open.click();
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);
  const nameInput=page.locator('#nickname-input'),saveName=page.locator('[data-action=rename]');await page.locator('.sheet').evaluate(el=>el.scrollTop=240);await nameInput.fill('きなこ');await saveName.scrollIntoViewIfNeeded();
  const before=await page.locator('.sheet').evaluate(el=>el.scrollTop);assert.ok(before>100,'detail sheet must be scrolled');await saveName.click();
  const after=await page.locator('.sheet').evaluate(el=>el.scrollTop);assert.ok(Math.abs(after-before)<4,`scroll changed from ${before} to ${after}`);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'rename');assert.equal(await page.locator('.detail-name').innerText(),'きなこ');
  const bounds=await page.evaluate(()=>({sheet:document.querySelector('.sheet').getBoundingClientRect().toJSON(),close:document.querySelector('.sheet-close').getBoundingClientRect().toJSON()}));assert.ok(bounds.close.top>=bounds.sheet.top&&bounds.close.bottom<=bounds.sheet.bottom,'close stays visible while scrolled');
  await page.locator('[data-action=move-dialog]').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'close-modal');await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'move-dialog');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.modal-layer').isHidden(),true);assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);assert.equal(await page.evaluate(()=>document.activeElement.closest('.pair-unready')!==null),true);

  // The 3D objects stay alive while controls rerender and the carousel preserves its horizontal position.
  const buildBefore=(await page.evaluate(()=>window.__game.getSceneInfo())).modelBuildCount;
  await page.locator('[data-action=select-food][data-food=special]').scrollIntoViewIfNeeded();const scrollBefore=await page.locator('.food-choices').evaluate(el=>el.scrollLeft);assert.ok(scrollBefore>0);
  await page.locator('[data-action=select-food][data-food=special]').click();const scrollAfter=await page.locator('.food-choices').evaluate(el=>el.scrollLeft);assert.ok(Math.abs(scrollAfter-scrollBefore)<4);
  assert.equal((await page.evaluate(()=>window.__game.getSceneInfo())).modelBuildCount,buildBefore);
  await page.locator('[data-action=select-food][data-food=auto]').click();assert.match(await page.locator('.food-help').innerText(),/5匹それぞれに合う/);
  const allBefore=await page.evaluate(()=>window.__game.getState());await page.locator('[data-action=feed]').click();await page.waitForTimeout(120);
  const afterFeed=await page.evaluate(()=>window.__game.getState()),scene=await page.evaluate(()=>window.__game.getSceneInfo());assert.equal(afterFeed.daily.fed_by_tank['current:marine'],1);assert.ok(scene.foodCount>=5);
  const foods=new Set(scene.foodPositions.map(x=>x.food));assert.ok(foods.has('special')&&foods.has('plants')&&foods.has('seafood')&&foods.has('plankton'));
  for(const f of afterFeed.fish_instances.filter(x=>x.species_id!=='sp_011')){assert.equal(f.growth,8);assert.ok(f.care.satiety>=35);}
  assert.equal(afterFeed.fish_instances.find(x=>x.species_id==='sp_011').growth,allBefore.fish_instances.find(x=>x.species_id==='sp_011').growth);
  assert.match(await page.locator('.care-summary').innerText(),/低い仲間はいません/);assert.equal(scene.modelBuildCount,buildBefore);
  if(process.env.E2E_CARE_SCREENSHOT){await page.locator('.food-section').scrollIntoViewIfNeeded();await page.screenshot({path:process.env.E2E_CARE_SCREENSHOT});}
  assert.deepEqual(errors,[]);await ctx.close();console.log('CARE: mixed diets, hunger summary, food animation, stable 3D and accessible detail sheet OK');

  // Hunger can cross its threshold halfway between hourly growth ticks. Keep
  // the summary and pair status live, and never erase an unsaved name on refresh.
  const clockState=E.createInitial(now);clockState.started=true;clockState.settings.demo=false;clockState.tutorial={explore:true,discover:true,pet:true};E.discover(clockState,'sp_030','test',now,rng);E.discover(clockState,'sp_030','test',now,rng);clockState.pending=[];
  for(const f of clockState.fish_instances){f.growth=40;f.care.satiety=20;f.care.satiety_at=now;}E.refreshBreeding(clockState,now,rng);
  const clockCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),clock=await clockCtx.newPage(),clockErrors=[];clock.on('pageerror',e=>clockErrors.push(e.message));await clock.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:E.SAVE_KEY,value:clockState});await clock.goto(BASE);await clock.locator('[data-action=start]').click();await clock.locator('[data-action=room][data-room=current]').click();await clock.locator('[data-action=breed-panel]').click();
  assert.match(await clock.locator('.care-summary').innerText(),/低い仲間はいません/);assert.equal(await clock.locator('.pair-attention').isHidden(),true);
  await clock.evaluate(()=>{window.__realNow=Date.now;window.__clockDelta=31*60000;Date.now=()=>window.__realNow()+window.__clockDelta;});await clock.waitForFunction(()=>document.querySelector('.care-summary')?.textContent.includes('2匹'),null,{timeout:10000});assert.match(await clock.locator('.care-summary').innerText(),/2匹/);assert.equal(await clock.locator('.pair-attention').isVisible(),true);
  await clock.locator(`.fish-chip[data-uid="${clockState.fish_instances[0].uid}"]`).click();await clock.locator('#nickname-input').fill('1234567890ABCDE');await clock.locator('#nickname-input').evaluate(el=>el.setSelectionRange(4,4));const detailScroll=await clock.locator('.sheet').evaluate(el=>el.scrollTop);
  await clock.evaluate(()=>window.__clockDelta=61*60000);await clock.waitForTimeout(800);assert.equal(await clock.locator('#nickname-input').inputValue(),'1234567890ABCDE');assert.equal(await clock.evaluate(()=>document.activeElement.id),'nickname-input');assert.equal(await clock.locator('#nickname-input').evaluate(el=>el.selectionStart),4);assert.ok(Math.abs((await clock.locator('.sheet').evaluate(el=>el.scrollTop))-detailScroll)<4);
  await clock.locator('[data-action=move-dialog]').click();assert.match(await clock.locator('.modal-heading').innerText(),/展示室/);await clock.locator('[data-action=move][data-room=current]').click();assert.equal(await clock.locator('#nickname-input').inputValue(),'1234567890ABCDE','draft survives moving into another sheet and back');
  await clock.locator('[data-action=rename]').click();assert.equal(await clock.locator('#nickname-input').inputValue(),'1234567890AB');assert.deepEqual(clockErrors,[]);await clockCtx.close();console.log('CARE LIVE STATUS AND UNSAVED DRAFT RETENTION OK');

  const original=E.createInitial(now);original.started=true;original.tutorial={explore:true,discover:true,pet:true};E.discover(original,'sp_030','test',now,rng);original.fish_instances[0].nickname='もとの子';original.pending=[];
  const incoming=E.createInitial(now);incoming.started=true;incoming.tutorial={explore:true,discover:true,pet:true};E.discover(incoming,'sp_057','test',now,rng);incoming.fish_instances[0].nickname='新しい子';incoming.pending=[];
  const saveCtx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'}),p=await saveCtx.newPage(),saveErrors=[];p.on('pageerror',e=>saveErrors.push(e.message));
  await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('transfer-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('transfer-seeded','1');}},{key:E.SAVE_KEY,value:original});
  await p.goto(BASE);await p.locator('[data-action=start]').click();await p.locator('[data-screen=settings].nav-item').click();
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action=export-current]').click()]);assert.equal(dl.suggestedFilename(),'yoru-aquarium-save.json');const exported=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.equal(exported.fish_instances[0].nickname,'もとの子');assert.equal(exported.importRecovery,undefined);
  const input=()=>p.locator('#save-import-file');
  await input().setInputFiles({name:'broken.json',mimeType:'application/json',buffer:buffer('{broken')});await p.waitForSelector('.transfer-notice');assert.match(await p.locator('.transfer-notice').innerText(),/変更していません/);assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');
  const malicious=structuredClone(original);malicious.pending=[{type:'award',threshold:'<img src=x onerror=window.__hacked=1>'}];await input().setInputFiles({name:'malicious.json',mimeType:'application/json',buffer:buffer(malicious)});assert.match(await p.locator('.transfer-notice').innerText(),/変更していません/);assert.equal(await p.evaluate(()=>window.__hacked),undefined);
  await input().setInputFiles({name:'too-big.json',mimeType:'application/json',buffer:Buffer.alloc(5*1024*1024+1,32)});assert.match(await p.locator('.transfer-notice').innerText(),/5MB以下/);assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');
  await input().setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:buffer(incoming)});assert.match(await p.locator('.modal-copy').first().innerText(),/仲間 1体/);await p.locator('.sheet-close').click();assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');
  await input().setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:buffer(incoming)});await p.locator('[data-action=commit-import]').click();
  let s=await p.evaluate(()=>window.__game.getState());assert.equal(s.fish_instances[0].nickname,'新しい子');assert.equal(s.importRecovery.original.fish_instances[0].nickname,'もとの子');assert.equal(await p.locator('[data-action=restore-confirm]').count(),1);
  const [dl2]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action=export-current]').click()]);assert.equal(JSON.parse(fs.readFileSync(await dl2.path(),'utf8')).importRecovery,undefined);
  await p.reload();await p.locator('[data-action=start]').click();await p.locator('[data-screen=settings].nav-item').click();assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'新しい子');
  await p.locator('[data-action=restore-confirm]').click();await p.locator('[data-action=restore-import]').click();s=await p.evaluate(()=>window.__game.getState());assert.equal(s.fish_instances[0].nickname,'もとの子');assert.equal(s.importRecovery,undefined);assert.equal(await p.locator('[data-action=restore-confirm]').count(),0);
  await p.reload();await p.locator('[data-action=start]').click();assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');
  // Move the downloaded file to a distinct origin; the source remains untouched.
  const portable=fs.readFileSync(await dl.path()),alternate=new URL(BASE);if(alternate.hostname==='127.0.0.1'||alternate.hostname==='localhost'){
   alternate.hostname=alternate.hostname==='127.0.0.1'?'localhost':'127.0.0.1';const other=await saveCtx.newPage();await other.goto(alternate.href);await other.locator('[data-action=start]').click();assert.equal((await other.evaluate(()=>window.__game.getState())).fish_instances.length,0);await other.locator('[data-screen=settings].nav-item').click();
   const [chooser]=await Promise.all([other.waitForEvent('filechooser'),other.locator('[data-action=select-import]').click()]);await other.locator('[data-action=toggle-setting][data-key=demo]').click();await chooser.setFiles({name:'from-other-origin.json',mimeType:'application/json',buffer:portable});await other.locator('[data-action=commit-import]').click();assert.equal((await other.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');assert.equal((await p.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');await other.close();
  }else console.log('Cross-origin transfer skipped: BASE_URL is not a localhost alias');
  assert.deepEqual(saveErrors,[]);await saveCtx.close();console.log('TRANSFER: export, validation, cancel, atomic import, reload, restore and cross-origin move OK');

  const localCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),local=await localCtx.newPage(),localErrors=[];local.on('pageerror',e=>localErrors.push(e.message));await localCtx.route('http**/*',route=>route.abort());await local.goto(pathToFileURL(path.resolve('yoru-no-suizokukan.html')).href);await local.locator('[data-action=start]').click();await local.locator('[data-screen=settings].nav-item').click();await local.locator('#save-import-file').setInputFiles({name:'offline.json',mimeType:'application/json',buffer:buffer(incoming)});await local.locator('[data-action=commit-import]').click();assert.equal((await local.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'新しい子');assert.deepEqual(localErrors,[]);await localCtx.close();console.log('TRANSFER: local HTML works without network in Chromium OK');

  const quotaCtx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),q=await quotaCtx.newPage(),quotaErrors=[];q.on('pageerror',e=>quotaErrors.push(e.message));
  await q.addInitScript(({key,value})=>{if(!sessionStorage.getItem('quota-seeded')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('quota-seeded','1');}},{key:E.SAVE_KEY,value:original});await q.goto(BASE);await q.locator('[data-action=start]').click();await q.locator('[data-screen=settings].nav-item').click();
  const beforeRaw=await q.evaluate(key=>localStorage.getItem(key),E.SAVE_KEY);await q.locator('#save-import-file').setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:buffer(incoming)});
  await q.evaluate(key=>{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');return orig.call(this,k,v);};},E.SAVE_KEY);
  await q.locator('[data-action=commit-import]').click();assert.match(await q.locator('.sheet .transfer-notice').innerText(),/保存できません/);assert.equal(await q.evaluate(key=>localStorage.getItem(key),E.SAVE_KEY),beforeRaw);assert.equal((await q.evaluate(()=>window.__game.getState())).fish_instances[0].nickname,'もとの子');assert.deepEqual(quotaErrors,[]);await quotaCtx.close();console.log('TRANSFER SAFETY: storage quota failure leaves old data untouched OK');
  // A syntactically valid v5 file with corrupt internals must not be silently
  // normalized into an empty save or overwritten by pagehide/periodic saving.
  const corrupt=JSON.stringify({...original,fish_instances:[null]}),badCtx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'}),bad=await badCtx.newPage(),badErrors=[];bad.on('pageerror',e=>badErrors.push(e.message));
  await bad.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('bad-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('bad-seeded','1');}},{key:E.SAVE_KEY,raw:corrupt});await bad.goto(BASE);await bad.locator('[data-action=start]').click();assert.match(await bad.locator('.storage-warning').first().innerText(),/保存/);await bad.locator('[data-screen=settings].nav-item').click();assert.equal(await bad.locator('[data-action=select-import]').isDisabled(),true);assert.equal(await bad.locator('[data-action=reset-confirm]').isDisabled(),true);
  const [protectedDownload]=await Promise.all([bad.waitForEvent('download'),bad.locator('[data-action=export-protected]').click()]);assert.equal(fs.readFileSync(await protectedDownload.path(),'utf8'),corrupt);await bad.reload();await bad.locator('[data-action=start]').click();assert.equal(await bad.evaluate(key=>localStorage.getItem(key),E.SAVE_KEY),corrupt);assert.deepEqual(badErrors,[]);await badCtx.close();console.log('SAVE SAFETY: malformed current save protected and downloadable byte-for-byte OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
