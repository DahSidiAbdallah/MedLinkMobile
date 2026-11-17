# Medicine registries and alerts

The scanner (`src/scan/`) identifies a box and checks it against three kinds of data, all
bundled in the app so scans work offline:

| Data | File | Built by |
|---|---|---|
| National medicine registries | `src/data/registries/<iso>.json` | `build-fr-bdpm.js`, `build-csv-registry.js` |
| WHO falsified/substandard alerts | `src/data/alerts/who.json` | `build-who-alerts.js` |
| National recalls / batch withdrawals | `src/data/alerts/recalls.json` | edited by hand |

Refresh everything that can be downloaded automatically:

```bash
npm run registry:update
```

Run it before each release; the French and WHO sources change every few weeks.

## France — BDPM (automatic)

`npm run registry:fr` downloads the official Base de données publique des médicaments
(ANSM) and builds `fr.json`: every medicine authorised in France, keyed by CIP13, with
laboratory, active substances, and marketing/authorisation status. Because the list is
complete, a French-format code (`3400…`) that is missing from it is reported as suspicious.

## Other countries — CSV import

Most North and West African regulators publish their list of authorised medicines as a
spreadsheet or PDF rather than an API (Morocco AMMPS, Algeria MIPH "nomenclature nationale",
Tunisia DPM, Mauritania DPL, Senegal ARP, Côte d'Ivoire AIRP…). Export the list to CSV and run:

```bash
npm run registry:csv -- MA morocco.csv --source "AMMPS — liste des médicaments" --url https://ammps.sante.gov.ma
```

The header row is matched by name (French or English): a barcode column (`ean`, `gtin`,
`code barre`, `cip`…) and a name column (`nom`, `denomination`, `spécialité`…) are required;
`laboratoire`, `dci`/`substances` and `statut` are used when present.

Add `--exhaustive` **only** for an official, complete list. It turns "not in this list" into
a warning for barcodes issued in that country, so a partial list would cause false alarms.

The importer regenerates `src/data/registries/index.ts`; the app picks the new country up
automatically.

## WHO Medical Product Alerts (automatic)

`npm run registry:who` reads the WHO alert index and extracts, for each alert: the products,
stated manufacturer, affected countries and any batch numbers in the text.

Batch tables are often only in each alert's PDF annex. Add them by hand in
`who-alerts.overrides.json`, keyed by alert id:

```json
{
  "6/2022": { "batches": ["PF21301", "PF21302"], "manufacturer": "Maiden Pharmaceuticals Limited" }
}
```

## National recalls

For a recall or batch withdrawal announced by a national authority (ANSM, AMMPS, NAFDAC…),
add an entry to `src/data/alerts/recalls.json`:

```json
[
  {
    "source": "ANSM",
    "country": "FR",
    "gtin": "03400935294227",
    "batches": ["LOT123"],
    "reason": "Retrait de lot : défaut de conditionnement",
    "date": "2026-10-01",
    "url": "https://ansm.sante.fr/…"
  }
]
```

Leave out `batches` to recall every batch of that product.

## Cloned-code detection (Firestore)

Serialised packs carry a serial number unique to each box. The app records each scanned
GTIN + serial in the `serialScans` collection with an anonymous per-user hash, and warns
when several different people have scanned the same box code. Deploy these rules:

```
match /serialScans/{id} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null
    && request.resource.data.keys().hasOnly(['gtin', 'serial', 'users', 'count', 'firstSeen', 'lastSeen'])
    && request.resource.data.users.size() <= 50;
}
```

Without them the check is skipped silently and the rest of the scan still works.
