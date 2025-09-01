End-to-end barcode → data → UI audit checklist
===============================================

Purpose
-------
This document is an ordered, actionable audit checklist for implementing a robust barcode scan pipeline in the MedLinkMobile app: Camera & scan layer → Normalization → Lookup → UI & state → Telemetry.

Work through this in order — mark each box before you proceed to the next section.

1) Camera & scan layer
-----------------------
- [ ] Validate supported symbologies
  - Required: EAN-13 / UPC-A (retail meds), GS1 DataMatrix (boxes with AIs like 01/10/17).
  - Acceptance: scanner configuration explicitly enables only these symbologies and rejects others.

- [ ] Check digit logic for EAN-13
  - Acceptance: local validation via validateEAN13CheckDigit(gtin13) must match examples from GS1.

- [ ] Permission flow
  - First run: request camera permission and explain usage.
  - Denied: show inline guidance with action to open app settings.
  - Restricted (platform-specific): show guidance with alternative workflows.
  - UI hints: ambient light, distance, angle.

- [ ] Performance
  - Focus lock (auto-focus), minimum FPS target 24+.
  - Show scan box overlay and animate a 'finder' line.
  - Haptic feedback on successful decode.

Notes / Implementation tips
- Use native camera APIs (or react-native-vision-camera / MLKit) with explicit symbology lists.
- For DataMatrix GS1 payloads, scan raw payload (not just numeric) so AIs can be parsed.

2) Normalization layer (run on every scan)
-----------------------------------------
- [ ] validateCheckDigit() for EAN-13
  - Must return boolean and be deterministic, implemented locally.

- [ ] Normalize barcode → canonical GTIN string
  - Normalize UPC-A (12 digits) to GTIN-13 by prepending '0'.
  - Capture type: EAN, UPC, DataMatrix.

- [ ] If DataMatrix, parse GS1 AIs (01 GTIN, 17 expiry, 10 lot)
  - Support both parentheses (human-readable) and FNC1 (GS1 separator ASCII 29) formats.

Contracts (functions to implement)
- validateEAN13CheckDigit(gtin13: string): boolean
- normalizeBarcode(raw: string): { gtin?: string; type: 'EAN'|'UPC'|'DATAMATRIX'|'UNKNOWN'; raw: string }
- parseGs1AIs(payload: string): Record<string,string>

3) Lookup layer (API + scrapers)
--------------------------------
Attempt these in order; cache each step for 24 hours with cache key = normalized GTIN + source

- [ ] GS1 Resolver (Digital Link) — try first if payload includes a Digital Link or resolver available.
  - If Digital Link present, resolve to brand resources. (Note: may require API key or paid access)

- [ ] Drug knowledge mapping
  - Map brand/generic → RxNorm RxCUI via server-side findRxcuiByString
  - Optionally use RxClass to get ATC class.

- [ ] Label & safety
  - Fetch structured labeling text via OpenFDA Drug Label APIs for adverse reactions, contraindications, warnings.

- [ ] Regional specifics
  - France/EU: CIP13 prefixed with 34009… will scan as EAN-13 — map with name→RxNorm/ATC where necessary.

- [ ] Fallback product metadata (non-medical trust)
  - UPC/EAN public lookup (upcitemdb or similar) strictly for title/brand only; do not use for clinical decisions.

Error handling & backoffs
- Rate-limits and network failures: implement exponential backoff + jitter and surface localized errors in the UI with retry.

4) UI & state
------------
- [ ] Display fields
  - Product name, strength, form, active ingredient(s).
  - Lot and expiry (if present from GS1 AIs).
  - Source badges (GS1 / RxNorm / OpenFDA / UPC Lookup).
  - Confidence indicator: high (direct GS1 + RxNorm), low (UPC title only or fuzzy name match).

- [ ] Empty & error states
  - Barcode valid but no match: show clear empty state with 'Add manual product' CTA.
  - Network error: show retry button and offline mode.
  - Rate-limit: show polite message and backoff timer.

5) Telemetry
------------
Log privacy-safe telemetry (avoid PII)
- scan.type: EAN / UPC / DATAMATRIX
- decode_time_ms: integer
- lookup_latency_ms: { gs1?:n, rxcui?:n, openfda?:n, fallback?:n }
- cache_hit: boolean
- lookup_success: boolean
- error_codes: list
- user_dismiss_action: boolean

Examples / test cases
- EAN-13 valid: 4006381333931 (example from GS1) -> validate true
- UPC-A (12): 03600029145 -> normalize to 003600029145? (see contract — UPC-A 12 -> prepend 0 to make 13)
- GS1 DataMatrix sample: (01)09501101530002(17)240101(10)LOT123 -> parse 01,17,10

Files added to repo
- src/core/barcode.ts — lightweight normalization & GS1 AI parsing helpers (reference implementation)

Next steps to fully implement in app
- Wire camera component to normalization layer; run unit tests for check-digit & AI parsing.
- Implement lookup server endpoints for RxNorm mapping and caching policy.
- Add UI screens for scan results and empty/error flows.

References
- GS1 General Specifications, GS1 Digital Link, GS1 DataMatrix application identifiers
- RxNorm APIs (NLM) — findRxcuiByString
- OpenFDA Drug Label API
