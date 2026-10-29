# Page SEO Titles, Meta Descriptions, and URL Slugs

Where to enter these in Hostinger Website Builder: open the page in the editor, go to the **Pages** menu (left sidebar), click the **three dots / gear** next to the page, choose **SEO settings** (sometimes labeled "Page settings" → "SEO"). You'll see fields for the title, description, page URL (slug), and an option to hide the page from search engines. Exact labels can differ slightly between Hostinger versions.

Rules used below:
- Titles are under 60 characters (Google cuts off longer ones). Descriptions are under 155 characters.
- Each page targets one main phrase. No two pages share a title or description.
- Don't change a slug that's already live and getting traffic (like `/sell-your-house/`). If you ever must, set up a 301 redirect from the old URL if Hostinger allows it.
- Replace `YOUR_PHONE` where it appears once you have the number. Descriptions here avoid the phone on purpose so you don't have to edit them later.

Character counts are shown as (title / description).

---

## Existing pages

### Home
- **Slug:** `/` (home)
- **Main phrase:** we buy houses Kansas City
- **SEO title:** `We Buy Houses Kansas City & Independence | Turning Point` (56)
- **Meta description:** `Turning Point Homes buys houses for cash in Kansas City, Independence & nearby. Sell as-is, no repairs or fees, and close when you want. Get an offer.` (150)
- **H1 on page:** We Buy Houses for Cash in Kansas City & Independence, MO

### Sell Your House
- **Slug:** `/sell-your-house/` (keep as-is)
- **Main phrase:** sell my house fast Kansas City
- **SEO title:** `Sell My House Fast Kansas City | Cash Offer in 24 Hrs` (53)
  - Only use "in 24 Hrs" if you really deliver offers within 24 hours. Alternative: `Sell My House Fast Kansas City | Fair Cash Offer` (48)
- **Meta description:** `Sell your house fast for cash in Kansas City & Independence, MO. No repairs, no fees, no showings. Get a fair cash offer and close on your timeline.` (148)
- **H1:** Sell Your House Fast for Cash in Kansas City & Independence, MO

