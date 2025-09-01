// Simple Node script to validate barcodes against RxNorm and openFDA
// Usage: node scripts/check-meds.js

const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

async function rxnormRxcui(drugName) {
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`
  const r = await fetch(url)
  const j = await r.json()
  return { url, body: j, rxcui: j.idGroup?.rxnormId?.[0] ?? null }
}

async function openFdaLabel(query) {
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query)}&limit=1`
  const r = await fetch(url)
  const j = await r.json()
  return { url, body: j, label: j.results?.[0] ?? null }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function run() {
  const tests = [
    { barcode: '3400933071998', guessName: 'Doliprane 500 mg' },
    { barcode: '3400936864986', guessName: 'Nurofen 400 mg' },
    { barcode: '5024071210002', guessName: 'Paracetamol 500 mg' },
    { barcode: '312843536371',  guessName: 'Bayer Aspirin 81 mg' },
  ]

  const record = !!process.env.RECORD_FIXTURES
  const outDir = path.resolve(process.cwd(), 'tests', 'fixtures', 'check-meds')
  if (record) ensureDir(outDir)

  for (const t of tests) {
    const rxcuiResp = await rxnormRxcui(t.guessName)
    // If the barcode looks numeric, try a code-first query (GTIN/NDC)
    let labelResp = null
    if (/^\d+$/.test(t.barcode)) {
      // Try product_ndc search first
      labelResp = await openFdaLabel(`openfda.product_ndc:${t.barcode}`)
      if (!labelResp.label) {
        // fallback: search by the code anywhere
        labelResp = await openFdaLabel(t.barcode)
      }
    }
    // If still null, try brand token search
    if (!labelResp || !labelResp.label) {
      const brandToken = t.guessName.split(/\s+/)[0]
      labelResp = await openFdaLabel(`openfda.brand_name:"${brandToken}"`)
    }
    console.log(t.barcode, { rxcui: rxcuiResp.rxcui, labelOk: !!labelResp.label })
    if (record) {
      const filename = path.join(outDir, `${t.barcode}.json`)
      fs.writeFileSync(filename, JSON.stringify({ rxcui: rxcuiResp, label: labelResp }, null, 2), 'utf8')
      console.log('Wrote fixture', filename)
    }
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1) })
}

module.exports = { run }
