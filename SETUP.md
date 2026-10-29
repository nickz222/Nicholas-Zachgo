# Turning Point Homes: website form → Google Sheet → REsimpli

How it works: the website form sends each lead to a Google Sheet, the visitor lands on a
thank-you page, and Zapier turns every new row into a REsimpli lead.

Google Sheet (already created):
https://docs.google.com/spreadsheets/d/1v8_M-LH0p2n0f8S90159Ebw1otAy8NAxk_SzGsGWMSg/edit

## 1. Connect the sheet (about 5 minutes)
1. Open the sheet, then go to **Extensions → Apps Script**.
2. Delete the starter code and paste in everything from `apps-script/Code.gs`. Save.
3. Click **Deploy → New deployment → Web app**. Set *Execute as*: **Me** and *Who has access*: **Anyone**. Deploy and approve the permissions.
4. Copy the **Web app URL** (it ends in `/exec`).

## 2. Replace the form on /sell-your-house/ (Hostinger Website Builder)
1. In Hostinger, open the site editor and go to the **Sell Your House** page.
2. Delete the old form.
3. Add an **Embed code** element in its place.
4. Paste in `website/sell-form-embed.html`.
5. In the pasted code, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL from step 1.4.

## 3. Add the thank-you page
1. Add a new page with the URL `thank-you` and hide it from the navigation menu.
2. Add an **Embed code** element and paste in `website/thank-you-embed.html`.
3. In that code, replace `YOUR_PHONE` with your business phone number.

## 4. Fix the address
Change the address in the site **footer** (and on the Contact page, if it's listed there) to:
**25209 E Blue Mills Rd, Independence, MO 64058**

You can also update it in Hostinger under **Website → Settings → Business info / SEO** if it's set there.

## 5. Send leads to REsimpli (Zapier)
Create a Zap:
- **Trigger:** Google Sheets → *New Spreadsheet Row* → sheet "Turning Point Homes - Seller Leads", worksheet **Leads**
- **Action:** REsimpli 6.0 → *Add Lead (Residential)*, using the connected account nick@investturningpoint.com

| REsimpli field | Value |
|---|---|
| Marketing Campaign | Website number (or a new "Website Form" campaign) |
| Market / Pipeline / Status | Your main market, the acquisitions pipeline, and the "New Lead" status |
| First Name / Last Name | First Name / Last Name |
| Primary Phone Number | Phone |
| Primary Email | Email |
| Property Address | Property Address, City, State Zip |
| Tags | Web, New Lead |
| motivation - how soon are you looking to sell? | Timeline (the form's choices match REsimpli's) |
| motivation - why are you looking to sell the house? | Reason for Selling (choices match) |
| price - how much are you looking to sell the house for? | Asking Price |
| Notes | Condition: {Property Condition} · Source: {Source Page} |

Turn the Zap on. Any drip campaign you've set on that lead source/status in REsimpli will start automatically.

## 6. Test
Submit the form using your own phone number. Then check that:
1. you land on the thank-you page,
2. a new row shows up in the sheet,
3. you get the email alert, and
4. the lead appears in REsimpli within a couple of minutes.
