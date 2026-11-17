# MedLink Mobile

MedLink is a React Native mobile app focused on medication safety, counterfeit detection, and patient-aware drug verification. The project is meant to help people verify what they are scanning, understand recall and labeling data, and cross-check medication risk against the patient profile they maintain in the app.

This is not a clinical system and not a replacement for professional medical advice. It is a safety and verification tool intended to support informed decisions, reduce avoidable medication errors, and surface known risks around counterfeit goods, recalls, allergies, and interactions.

## Why this project exists

Medication safety problems are often caused by a combination of:

- products that are recalled, expired, or counterfeit,
- the wrong drug being scanned or substituted,
- patient allergies or medical conditions being missed,
- duplicate medication use, and
- poor visibility into medication interactions.

MedLink attempts to bring a few of those checks into one workflow:

1. scan a drug code,
2. look up product information and recall state,
3. compare against the patient profile,
4. flag important risks, and
5. guide the user toward a safer decision.

## What is implemented today

### Core product features

- barcode and GS1/Datamatrix scanning support,
- EAN/UPC/NDC-style lookup flows,
- MedLink authenticity QR support,
- recall and labeling lookups using public drug data sources,
- local recall data checks for offline-first safety screening,
- patient profile data for allergies, medications, medical conditions, and reminders,
- dashboard summary and medication management views,
- clinic and facility lookup screens,
- reminder scheduling and medication management UX,
- multilingual interface support.

### Safety and verification logic

The app includes logic for:

- recall screening,
- expiry checks from GS1 DataMatrix fields,
- counterfeit suspicion checks for known MedLink authenticity codes,
- medical label and drug lookup fallback behavior,
- user profile comparisons against allergy and condition data,
- duplicate medication detection,
- medication safety assessment flows for known interactions and contraindications.

## Current architecture

MedLink is structured as a mobile app with a number of supporting services and data sources.

### Mobile app

The app is a React Native / Expo project using TypeScript.

Key areas:

- App shell and navigation: [App.tsx](App.tsx)
- Screens: [src/screens](src/screens)
- Safety and verification logic: [src/utils](src/utils)
- Barcode parsing and assessment: [src/scan](src/scan)
- Firebase/auth integration: [src/lib](src/lib)
- Notifications and reminders: [src/notifications](src/notifications)
- Theme and UI helpers: [src/theme.ts](src/theme.ts)

### Supporting services and data sources

- OpenFDA and regional recall sources for product data and recalls,
- RxNorm-style safety checks for interactions and cross-references,
- local recall datasets for offline checks,
- a scraper/fallback data path used when public sources are incomplete,
- optional FastAPI or scraper service support under [autoscrape](autoscrape) and [autoscrape_fastapi](autoscrape_fastapi).

## Project layout

```text
.
├── App.tsx
├── package.json
├── README.md
├── CONTRIBUTING.md
├── START_HERE.md
├── QUICK_START.md
├── DRUG_SAFETY_SYSTEM.md
├── DRUG_VERIFICATION_AUDIT.md
├── IMPLEMENTATION_SUMMARY.md
├── TROUBLESHOOTING.md
├── src/
│   ├── components/
│   ├── core/
│   ├── hooks/
│   ├── i18n/
│   ├── lib/
│   ├── notifications/
│   ├── scan/
│   ├── screens/
│   ├── services/
│   ├── theme.ts
│   └── utils/
├── autoscrape/
├── server/
├── scripts/
├── docs/
├── __tests__/
├── app.json
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js 18+ recommended
- npm
- Expo / React Native toolchain
- optional: Python for the scraper/support service

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm start
```

### Run the app with the scraper service

```bash
npm run start:full
```

The project also includes some utility scripts for scraper startup and registry/data prep.

## Quick feature checks

Some parts of the app are still experimental and should be treated as guidance, not final clinical-grade decisions.

### Example flows supported

