# Contributing to MedLink

MedLink helps patients in Mauritania and the wider region check the medicines they buy. Read the [README](README.md) first: it explains what a scan does and where the data comes from. This guide covers how to work on the code and data without making the app less trustworthy.

## Where help matters most

1. **National medicine registries.** Mauritania (DPL), Morocco (AMMPS), Algeria (MIPH), Tunisia (DPM), Senegal (ARP), Côte d'Ivoire (AIRP)… None has an API. If you can get an official list of authorised medicines with barcodes as a spreadsheet, that's the most valuable contribution there is. See [Adding a country](#adding-a-country).
2. **WHO batch numbers.** Many WHO alerts list their batches only in a PDF annex. Copying them into `scripts/registry/who-alerts.overrides.json` turns "WHO has reported fakes of this brand" into "this exact batch is in a WHO alert".
3. **Recall feeds.** ANSM batch withdrawals, AMMPS notices, NAFDAC alerts, into `src/data/alerts/recalls.json` — or a script that builds that file automatically.
4. **Real boxes.** Scan medicines bought in the region and report what MedLink got wrong (see [Reporting a scan problem](#reporting-a-scan-problem)).
5. **The app itself:** UI, accessibility, Arabic right-to-left layout, behaviour on slow or no connection.

## Setup

You need Node 20.19 or newer, npm, and Expo Go for SDK 54.

```bash
npm install
npx expo start -c
npm test
```

## How the scan engine is organised

Everything a scan decides lives in `src/scan/`, as plain TypeScript with no UI. That keeps it testable:

| File | Responsibility |
|---|---|
| `parseCode.ts` | Raw barcode → GTIN, batch, expiry, serial, national codes, structural issues |
| `gs1Prefixes.ts` | GS1 prefix → issuing country |
| `registries.ts` | Lookup in bundled national registries (`src/data/registries/`) |
| `alerts.ts` | Match against WHO alerts (`src/data/alerts/who.json`) |
| `cloneCheck.ts` | Record/check serial numbers in Firestore |
| `assess.ts` | Combine everything into a verdict and a list of findings |
| `inn.ts` | French/English active-ingredient names, allergy matching |
| `index.ts` | `scanMedication()`: runs the whole pipeline |

The screen (`src/screens/BarcodeScanner.tsx`) calls `scanMedication()` and renders the report with `src/components/ScanReportView.tsx`.

## Rules for safety logic

These are the rules that keep the scanner honest. A pull request that touches `src/scan/` should follow all of them.

- **Never claim a product is authentic.** The best verdict is "Registered product — no alerts found". No consumer-side check can prove authenticity, and the wording must never suggest it can.
- **Match severity to the evidence:**
  - `critical` (→ "Do not use"): only for something certain about *this box*. Expired, recalled, or the batch appears in an alert.
  - `high` (→ "Check with a pharmacist"): a strong but not conclusive red flag.
  - `medium` and `info`: worth knowing, but they never change the verdict.
- **"Not in the register" only counts for a complete list.** Only mark a registry `exhaustive` when it is the official, complete list. A partial list would make every missing product look suspicious.
- **Avoid false alarms.** A shared active ingredient alone must never trigger a WHO match, otherwise every paracetamol box would be flagged because of one contaminated syrup. False alarms teach people to ignore warnings.
- **Every finding needs a source.** If a rule comes from a regulation, alert or dataset, link it (the `url` on a signal) or explain it in the PR.
- **Test with real codes.** Add cases to `__tests__/scan.engine.test.ts` using real CIP13/GTIN values from the bundled data, plus the false-positive case you're guarding against.

## Adding a country

1. Get the official list (regulator website, ministry publication, or a direct request) and export it as CSV with at least a barcode column and a product-name column.
2. Import it:
   ```bash
   npm run registry:csv -- MR mauritania.csv --source "DPL — liste des médicaments autorisés" --url <source page>
   ```
   Add `--exhaustive` only if it's the complete official list.
3. Scan a few boxes from that country, or add test cases with real codes from the list.
4. In the PR, say where the list came from, its date, and whether it's complete.

Full details, including the WHO overrides and recall file formats, are in [scripts/registry/README.md](scripts/registry/README.md).

## Translations

Every user-facing string goes through i18next and must exist in **all three** files: `src/i18n/locales/en.ts`, `fr.ts` and `ar.ts`.

- Never hard-code text in a component. Use `t('section.key', 'English fallback')`.
- Check new screens in Arabic: text alignment and icon direction should follow right-to-left.
- The locale files use Windows (CRLF) line endings. Keep them that way, or scripts that edit them will silently miss.
- `__tests__/scan.engine.test.ts` fails if a scan verdict or finding is missing in any language.

## UI conventions

The design system is in `src/theme.ts`. Use its tokens instead of hard-coded values:

- colours from `colors` (primary `#0066CC`; status colours only for status), background `#FAFAFA`, white cards
- radius: buttons 10 (`radius.lg`), cards 12 (`radius.xl`), banners 16 (`radius.xxl`), chips/pills 20
- buttons 44px high; screen side padding 20px; spacing in multiples of 4
- Ionicons only, never emoji in the interface
- every loading state gets a skeleton that matches the real layout's size

## Tests

```bash
npm test                                  # everything
npx jest __tests__/scan.engine.test.ts    # scan engine only
npx tsc --noEmit                          # type-check
```

These suites already fail on `master` for reasons unrelated to most changes. Don't let them hide new failures:

- `barcode-scanner-analysis.test.ts`: TypeScript syntax error in the test file
- `fixtureDriven.verifyScanned.test.ts`: `jest.mock` factory references an out-of-scope variable
- `verification.telemetry.test.ts`: `expo-constants` can't load under plain Jest

Fixing any of them is a welcome contribution in its own right.

## Commits and pull requests

Commit messages follow the style already in the history: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, optionally with a scope (`feat(scan): …`).

A pull request should say:

- what problem it solves, and for whom
- what changed
- how you checked it: tests, device, real boxes scanned
- for data changes: the source, its date, and whether it's complete
- anything uncertain, or anything that could cause a false alarm or a missed warning

Keep pull requests focused. A data import and a UI redesign belong in separate PRs.

## Reporting a scan problem

Wrong verdicts are the most useful bug reports we get. Include:

- a photo of the box (front and the barcode side) and the country where it was bought
- what MedLink said, and what you expected
- the raw scanned code, if you can copy it from the scan history
- whether you were online

Don't include photos of prescriptions, patient names, or anything else that identifies a person.

## Privacy and data

- Never put real patient data in fixtures, screenshots or issues.
- Serial-number tracking stores only an anonymous per-user hash. Keep it that way.
- Respect each data source's reuse terms, and note them when you add a source.

## Conduct

Be direct, be kind, and stay focused on the patient at the other end of the scan.
