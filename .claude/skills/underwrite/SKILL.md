---
name: underwrite
description: >
  60-second storage deal underwriting from a broker OM. Use whenever Nick gives a
  property OM (PDF upload, Drive folder, or link) or says anything like: underwrite
  this deal, run this OM, analyze this facility, deep dive this property, what's this
  storage deal worth, run the deal analyzer, or drops an OM with no other instruction.
  Copies the master Storage Deal Analyzer sheet (never edits the master), extracts the
  OM, researches market stats / rate comps / competition / flood / saturation, fills
  the copy, and delivers a deal memo with a verdict.
---

# Underwrite a storage deal from an OM

You are underwriting self-storage acquisitions for Nick (Turning Point Storage,
nickzachgo@gmail.com). The deliverables of every run:

1. A filled **copy** of the master Storage Deal Analyzer in the deal's Drive folder.
2. A **deep-dive deal memo** (published Artifact page + TLDR in chat) covering the
   numbers, the BS check, market statistics, rate comps, competition, flood, and a
   recommended offer strategy.

## Hard rules

- **NEVER write to the master spreadsheet** `1RvtnZsQLgmFaQVlKI5HGJy-uLjjayMYQgDMVJvowiW0`
  ("Storage Deal Analyzer (Underwriting + OM Check + Flood/Market + Offer Builder)").
  Every deal gets its own copy. If you ever notice a write targeting the master, stop,
  tell Nick, and do not try to "fix it quietly".
- **Read before you write.** Before writing any range, fetch it with
  `mcp__Google_Sheets__get_spreadsheet` using `ranges` + `includeGridData: true` and
  check `userEnteredValue` for formulas. Never overwrite a cell containing a formula —
  the workbook wires tabs together and a clobbered formula silently breaks the
  Scorecard. The cell map below lists known-safe input cells, but verify on the copy
  you just made (the workbook evolves).
- **Underwrite in-place, not pro forma.** OM pro forma numbers go in the OM Check tab
  for comparison only. Our NOI comes from the rent roll / unit mix at actual rates with
  our expense model.
- **Every market number gets a source.** Put the source in the memo (and sheet notes
  columns where they exist). If you can't verify something, say so — a dash with a note
  beats a guess.
- Leave `Underwriting!D3` (Contracted Purchase Price — "Don't Touch") alone unless Nick
  says the deal is under contract.

## Speed: the two-phase promise

**Phase 1 — 60-second triage (no web research needed).** As soon as the OM is read:
copy the sheet, fill UnitMix + OM Check + Underwriting inputs, read back the computed
BS-check and value-at-target-cap, and give Nick a short triage verdict in chat
(ask vs. our value, cap-rate math honest or not, expense ratio plausible or not,
DSCR at ask). Do this before and while research agents run — don't make Phase 1 wait
on anything from Phase 2.

**Phase 2 — market deep dive (runs in parallel).** Launch ALL research agents in one
message the moment you know the address — before you start writing cells. Then fill
Flood & Market, RateComps, Saturation as results land, and finish with the memo.

Parallel agents to launch simultaneously (Agent tool, one message, run in background):

1. **Rate comps + competition** — "Find every self-storage facility within ~10 miles of
   {address} (expand to 15-20 mi for rural). For each: name, operator type (REIT /
   regional / mom-and-pop), distance, and current advertised monthly street rates for
   5x10, 10x10, 10x15, 10x20 drive-up AND climate-controlled where offered. Check the
   facility's own website rates, SpareFoot listings, and Google Maps. Note occupancy
   signals (waitlists, 'only X left', move-in specials), security/gate/office features,
   and reviews. Return a table + per-facility notes."
2. **Demographics + saturation** — "For {address}: population, annual population growth
   %, median & average household income, poverty rate, median age, % renter-occupied —
   at 1, 3, and 5-mile radii where findable (city/ZIP/county from Census QuickFacts,
   data.census.gov, worldpopulationreview as fallback; label the geography used). Also:
   count of existing storage facilities and estimated total NRSF at each radius, and any
   new/planned storage developments or permits (search '{county} self storage permit',
   '{city} storage development', recent news). Compute SF/capita."
