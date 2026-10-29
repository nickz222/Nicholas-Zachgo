/**
 * Turning Point Homes - website form -> Google Sheet.
 *
 * Paste this into the Apps Script editor of the "Turning Point Homes - Seller Leads"
 * sheet (Extensions > Apps Script), then Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone. Copy the web app URL into the form embed.
 */
const SHEET_NAME = 'Leads';
const COLUMNS = [
  'submittedAt', 'firstName', 'lastName', 'phone', 'email', 'address', 'city',
  'state', 'zip', 'timeline', 'condition', 'askingPrice', 'reason', 'sourcePage',
];
// Optional: get an email for every new lead. Leave '' to turn off.
const NOTIFY_EMAIL = 'nick@investturningpoint.com';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = e.parameter || {};
    // Honeypot: bots fill the hidden "website" field, people don't.
    if (data.website) return json_({ ok: true });

    data.submittedAt = Utilities.formatDate(new Date(), 'America/Chicago', 'MM/dd/yyyy HH:mm:ss');
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    sheet.appendRow(COLUMNS.map(function (key) { return String(data[key] || '').trim(); }));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'New seller lead: ' + (data.address || 'no address'),
        COLUMNS.map(function (key) { return key + ': ' + (data[key] || ''); }).join('\n')
      );
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
