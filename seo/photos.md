# Photos: website and Google Business Profile

Your site is **WordPress + Elementor** (not Hostinger Website Builder). Wherever the other SEO files
say "Hostinger Website Builder", use WP Admin → Pages → Edit with Elementor instead.

## What I found in your media library (wp-content/uploads)
- **Oversized originals:** these are huge for a web page and slow mobile loading, which Google uses as a ranking signal:
  - `pexels-photo-8469931.jpeg` (3.5 MB)
  - `Wholesaling-Real-Estate-business.jpg` (2.9 MB)
  - `pexels-photo-7031405.jpeg` (2.0 MB)
  - `modern-house-for-sale-.jpg` (1.9 MB)
- **About 30 plumbing photos and "Plumblend" logos** left over from the template kit (plumber-*, wrench-*, sink-*,
  `Logo_Plumblend_*`, plus Visa/Mastercard/PayPal icons). If any of them appear on a page, they confuse Google
  about what the business does. Remove them from pages, then delete them from Media.
- **Meaningless file names:** `IMG_6684.jpg`, `WhatsApp-Image-2024-09-13...jpeg`, `57eb7abd...jpg`.
- **Stock photos** (pexels-*): fine to have, but real photos of your houses and team earn more trust and convert better.

## Already handled automatically by the plugin
Every image that has no alt text now gets a descriptive one, e.g. "House needing major repairs, bought as-is by
Turning Point Homes". Alt text you've written yourself is never changed.

## Do this in WP Admin (about 10 minutes)
1. **LiteSpeed Cache → Image Optimization:**
   - Click **Gain API Key / Send Optimization Request**.
   - Turn on **Image WebP Replacement**. This compresses every image and serves WebP, with no visual change.
2. **LiteSpeed Cache → Page Optimization → Media:** turn on **Lazy Load Images**.
3. Open each page in Elementor and replace any plumbing or stock image with a real photo (list below).

## Real photos to take (they work for both the website and Google)
Shoot on a phone in landscape, in daylight. Before uploading, rename each file to describe it, e.g.
`we-buy-houses-independence-mo-before.jpg`. Don't stuff the name with keywords.

| Photo | Website use | Google Business category |
|---|---|---|
| You (Nicholas) in front of a house you bought, smiling | About page, homepage trust section | Team |
| You shaking hands or handing over keys at closing (ask the seller's permission) | Sell Your House page, Thank-you page | At work |
| Before/after pairs of 3–5 properties | "Recent houses we bought" section | Exterior / Interior |
| Your vehicle or yard sign, if you have one | Footer / About | Exterior |
| Logo (square, 720×720) | Header | Logo |
| Cover image (a clean house photo with no text, 1080×608) | n/a | Cover |

## Google Business Profile photos
I can't reach your Google Business Profile from here, so add these yourself in Google Maps (or search "Turning Point Homes" while signed in) → **Edit profile → Photos**:
- Upload the **logo** and **cover** first.
- Then add 10+ real photos from the table above.
- Add **2–3 new photos every week**. Profiles with fresh photos get noticeably more clicks and calls.
- **No** stock photos, text-heavy graphics, or other businesses' photos (Google may remove them).
- Photo tips and post drafts are in `google-business-profile.md`.