3. **Flood + site risk** — "For EACH of these addresses: {every address}: FEMA flood
   zone per parcel (see the FEMA flood check section — run the NFHL API first), FIRM
   panel # and effective date, whether it's in a Special Flood Hazard Area; note
   dam/levee/drainage issues, levee presence, river gauge flood history for {city}.
   Also note anything else site-relevant that turns up: crime reputation, major
   employer news, highway projects."

If an agent comes back thin, do one targeted follow-up search yourself rather than
re-running the whole agent.

## FEMA flood check — MANDATORY, every address, every deal

Never accept the OM's flood claim ("Flood Zone: No" is a sales line, not a
determination). Every deal gets a parcel-level check for EVERY property address —
portfolios included: enumerate all addresses/parcels from the OM and county parcel
numbers, and check each one. A deal is not fully underwritten until every address has
a flood status of VERIFIED-IN, VERIFIED-OUT, or explicitly UNVERIFIED.

**Primary method — FEMA NFHL API (run this first, per address):**
1. Geocode: `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address={URL-encoded address}&benchmark=Public_AR_Current&format=json`
   → take `result.addressMatches[0].coordinates` (x = lon, y = lat). Fallback geocoder:
   `https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1`.
2. Flood zone: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry={lon},{lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE&returnGeometry=false&f=json`
   (layer 28 = Flood Hazard Zones). `SFHA_TF = "T"` means Special Flood Hazard Area
   (zones A/AE/AO/AH/VE). Zone X with subtype "0.2 PCT ANNUAL CHANCE" = moderate risk.
   FIRM panel: same query against layer 3 (FIRM Panels) with outFields
   `FIRM_PAN,EFF_DATE`. An empty `features` array can mean unmapped area — query layer
   0 (NFHL Availability) before concluding "not in a flood zone".
3. Run the point query at the building locations, not just the mailing point: for a
   large parcel, also test 2-3 offsets (~50-100m toward the water side). A parcel can
   straddle zones; the structures decide insurance.

**When the network blocks those hosts** (CONNECT 403 through the proxy — this
environment allowlists domains): tell Nick which hosts to add under the environment's
Network access settings (Edit environment → Allowed domains):
`geocoding.geo.census.gov`, `hazards.fema.gov`, and optionally
`nominatim.openstreetmap.org`, `msc.fema.gov` — docs:
https://code.claude.com/docs/en/cloud-environments#network-access. Then fall back,
per address, to web-search evidence (county floodplain pages, SafeRate/LoopNet parcel
flood fields, NWS gauge history, local flood news) and classify every address
conservatively. A search-based call is never VERIFIED: mark it "likely X / likely AE
(unverified)" with the evidence.

**Recording the result (all of it, every deal):**
- Flood & Market tab: B11 = per-deal summary naming each address and its zone/status;
  B12 = FIRM panel(s) + effective date(s); B17 = flood premium estimate if any parcel
  is in/near SFHA (and add that premium to the Underwriting insurance line, saying so).
- The memo gets a per-address flood table: address | zone | SFHA? | source | status.
- Any SFHA parcel, or any UNVERIFIED parcel, is a red flag in the memo even if the
  sheet's Scorecard row shows a pass (the Scorecard can only see one cell): say
  explicitly "flood status is not clear for {addresses} — elevation certificates and
  a flood zone determination cert (~$20/parcel) in DD, plus NFIP claims history and
  seller loss runs."
- River/creek-adjacent markets (names like "Riverside" count as a hint, not a joke):
  also check levee presence and the local gauge's historic crests vs flood stage.

## Step-by-step

### 0. Intake
Accept any of: an uploaded OM PDF; a Drive folder/file (use `mcp__Google_Drive__read_file_content`
on PDFs — it handles `application/pdf`); a Dropbox file; or a pasted link (web-fetch).
Read the ENTIRE OM including rent roll, financials, and footnotes. Capture OM page
numbers as you go — they feed the OM Check notes column. If there is a separate rent
roll or T12 file in the deal folder, read it too; it beats the OM summary when they
disagree.

### 1. Deal folder + copy
- Deals root folder: `1Iii4LxXPMfbYPWH-42CW0JiuMTNjerCc`. Existing convention:
  one folder per deal named like `Stover Mini Storage  - Stover MO`.
- If the OM came from an existing deal folder, use that folder. Otherwise create
  `{Facility Name} - {City} {ST}` under the root (`mcp__Google_Drive__create_file`
  with mimeType `application/vnd.google-apps.folder`; if folder creation fails, just
  put the copy under the root and say so).
- `mcp__Google_Drive__copy_file` the master into the deal folder, titled
  `{Facility Name} - Deal Analyzer`. All writes go to this new spreadsheet ID.

### 2. Fill from the OM (Phase 1)

Use `mcp__Google_Sheets__update_values` with `valueInputOption: USER_ENTERED`.
Independent ranges can be written with parallel calls.

**UnitMix tab** (source of truth for name/NRSF/income — other tabs reference it):
- `E2` Facility Name, `E3` Address.
- Unit mix table rows **9–48**: `B` Type (dropdown — read the data validation options
  from the copy first and match exactly; categories are Drive Up/Enclosed, Climate
  Controlled, Flex/Warehouse, Office/Retail, House, Connex/Containers, Covered
  Parking), `C` Size (e.g. `10x10`), `D` Quantity, `E` Std. monthly rate.
- SF breakdown same rows: `H` Width ft, `I` Length ft (SF/unit and totals are
  formulas). `M` is the "Count in NRSF?" checkbox — check whether it's formula-driven
  on the copy; if it's a plain input, set TRUE for everything except Covered Parking.
- Read back `E4` (total units) and `L4` (total NRSF) and reconcile against the OM's
  stated totals. A mismatch is a finding, not an error to hide — it often means the
  rent roll and OM disagree. Note it in the memo and OM Check.
- Use rent-roll ACTUAL rates when available; OM "street rates" go to RateComps
  comparison instead.

**OM Check tab** — column `B`, rows 4–23 (leave blank what the OM doesn't give —
a missing number is a flag by itself). Put OM page numbers / notes in column `C`:
- B4 asking price · B5 net rentable SF · B6 total units · B7 physical occupancy % ·
  B8 economic occupancy % · B9 gross potential rent (annual) · B10 rental income
  actually collected (T12) · B11 other income · B12 total operating expenses ·
  B13 NOI (OM) · B14 cap rate OM states · B15 management fee in expenses ($) ·
  B16 property tax in expenses ($) · B17 insurance in expenses ($) · B18 on-site
  payroll ($) · B19 pro forma/stabilized NOI · B20 months of actual financials ·
  B21 avg in-place rent $/SF/mo · B23 our target cap (default 7.5% — adjust per
  market and say why).

**Underwriting tab** inputs:
- D6 purchase price (use asking price until an offer is chosen) · D7 immediate capex ·
  D8 finance capex? TRUE/FALSE · C10 down payment % (default 35%) · C11 closing costs %
  · D16 interest rate · D17 amortization yrs · D18 interest-only? — current defaults
  6.70% / 25 / FALSE; keep unless Nick gives deal-specific terms.
- Second mortgage (only if seller carry is already on the table): D23 amount, C24 down %,
  D28 rate, D29 amort, D30 IO.
- H48 tenant insurance %, I49 ancillary income %, I50 vacancy % (default 22% — justify
  any change from market occupancy evidence).
- Expense model (rows ~56–70: rates in col `I`, fixed $ in col `J` — taxes 1.25%,
  insurance $0.30/SF, R&M $0.20/SF, mgmt 6%, etc.): these are OUR takeover defaults.
  Usually leave them; override only with deal-specific evidence (e.g., the county's
  actual millage on a reassessed-at-purchase-price basis — check the county assessor)
  and note the override in the memo.
- Capex worksheet (rows ~80–92) if the OM/photos show deferred maintenance.

**Phase 1 read-back + triage.** Read `Scorecard!A1:F25`, `'OM Check'!A26:H50`, and the
Underwriting NOI/DSCR block. Give Nick the triage verdict in chat now: our NOI vs OM
NOI, value at target cap vs ask, DSCR at ask, cap-math honesty, expense ratio, and the
red flags the sheet computed.

### 3. Fill market research (Phase 2, as agents return)

**Flood & Market tab** (yellow inputs, col B/C/D = 1/3/5 mile):
- B4 address · B5 city · B6 state · B7 ZIP · B8 county.
- B11 FEMA flood zone · B12 FIRM panel/date · B17 flood insurance quote if in SFHA
  (and if in SFHA, add flood premium to the Underwriting insurance line and say so).
- Rows 21–29 demographics (population, growth %, median HHI, avg HHI, poverty, median
  age, renter %), rows 28–29 competitor count & NRSF, row 32 new/planned NRSF,
  rows 37–38 market 10x10 drive-up and climate rents. Rows 30/33/34 (SF per capita,
  future SF/capita, verdicts) are formulas — don't touch.
- When only ZIP/city-level data exists, use it for the closest radius and note the
  geography in the memo.

**RateComps tab**: subject's columns B/C/D are autofilled — do not touch. Competitor
names in `E3:L3`, miles away in `E4:L4`, and each competitor's rate for the matching
type/size row in its column (rows 6–45). Pick the 8 most relevant competitors (closest
+ largest). Notes per facility go in the notes area below row 47. Year 1–4 rate
changes (cols P–S): propose from the comp spread — if subject's in-place rates are
below market average, Year 1 can capture part of the gap; verify which cells are
inputs before writing.

**Saturation tab**: check which cells are formula-fed from Flood & Market before
writing; fill only true inputs (per-size market rates rows 14–19 drive-up and 21–26
climate for 1/3/5 mile; 10x10 rows may already be wired).

### 4. Verify
- Re-read Scorecard, OM Check section 2/3, Underwriting DSCR/cash flow, Offer Builder
  results. Any `#DIV/0!` or `—` where you supplied data means a write went to the wrong
  cell — find it and fix it.
- Sanity-check the big four: NRSF matches OM ±5%, gross potential within ±10% of OM's
  (investigate beyond that), expense ratio 35–45%, SF/capita plausible (rural markets
  can legitimately exceed 10 — judge against occupancy evidence, not just the number).

### 5. The deal memo (the deep dive)

Publish an Artifact page (icon: `building`) titled `{Facility} Deal Memo` and give a
TLDR in chat with the link + the sheet link. Sections:

1. **Verdict box** — pursue / pursue-at-a-lower-number / pass, our max price, the
   one-sentence why.
2. **Snapshot** — ask, $/SF, NRSF, units, occupancy, OM NOI & cap vs OUR NOI & cap.
3. **The BS check** — every Section-2 flag with the math shown (cap-rate arithmetic,
   missing mgmt/payroll, taxes at reassessment, insurance reality, pro forma uplift,
   physical-vs-economic gap). Quote the OM page.
4. **Market statistics** — 1/3/5-mile demographics, growth, income, SF/capita with
   verdicts, new supply pipeline. Name every source.
5. **Rate comps & competition** — full comp table (facility, operator, distance, rates
   by size, climate vs drive-up), subject's in-place rates vs market avg/low/high,
   achievable upside, who the real competitor threats are and why.
6. **Flood & site risk**.
7. **Offer strategy** — read the Offer Builder/Offer Solver outputs and recommend 2–3
   structures (conventional at our value, seller-finance variants, hybrid), each with
   price, terms, DSCR, cash-on-cash, and what it gives the seller. Include the
   "their price, our terms" option when ask > our value.
8. **Open questions for the broker** — the ask-list (T12, rent roll, tax bill,
   insurance dec page, delinquency report, etc.) driven by what the OM omitted.

Never soften findings. If the deal fails the Scorecard, the memo says so and pivots to
the terms that could still make it work (that's the StorageLife rule: a fail is a
reason to change the TERMS, not always to walk).

## Reference: master workbook tabs

Scorecard (auto) · OM Check (inputs B4:B23) · Flood & Market (inputs) · Offer Builder
(mostly auto; B6 target DSCR 1.25, B7 min CoC 8%) · Offer Solver (auto) · Bank+Seller
Split · DD Checklist · UnitMix (PRIMARY input) · Underwriting (inputs + our expense
model) · SF1/SF2 (seller-finance scenario copies of Underwriting) · RateComps ·
Saturation · Property Summary (display) · LOI Prep / LOI · Investor Return Estimates.
