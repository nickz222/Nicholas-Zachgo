// Tests apps-script/Code.gs in Node by mocking the Apps Script globals.
// Run: node tests/apps-script.test.js   (exits non-zero on failure)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const CODE = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
const HEADERS = ['Submitted At', 'First Name', 'Last Name', 'Phone', 'Email', 'Property Address',
  'City', 'State', 'Zip', 'Timeline', 'Property Condition', 'Asking Price', 'Reason for Selling',
  'Source Page', 'Sent to REsimpli'];

function makeSheet(name) {
  return { name: name, rows: [HEADERS.slice()], appendRow: function (r) { this.rows.push(Array.from(r)); } };
}

// Build a fresh sandbox. opts: sheetName, lockMode ('ok'|'busy'|'throw'), mailThrows, appendThrows
function load(opts) {
  opts = opts || {};
  const sheet = makeSheet(opts.sheetName || 'Leads');
  if (opts.appendThrows) sheet.appendRow = function () { throw new Error('Sheet broken'); };
  const state = { sheet: sheet, mails: [], released: 0, tryLockCalls: 0, waitLockCalls: 0, dateArgs: [] };
  const lock = {
    tryLock: function () {
      state.tryLockCalls++;
      if (opts.lockMode === 'throw') throw new Error('Lock timeout');
      return opts.lockMode !== 'busy';
    },
    waitLock: function () {
      state.waitLockCalls++;
      if (opts.lockMode === 'throw' || opts.lockMode === 'busy') throw new Error('Lock timeout');
    },
    releaseLock: function () { state.released++; },
  };
  function TextOutput(s) { this.content = s; this.mime = null; }
  TextOutput.prototype.setMimeType = function (m) { this.mime = m; return this; };
  TextOutput.prototype.getContent = function () { return this.content; };
  const ctx = {
    console: { log: function () {}, error: function () {}, warn: function () {} },
    SpreadsheetApp: { getActive: function () {
      return { getSheetByName: function (n) { return n === sheet.name ? sheet : null; },
        getSheets: function () { return [sheet]; } };
    } },
    LockService: { getScriptLock: function () { return lock; } },
    Utilities: { formatDate: function (d, tz, fmt) { state.dateArgs.push([tz, fmt]); return '10/29/2026 09:15:00'; } },
    MailApp: { sendEmail: function (to, subj, body) {
      if (opts.mailThrows) throw new Error('Service invoked too many times for one day: email.');
      state.mails.push({ to: to, subj: subj, body: body });
    } },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: function (s) { return new TextOutput(s); } },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx, { filename: 'Code.gs' });
  state.ctx = ctx;
  state.post = function (params) { return ctx.doPost(params === undefined ? undefined : { parameter: params }); };
  state.dataRows = function () { return sheet.rows.slice(1); };
  return state;
}

const LEAD = {
  firstName: 'Jane', lastName: 'Doe', phone: '816-555-1234', email: 'jane@example.com',
  address: '1 Main St', city: 'Independence', state: 'MO', zip: '64058', timeline: 'ASAP',
  condition: 'Needs work', askingPrice: '150000', reason: 'Relocating', sourcePage: '/sell-your-house/',
  website: '',
};
function lead(over) { return Object.assign({}, LEAD, over || {}); }
function body(out) { return JSON.parse(out.getContent()); }

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('column order matches sheet headers A..N; O left blank', function () {
  const s = load();
  const out = s.post(lead());
  assert.deepStrictEqual(body(out), { ok: true });
  assert.strictEqual(out.mime, 'application/json');
  const rows = s.dataRows();
  assert.strictEqual(rows.length, 1);
  assert.deepStrictEqual(rows[0], ['10/29/2026 09:15:00', 'Jane', 'Doe', '816-555-1234', 'jane@example.com',
    '1 Main St', 'Independence', 'MO', '64058', 'ASAP', 'Needs work', '150000', 'Relocating', '/sell-your-house/']);
  assert.ok(rows[0].length <= HEADERS.length);
  assert.strictEqual(HEADERS[rows[0].length], 'Sent to REsimpli');
});

