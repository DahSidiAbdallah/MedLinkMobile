const fs = require('fs')
const path = require('path')

const tests = [
  '0376385114015',
  '0376385116019',
  '0382009046105',
  '0382009047102',
  '0854709002656',
  '0843119104326',
  '0194346206247',
  '0087701427244',
  '0190853003508',
  '0190853002433'
]

async function rxnormRxcui(drugName) {
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`
  const r = await fetch(url)
  const j = await r.json()
  return { url, body: j, rxcui: j.idGroup && j.idGroup.rxnormId && j.idGroup.rxnormId[0] ? j.idGroup.rxnormId[0] : null }
}

async function openFdaLabel(query) {
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query)}&limit=1`
  const r = await fetch(url)
  if (r.status === 404) return { url, body: null, label: null }
  const j = await r.json()
  return { url, body: j, label: j.results && j.results[0] ? j.results[0] : null }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function run() {
  const record = !!process.env.RECORD_FIXTURES
  const outDir = path.resolve(process.cwd(), 'tests', 'fixtures', 'check-meds')
  if (record) ensureDir(outDir)

  let failing = false

  for (const barcode of tests) {
  const guessName = ''
  let rxcuiResp = { url: null, body: null, rxcui: null }
  if (guessName) rxcuiResp = await rxnormRxcui(guessName)

    let labelResp = null
    if (/^\d+$/.test(barcode)) {
      labelResp = await openFdaLabel(`openfda.product_ndc:${barcode}`)
      if (!labelResp.label) labelResp = await openFdaLabel(barcode)
    }

    if (!labelResp || !labelResp.label) {
      // try brand token from crosswalk if possible
      const map = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'data','gtin_ndc_crosswalk.json'),'utf8'))
      const ndc = map[barcode]
      if (ndc) {
        labelResp = await openFdaLabel(`openfda.product_ndc:${ndc}`)
      }
    }

    const hasRequired = !!(rxcuiResp.rxcui || (labelResp && (labelResp.label && (labelResp.label.openfda && labelResp.label.openfda.brand_name) || (labelResp.label && labelResp.label.indications_and_usage) || (labelResp.label && labelResp.label.adverse_reactions))))
    if (!hasRequired) failing = true

    console.log(barcode, { rxcui: rxcuiResp.rxcui, labelOk: !!(labelResp && labelResp.label), requiredPresent: hasRequired })

    if (record) {
      const filename = path.join(outDir, `${barcode}.json`)
      fs.writeFileSync(filename, JSON.stringify({ rxcui: rxcuiResp, label: labelResp }, null, 2), 'utf8')
      console.log('Wrote fixture', filename)
    }
    // polite delay
    await new Promise(r=>setTimeout(r,200))
  }

  if (failing) {
    console.error('One or more barcodes failed required field assertions')
    return false
  }
  return true
}

if (require.main === module) {
  run().then(ok => { if (!ok) process.exit(2) }).catch(err => { console.error(err); process.exit(1) })
}

module.exports = { run }
