# Turning Point Homes — Local SEO Action Plan

Goal: get investturningpoint.com and the Google Business Profile showing up when people near Independence and Kansas City search things like "sell my house fast Kansas City," "we buy houses Independence MO," and "cash home buyers near me" — and turn those visitors into form submissions.

Business info to use everywhere (exactly the same each time):

```
Turning Point Homes
25209 E Blue Mills Rd, Independence, MO 64058
YOUR_PHONE        <- replace with the real number everywhere
nick@investturningpoint.com
https://investturningpoint.com
```

## Files in this folder

| File | What it's for |
|---|---|
| `README.md` | This plan — start here |
| `page-meta.md` | SEO titles, meta descriptions, and URL slugs for every page (existing + new) |
| `sell-your-house-copy.md` | Full rewritten copy for /sell-your-house/ (H1, steps, comparison table, FAQ, trust section) |
| `schema-embed.html` | Structured data (JSON-LD) to paste into Hostinger: business info + FAQ |
| `location-page-template.md` | A finished Independence page + a template for other cities |
| `google-business-profile.md` | Every recommended Google Business Profile change, post drafts, review scripts, citation checklist |

Anything marked **[FILL IN: ...]** needs a real fact from you, or should be deleted. Never publish a placeholder, and don't add made-up numbers, reviews, or testimonials.

---

## A note on Hostinger Website Builder menus

