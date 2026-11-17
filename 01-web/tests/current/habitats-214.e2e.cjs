// Isolated static server and browser: never opens port 3000 or user saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const E=await import('../../engine.js');
 const map={'/':'index.html','/index.html':'index.html','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/assets/icon-192.png':'assets/icon-192.png','/assets/icon-512.png':'assets/icon-512.png'};
 const server=http.createServer((req,res)=>{const f=map[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404).end();return;}res.writeHead(200,{'Cache-Control':'no-store','Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,f)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>window.__game?.getBackupInfo().status!=='checking');
  await page.locator('[data-action=start]').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('.room-card').count(),14,'home shows 14 exhibit rooms');
  // Reef: 20 animals on the first display page
  await page.locator('[data-action=room][data-room=reef]').click();await page.waitForTimeout(1200);
  assert.match(await page.locator('.water-count').innerText(),/20体を表示/);
  const entries1=await page.evaluate(()=>window.__game.getSceneInfo().entries.filter(e=>e).length);assert.ok(entries1>=20,entries1);
  assert.ok(await page.locator('.tank-pagination').count(),'pagination exists for 79 reef samples');
  assert.equal(await page.locator('[data-action=moments]').count(),0,'no moments entry in tank screen');
  // Dex: species page with facts, then adopt
  await page.locator('[data-screen=dex].nav-item').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('.dex-cell').count(),296);
  // A newly added deep-sea species is searchable and its authored detail opens.
  await page.locator('#dex-search').fill('ボア・ドラゴンフィッシュ');await page.waitForTimeout(200);
  assert.equal(await page.locator('.dex-cell').count(),1);await page.locator('.dex-cell').first().click();await page.waitForTimeout(300);
  assert.match(await page.locator('.species-facts').innerText(),/あごひげ/);
  await page.keyboard.press('Escape');await page.waitForTimeout(200);await page.locator('#dex-search').fill('');await page.waitForTimeout(200);
  assert.ok(await page.locator('[data-action=moments]').count(),'moments entry exists in dex');
  assert.equal(await page.locator('.dex-filter-panel select').count(),3,'filter panel has 3 selects');
  await page.locator('#dex-search').fill('カクレクマノミ');await page.waitForTimeout(200);
  await page.locator('.dex-cell').first().click();await page.waitForTimeout(300);
  assert.match(await page.locator('.species-facts').innerText(),/見わける特徴/);
  await page.locator('[data-action=adopt-showcase]').click();await page.waitForTimeout(600);
  if(await page.locator('[data-action=ack-pending]').count())await page.locator('[data-action=ack-pending]').click();
  let st=await page.evaluate(()=>window.__game.getState());assert.equal(st.fish_instances.length,1);assert.equal(st.fish_instances[0].room,'reef');
  // Rename through collection -> individual page
  await page.locator('[data-action=open-collection]').first().click();await page.waitForTimeout(300);
  await page.locator('.collection-subject').first().click();await page.waitForTimeout(300);
  await page.locator('#nickname-input').fill('テスト');await page.locator('[data-action=rename]').click();await page.waitForTimeout(300);
  st=await page.evaluate(()=>window.__game.getState());assert.equal(st.fish_instances[0].nickname,'テスト');
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  // Create a breeding tank and move the clown there; incompatible rooms are not offered as enabled
  await page.locator('[data-screen=home].nav-item').click();await page.waitForTimeout(200);
  await page.locator('[data-action=open-breeding-create]').click();await page.waitForTimeout(200);
  await page.locator('[data-action=create-breeding][data-habitat=reef]').click();await page.waitForTimeout(500);
  st=await page.evaluate(()=>window.__game.getState());assert.equal(st.breeding_tanks.length,1);const bt=st.breeding_tanks[0].id;
  await page.locator('[data-action=open-collection]').first().click();await page.waitForTimeout(200);
  // collection in breeding tank is empty; go back to reef via quick switch
  await page.keyboard.press('Escape');
  await page.locator(`[data-action=quick-room][data-room=reef]`).click();await page.waitForTimeout(400);
  await page.locator('[data-action=open-collection]').first().click();await page.waitForTimeout(200);
  await page.locator('.collection-move').first().click();await page.waitForTimeout(300);
  const enabledRooms=await page.locator('.move-option:not(:disabled)').evaluateAll(els=>els.map(e=>e.dataset.room));
  assert.ok(enabledRooms.includes(bt),enabledRooms.join(','));assert.ok(!enabledRooms.includes('cold-sea'));
  await page.locator(`.move-option[data-room="${bt}"]`).click();await page.waitForTimeout(400);
  st=await page.evaluate(()=>window.__game.getState());assert.equal(st.fish_instances[0].room,bt);
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  // Exploration: 11 destinations, start, return home, watch again
  await page.locator('[data-screen=explore].nav-item').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('.destination').count(),6);
  await page.locator('[data-action=explore-start]').first().click();await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-action=journey-home]').count(),1);
  await page.locator('[data-action=journey-home]').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('.destination').count(),6);assert.equal(await page.locator('[data-action=journey-watch]').count(),1);
  assert.deepEqual(errors,[]);
  console.log('2.20 E2E: 14 rooms, 20-fish page, dex species page, adopt+rename, breeding tank move, exploration home OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
