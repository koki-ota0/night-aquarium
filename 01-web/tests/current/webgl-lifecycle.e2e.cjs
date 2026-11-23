// Isolated WebGL lifecycle regression test: synthetic data, no preview writes.
// Build the HTML first with npm run build. Requires Playwright Chromium.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../..');

(async () => {
  const E = await import('../../engine.js');
  const {CATALOG, ROOMS} = await import('../../catalog.js');
  const now = Date.now();
  const seed = E.createInitial(now);
  seed.started = true;
  seed.tutorial = {explore: true, discover: true, pet: true};
  const adopted = E.discover(seed, CATALOG.find(s => s.scientific === 'Amphiprion clarkii').id, 'test', now, () => .4);
  assert.ok(adopted.ok);
  seed.fish_instances[0].nickname = 'isolated-test-fish';
  seed.pending = [];
  assert.ok(E.startExplore(seed, 'coastal', now).ok);
  seed.exploration.active.started_at = now - 30000;
  seed.exploration.active.ends_at = now + 3600000;
  const files = {'/': 'index.html', '/sw.js': 'sw.js', '/manifest.webmanifest': 'manifest.webmanifest'};
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://test.invalid');
    if (url.pathname === '/embed') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end('<!doctype html><html><body style="margin:0"><iframe title="test" src="/" style="width:390px;height:844px;border:0"></iframe></body></html>');
      return;
    }
    const f = files[url.pathname];
    if (!f) {res.writeHead(404).end(); return;}
    res.writeHead(200, {'Cache-Control': 'no-store', 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'});
    res.end(fs.readFileSync(path.join(root, f)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const contexts = [];
  const fish = frame => frame.evaluate(() => __game.getState().fish_instances.map(f => ({uid: f.uid, species_id: f.species_id, nickname: f.nickname, size: f.size, growth: f.growth})));
  async function newContext(noWebGL = false) {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    contexts.push(context);
    await context.route('**/__yoru/preview-save', route => route.abort());
    await context.addInitScript(({key, value, noWebGL}) => {
      if (!sessionStorage.getItem('diagnostic-seed')) {
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem('diagnostic-seed', '1');
      }
      window.__contextLostEvents = 0;
      window.__contextRestoredEvents = 0;
      window.addEventListener('webglcontextlost', () => window.__contextLostEvents++, true);
      window.addEventListener('webglcontextrestored', () => window.__contextRestoredEvents++, true);
      if (noWebGL) {
        const native = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          return String(type).includes('webgl') ? null : native.call(this, type, ...args);
        };
      }
    }, {key: E.SAVE_KEY, value: seed, noWebGL});
    return context;
  }
  async function ready(frame) {
    await frame.waitForFunction(() => window.__game && __game.getBackupInfo().status !== 'checking');
    await frame.locator('[data-action=start]').click();
  }
  async function pixels(frame, selector) {
    return frame.locator(selector).evaluate(canvas => {
      const gl = canvas.getContext('webgl2');
      const sample = document.createElement('canvas');
      sample.width = sample.height = 40;
      const ctx = sample.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 40, 40);
      const data = ctx.getImageData(0, 0, 40, 40).data;
      let solid = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 30) solid++;
      return {webgl2: !!gl, lost: gl ? gl.isContextLost() : null, solid};
    });
  }
  try {
    browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl']});
    const context = await newContext();
    const p = await context.newPage(), errors = [];
    p.on('pageerror', error => errors.push(error.message));
    await p.goto(base);
    await ready(p);
    const original = await fish(p);
    for (const room of ROOMS) {
      await p.locator(`[data-action=room][data-room="${room.id}"]`).click();
      await p.waitForTimeout(220);
      assert.equal(await p.locator('.webgl-fallback').count(), 0, room.id);
      assert.equal(await p.locator('canvas.aquarium-canvas').count(), 1, room.id);
      const result = await pixels(p, 'canvas.aquarium-canvas');
      assert.ok(result.webgl2 && !result.lost && result.solid > 0, `${room.id}: ${JSON.stringify(result)}`);
      if (!await p.evaluate(() => !!window.__testCanvas)) await p.evaluate(() => window.__testCanvas = document.querySelector('canvas.aquarium-canvas'));
      assert.ok(await p.evaluate(() => window.__testCanvas === document.querySelector('canvas.aquarium-canvas')), 'one shared canvas');
      await p.locator('[data-screen=home].nav-item').click();
    }
    console.log('WEBGL: all 14 exhibits have nontransparent WebGL2 pixels on one shared canvas');
    for (let i = 0; i < 4; i++) {
      await p.locator('[data-screen=explore].nav-item').click();
      await p.waitForFunction(() => __game.getJourneyInfo().running && __game.getJourneyInfo().frameCount > 2);
      assert.ok(await p.evaluate(() => window.__testCanvas === document.querySelector('canvas.journey-canvas')));
      const result = await pixels(p, 'canvas.journey-canvas');
      assert.ok(result.webgl2 && !result.lost && result.solid > 0);
      await p.locator('[data-screen=home].nav-item').click();
      await p.locator('[data-action=room][data-room=reef]').click();
      assert.ok(await p.evaluate(() => window.__testCanvas === document.querySelector('canvas.aquarium-canvas')));
      await p.locator('[data-screen=home].nav-item').click();
    }
    assert.equal(await p.evaluate(() => window.__contextLostEvents), 0, 'no spontaneous context loss');
    assert.deepEqual(await fish(p), original);
    console.log('WEBGL: exploration / aquarium navigation reuses the renderer without context loss or fish changes');
    await p.locator('[data-screen=explore].nav-item').click();
    await p.emulateMedia({reducedMotion: 'reduce'});
    await p.waitForFunction(() => __game.getJourneyInfo().reducedMotion && !__game.getJourneyInfo().running);
    await p.emulateMedia({reducedMotion: 'no-preference'});
    await p.waitForFunction(() => __game.getJourneyInfo().running);
    await p.locator('[data-screen=home].nav-item').click();
    await p.locator('[data-action=room][data-room=reef]').click();
    await p.evaluate(() => {
      const gl = document.querySelector('canvas.aquarium-canvas').getContext('webgl2');
      window.__lossExtension = gl.getExtension('WEBGL_lose_context');
      if (!window.__lossExtension) throw new Error('Context-loss extension unavailable');
      window.__lossExtension.loseContext();
    });
    await p.waitForFunction(() => window.__contextLostEvents === 1);
    await p.waitForTimeout(150);
    await p.evaluate(() => window.__lossExtension.restoreContext());
    await p.waitForFunction(() => window.__contextRestoredEvents === 1);
    await p.waitForTimeout(500);
    const restored = await pixels(p, 'canvas.aquarium-canvas');
    assert.ok(restored.webgl2 && !restored.lost && restored.solid > 0);
    assert.deepEqual(await fish(p), original);
    assert.deepEqual(errors, []);
    console.log('WEBGL: reduced-motion resume and forced context loss / restoration retain rendering and fish identity');
    await context.close();

    const iframeContext = await newContext(), iframePage = await iframeContext.newPage(), iframeErrors = [];
    iframePage.on('pageerror', error => iframeErrors.push(error.message));
    await iframePage.goto(`${base}/embed`);
    const frame = iframePage.frames().find(frame => frame !== iframePage.mainFrame());
    await ready(frame);
    await frame.locator('[data-action=room][data-room=reef]').click();
    await frame.waitForTimeout(400);
    const embedded = await pixels(frame, 'canvas.aquarium-canvas');
    assert.ok(embedded.webgl2 && !embedded.lost && embedded.solid > 0);
    assert.deepEqual(iframeErrors, []);
    console.log('WEBGL: ordinary same-origin iframe renders 3D (not a reproduction of the original preview host)');
    await iframeContext.close();

    const fallbackContext = await newContext(true), fallbackPage = await fallbackContext.newPage(), fallbackErrors = [];
    fallbackPage.on('pageerror', error => fallbackErrors.push(error.message));
    await fallbackPage.goto(base);
    await ready(fallbackPage);
    const fallbackFish = await fish(fallbackPage);
    await fallbackPage.locator('[data-action=room][data-room=reef]').click();
    assert.match(await fallbackPage.locator('.webgl-fallback').innerText(), /3D表示を開始できませんでした/);
    assert.equal((await fallbackPage.evaluate(() => __game.getGraphicsInfo())).status, 'unavailable');
    assert.deepEqual(await fish(fallbackPage), fallbackFish);
    await fallbackPage.locator('[data-screen=explore].nav-item').click();
    assert.equal(await fallbackPage.locator('[data-journey-scene]').getAttribute('data-renderer'), 'fallback');
    assert.ok(await fallbackPage.locator('.journey-fallback').isVisible());
    assert.deepEqual(fallbackErrors, []);
    console.log('WEBGL: denying context creation shows an explicit failure and diagnostics; navigation and saved fish remain intact');
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
