const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:3000/';
(async()=>{
 const E=await import('../engine.js');const now=Date.now(),rng=()=>.5;
 const makeState=(ids)=>{const s=E.createInitial(now);s.settings.demo_showcase=false;s.started=true;s.tutorial={explore:true,discover:true,pet:true};for(const id of ids){const r=E.discover(s,id,'test',now,rng);if(r.uid)s.fish_instances.find(f=>f.uid===r.uid).size=1;}s.pending=[];return s;};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const contexts=[];
 const create=async(state,viewport={width:390,height:844})=>{
  const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});contexts.push(ctx);
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('size-fixture')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('size-fixture','yes');}},{key:E.SAVE_KEY,value:state});
  await page.goto(BASE);await page.locator('[data-action=start]').click();return {ctx,page,errors};
 };
 try{
  // A 2.4-shaped save is loaded without migration; class is derived, not stored.
  const save=makeState(['sp_030','sp_058','sp_054','sp_055','sp_001','sp_011']);
  const {page:p,errors}=await create(save);await p.locator('[data-action=room][data-room=current]').click();await p.waitForTimeout(500);
  const byId=id=>save.fish_instances.find(f=>f.species_id===id);
  let scene=await p.evaluate(()=>window.__game.getSceneInfo()),entry=id=>scene.entries.find(x=>x.uid===byId(id).uid);
  const clown=entry('sp_030'),tuna=entry('sp_058'),dolphin=entry('sp_054'),shark=entry('sp_055'),anemone=entry('sp_001');
  assert.equal(clown.sizeClass,'small');assert.equal(tuna.sizeClass,'medium');assert.equal(dolphin.sizeClass,'large');assert.equal(shark.sizeClass,'large');
  assert.ok(tuna.displayLength/clown.displayLength>1.7);assert.ok(dolphin.displayLength/tuna.displayLength>1.5);assert.ok(shark.displayLength/tuna.displayLength>1.5);
  assert.equal(anemone.sizeClass,null);assert.equal(anemone.stationary,true);assert.equal(anemone.displayLength,null);
  assert.match(await p.locator('.tank-size-summary').innerText(),/小型 1.*中型 1.*大型 2/s);
  assert.match(await p.locator(`.fish-chip[data-uid="${clown.uid}"] .fish-size`).innerText(),/小型/);
  assert.match(await p.locator(`.fish-chip[data-uid="${tuna.uid}"] .fish-size`).innerText(),/中型/);
  assert.match(await p.locator(`.fish-chip[data-uid="${dolphin.uid}"] .fish-size`).innerText(),/大型/);
  for(const [id,label] of [['sp_030','小型'],['sp_058','中型'],['sp_055','大型']]){
   await p.locator(`.fish-chip[data-uid="${byId(id).uid}"]`).click();
   assert.equal(await p.locator('.detail-size-label').innerText(),label);assert.match(await p.locator('.size-note').innerText(),new RegExp(`水槽でのサイズ：${label}`));
   assert.match(await p.locator('.size-note').innerText(),/実寸比ではありません/);await p.locator('.sheet-close').click();
  }
  await p.locator(`.fish-chip[data-uid="${byId('sp_001').uid}"]`).click();assert.equal(await p.locator('.detail-size-label').innerText(),'環境種');assert.equal(await p.locator('.size-note').count(),0);await p.locator('.sheet-close').click();
  await p.locator('[data-action=water][data-water=fresh]').click();scene=await p.evaluate(()=>window.__game.getSceneInfo());assert.equal(scene.entries.length,1);assert.equal(scene.entries[0].sizeClass,'small');
  await p.locator('[data-action=water][data-water=marine]').click();
  // Existing view controls and tap selection continue to work on actual 3D models.
  await p.locator('[data-action=view-mode][data-mode=follow]').click();await p.locator('#follow-target').selectOption(byId('sp_058').uid);assert.equal((await p.evaluate(()=>window.__game.getSceneInfo())).view.uid,byId('sp_058').uid);
  await p.locator('[aria-label="ズームをリセット"]').click();
  await p.locator('[data-screen=dex].nav-item').click();
  assert.equal(await p.locator('.dex-cell').count(),100);assert.equal(await p.locator('.dex-cell[data-id=sp_030] .dex-size-label').innerText(),'小型');
  assert.equal(await p.locator('.dex-cell[data-id=sp_058] .dex-size-label').innerText(),'中型');assert.equal(await p.locator('.dex-cell[data-id=sp_054] .dex-size-label').innerText(),'大型');
  assert.equal(await p.locator('.dex-cell[data-id=sp_001] .dex-size-label').innerText(),'環境種');
  assert.equal(await p.locator('.dex-cell[data-id=sp_060] [data-size-class]').count(),0,'unknown entry must not reveal its size');
  await p.locator('.dex-cell[data-id=sp_060]').click();assert.match(await p.locator('.modal-heading').innerText(),/まだ出会っていない/);assert.equal(await p.locator('.detail-size-label').count(),0);await p.locator('.sheet-close').click();
  await p.locator('[data-action=dex-size][data-size=medium]').click();assert.equal(await p.locator('.dex-cell').count(),1);assert.equal(await p.locator('.dex-cell').getAttribute('data-id'),'sp_058');
  await p.locator('.dex-cell').click();assert.equal(await p.locator('.detail-size-label').innerText(),'中型');await p.locator('.sheet-close').click();
  await p.locator('[data-action=dex-size][data-size=large]').click();assert.equal(await p.locator('.dex-cell').count(),2);
  await p.locator('[data-action=dex-status][data-status=unknown]').click();assert.equal(await p.locator('[data-action=dex-size][data-size=all]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.dex-cell').count(),94);
  await p.locator('[data-action=dex-size][data-size=small]').click();assert.equal(await p.locator('[data-action=dex-status][data-status=all]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.dex-cell').count(),2);
  await p.locator('[data-action=filter][data-filter=外洋]').click();assert.equal(await p.locator('.dex-cell').count(),0);await p.locator('[data-action=dex-size][data-size=medium]').click();assert.equal(await p.locator('.dex-cell').count(),1);
  await p.locator('.size-explanation summary').click();assert.match(await p.locator('.size-explanation p').innerText(),/クロマグロの方が大きくなることも/);
  const beforeReload=await p.evaluate(()=>window.__game.getState());await p.reload();await p.locator('[data-action=start]').click();const afterReload=await p.evaluate(()=>window.__game.getState());
  assert.deepEqual(afterReload.fish_instances.map(f=>[f.uid,f.species_id,f.size]),beforeReload.fish_instances.map(f=>[f.uid,f.species_id,f.size]));
  assert.ok(afterReload.fish_instances.every(f=>!Object.hasOwn(f,'sizeClass')),'display classes must not alter save schema');assert.deepEqual(errors,[]);
  console.log('SIZE: 3D classes, environment exclusion, water, follow, catalog badges/filters, spoilers and reload OK');

  // Twelve animals share the same density coefficient; the next page is independent.
  const crowded=makeState(['sp_030','sp_058','sp_055','sp_054','sp_031','sp_032','sp_033','sp_035','sp_036','sp_037','sp_038','sp_053','sp_057']);
  const cf=id=>crowded.fish_instances.find(f=>f.species_id===id);
  cf('sp_030').size=1.15;cf('sp_058').size=1.15;cf('sp_055').size=.85;cf('sp_055').parents=['p1','p2'];cf('sp_055').growth=0;
  const crowdedPage=await create(crowded);await crowdedPage.page.locator('[data-action=room][data-room=current]').click();await crowdedPage.page.waitForTimeout(500);
  const list=(await crowdedPage.page.evaluate(()=>window.__game.getSceneInfo())).entries;
  assert.equal(list.length,12);const length=id=>list.find(x=>x.uid===cf(id).uid).displayLength;
  assert.ok(length('sp_030')<length('sp_058'));assert.ok(length('sp_058')<length('sp_055'),'even a small young shark is larger than a maximum-size tuna');
  assert.match(await crowdedPage.page.locator('.tank-size-summary').innerText(),/表示中/);assert.equal(await crowdedPage.page.locator('.tank-pagination span').innerText(),'1 / 2');
  await crowdedPage.page.locator('[data-action=tank-page][data-delta="1"]').click();assert.equal((await crowdedPage.page.evaluate(()=>window.__game.getSceneInfo())).entries.length,1);
  assert.match(await crowdedPage.page.locator('.tank-size-summary').innerText(),/大型 1/);assert.deepEqual(crowdedPage.errors,[]);
  console.log('SIZE: crowded 12-animal page, birth growth, individual extremes and pagination OK');

  // A narrow phone with large text must show labels within each cell and not overflow.
  const narrowState=makeState(['sp_030','sp_058','sp_054','sp_001']);narrowState.settings.text_size='larger';
  const narrow=await create(narrowState,{width:320,height:640});await narrow.page.locator('[data-screen=dex].nav-item').click();await narrow.page.locator('[data-action=dex-size][data-size=large]').click();
  const boxes=await narrow.page.evaluate(()=>{
   const cell=document.querySelector('.dex-cell'),label=cell.querySelector('.dex-size-label'),name=cell.querySelector('.name'),r=x=>{const b=x.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
   return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,cell:r(cell),label:r(label),name:r(name)};
  });
  assert.ok(boxes.scroll<=boxes.viewport);assert.ok(boxes.label.bottom<=boxes.cell.bottom+1);assert.ok(boxes.label.top>=boxes.name.bottom-1);assert.deepEqual(narrow.errors,[]);
  console.log('SIZE: 320px large-text grid stays legible and within its bounds OK');

  // Offline standalone game and design gallery include the same assignments.
  const offline=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});contexts.push(offline);await offline.route('http**/*',route=>route.abort());
  const op=await offline.newPage(),offlineErrors=[];op.on('pageerror',e=>offlineErrors.push(e.message));
  await op.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:E.SAVE_KEY,value:save});
  await op.goto(pathToFileURL(path.resolve('yoru-no-suizokukan.html')).href);await op.locator('[data-action=start]').click();await op.locator('[data-screen=dex].nav-item').click();await op.locator('[data-action=dex-size][data-size=medium]').click();assert.equal(await op.locator('.dex-cell').count(),1);assert.equal(await op.locator('.dex-cell .dex-size-label').innerText(),'中型');assert.deepEqual(offlineErrors,[]);
  const gallery=await offline.newPage();await gallery.goto(pathToFileURL(path.resolve('DESIGN_GALLERY.html')).href);await gallery.locator('#size').selectOption('large');assert.equal(await gallery.locator('.card').count(),19);
  await gallery.locator('#size').selectOption('medium');await gallery.locator('#search').fill('クロマグロ');assert.equal(await gallery.locator('.card').count(),2);await gallery.locator('.card').first().click();assert.equal(await gallery.locator('#detail-name').innerText(),'クロマグロ');assert.match(await gallery.locator('#detail-labels').innerText(),/水槽の大きさ：中型/);await gallery.locator('#close').click();
  await gallery.locator('#search').fill('');await gallery.locator('#size').selectOption('environment');assert.equal(await gallery.locator('.card').count(),10);assert.ok(await gallery.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('SIZE: standalone HTML and complete design gallery work offline OK');
 }finally{for(const ctx of contexts)await ctx.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
