#!/usr/bin/env node
/**
 * Builds the WHO Medical Product Alerts dataset (substandard & falsified medicines,
 * WHO Global Surveillance and Monitoring System).
 *
 * Usage: node scripts/registry/build-who-alerts.js
 * Output: src/data/alerts/who.json
 *
 * Batch-level details often live in each alert's PDF annex rather than the page text.
 * Curated additions go in scripts/registry/who-alerts.overrides.json, keyed by alert id
 * (e.g. "6/2022"), and are merged into the generated records.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const LIST_URL = 'https://www.who.int/teams/regulation-prequalification/incidents-and-SF/full-list-of-who-medical-product-alerts';
const OUT = path.join(__dirname, '..', '..', 'src', 'data', 'alerts', 'who.json');
const OVERRIDES = path.join(__dirname, 'who-alerts.overrides.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(new URL(res.headers.location, url).toString()));
      }
      if (res.statusCode !== 200) return reject(new Error(`${url} -> HTTP ${res.statusCode}`));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const ENTITIES = { nbsp: ' ', amp: '&', quot: '"', apos: "'", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', deg: '°', ndash: '-', mdash: '-' };
function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function bodyText(html) {
  const start = html.indexOf('sf-detail-body-wrapper');
  if (start < 0) return '';
  let s = html.slice(start);
  const end = s.search(/<div[^>]+class="[^"]*(related|sf-detail-related)/i);
  if (end > 0) s = s.slice(0, end);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|tr|li|h\d|div)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');
  const cut = s.search(/\n\s*Related\s*\n/);
  return (cut > 0 ? s.slice(0, cut) : s).replace(/^[^\n]*\n/, '').trim();
}

// Countries most relevant to the app's users, plus major exporters to Africa.
const COUNTRIES = [
  'Mauritania', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Senegal', 'Mali', 'Niger', 'Burkina Faso',
  'Guinea', 'Côte d’Ivoire', "Côte d'Ivoire", 'Cote d’Ivoire', 'Ivory Coast', 'Ghana', 'Togo', 'Benin', 'Nigeria', 'Cameroon',
  'Chad', 'Sudan', 'South Sudan', 'Ethiopia', 'Somalia', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania',
  'Democratic Republic of the Congo', 'Congo', 'Gabon', 'Angola', 'Zambia', 'Zimbabwe', 'Malawi', 'Mozambique',
  'Madagascar', 'South Africa', 'Namibia', 'Botswana', 'Lesotho', 'Eswatini', 'Gambia', 'Sierra Leone', 'Liberia',
  'Guinea-Bissau', 'Cabo Verde', 'Djibouti', 'Eritrea', 'Central African Republic', 'Equatorial Guinea',
  'France', 'Spain', 'Belgium', 'Germany', 'Italy', 'Portugal', 'Switzerland', 'United Kingdom',
  'India', 'China', 'Pakistan', 'Turkey', 'Türkiye', 'Jordan', 'Lebanon', 'Saudi Arabia', 'United Arab Emirates',
  'Indonesia', 'Uzbekistan', 'Iraq', 'Yemen', 'Brazil', 'Mexico', 'United States',
];

// Words that never identify a specific product on their own.
const GENERIC = new Set(('the of and or for with in by a an only all batches batch products product update globally '
  + 'traded asia tablets tablet tabs caps capsules capsule syrup syrups suspension solution oral injection injectable '
  + 'vaccine vaccines cream drops powder infusion ointment ophthalmic ampoules sodium hydrochloride citrate '
  + 'baby paediatric pediatric medicines medicine medical cough cold liquid dosage forms version versions '
  + 'falsified substandard contaminated unregistered antimalarial antimalarials malaria hepatitis meningitis '
  + 'meningococcal rabies serum emergency contraceptive human normal covid diagnostic tests rapid yellow fever '
  + 'cholera acid discovered impurity displaying outdated essential drugs programme logo that claim prevent '
  + 'detect treat cure active pharmaceutical ingredient anti usp '
  + 'sulphate sulfate bisulphate bisulfate phosphate maleate acetate').split(' '));

// Phrases that show a "products are …" match captured prose rather than product names.
const PROSE = /\b(discovered|considered|deliberately|available|obtained|reliable|authentic|circulating|identified|detected|regularly|page|here|their|country|quality|standards|specifications|therefore|misrepresent|composition|source|excluded|claim)\b/i;

function splitNames(list) {
  return list.split(/,\s*|\s+and\s+/).map(n => n.trim()).filter(Boolean);
}

function extractProducts(title, text) {
  const out = new Set();
  // Title: "Medical Product Alert N°3/2026: Falsified DARZALEX (daratumumab)"
  let t = title.split(/:\s*/).slice(1).join(': ');
  t = t.replace(/^(adverse reactions caused by\s+)?(falsified|substandard|contaminated)(\s*\(contaminated\))?\s+/i, '')
    .replace(/^batches of\s+/i, '')
    .replace(/\s*\((update|asia and globally)\)\s*|\s+update$|\s+traded globally$/gi, '')
    .replace(/[“”"]/g, '').trim();
  for (const part of splitNames(t)) {
    const brand = part.replace(/\s*\(.*?\)/g, '').replace(/\s+(for injection|injection.*|\d+\s*mg.*)$/i, '').trim();
    if (brand) out.add(brand);
  }
  // Body: "The four products are A, B, C and D."
  const m = text.match(/\bThe (?:\w+ )?products (?:referenced in this alert )?are ([^.]{3,400})\./i);
  if (m && !PROSE.test(m[1])) {
    for (const n of splitNames(m[1])) {
      const name = n.replace(/\s*\(.*?\)\s*/g, ' ').trim();
      if (name.split(/\s+/).length <= 6 && /^[A-Z0-9]/.test(name)) out.add(name);
    }
  }
  return [...out].filter(n => n.length >= 3 && n.length <= 80);
}

function extractBatches(text) {
  const out = new Set();
  const re = /\b(?:batch|lot)(?:es|s)?(?:\s+(?:numbers?|nos?\.?|n°))?\s*[:#]?\s*((?:[A-Z0-9][A-Z0-9\-/]{3,19}(?:\s*(?:,|and|&)\s*)?)+)/gi;
  for (const m of text.matchAll(re)) {
    for (const tok of m[1].split(/\s*(?:,|and|&)\s*/)) {
      const b = tok.trim().toUpperCase();
      // Real batch codes mix letters/digits or are long digit runs; skip plain words.
      if (/^[A-Z0-9\-/]{4,20}$/.test(b) && /\d/.test(b) && !/^(19|20)\d{2}$/.test(b)) out.add(b);
    }
  }
  return [...out];
}

function extractManufacturer(text) {
  const m = text.match(/stated manufacturer(?: of (?:these|this) products?)? (?:is|are|was)\s+([^.(]{3,120})/i)
    || text.match(/manufactured by\s+([^.()]{3,80})/i);
  return m ? m[1].trim().replace(/[,;]+$/, '') : undefined;
}

function brandTokens(products) {
  const tokens = new Set();
  for (const p of products) {
    for (const w of p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/)) {
      if (w.length >= 4 && !GENERIC.has(w) && !/^\d+$/.test(w)) tokens.add(w);
    }
  }
  return [...tokens];
}

async function main() {
  const list = await get(LIST_URL);
  const urls = [...new Set(
    [...list.matchAll(/href="([^"]*medical-product-alert[^"]*)"/gi)]
      .map(m => new URL(decodeEntities(m[1]), 'https://www.who.int').toString().replace(/^http:/, 'https:')),
  )];
  console.log(`[who] ${urls.length} alert links`);

  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
  const alerts = [];
  const seen = new Set();
  for (const url of urls) {
    try {
      const html = await get(url);
      const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]).replace(/\s+/g, ' ').trim();
      const idm = title.match(/N\s*[°º]?\s*(\d+)\s*\/\s*(\d{4})/i);
      if (!idm) continue;
      const id = `${idm[1]}/${idm[2]}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const text = bodyText(html) || decodeEntities((html.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]);
      const dm = url.match(/\/(\d{2})-(\d{2})-(\d{4})-/);
      const kind = /falsified/i.test(title) ? 'falsified' : /substandard|contaminat/i.test(title) ? 'substandard' : /unregistered/i.test(title) ? 'unregistered' : 'other';
      const products = extractProducts(title, text);
      const record = {
        id,
        title: title.replace(/\s*\|\s*World Health Organization.*$/i, ''),
        date: dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : undefined,
        url,
        kind,
        products,
        tokens: brandTokens(products),
        batches: extractBatches(text),
        manufacturer: extractManufacturer(text),
        countries: COUNTRIES.filter(c => text.includes(c)),
        allBatches: /all batches/i.test(text),
        summary: text.split('\n').find(l => l.length > 80)?.slice(0, 400),
      };
      const o = overrides[id];
      if (o) {
        for (const k of ['products', 'batches', 'countries']) if (o[k]) record[k] = [...new Set([...record[k], ...o[k]])];
        Object.assign(record, { ...o, products: record.products, batches: record.batches, countries: record.countries });
        record.tokens = brandTokens(record.products);
      }
      alerts.push(record);
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.warn(`\n[who] skip ${url}: ${e.message}`);
    }
  }
  alerts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    meta: { source: 'WHO Medical Product Alerts (GSMS)', url: LIST_URL, generatedAt: new Date().toISOString() },
    alerts,
  }, null, 1));
  console.log(`\n[who] ${alerts.length} alerts, ${alerts.reduce((n, a) => n + a.batches.length, 0)} batch numbers -> ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