### Thank You (after form submission)
- **Slug:** `/thank-you/`
- **SEO title:** `Thank You | Turning Point Homes` (31)
- **Meta description:** `Thanks for reaching out to Turning Point Homes. We'll contact you shortly about your cash offer.` (96)
- **Indexing:** turn ON "Hide page from search results" / noindex in the page's SEO settings, and don't add it to the navigation menu. (If Hostinger doesn't offer a noindex toggle on your plan, at least keep it out of the menu; it will still work fine.)
- Tip: this page is the best place to put a conversion-tracking tag (Google Ads / GA4 event) later.

### About
- **Slug:** `/about/`
- **Main phrase:** local cash home buyer Independence MO
- **SEO title:** `About Turning Point Homes | Local Home Buyer Independence` (57)
- **Meta description:** `Meet Turning Point Homes, a local cash home buyer based in Independence, MO. Learn how we work, who we help, and why sellers in Kansas City trust us.` (149)
  - Remove "trust us" if you'd rather not claim it until you have reviews: `...Learn how we work and who we help across the Kansas City area.`
- **Page content must-haves:** real owner name and photo, why you started, how you make offers, [FILL IN: true facts only].

### Contact
- **Slug:** `/contact/`
- **SEO title:** `Contact Turning Point Homes | Independence, MO` (46)
- **Meta description:** `Contact Turning Point Homes in Independence, MO for a free, no-obligation cash offer on your house. Call, text, email, or fill out our quick form.` (146)
- **Page content must-haves:** business name, address (or "Serving Independence & Kansas City metro" if you hide it), phone YOUR_PHONE, email nick@investturningpoint.com, form, embedded Google Map (optional).

---

## New location pages (recommended)

Build one at a time, starting with Independence (your home city, easiest to rank). See `location-page-template.md`. Each must have genuinely different content — don't just swap the city name.

| City | Slug | SEO title | Meta description |
|---|---|---|---|
| Independence | `/we-buy-houses-independence-mo/` | `We Buy Houses Independence MO \| Fast Cash Offer` (47) | `Need to sell your house fast in Independence, MO? Turning Point Homes is a local cash buyer. Any condition, no fees, close on your schedule.` (140) |
| Kansas City MO | `/we-buy-houses-kansas-city-mo/` | `We Buy Houses Kansas City MO \| Sell As-Is for Cash` (50) | `Sell your Kansas City, MO house fast for cash. We buy as-is in any condition, no repairs, no commissions. Get a fair no-obligation offer today.` (143) |
| Blue Springs | `/we-buy-houses-blue-springs-mo/` | `We Buy Houses Blue Springs MO \| Cash Home Buyer` (47) | `Sell your Blue Springs house fast for a fair cash price. No repairs, no showings, no agent fees. Local buyer from nearby Independence, MO.` (138) |
| Lee's Summit | `/we-buy-houses-lees-summit-mo/` | `We Buy Houses Lee's Summit MO \| Fast Cash Sale` (46) | `Selling a house in Lee's Summit, MO? Get a fair cash offer from a local buyer. Sell as-is, skip repairs and commissions, and pick your closing date.` (148) |
| Raytown | `/we-buy-houses-raytown-mo/` | `We Buy Houses Raytown MO \| Sell Your House Fast` (47) | `Sell your Raytown, MO house fast for cash, as-is. No repairs, cleaning, or fees. Local cash home buyer serving Raytown and Eastern Jackson County.` (146) |
| Grain Valley | `/we-buy-houses-grain-valley-mo/` | `We Buy Houses Grain Valley MO \| Cash Offer` (42) | `Need to sell a house in Grain Valley, MO? We buy houses for cash in any condition. No fees, no repairs, no waiting on buyer financing.` (134) |

Note: in the table, `\|` is just an escaped pipe for Markdown — type a normal `|` in Hostinger.

Later candidates (only if you actually buy there): Sugar Creek, Buckner, Oak Grove, Grandview, Kansas City KS (only if you buy in Kansas).

---

## New situation pages (recommended)

These catch people searching their specific problem, which often converts better than generic "sell my house" searches.

### Inherited / probate house
- **Slug:** `/sell-inherited-house-kansas-city/`
- **SEO title:** `Sell an Inherited House in Kansas City | Probate Help` (53)
- **Meta description:** `Inherited a house in Kansas City or Independence? We buy inherited and probate properties as-is, even full of belongings. No cleanout or repairs needed.` (152)
- **Content ideas:** what to do first after inheriting, working with the personal representative and probate attorney (don't give legal advice — say "talk to a probate attorney"), selling with siblings/co-heirs, leaving belongings behind.

### Foreclosure
- **Slug:** `/stop-foreclosure-kansas-city/`
- **SEO title:** `Facing Foreclosure in Kansas City? Sell Your House Fast` (55)
- **Meta description:** `Behind on mortgage payments in Kansas City or Independence? A fast cash sale may help you avoid foreclosure. Learn your options and get a fair offer.` (149)
- **Content ideas:** a plain overview of options (loan modification, reinstatement, selling, etc.), recommend talking to the lender and a HUD-approved housing counselor, how a fast sale works. Avoid promises like "we can stop any foreclosure." Missouri foreclosures are usually non-judicial and can move quickly — [FILL IN: have this reviewed by a local attorney before stating timelines].

### Divorce
- **Slug:** `/sell-house-divorce-kansas-city/`
- **SEO title:** `Selling a House During Divorce in Kansas City` (45)
- **Meta description:** `Need to sell a house during a divorce in Kansas City or Independence? Get a fair cash offer, a quick closing, and a neutral process for both sides.` (147)
- **Content ideas:** neutral process, both owners sign, closing date that works with the settlement, coordinate with attorneys.

### Tired landlord
- **Slug:** `/sell-rental-property-kansas-city/`
- **SEO title:** `Sell Your Rental Property Kansas City | Tenants OK` (50)
- **Meta description:** `Done being a landlord? We buy rental houses in Kansas City and Independence with or without tenants. No repairs, no evictions needed, fast cash closing.` (152)
- **Content ideas:** problem tenants, deferred maintenance, out-of-state owners, portfolio sales, tenant-occupied sales.

### House needs repairs
- **Slug:** `/sell-house-as-is-kansas-city/`
- **SEO title:** `Sell Your House As-Is in Kansas City | Any Condition` (52)
- **Meta description:** `Sell your Kansas City house as-is: foundation issues, roof leaks, fire or water damage, code violations, or outdated. No repairs needed. Get an offer.` (150)
- **Content ideas:** common KC-area problems (foundation/basement water in older homes, old roofs, outdated electrical, hoarder houses), why repairs before selling often don't pay back.

---

## Internal linking (do this once pages exist)
- Home → Sell Your House (main button), each location page, each situation page.
- Each location/situation page → Sell Your House (or has the form itself) and back to Home.
- Footer: list the location pages under "Areas We Serve."
- Use descriptive link text ("sell an inherited house in Kansas City"), not "click here."
