const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

async function main() {
  const code = process.argv[2] || '3664798022032';
  const crossPath = path.join(__dirname, '..', 'data', 'gtin_ndc_crosswalk.json');
  let map = {};
  if (fs.existsSync(crossPath)) {
    try { map = JSON.parse(fs.readFileSync(crossPath, 'utf8')) } catch(e) { console.error('cross parse err', e) }
  }
  console.log('Looking up GTIN', code);
  const ndc = map[code] || null;
  console.log('Mapped NDC:', ndc);
  if (ndc) {
    // try openfda label
    const url = `https://api.fda.gov/drug/label.json?search=openfda.product_ndc:${encodeURIComponent(ndc)}&limit=1`;
    console.log('Querying openFDA:', url);
    try {
      const res = await fetch(url);
      const j = await res.json();
      console.log('openFDA label results:', JSON.stringify(j.results?.[0] || null, null, 2));
    } catch (e) { console.error('openfda fetch error', e) }
  } else {
    // try openfda by gtin tails
    const tails = [11,10,9,8];
    for (const n of tails) {
      const t = code.slice(-n);
      if (t.length < 8) continue;
      const urls = [
        `https://api.fda.gov/drug/label.json?search=openfda.product_ndc:${t}&limit=1`,
        `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:${t}&limit=1`,
      ];
      for (const u of urls) {
        try {
          const r = await fetch(u);
          const j = await r.json();
          if (j && j.results && j.results.length>0) {
            console.log('Found by tail', t, 'url', u);
            console.log(JSON.stringify(j.results[0], null, 2));
            return;
          }
        } catch (e) {}
      }
    }
    console.log('No openFDA result for GTIN or tails');
  }
}

main().catch(e=>{ console.error(e); process.exit(1) })
