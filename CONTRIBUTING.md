# Contributing to MedLink

Thanks for being interested in MedLink. This project is broad enough to benefit from many kinds of contributions: mobile UI, medication safety logic, barcode parsing, data quality improvement, backend services, tests, and documentation.

This repository is not just a demo app. It is a real-world-oriented medication verification system with safety implications, so contributions should be careful, well-tested, and honest about limitations.

## Project goals

MedLink aims to help people:

- verify medication packaging or scanned product information,
- detect obvious counterfeit or suspicious product signals,
- understand recall and expiry status,
- compare a scanned drug against a patient profile,
- reduce avoidable medication errors caused by missing allergy or interaction data.

## Ways to contribute

### 1. Core app work

- improve the barcode and GS1 parsing flow,
- harden validation logic,
- fix edge cases in product normalization,
- improve the scanner UX and error states,
- clean up the dashboard and profile integration.

### 2. Safety logic

- review interaction logic,
- improve recall/expiry handling,
- improve patient-profile matching,
- reduce false positives and false negatives,
- add stronger confidence and severity reporting.

### 3. Data and integrations

- improve OpenFDA / registry / recall data handling,
- work on scraper fallback reliability,
- improve regional coverage and local dataset quality,
- document data provenance and source limitations.

### 4. Quality and reliability

- add or improve tests,
- help with error handling,
- improve logging and telemetry,
- make the app more resilient to network and API outages.

### 5. Documentation

- improve onboarding and setup documentation,
- clarify workflows, limitations, and risks,
- document architecture, decisions, and unsupported assumptions.

## Before you start

Please read these first:

- [README.md](README.md)
- [START_HERE.md](START_HERE.md)
- [DRUG_SAFETY_SYSTEM.md](DRUG_SAFETY_SYSTEM.md)

This matters because the project has both product and safety implications. Good contributions require understanding that this is not a generic app.

## Local setup

```bash
npm install
npm start
```

For the scraper-enabled setup:

```bash
npm run start:full
```

## Development workflow

1. Fork the repo or create a feature branch.
2. Keep changes focused and readable.
3. Test the affected behavior before opening a PR.
4. Keep the PR description specific: what changed, why it changed, and how it was validated.
5. Be transparent about limitations, known edge cases, and unverified assumptions.

## Contribution standards

### Code quality

- prefer small, readable commits,
- avoid unrelated refactors in the same PR,
- keep TypeScript types explicit where needed,
- document important assumptions in code comments when appropriate,
- avoid broad changes that hide the root cause of a bug.

### Safety-sensitive work

If you are changing product risk logic, patient-profile matching, or medical interpretation:

- explain the rule or logic source,
- document assumptions,
- keep output conservative when certainty is low,
- avoid making hard claims that the app is a final medical decision tool.

### Tests

For bug fixes and new logic, add or update tests where possible. The repo already contains a test suite around barcode verification and scanner flows.

Example:

```bash
npm test
```

If you are only touching a narrow area, run the relevant subset when possible.

## Good PR structure

A good PR should include:

- concise title,
- clear summary of the issue or enhancement,
- changed files and why,
- validation commands run,
- known limitations or follow-up items,
- any risk notes, especially around safety or data accuracy.

## Issue reporting

When opening an issue, include:

- what you expected to happen,
- what actually happened,
- reproduction steps,
- environment details,
- screenshots or logs when relevant,
- whether the issue is app logic, UI, data lookup, or validation-related.

## What we especially need help with

- barcode edge cases and normalization fixes,
- product lookup reliability,
- safety logic quality,
- accessibility improvements,
- documentation clarity,
- tests for scan and verification behavior,
- international product support and dataset coverage.

## Important note on responsibility

This project deals with medication information and risk signaling. That means contributors should be careful not to overstate certainty. If a change improves safety but introduces uncertainty, document that uncertainty instead of hiding it.

Contributions are welcome, but we expect them to be thoughtful, evidence-based, and respectful of the seriousness of the problem space.

## Code of conduct

Please keep discussions constructive and professional. This project is about improving medication safety, not marketing hype or careless assumptions.

Treat patient safety, data quality, and honest reporting as core project values.