Hostinger updates its builder often, so menu names below may be slightly different on your screen. In general:
- **Page SEO settings:** left sidebar **Pages** (or "Pages and navigation") → hover the page → **three dots / gear icon** → **SEO settings** (sometimes under "Page settings"). Fields: page title (SEO title), description (meta description), page URL (slug), sometimes keywords (Google ignores the keywords field — skip it), and a toggle to hide the page from search engines.
- **Website-wide settings:** **Website settings** (gear icon in the left sidebar) → look for **SEO**, **Integrations**, and **Custom code** (adding code to the site's `<head>`). Google Analytics and sometimes Google Search Console can be connected under Integrations.
- **Image alt text:** click an image on the page → **Settings / Edit image** → field labeled something like **"Image description (alt text)."**
- **Embed code:** **Add elements** (the + button) → **Embed code** → paste HTML/script. Note: the Embed element may load inside an iframe on some Hostinger versions; if the Rich Results Test can't see your schema, use Custom code (head) instead (see step 6).
- **Sitemap:** Hostinger Website Builder generates one automatically, usually at `https://investturningpoint.com/sitemap.xml`. Open that URL in your browser to confirm.
- Hostinger also has a built-in **SEO checklist / AI SEO assistant** in some plans — useful for catching missing titles, but use the specific text in `page-meta.md` rather than its auto-generated text.

After any change, click **Update website / Publish** — nothing goes live until you do.

---

## Top 10 actions (do these first, in this order)

### 1. Fix the Google Business Profile address and setup  (biggest local impact)
- Go to business.google.com → your profile → **Edit profile → Location**. Set the address to exactly `25209 E Blue Mills Rd, Independence, MO 64058`.
- If sellers don't come to that address (it's a home), set it up as a **service-area business**: hide the address and add service areas (Independence, Kansas City, Blue Springs, Lee's Summit, Raytown, Grain Valley, etc.). Details: `google-business-profile.md` sections 1–2.
- Make sure the business name is just **Turning Point Homes** — no keywords.
- Expect possible re-verification. Make this change by itself first; do the rest of the GBP changes after it's approved.

### 2. Put the same NAP on the website
- Add the business name, address (or "Serving Independence & the Kansas City metro" if you'd rather keep the address private — but then do the same everywhere), phone YOUR_PHONE, and email to the **site footer** so it appears on every page. In Hostinger, edit the footer once and it applies site-wide.
- Make the phone number a clickable link (in the text editor, add a link with `tel:` followed by the number, e.g. `tel:+18165550123`).
- Contact page: same info, plus the form.

### 3. Set SEO title, meta description, and slug on every page
- Use `page-meta.md`. Start with Home and Sell Your House, then About, Contact, Thank You.
- **Thank You page:** turn on "hide from search results" (noindex) and keep it out of the menu.
- Each page gets exactly **one H1** heading (in Hostinger, select the main headline text and set its style to "Heading 1"). Check that Home and Sell Your House don't have two H1s.

### 4. Rewrite /sell-your-house/ with the new copy
- Use `sell-your-house-copy.md`. Keep the form near the top. Keep the URL `/sell-your-house/`.
- Fill in or delete every [FILL IN]. Replace YOUR_PHONE.
- Add alt text to every image (suggestions at the bottom of that file).

### 5. Set up Google Search Console and submit the sitemap
1. Go to search.google.com/search-console → **Add property**.
2. Choose **Domain** property (`investturningpoint.com`) if you can edit DNS. If your domain's DNS is managed at Hostinger, go to **hPanel → Domains → DNS / Nameservers** and add the TXT record Google gives you. (This verifies all versions of the site at once.)
   - Alternative: choose **URL prefix** (`https://investturningpoint.com/`) and the **HTML tag** method. Copy the `<meta name="google-site-verification" ...>` tag and paste it in Hostinger under **Website settings → Integrations** (there may be a dedicated Google Search Console field) or **Custom code → head**. Publish, then click Verify.
3. In Search Console → **Sitemaps** → enter `sitemap.xml` → Submit.
4. Use **URL Inspection** on `/sell-your-house/` and the home page → **Request indexing** after publishing big changes.
5. Also add the site to **Bing Webmaster Tools** (bing.com/webmasters) — you can import from Search Console in a couple of clicks. Bing also feeds some AI search tools.

### 6. Add the structured data (schema)
- Open `schema-embed.html`. Replace YOUR_PHONE. Replace the **approximate** coordinates with exact ones from Google Maps (right-click your property → click the coordinates to copy).
- Block 1 (business info) → site-wide: **Website settings → Custom code → head**, if your plan has it. Otherwise an Embed code element on the Home page.
- Block 2 (FAQ) → only on /sell-your-house/, via an Embed code element. The FAQ text on the page must match it.
- Test: search.google.com/test/rich-results with your page URL. Fix any errors it shows.

### 7. Finish the Google Business Profile
- Categories, description, services, hours, photos, website link (consider linking to /sell-your-house/), and first post. All the text is ready in `google-business-profile.md`.
- Verify category names in Google's dropdown — the doc explains which ones are uncertain.

### 8. Start getting real reviews
- Get your review link from GBP ("Ask for reviews").
- Ask every past and future seller using the scripts in `google-business-profile.md` section 10. No incentives, no only-asking-happy-people.
- Reply to every review.
- Once you have real reviews, add a couple to the website (with permission) where the [FILL IN] testimonial blocks are.

### 9. Build the Independence location page, then the others
- Start with `/we-buy-houses-independence-mo/` — copy from `location-page-template.md`, fill in the [FILL IN] parts.
- Then Kansas City MO, Blue Springs, Lee's Summit, Raytown, Grain Valley — one every week or two, each with genuinely different content. Titles/descriptions are in `page-meta.md`.
- Link them from the footer ("Areas We Serve") and from /sell-your-house/.
- In Hostinger: **Pages → Add page → Blank page** (or duplicate an existing page and fully rewrite it), set the slug in SEO settings, and decide whether to show it in the main menu (a dropdown "Areas We Serve" or footer-only both work).

### 10. Fix citations (NAP everywhere else)
- Claim/update Bing Places, Apple Business Connect, Facebook, Yelp, BBB, Nextdoor, and the data aggregators. Checklist in `google-business-profile.md` section 11.
- Search Google for old or wrong listings (old phone numbers, old addresses) and correct them.

---

## Next steps (after the top 10)

11. **Situation pages:** inherited/probate, foreclosure, divorce, tired landlord, house needs repairs. Titles and outlines in `page-meta.md`. These often convert better than city pages.
12. **Weekly GBP posts:** 8 weeks are drafted in `google-business-profile.md`. Post one per week.
13. **Page speed and mobile:** check the site at pagespeed.web.dev. Compress big images before uploading (aim for under ~300 KB each; tools like squoosh.app). Preview the mobile view in the Hostinger editor (phone icon at the top) — make sure the form and phone button are visible without much scrolling.
14. **Track leads:** connect Google Analytics 4 (Hostinger → Website settings → Integrations → Google Analytics). Mark a visit to /thank-you/ as a key event (conversion) so you know how many form submissions come from Google.
15. **Clickable call button on mobile:** add a "Call now" button linking to `tel:YOUR_PHONE` in the header or a sticky bar if Hostinger supports it.
16. **Local links:** join the Independence Chamber of Commerce (and/or Blue Springs Chamber), sponsor a local team or event, get listed by your title company or local REIA. One real local link beats dozens of directory links. Don't buy links.
17. **Blog/helpful content (optional):** short, genuinely helpful articles like "What to do with an inherited house in Jackson County" or "How property tax liens work when you sell in Missouri" (have legal/tax topics checked). Quality over quantity.
18. **Review monthly in Search Console:** Performance report → see which searches show your site. If a page shows up a lot but gets few clicks, improve its title/description.

---

## Keyword targets (for reference)

Main phrases (use naturally, don't repeat them over and over):
- sell my house fast Kansas City / Independence MO
- we buy houses Kansas City / Independence MO / [city] MO
- cash home buyers Kansas City / cash for houses Kansas City
- sell house as is Kansas City
- sell inherited house Kansas City / probate house Missouri
- sell house with foundation problems Kansas City
- avoid foreclosure Kansas City / sell house before foreclosure Missouri
- sell rental property with tenants Kansas City
- "near me" versions (these are driven mostly by the Google Business Profile and reviews, not by page text)

Competitive reality: the KC "we buy houses" market is crowded with national buyers (e.g., Opendoor-style iBuyers, HomeVestors/"We Buy Ugly Houses" franchises, and many local investors running paid ads). Your advantages are being genuinely local in Independence, real reviews, and real local content — focus there instead of trying to out-spend them on generic Kansas City terms. Independence and the eastern suburbs are the most realistic places to rank first.

---

## Things to avoid
- Keyword stuffing ("We buy houses Kansas City. Our Kansas City house buying company buys Kansas City houses...").
- Location pages that are copies with the city name swapped.
- Fake or incentivized reviews, stock-photo "testimonials," made-up stats ("500+ houses bought").
- Keywords in the Google Business Profile name.
- Multiple Google Business Profiles for cities where you have no real office.
- Changing URLs that already rank (like /sell-your-house/) without a redirect.
