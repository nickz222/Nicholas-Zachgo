#!/usr/bin/env node
/*
 * End-to-end test for website/sell-form-embed.html and website/thank-you-embed.html.
 *
 *   node tests/form.test.js            (exits non-zero if any test fails)
 *
 * Self-contained: starts three local HTTP servers, so nothing touches the live site
 * or script.google.com.
 *   - "site"     http://localhost:<A>   Hostinger-like parent pages + mock /thank-you/
 *   - "embed"    http://127.0.0.1:<B>   serves the form on a second origin (cross-origin iframe)
 *   - "endpoint" http://localhost:<C>   mock Apps Script web app, logs every POST body
 * The form is a temp copy with APPS_SCRIPT_URL / THANK_YOU_URL pointed at the mocks.
 * Screenshots go to test-results/.
 *
 * Needs Playwright + Chromium (require('playwright')).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FORM_FILE = path.join(ROOT, 'website', 'sell-form-embed.html');
const TY_FILE = path.join(ROOT, 'website', 'thank-you-embed.html');
const OUT = path.join(ROOT, 'test-results');
const CODE_GS = path.join(ROOT, 'apps-script', 'Code.gs');

// ---------- servers ----------
const posts = [];            // received lead POST bodies
let endpointMode = 'ok';     // ok | slow | hang
const hung = [];

function listen(handler) {
  return new Promise((resolve) => {
    const s = http.createServer(handler);
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}
function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/html; charset=utf-8' });
  res.end(body);
}

function buildForm(endpointUrl, thankYouUrl) {
  let src = fs.readFileSync(FORM_FILE, 'utf8');
  const before = src;
  src = src.replace(/(var\s+APPS_SCRIPT_URL\s*=\s*)'[^']*'/, `$1'${endpointUrl}'`);
  if (src === before) throw new Error('APPS_SCRIPT_URL constant not found in form');
  const b2 = src;
  src = src.replace(/(var\s+THANK_YOU_URL\s*=\s*)'[^']*'/, `$1'${thankYouUrl}'`);
  if (src === b2) throw new Error('THANK_YOU_URL constant not found in form');
  // Shorten the hang timeout so the test runs fast (optional constant).
  src = src.replace(/(var\s+SUBMIT_TIMEOUT_MS\s*=\s*)\d+/, '$12500');
  return src;
}
function wrapDoc(inner, title) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f7fa}</style></head><body>${inner}</body></html>`;
}
function escAttr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

async function main() {
  const endpoint = await listen((req, res) => {
    if (req.method === 'POST' && req.url.startsWith('/exec')) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        posts.push({ body, headers: req.headers, params: Object.fromEntries(new URLSearchParams(body)) });
        if (endpointMode === 'hang') { hung.push(res); return; }
        const reply = () => send(res, 200, JSON.stringify({ ok: true }), 'application/json');
        if (endpointMode === 'slow') setTimeout(reply, 1500); else reply();
      });
      return;
    }
    send(res, 404, 'nope');
  });
  const C = endpoint.address().port;
  const ENDPOINT_URL = `http://localhost:${C}/exec`;

  // A closed port for the "endpoint down" test.
  const dead = await listen(() => {});
  const DEAD_PORT = dead.address().port;
  await new Promise((r) => dead.close(r));
  const DEAD_URL = `http://localhost:${DEAD_PORT}/exec`;

  let A, B;
  const formFor = (ep) => buildForm(ep, `http://localhost:${A}/thank-you/`);

  const embedSrv = await listen((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/embed') {
      const ep = u.searchParams.get('ep') === 'dead' ? DEAD_URL : ENDPOINT_URL;
      return send(res, 200, wrapDoc(formFor(ep), 'embed'));
    }
    send(res, 404, 'nope');
  });
  B = embedSrv.address().port;

  const site = await listen((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/thank-you/') {
      return send(res, 200, wrapDoc(`<div style="padding:16px">${fs.readFileSync(TY_FILE, 'utf8')}</div>`, 'Thank You'));
    }
    if (u.pathname === '/embed') {
      const ep = u.searchParams.get('ep') === 'dead' ? DEAD_URL : ENDPOINT_URL;
      return send(res, 200, wrapDoc(formFor(ep), 'embed'));
    }
    if (u.pathname === '/direct') {
      const ep = u.searchParams.get('ep') === 'dead' ? DEAD_URL : ENDPOINT_URL;
      return send(res, 200, wrapDoc(`<div style="padding:16px">${formFor(ep)}</div>`, 'Sell Your House'));
    }
    if (u.pathname === '/sell-your-house/') {
      const mode = u.searchParams.get('mode') || 'plain';
      const ep = u.searchParams.get('ep') || '';
      const sandbox = u.searchParams.get('sandbox') === '1'
        ? ' sandbox="allow-scripts allow-forms allow-same-origin allow-popups"' : '';
      let attr;
      if (mode === 'cross') attr = `src="http://127.0.0.1:${B}/embed?ep=${ep}"`;
      else if (mode === 'srcdoc') attr = `srcdoc="${escAttr(wrapDoc(formFor(ep === 'dead' ? DEAD_URL : ENDPOINT_URL), 'embed'))}"`;
      else attr = `src="/embed?ep=${ep}"`;
      const page = `<header style="background:#1f2933;color:#fff;padding:16px">Turning Point Homes (mock Hostinger page)</header>
<main style="padding:16px;max-width:900px;margin:0 auto;box-sizing:border-box">
<h1 style="font-size:24px">Sell Your House Fast</h1>
<iframe id="embed" title="Seller form" ${attr}${sandbox} style="width:100%;height:1500px;border:0;display:block"></iframe>
</main>`;
      return send(res, 200, wrapDoc(page, 'Sell Your House'));
    }
    send(res, 404, 'nope');
  });
  A = site.address().port;
  const SITE = `http://localhost:${A}`;
  const THANK_YOU = `${SITE}/thank-you/`;

  // ---------- test runner ----------
  const results = [];
  async function test(name, fn) {
    try { await fn(); results.push([name, true]); console.log('PASS', name); }
    catch (e) { results.push([name, false, e.message]); console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); }
  }
  function assert(c, msg) { if (!c) throw new Error(msg); }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  async function openForm(query, opts) {
    const page = await (opts && opts.context || ctx).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const url = query === 'direct' ? `${SITE}/direct` : query.startsWith('direct?') ? `${SITE}/${query}` : `${SITE}/sell-your-house/?${query}`;
    await page.goto(url);
    let frame;
    if (query.startsWith('direct')) frame = page.mainFrame();
    else {
      const handle = await page.waitForSelector('#embed');
      frame = await handle.contentFrame();
    }
    await frame.waitForSelector('#tph-form');
    return { page, frame, errors };
  }
  const VALID = {
    firstName: 'Jane', lastName: 'Doe', phone: '(816) 555-0142', email: 'jane@example.com',
    address: '123 Main St', city: 'Independence', state: 'MO', zip: '64050',
    timeline: 'ASAP', condition: 'Needs minor repairs', reason: 'Job loss', askingPrice: '150000',
  };
  async function fill(frame, data) {
    for (const [k, v] of Object.entries(data)) {
      const el = await frame.$(`[name="${k}"]`);
      const tag = await el.evaluate((n) => n.tagName);
      if (tag === 'SELECT') await el.selectOption({ label: v }); else await el.fill(v);
    }
  }
  async function clearPosts() { posts.length = 0; }
  // Waits until the top page is on the thank-you URL or the iframe shows an inline thank-you.
  async function outcome(page, frame, ms) {
    const end = Date.now() + (ms || 6000);
    while (Date.now() < end) {
      if (page.url().startsWith(THANK_YOU)) return 'redirect';
      try {
        const inline = await frame.evaluate(() => {
          const el = document.getElementById('tph-success');
          return !!(el && el.offsetParent !== null && /thank you/i.test(el.textContent));
        });
        if (inline) return 'inline';
      } catch (e) { /* frame navigating/detached */ }
      await new Promise((r) => setTimeout(r, 100));
    }
    let btn = '';
    try { btn = await frame.$eval('#tph-submit', (b) => b.textContent); } catch (e) {}
    return 'stuck(button="' + btn + '")';
  }
  const visibleError = (frame) => frame.evaluate(() => {
    const e = document.getElementById('tph-error');
    return e && getComputedStyle(e).display !== 'none' ? e.textContent.trim() : '';
  });

  // ---------- field names vs Code.gs ----------
  await test('field names match Code.gs COLUMNS + honeypot', async () => {
    const gs = fs.readFileSync(CODE_GS, 'utf8');
    const cols = JSON.parse(gs.match(/const COLUMNS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
    const { page, frame } = await openForm('direct');
    const names = await frame.$$eval('#tph-form [name]', (els) => els.map((e) => e.name));
    await page.close();
    const expected = cols.filter((c) => c !== 'submittedAt' && c !== 'sourcePage');
    const missing = expected.filter((c) => !names.includes(c));
    const extra = names.filter((n) => !expected.includes(n) && n !== 'website');
    assert(!missing.length, 'form missing fields: ' + missing);
    assert(!extra.length, 'form has fields Code.gs ignores: ' + extra);
    assert(names.includes('website'), 'honeypot "website" missing');
    assert(/data\.website/.test(gs), 'Code.gs does not check honeypot "website"');
  });

  // ---------- validation ----------
  await test('required: empty submit blocked, error shown, focus on first name, no POST', async () => {
    await clearPosts();
    const { page, frame } = await openForm('mode=plain');
    await frame.click('#tph-submit');
    await page.waitForTimeout(400);
    const err = await visibleError(frame);
    assert(err, 'no visible error message');
    const focused = await frame.evaluate(() => document.activeElement && document.activeElement.name);
    assert(focused === 'firstName', 'focus not on firstName: ' + focused);
    const inv = await frame.$eval('[name=firstName]', (e) => e.getAttribute('aria-invalid'));
    assert(inv === 'true', 'firstName not marked aria-invalid');
    assert(posts.length === 0, 'POST was sent');
    await page.close();
  });

  for (const [field, label] of [['firstName', 'first name'], ['phone', 'phone'], ['address', 'address']]) {
    await test(`required: missing ${label} only -> blocked`, async () => {
      await clearPosts();
      const { page, frame } = await openForm('mode=plain');
      const d = Object.assign({}, VALID); d[field] = '   ';
      await fill(frame, d);
      await frame.click('#tph-submit');
      await page.waitForTimeout(400);
      assert(await visibleError(frame), 'no visible error');
      const focused = await frame.evaluate(() => document.activeElement && document.activeElement.name);
      assert(focused === field, `focus on ${focused}, expected ${field}`);
      assert(posts.length === 0, 'POST was sent');
      await page.close();
    });
  }

  for (const bad of ['12345', '555-0142', 'call me', '816555014222', '1165550142', '8160550142']) {
    await test(`phone rejected: "${bad}"`, async () => {
      await clearPosts();
      const { page, frame } = await openForm('mode=plain');
      await fill(frame, Object.assign({}, VALID, { phone: bad }));
      await frame.click('#tph-submit');
      await page.waitForTimeout(400);
      const err = await visibleError(frame);
      assert(/phone/i.test(err), 'no phone error shown (got "' + err + '")');
      assert(posts.length === 0, 'POST was sent');
      await page.close();
    });
  }
  for (const good of ['816-555-0142', '(816) 555-0142', '816.555.0142', '8165550142', '+1 816 555 0142', '1-816-555-0142']) {
    await test(`phone accepted: "${good}"`, async () => {
      await clearPosts();
      const { page, frame } = await openForm('mode=plain');
      await fill(frame, Object.assign({}, VALID, { phone: good }));
      await frame.click('#tph-submit');
      const o = await outcome(page, frame);
      assert(o === 'redirect', 'outcome ' + o + ' / error: ' + (await visibleError(frame).catch(() => '')));
      assert(posts.length === 1, 'posts=' + posts.length);
      await page.close();
    });
  }
  for (const bad of ['jane@', 'jane.example.com', 'jane@example', 'a b@c.com']) {
    await test(`email rejected: "${bad}"`, async () => {
      await clearPosts();
      const { page, frame } = await openForm('mode=plain');
      await fill(frame, Object.assign({}, VALID, { email: bad }));
      await frame.click('#tph-submit');
      await page.waitForTimeout(400);
      const err = await visibleError(frame);
      assert(/email/i.test(err), 'no email error (got "' + err + '")');
      assert(posts.length === 0, 'POST was sent');
      await page.close();
    });
  }
  await test('email optional: blank email submits', async () => {
    await clearPosts();
    const { page, frame } = await openForm('mode=plain');
    await fill(frame, Object.assign({}, VALID, { email: '' }));
    await frame.click('#tph-submit');
    assert((await outcome(page, frame)) === 'redirect', 'did not submit');
    assert(posts.length === 1, 'posts=' + posts.length);
    await page.close();
  });

  // ---------- payload ----------
  await test('payload: every field sent with Code.gs names; sourcePage populated; honeypot empty', async () => {
    await clearPosts();
    const { page, frame } = await openForm('mode=plain');
    await fill(frame, VALID);
    await frame.click('#tph-submit');
    await outcome(page, frame);
    assert(posts.length === 1, 'posts=' + posts.length);
    const p = posts[0].params;
    const want = Object.assign({}, VALID, { phone: '(816) 555-0142' }); // phone is normalized
    for (const [k, v] of Object.entries(want)) assert(p[k] === v, `${k}: got ${JSON.stringify(p[k])} want ${JSON.stringify(v)}`);
    assert(p.sourcePage && p.sourcePage.includes('/sell-your-house/'), 'sourcePage=' + p.sourcePage);
    assert(p.website === '' || p.website === undefined, 'honeypot sent non-empty');
    assert(/application\/x-www-form-urlencoded/.test(posts[0].headers['content-type'] || ''), 'content-type ' + posts[0].headers['content-type']);
    await page.close();
  });

  // ---------- iframe scenarios ----------
  const scenarios = [
    ['direct (no iframe)', 'direct', 'redirect'],
    ['same-origin iframe, no sandbox', 'mode=plain', 'redirect'],
    ['same-origin iframe, sandbox w/o allow-top-navigation', 'mode=plain&sandbox=1', 'inline'],
    ['cross-origin iframe, no sandbox', 'mode=cross', 'redirect'],
    ['cross-origin iframe, sandbox w/o allow-top-navigation', 'mode=cross&sandbox=1', 'inline'],
    ['srcdoc iframe, no sandbox', 'mode=srcdoc', 'redirect'],
    ['srcdoc iframe, sandbox w/o allow-top-navigation', 'mode=srcdoc&sandbox=1', 'inline'],
  ];
  for (const [name, q, expect] of scenarios) {
    await test(`submit -> ${expect === 'redirect' ? 'thank-you page' : 'inline thank-you'}: ${name}`, async () => {
      await clearPosts();
      const { page, frame, errors } = await openForm(q);
      await fill(frame, VALID);
      await frame.click('#tph-submit');
      const o = await outcome(page, frame);
      assert(o === expect, `outcome=${o}, expected ${expect}`);
      assert(posts.length === 1, 'posts=' + posts.length);
      assert(posts[0].params.sourcePage, 'sourcePage empty');
      if (o === 'inline') {
        const link = await frame.$eval('#tph-success a[target=_top]', (a) => a.href).catch(() => null);
        assert(link === THANK_YOU, 'inline message has no target=_top link to thank-you page: ' + link);
        const btn = await frame.$('#tph-submit');
        const btnVisible = btn ? await btn.isVisible() : false;
        assert(!btnVisible, 'form/button still visible behind inline message');
      }
      assert(!errors.length, 'page errors: ' + errors.join('; '));
      console.log('      sourcePage =', posts[0].params.sourcePage);
      await page.close();
    });
  }

  await test('slow endpoint (1.5s): still reaches thank-you page from cross-origin iframe', async () => {
    await clearPosts(); endpointMode = 'slow';
    const { page, frame } = await openForm('mode=cross');
    await fill(frame, VALID);
    await frame.click('#tph-submit');
    await page.waitForTimeout(300);
    const txt = await frame.$eval('#tph-submit', (b) => [b.disabled, b.textContent]);
    assert(txt[0] === true, 'button not disabled while sending');
    const o = await outcome(page, frame, 8000);
    endpointMode = 'ok';
    assert(o === 'redirect', 'outcome=' + o);
    await page.close();
  });

  await test('Back button from thank-you page: form is usable again (not stuck on "Sending")', async () => {
    const { page, frame } = await openForm('direct');
    await fill(frame, VALID);
    await frame.click('#tph-submit');
    assert((await outcome(page, frame)) === 'redirect', 'no redirect');
    await page.goBack();
    await page.waitForSelector('#tph-submit');
    await page.waitForTimeout(300);
    const b = await page.$eval('#tph-submit', (b) => [b.disabled, b.textContent]);
    assert(!b[0] && !/sending|sent/i.test(b[1]), 'button state after Back: ' + b);
    await page.close();
  });

  // ---------- double submit ----------
  await test('double submit: rapid clicks + Enter + requestSubmit send exactly one POST', async () => {
    await clearPosts(); endpointMode = 'slow';
    const { page, frame } = await openForm('mode=plain');
    await fill(frame, VALID);
    await frame.evaluate(() => {
      const f = document.getElementById('tph-form');
      const b = document.getElementById('tph-submit');
      b.click(); b.click();
      f.requestSubmit(); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await frame.press('[name=address]', 'Enter').catch(() => {});
    await outcome(page, frame, 8000);
    endpointMode = 'ok';
    assert(posts.length === 1, 'posts=' + posts.length);
    await page.close();
  });

  // ---------- failure handling ----------
  for (const [name, q] of [['same-origin iframe', 'mode=plain&ep=dead'], ['cross-origin iframe', 'mode=cross&ep=dead'], ['direct', 'direct?ep=dead']]) {
    await test(`endpoint down (${name}): user told, no redirect, button re-enabled, data kept`, async () => {
      const { page, frame } = await openForm(q);
      await fill(frame, VALID);
      await frame.click('#tph-submit');
      await page.waitForTimeout(3500);
      assert(!page.url().startsWith(THANK_YOU), 'redirected to thank-you even though the lead was not delivered');
      const err = await visibleError(frame);
      assert(err && /try again|call/i.test(err), 'no failure message (got "' + err + '")');
      const b = await frame.$eval('#tph-submit', (b) => [b.disabled, b.textContent]);
      assert(!b[0], 'button still disabled: ' + b[1]);
      assert(!/sending/i.test(b[1]), 'button still says ' + b[1]);
      const v = await frame.$eval('[name=address]', (e) => e.value);
      assert(v === VALID.address, 'form data lost');
      if (name === 'direct') await page.screenshot({ path: path.join(OUT, 'form-network-error-desktop.png'), fullPage: true });
      await page.close();
    });
  }
  await test('endpoint hangs: button does not hang forever; user gets a thank-you after timeout', async () => {
    await clearPosts(); endpointMode = 'hang';
    const { page, frame } = await openForm('mode=plain');
    await fill(frame, VALID);
    await frame.click('#tph-submit');
    const o = await outcome(page, frame, 7000);
    endpointMode = 'ok';
    hung.splice(0).forEach((r) => { try { r.end(); } catch (e) {} });
    assert(posts.length === 1, 'posts=' + posts.length);
    assert(o === 'redirect' || o === 'inline', 'outcome=' + o);
    await page.close();
  });

  // ---------- honeypot ----------
  await test('honeypot: hidden, not focusable by Tab, not announced', async () => {
    const { page, frame } = await openForm('direct');
    const info = await frame.$eval('[name=website]', (e) => {
      const r = e.getBoundingClientRect();
      const wrap = e.closest('[aria-hidden="true"]');
      return { off: r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || e.offsetParent === null, tab: e.tabIndex, hidden: !!wrap, val: e.value };
    });
    assert(info.off, 'honeypot visible on screen');
    assert(info.tab === -1, 'honeypot tabbable');
    assert(info.hidden, 'honeypot not aria-hidden');
    assert(info.val === '', 'honeypot prefilled');
    await page.close();
  });

  // ---------- accessibility / keyboard ----------
  await test('labels: every visible control has an associated label; required marked', async () => {
    const { page, frame } = await openForm('direct');
    const problems = await frame.evaluate(() => {
      const out = [];
      document.querySelectorAll('#tph-form input, #tph-form select, #tph-form textarea').forEach((el) => {
        if (el.name === 'website') return;
        if (!el.labels || !el.labels.length) out.push('no label: ' + el.name);
      });
      ['firstName', 'phone', 'address'].forEach((n) => {
        const el = document.querySelector('[name=' + n + ']');
        if (!el.required && el.getAttribute('aria-required') !== 'true') out.push('not required: ' + n);
      });
      const err = document.getElementById('tph-error');
      if (!err.getAttribute('role') && !err.getAttribute('aria-live')) out.push('error not announced (no role/aria-live)');
      return out;
    });
    assert(!problems.length, problems.join('; '));
    await page.close();
  });
  await test('keyboard: Tab order covers all fields then button (skips honeypot); Enter submits', async () => {
    await clearPosts();
    const { page, frame } = await openForm('direct');
    await frame.focus('[name=firstName]');
    const order = ['firstName'];
    for (let i = 0; i < 13; i++) {
      await page.keyboard.press('Tab');
      order.push(await frame.evaluate(() => document.activeElement.name || document.activeElement.id));
    }
    const expected = ['firstName', 'lastName', 'phone', 'email', 'address', 'city', 'state', 'zip', 'timeline', 'condition', 'reason', 'askingPrice', 'tph-submit'];
    assert(JSON.stringify(order.slice(0, 13)) === JSON.stringify(expected), 'tab order: ' + order.join(','));
    await fill(frame, VALID);
    await frame.focus('[name=address]');
    await page.keyboard.press('Enter');
    const o = await outcome(page, frame);
    assert(o === 'redirect' && posts.length === 1, 'Enter did not submit: ' + o);
    await page.close();
  });
  await test('focus is visible on inputs and button', async () => {
    const { page, frame } = await openForm('direct');
    await frame.focus('[name=phone]');
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    const inp = await frame.$eval('[name=phone]', (e) => getComputedStyle(e).outlineStyle);
    await frame.focus('[name=askingPrice]'); await page.keyboard.press('Tab');
    const btn = await frame.$eval('#tph-submit', (e) => [getComputedStyle(e).outlineStyle, getComputedStyle(e).boxShadow]);
    assert(inp !== 'none', 'no focus outline on input');
    assert(btn[0] !== 'none' || btn[1] !== 'none', 'no focus indicator on button');
    await page.close();
  });

  // ---------- screenshots + mobile ----------
  await test('desktop screenshots (form, error state, thank-you page)', async () => {
    const { page, frame } = await openForm('direct');
    await page.screenshot({ path: path.join(OUT, 'form-desktop.png'), fullPage: true });
    await frame.click('#tph-submit');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'form-errors-desktop.png'), fullPage: true });
    await page.close();
    const p2 = await ctx.newPage();
    await p2.goto(THANK_YOU);
    await p2.screenshot({ path: path.join(OUT, 'thank-you-desktop.png'), fullPage: true });
    await p2.close();
    const s = await openForm('mode=plain&sandbox=1');
    await fill(s.frame, VALID);
    await s.frame.click('#tph-submit');
    await outcome(s.page, s.frame);
    await s.page.screenshot({ path: path.join(OUT, 'inline-thank-you-desktop.png') });
    await s.page.close();
  });

  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const overflow = (f) => f.evaluate(() => {
    const d = document.documentElement;
    const wide = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > d.clientWidth + 1).map((el) => el.tagName + '#' + el.id + '.' + el.className);
    return { sw: d.scrollWidth, cw: d.clientWidth, wide: wide.slice(0, 5) };
  });
  for (const q of ['direct', 'mode=cross']) {
    await test(`mobile 375px (${q}): no horizontal overflow in form or page`, async () => {
      const { page, frame } = await openForm(q, { context: mctx });
      const fo = await overflow(frame);
      const po = await overflow(page.mainFrame());
      assert(fo.sw <= fo.cw, `form overflows: ${fo.sw}>${fo.cw} ${fo.wide}`);
      assert(po.sw <= po.cw, `page overflows: ${po.sw}>${po.cw} ${po.wide}`);
      if (q === 'direct') {
        await page.screenshot({ path: path.join(OUT, 'form-mobile.png'), fullPage: true });
        await frame.click('#tph-submit'); await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, 'form-errors-mobile.png'), fullPage: true });
        const fo2 = await overflow(frame);
        assert(fo2.sw <= fo2.cw, 'error state overflows');
      }
      await page.close();
    });
  }
  await test('mobile 375px: thank-you page no overflow', async () => {
    const p = await mctx.newPage();
    await p.goto(THANK_YOU);
    const o = await overflow(p.mainFrame());
    await p.screenshot({ path: path.join(OUT, 'thank-you-mobile.png'), fullPage: true });
    assert(o.sw <= o.cw, `overflows: ${o.sw}>${o.cw} ${o.wide}`);
    await p.close();
  });
  await test('mobile 375px: inline thank-you (sandboxed iframe) fits', async () => {
    await clearPosts();
    const { page, frame } = await openForm('mode=srcdoc&sandbox=1', { context: mctx });
    await fill(frame, VALID);
    await frame.click('#tph-submit');
    assert((await outcome(page, frame)) === 'inline', 'no inline message');
    const fo = await overflow(frame);
    assert(fo.sw <= fo.cw, 'inline message overflows');
    await page.screenshot({ path: path.join(OUT, 'inline-thank-you-mobile.png') });
    await page.close();
  });
  await test('mobile: phone/email/zip fields use proper mobile keyboards', async () => {
    const { page, frame } = await openForm('direct', { context: mctx });
    const r = await frame.evaluate(() => ['phone', 'email', 'zip'].map((n) => {
      const e = document.querySelector('[name=' + n + ']'); return e.type + '/' + (e.inputMode || '');
    }));
    assert(r[0].startsWith('tel') && r[1].startsWith('email') && /numeric/.test(r[2]), r.join(' '));
    await page.close();
  });

  // ---------- thank-you page content ----------
  // Not a failure: the real number has to be filled in by the owner.
  if (/YOUR_PHONE/.test(fs.readFileSync(TY_FILE, 'utf8').replace(/<!--[\s\S]*?-->/g, ''))) {
    console.log('WARN thank-you-embed.html still contains the YOUR_PHONE placeholder (replace before going live)');
  }

  await browser.close();
  [endpoint, embedSrv, site].forEach((s) => s.close());

  const failed = results.filter((r) => !r[1]);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  failed.forEach((f) => console.log('  FAIL', f[0], '-', f[2]));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
