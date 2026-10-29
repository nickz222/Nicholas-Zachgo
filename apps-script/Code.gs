/**
 * Turning Point Homes - website form -> Google Sheet.
 *
 * Paste this into the Apps Script editor of the "Turning Point Homes - Seller Leads"
 * sheet (Extensions > Apps Script), then Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone. Copy the web app URL into the form embed.
 *
 * To check the deployment, open the web app URL in a browser: it should say "OK".
 * To add a test row without the website, pick testDoPost in the editor and click Run.
 * After editing this code, use Deploy > Manage deployments > Edit > New version,
 * or the live URL keeps running the old code.
 */
const SHEET_NAME = 'Leads';
// One entry per sheet column, in the same order as the headers in row 1 (A..N):
// Submitted At, First Name, Last Name, Phone, Email, Property Address, City, State,
// Zip, Timeline, Property Condition, Asking Price, Reason for Selling, Source Page.
// Column O "Sent to REsimpli" is left blank for Zapier / you to fill in.
const COLUMNS = [
  'submittedAt', 'firstName', 'lastName', 'phone', 'email', 'address', 'city',
  'state', 'zip', 'timeline', 'condition', 'askingPrice', 'reason', 'sourcePage',
];
// Optional: get an email for every new lead. Leave '' to turn off.
const NOTIFY_EMAIL = 'nick@investturningpoint.com';
// Independence, MO time.
const TIME_ZONE = 'America/Chicago';
// Longest value we keep from any one field (stops junk from flooding the sheet).
const MAX_LENGTH = 1000;

function doPost(e) {
  const data = (e && e.parameter) || {};

  // Honeypot: bots fill the hidden "website" field, people don't.
  // Answer "ok" so the bot doesn't retry, but save nothing.
  if (clean_(data.website)) return json_({ ok: true });

  // Clean every field: trim, cut very long values, block spreadsheet formulas.
  const row = {};
  COLUMNS.forEach(function (key) { row[key] = clean_(data[key]); });

  // A lead we can't call or email back is useless (and almost always spam).
  if (!row.phone && !row.email) return json_({ ok: false, error: 'Phone or email required' });

  row.submittedAt = Utilities.formatDate(new Date(), TIME_ZONE, 'MM/dd/yyyy HH:mm:ss');

  // Lock so two leads arriving at the same moment don't collide. If the lock is
  // busy for 10 seconds we still save the lead: losing a seller is worse.
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    locked = lock.tryLock(10000);
  } catch (err) {
    locked = false;
  }

  try {
    // appendRow adds a new row at the bottom, which is what Zapier's
    // "New Spreadsheet Row" trigger watches for.
    getSheet_().appendRow(COLUMNS.map(function (key) { return safe_(row[key]); }));
  } catch (err) {
    console.error('Could not save lead: ' + err);
    return json_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }

  // The row is saved. Email is a bonus: if it fails (e.g. daily quota) the lead is still in the sheet.
  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'New seller lead: ' + (row.address || row.firstName || 'no address'),
        COLUMNS.map(function (key) { return key + ': ' + row[key]; }).join('\n')
      );
    } catch (err) {
      console.error('Lead saved, but email failed: ' + err);
    }
  }
  return json_({ ok: true });
}

// Visiting the web app URL in a browser shows "OK", so you know the deployment works.
function doGet() {
  return ContentService.createTextOutput('OK');
}

// Run this from the Apps Script editor to add a test row (and send a test email).
function testDoPost() {
  const result = doPost({
    parameter: {
      firstName: 'Test', lastName: 'Lead', phone: '+1 816-555-0100',
      email: 'test@example.com', address: '123 Test St', city: 'Independence',
      state: 'MO', zip: '64058', timeline: 'ASAP', condition: 'Needs some work',
      askingPrice: '150000', reason: 'Test', sourcePage: 'testDoPost (editor)',
    },
  });
  console.log(result.getContent());
}

// The "Leads" tab, or the first tab if it was renamed or deleted.
function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

// Trim a form value and cut it to MAX_LENGTH characters.
function clean_(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, MAX_LENGTH);
}

// Stop formula injection: a value starting with = + - @ would run as a formula.
// A leading apostrophe makes Sheets store it as plain text and is not shown,
// so a phone like "+1 816-555-0100" still displays (and reaches Zapier) as typed.
function safe_(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
