const fs = require('fs')
const path = require('path')

async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`fetch ${url} failed ${r.status}`)
  return r.json()
}

async function run() {
  const outFile = path.resolve(process.cwd(), 'data', 'gtin_ndc_crosswalk.json')
  const existing = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {}
  const map = { ...existing }

  const limit = 100
  let skip = 0
  let collected = 0
  const maxCollect = 2000
  const maxSkip = 10000

  while (collected < maxCollect && skip < maxSkip) {
    const url = `https://api.fda.gov/drug/ndc.json?limit=${limit}&skip=${skip}`
    console.log('Fetching', url)
    let j
    try {
      j = await fetchJson(url)
    } catch (err) {
      console.error('fetch failed', err.message)
      break
    }
    const results = j.results || []
    if (!results.length) break
    for (const r of results) {
      const ndc = (r.product_ndc || '').replace(/\D/g, '')
      const upcs = r.openfda && r.openfda.upc ? r.openfda.upc : []
      for (const upc of upcs) {
        const key = String(upc).trim()
        if (!key) continue
        if (!map[key]) {
          if (ndc) {
            map[key] = ndc
            collected++
          }
        }
      }
      if (collected >= maxCollect) break
    }
    skip += limit
    // small delay to be polite
    await new Promise(r => setTimeout(r, 200))
  }

  fs.writeFileSync(outFile, JSON.stringify(map, null, 2), 'utf8')
  console.log('Wrote', outFile, 'entries', Object.keys(map).length)
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1) })
}

module.exports = { run }