- scan a product barcode and check for recall or labeling data,
- identify a MedLink-issued authenticity QR code,
- query a product by NDC or GTIN-like identifier,
- check expiry details embedded in GS1 DataMatrix information,
- compare the medication list and patient profile for unsafe combinations,
- surface alerts through the UI and reminder flow.

## Roadmap and current status

### Working areas

- core barcode decoding and verification flows,
- basic patient profile persistence and medication awareness,
- recall / label lookup integration,
- reminder scheduling and dashboard views,
- architecture for safety-checking and verification results.

### Still in progress or not production-safe yet

These are the principal gaps to acknowledge honestly:

- no guaranteed clinical validation or medical-grade safety audit,
- some risk logic depends on external APIs and public datasets,
- product data quality varies by country, source, and format,
- interaction detection is limited by source coverage and availability,
- cross-border product mapping can be incomplete,
- the app still needs stronger validation for edge cases and uncommon code formats,
- legal/privacy review, consent flows, and compliance checks are still required before broad public use.

## Known limitations

This project should be viewed as an early-to-mid-stage safety tooling project rather than a regulated medical product.

### Important limitations

- public data sources may not cover all medications or all markets,
- search results can be incomplete or outdated,
- many safety checks are heuristic or dataset-dependent,
- product substitution and counterfeit detection are probabilistic rather than absolute,
- package-level identification does not equal a full patient assessment,
- medication safety can depend on dose, timing, patient-specific factors, and clinician context,
- some conditions, allergies, and contraindications may not be represented in the data sources.

### Safety disclaimer

MedLink is intended for general reference only. It should not be treated as a medical diagnosis, prescribing tool, or emergency triage system. Users should consult a licensed healthcare professional, pharmacist, or physician before making treatment decisions.

## Ongoing project issues and areas to improve

The main follow-up work is to improve reliability and safety rather than just add more features.

### High-priority work

- improve validation and normalization for barcode edge cases,
- make external lookup failure modes more predictable and user-friendly,
- add stronger caching, retry/backoff, and timeout management,
- formalize alert severity and confidence levels,
- improve profile-to-medication matching quality,
- reduce false positives and false negatives in risk detection,
- add better offline fallback logic,
- document data provenance and source confidence clearly in UI.

### Additional areas worth contribution

- better medication interaction logic,
- improved allergy matching and condition mapping,
- recall data coverage across more regions,
- support for more international packaging formats,
- accessibility improvements,
- error handling and telemetry,
- test coverage around scan flows and profile comparisons,
- documentation updates and onboarding improvements.

## Testing

The repository already includes Jest tests and verification-oriented checks. Run the project tests with:

```bash
npm test
```

If you are working on scanner logic or verification flows, it is worth running the targeted tests before submitting a pull request.

## Contributing

We want more contributors on this project. The app is big enough that multiple people can work in parallel across mobile UI, safety logic, data pipelines, testing, and documentation.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution guide, workflow, and project standards.

## Documentation index

- [START_HERE.md](START_HERE.md) – quick start and setup notes
- [QUICK_START.md](QUICK_START.md) – operational overview
- [DRUG_SAFETY_SYSTEM.md](DRUG_SAFETY_SYSTEM.md) – implementation and safety system notes
- [DRUG_VERIFICATION_AUDIT.md](DRUG_VERIFICATION_AUDIT.md) – audit of current capabilities and gaps
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) – implementation-focused summary
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) – issues and problem solving

## License

This project declares the 0BSD license in [package.json](package.json), but contributors should still review the repository state and legal use constraints before public deployment, especially for healthcare-facing products.

## Final note

This project has real potential for impact, but it needs disciplined contributors who understand the difference between a useful prototype and a trustworthy healthcare product. If you contribute, focus on correctness, safety, transparency, and measurable improvements over time.

If you are working on this repo, treat the safety logic and the patient data layer as high-risk areas. That is where good engineering discipline matters most.
