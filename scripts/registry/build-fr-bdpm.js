#!/usr/bin/env node
/**
 * Builds the French medicine registry from the official BDPM
 * (Base de données publique des médicaments, ANSM / HAS / CNAM).
 *
 * Usage:
 *   node scripts/registry/build-fr-bdpm.js            # downloads the latest files
 *   node scripts/registry/build-fr-bdpm.js <dir>      # uses already-downloaded files
 *
 * Output: src/data/registries/fr.json (see src/scan/registries.ts for the schema)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://base-donnees-publique.medicaments.gouv.fr/download/file/';
const FILES = ['CIS_bdpm.txt', 'CIS_CIP_bdpm.txt', 'CIS_COMPO_bdpm.txt'];
const OUT = path.join(__dirname, '..', '..', 'src', 'data', 'registries', 'fr.json');

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(new URL(res.headers.location, url).toString()));
      }
      if (res.statusCode !== 200) return reject(new Error(`${url} -> HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// BDPM files are published in a mix of UTF-8 and Windows-1252.
function decode(buf) {
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('�')) return utf8;
  return new TextDecoder('windows-1252').decode(buf);
}

function rows(text) {
  return text.split(/\r?\n/).filter(Boolean).map(l => l.split('\t').map(c => c.trim()));
}

async function main() {
  const srcDir = process.argv[2];
  const texts = {};
  for (const f of FILES) {
    const buf = srcDir ? fs.readFileSync(path.join(srcDir, f)) : await download(BASE + f);
    texts[f] = decode(buf);
    console.log(`[fr] ${f}: ${texts[f].length} chars`);
  }

  // CIS_COMPO: cis | element | substance code | substance name | dose | dose ref | nature (SA/FT) | link
  const substances = new Map();
  for (const r of rows(texts['CIS_COMPO_bdpm.txt'])) {
    const [cis, , , name, , , nature] = r;
    if (nature !== 'SA' || !name) continue;
    if (!substances.has(cis)) substances.set(cis, new Set());
    substances.get(cis).add(name.toUpperCase());
  }

  // CIS_bdpm: cis | name | form | routes | AMM status | procedure | marketing status | AMM date | BdM status | EU number | holders | reinforced surveillance
  // Holders repeat thousands of times, so they're stored once and referenced by index.
  const holders = [];
  const holderIdx = new Map();
  const products = {};
  for (const r of rows(texts['CIS_bdpm.txt'])) {
    const [cis, name, , , ammStatus, , marketing, , , , holder] = r;
    if (!cis || !name) continue;
    const h = (holder || '').trim();
    if (!holderIdx.has(h)) { holderIdx.set(h, holders.length); holders.push(h); }
    const flags = (/^Commercialis/i.test(marketing || '') ? 1 : 0) | (/active/i.test(ammStatus || '') ? 2 : 0);
    products[cis] = [name, holderIdx.get(h), flags, [...(substances.get(cis) || [])].join(';')];
  }

  // CIS_CIP: cis | cip7 | presentation | admin status | marketing state | date | cip13 | ...
  const codes = {};
  let skipped = 0;
  for (const r of rows(texts['CIS_CIP_bdpm.txt'])) {
    const [cis, , , adminStatus, marketingState, , cip13] = r;
    if (!products[cis] || !/^3400\d{9}$/.test(cip13 || '')) { skipped++; continue; }
    const flags = (/commercialisation/i.test(marketingState || '') && !/arr[êe]t/i.test(marketingState || '') ? 1 : 0)
      | (/active/i.test(adminStatus || '') ? 2 : 0);
    // Only the digits after the shared "3400" prefix are stored.
    codes[cip13.slice(4)] = Number(cis) * 4 + flags;
  }

  const out = {
    meta: {
      country: 'FR',
      source: 'BDPM — Base de données publique des médicaments (ANSM)',
      url: 'https://base-donnees-publique.medicaments.gouv.fr',
      generatedAt: new Date().toISOString(),
      codePrefix: '3400',
      // BDPM lists every medicine authorised in France, so a missing CIP13 is a real red flag.
      exhaustive: true,
    },
    holders,
    // product: [name, holderIndex, flags (1 = marketed, 2 = authorisation active), substances ";"-joined]
    products,
    // code (CIP13 without "3400"): productId * 4 + flags (1 = presentation marketed, 2 = presentation active)
    codes,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`[fr] ${Object.keys(products).length} products, ${Object.keys(codes).length} codes (${skipped} skipped) -> ${OUT} (${kb} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
