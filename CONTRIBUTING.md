# Contributing to MedLink

Thanks for being interested in this project. MedLink is not a toy app or a throwaway prototype. It is a real-world medication safety project with a direct connection to counterfeit medicine risk, recall visibility, and patient safety in African and other underserved markets.

If you are contributing here, the goal is not just to make the app look nice. It is to make it more trustworthy, more useful, and more accurate in the environments where people actually face the risk of bad or fake medicines.

## Why this project matters

The main challenge is straightforward: medicine verification is too weak in too many places. Counterfeit products can slip through when packaging is hard to verify, local recall data is fragmented, and patients do not have a quick way to compare a product with their own medical profile.

MedLink is trying to make that process easier by combining:

- product scanning,
- recall and expiry checks,
- patient profile awareness,
- medication safety prompts,
- and practical workflows for clinics, pharmacies, and everyday users.

## Ways to contribute

There are a lot of useful ways to help, and almost all of them matter.

### App and UX

- improve the dashboard and screen logic,
- fix scanner edge cases,
- make safety warnings clearer,
- improve the user experience in low-connectivity environments,
- clean up patient profile flows and onboarding.

### Safety and product logic

- improve product verification logic,
- reduce false positives and false negatives,
- strengthen recall and expiry logic,
- improve medication comparisons against patient allergies and conditions,
- help with data quality and confidence scoring.

### Data and regional support

- improve coverage for African markets and regional pharmacovigilance data,
- work on local recall sources and registry integration,
- improve product mapping across different packaging standards,
- add better handling for countries or regions with incomplete data.

### Testing and reliability

- add or improve tests around scanning and verification,
- fix edge cases in barcode parsing,
- improve network fallback behavior,
- harden the app against missing or incomplete API data.

### Documentation

- clarify project workflows,
- improve setup and troubleshooting docs,
- explain limitations honestly,
- write better onboarding materials for new contributors.

## Before you start

Please read these first:

- [README.md](README.md)
- [START_HERE.md](START_HERE.md)
- [DRUG_SAFETY_SYSTEM.md](DRUG_SAFETY_SYSTEM.md)

This is important because the project is not a generic app. It sits inside a high-risk problem area, and good contributions need to respect that.

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

1. Fork the repo or create a branch for your work.
2. Keep changes focused and easy to review.
3. Test the part of the app you changed.
4. Be clear in your pull request about what changed and why.
5. Call out any uncertainty, data limits, or known edge cases.

## Contribution standards

### Keep it careful

This project deals with medication safety, which means we should be conservative and honest.

- do not overstate certainty,
- document assumptions,
- explain how a rule or alert was derived,
- avoid making medical claims that the code cannot support.

### Keep it readable

- keep PRs focused,
- avoid unrelated refactors,
- prefer clear names and straightforward logic,
- comment on tricky parts where needed,
- write code that another contributor can understand without a long explanation.

### Keep it testable

For new or changed logic, add or update tests where possible. This repo already includes scanning and verification tests, and those are a good place to start.

```bash
npm test
```

## What we especially need help with

Right now, the biggest value is in a few areas:

- barcode edge cases and normalization improvements,
- product lookup reliability,
- region-specific recall and registry work,
- better patient-medication comparison logic,
- app resilience when APIs or network access are unreliable,
- accessibility and UX improvements,
- documentation and contributor onboarding.

## Pull request expectations

A solid PR here should include:

- a clear title,
- a short explanation of the problem,
- what changed and why,
- any validation you ran,
- limitations or follow-up questions,
- any safety or data-quality concerns you are aware of.

## Issues and bug reports

When opening an issue, be specific. Include:

- what you expected,
- what actually happened,
- steps to reproduce,
- environment details,
- screenshots or logs if useful,
- whether the problem is UI, scanning, verification, profile logic, or data quality.

## A note on responsibility

This project sits in a high-risk problem space. That means contributors should treat patient safety and data quality as core values, not as a nice-to-have afterthought.

A good contribution is not just one that works. It is one that is understandable, honest about uncertainty, and safe to build on.

## Code of conduct

Please keep discussions constructive and respectful. This project is about improving medication safety, not hype, vague claims, or careless engineering.

If you are contributing, be practical, be honest, and keep the real-world problem in view.