test('uses appendRow (Zapier New Spreadsheet Row)', function () {
  assert.ok(/\.appendRow\(/.test(CODE));
  const s = load(); s.post(lead()); s.post(lead({ firstName: 'Bob' }));
  assert.strictEqual(s.dataRows().length, 2);
  assert.strictEqual(s.dataRows()[1][1], 'Bob');
});

test('timezone America/Chicago', function () {
  const s = load(); s.post(lead());
  assert.strictEqual(s.dateArgs[0][0], 'America/Chicago');
});

test('formula injection neutralized with apostrophe', function () {
  const s = load();
  s.post(lead({ firstName: '=HYPERLINK("http://evil","x")', lastName: '@SUM(A1)', reason: '-2+3',
    address: '+cmd', city: '\t=1', condition: 'fine = ok' }));
  const r = s.dataRows()[0];
  assert.strictEqual(r[1], '\'=HYPERLINK("http://evil","x")');
  assert.strictEqual(r[2], "'@SUM(A1)");
  assert.strictEqual(r[12], "'-2+3");
  assert.strictEqual(r[5], "'+cmd");
  assert.strictEqual(r[6], "'=1"); // trimmed first, then neutralized
  assert.strictEqual(r[10], 'fine = ok'); // '=' in the middle is harmless
});

test('phone "+1 816..." stays readable (apostrophe is hidden by Sheets)', function () {
  const s = load(); s.post(lead({ phone: '+1 816-555-1234' }));
  assert.strictEqual(s.dataRows()[0][3], "'+1 816-555-1234");
  // Email shows the raw number, not the apostrophe.
  assert.ok(s.mails[0].body.indexOf('phone: +1 816-555-1234') !== -1);
});

test('trims and truncates long input to 1000 chars', function () {
  const s = load();
  s.post(lead({ firstName: '   Jane   ', reason: 'x'.repeat(5000) }));
  const r = s.dataRows()[0];
  assert.strictEqual(r[1], 'Jane');
  assert.strictEqual(r[12].length, 1000);
});

test('honeypot filled -> ok:true but nothing saved/emailed', function () {
  const s = load();
  assert.deepStrictEqual(body(s.post(lead({ website: 'http://spam.biz' }))), { ok: true });
  assert.strictEqual(s.dataRows().length, 0);
  assert.strictEqual(s.mails.length, 0);
});

test('no phone AND no email -> dropped', function () {
  const s = load();
  const out = body(s.post(lead({ phone: '   ', email: '' })));
  assert.strictEqual(out.ok, false);
  assert.strictEqual(s.dataRows().length, 0);
  assert.strictEqual(s.mails.length, 0);
});

test('phone only or email only -> saved', function () {
  const s = load();
  s.post(lead({ email: '' })); s.post(lead({ phone: '' }));
  assert.strictEqual(s.dataRows().length, 2);
});

test('missing fields become empty strings, not "undefined"', function () {
  const s = load();
  s.post({ phone: '8165551234' });
  const r = s.dataRows()[0];
  assert.strictEqual(r.length, 14);
  r.slice(1).forEach(function (v, i) { if (i !== 2) assert.strictEqual(v, ''); });
  assert.ok(s.mails[0].body.indexOf('undefined') === -1);
});

test('MailApp quota error does not lose the row', function () {
  const s = load({ mailThrows: true });
  const out = body(s.post(lead()));
  assert.deepStrictEqual(out, { ok: true });
  assert.strictEqual(s.dataRows().length, 1);
  assert.strictEqual(s.released, 1);
});

test('row is written before email is sent', function () {
  const s = load();
  let rowsAtMail = -1;
  const orig = s.ctx.MailApp.sendEmail;
  s.ctx.MailApp.sendEmail = function () { rowsAtMail = s.dataRows().length; return orig.apply(this, arguments); };
  s.post(lead());
  assert.strictEqual(rowsAtMail, 1);
});

test('lock acquired and released on success', function () {
  const s = load(); s.post(lead());
  assert.strictEqual(s.tryLockCalls + s.waitLockCalls, 1);
  assert.strictEqual(s.released, 1);
});

test('lock busy (tryLock false) -> lead still saved, lock not released', function () {
  const s = load({ lockMode: 'busy' });
  const out = body(s.post(lead()));
  assert.strictEqual(out.ok, true);
  assert.strictEqual(s.dataRows().length, 1);
  assert.strictEqual(s.released, 0);
});

test('lock throws -> no crash, lead still saved', function () {
  const s = load({ lockMode: 'throw' });
  const out = body(s.post(lead()));
  assert.strictEqual(out.ok, true);
  assert.strictEqual(s.dataRows().length, 1);
});

test('appendRow error -> ok:false, lock released, no email', function () {
  const s = load({ appendThrows: true });
  const out = body(s.post(lead()));
  assert.strictEqual(out.ok, false);
  assert.ok(/Sheet broken/.test(out.error));
  assert.strictEqual(s.released, 1);
  assert.strictEqual(s.mails.length, 0);
});

test('renamed tab -> falls back to first sheet', function () {
  const s = load({ sheetName: 'Sheet1' });
  assert.deepStrictEqual(body(s.post(lead())), { ok: true });
  assert.strictEqual(s.dataRows().length, 1);
});

test('doPost(undefined) and doPost({}) do not throw', function () {
  const s = load();
  assert.strictEqual(body(s.ctx.doPost(undefined)).ok, false);
  assert.strictEqual(body(s.ctx.doPost({})).ok, false);
  assert.strictEqual(s.dataRows().length, 0);
});

test('doGet returns "OK"', function () {
  const s = load();
  assert.strictEqual(typeof s.ctx.doGet, 'function');
  assert.strictEqual(s.ctx.doGet().getContent(), 'OK');
});

test('testDoPost inserts a test row', function () {
  const s = load();
  assert.strictEqual(typeof s.ctx.testDoPost, 'function');
  s.ctx.testDoPost();
  assert.strictEqual(s.dataRows().length, 1);
  assert.strictEqual(s.dataRows()[0][1], 'Test');
  assert.ok(s.dataRows()[0][3]); // has a phone, so the REsimpli Zap works
});

test('notification email sent to owner', function () {
  const s = load(); s.post(lead());
  assert.strictEqual(s.mails.length, 1);
  assert.strictEqual(s.mails[0].to, 'nick@investturningpoint.com');
  assert.ok(s.mails[0].subj.indexOf('1 Main St') !== -1);
});

test('header comment keeps deploy instructions', function () {
  assert.ok(/Web app/.test(CODE) && /Execute as: Me/.test(CODE) && /Who has access: Anyone/.test(CODE));
});

let failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('PASS ' + t[0]); }
  catch (err) { failed++; console.log('FAIL ' + t[0] + '\n     ' + (err && err.message)); }
});
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
