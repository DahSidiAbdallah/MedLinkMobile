const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { execSync } = require('child_process');

// This script downloads the FDA NDC 'text' ZIP from the public DPS endpoint,
// extracts product and package files, and builds a GTIN->NDC crosswalk.

const outDir = path.resolve(process.cwd(), '.tmp', 'fda-ndc');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const zipUrl = 'https://dps.fda.gov/ndc/ndc_files/ndc_product.txt.zip';
// there are several files; we'll attempt common names for product and package zips
const candidateZips = [
  'https://dps.fda.gov/ndc/ndc_files/ndc_product.txt.zip',
  'https://dps.fda.gov/ndc/ndc_files/ndc_package.txt.zip',
  'https://dps.fda.gov/ndc/ndc_files/ndc_files.txt.zip'
];

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node-fetch' } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) return reject(new Error('status ' + res.statusCode));
      let data = '';
      res.on('data', d => data += d.toString('utf8'));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function discoverZipsFromDPS() {
  const base = 'https://dps.fda.gov/ndc';
  try {
    const html = await fetchHtml(base);
    const links = [];
    // find hrefs that end with .zip
    const re = /href\s*=\s*['\"]([^'\"]+\.zip)['\"]/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      let href = m[1];
      // make absolute if relative
      if (/^\//.test(href)) href = 'https://dps.fda.gov' + href;
      if (!/^https?:\/\//i.test(href)) href = base + '/' + href;
      links.push(href);
    }
    // prefer product/package zips
    const uniq = Array.from(new Set(links));
    uniq.sort((a,b)=> (a.includes('product')? -1:1) - (b.includes('product')? -1:1));
    return uniq;
  } catch (err) {
    console.log('Discovery from DPS failed:', err.message);
    return [];
  }
}

async function discoverZipsFromFDADataPage() {
  const url = 'https://www.fda.gov/Drugs/InformationOnDrugs/ucm142438.htm';
  try {
    const html = await fetchHtml(url);
    const links = [];
    const re = /href\s*=\s*['"]([^'\"]+\.zip)['\"]/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      let href = m[1];
      if (/^\//.test(href)) href = 'https://www.fda.gov' + href;
      if (!/^https?:\/\//i.test(href)) href = 'https://www.fda.gov/' + href;
      links.push(href);
    }
    return Array.from(new Set(links));
  } catch (err) {
    console.log('Discovery from FDA data page failed:', err.message);
    return [];
  }
}

async function buildMapFromOpenFDA() {
  console.log('Falling back to openFDA API to build crosswalk');
  const perPage = 100;
  let skip = 0;
  const map = {};
  while (true) {
    const q = `https://api.fda.gov/drug/ndc.json?limit=${perPage}&skip=${skip}`;
    console.log('Querying openFDA', q);
    try {
      const html = await fetchHtml(q);
      const json = JSON.parse(html);
      if (!json.results || json.results.length === 0) break;
      for (const r of json.results) {
        // openFDA may include package_ndc_upc or product_ndc_upc or package_ndc
        const ndc = r.product_ndc || r.package_ndc || null;
        // multiple upcs may exist in r.package_ndc_upc
        if (r.package_ndc_upc) {
          const upcs = Array.isArray(r.package_ndc_upc) ? r.package_ndc_upc : [r.package_ndc_upc];
          for (const u of upcs) {
            const clean = (''+u).replace(/\D/g,'');
            if (clean && ndc) map[clean] = ndc.replace(/\D/g,'');
          }
        }
        if (r.product_ndc_upc) {
          const upcs = Array.isArray(r.product_ndc_upc) ? r.product_ndc_upc : [r.product_ndc_upc];
          for (const u of upcs) {
            const clean = (''+u).replace(/\D/g,'');
            if (clean && ndc) map[clean] = ndc.replace(/\D/g,'');
          }
        }
      }
      skip += perPage;
      if (json.results.length < perPage) break;
    } catch (err) {
      console.log('openFDA query failed:', err.message);
      break;
    }
  }
  console.log('openFDA produced', Object.keys(map).length, 'mappings');
  return map;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log('Downloading', url);
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('status ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => reject(err));
  });
}

(async function(){
  try {
  // discover zips from DPS and FDA data page first
  const discovered1 = await discoverZipsFromDPS();
  const discovered2 = await discoverZipsFromFDADataPage();
  const tryUrls = discovered1.concat(discovered2).concat(candidateZips);
    let downloaded = false;
    const prodZip = path.join(outDir, 'ndc_product.txt.zip');
    for (const u of tryUrls) {
      try {
        await download(u, prodZip);
        downloaded = true;
        break;
      } catch (e) {
        console.log('Download failed for', u, e.message);
      }
    }

    let map = {};
    if (downloaded) {
      // extract with powershell Expand-Archive if available, fallback to unzip via node
      try {
        console.log('Extracting', prodZip);
        execSync(`powershell -c "Expand-Archive -Path '${prodZip}' -DestinationPath '${outDir}' -Force"`, { stdio: 'inherit' });
      } catch (e) {
        console.log('PowerShell Expand-Archive failed, trying tar');
        execSync(`tar -xf "${prodZip}" -C "${outDir}"`);
      }

      // Now look for product and package files in outDir
      const files = fs.readdirSync(outDir).filter(f => /product|package/i.test(f));
      console.log('Found files:', files);

      map = {};
      for (const f of files) {
        const p = path.join(outDir, f);
        const content = fs.readFileSync(p, 'utf8');
        // Files are pipe-separated or tab; try to parse lines
        const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const header = lines.shift().split(/[|\t]/).map(h=>h.trim().toLowerCase());
        const upcIdx = header.findIndex(h=>/upc|ndc_package_upc|package_ndc_upc|product_ndc_upc/i.test(h));
        const ndcIdx = header.findIndex(h=>/product_ndc|package_ndc|productndc|packagendc/i.test(h));
        console.log('Parsing', f, 'upcIdx', upcIdx, 'ndcIdx', ndcIdx);
        for (const line of lines) {
          const cols = line.split(/[|\t]/).map(c=>c.trim());
          const ndc = ndcIdx>=0 ? (cols[ndcIdx]||'').replace(/\D/g,'') : null;
          const upc = upcIdx>=0 ? (cols[upcIdx]||'').replace(/\D/g,'') : null;
          if (upc && ndc) {
            // We'll store key as the UPC string (no padding) and value as ndc (10 or 11 digits)
            map[upc] = ndc;
          }
        }
      }
    } else {
      // fallback to openFDA API
      map = await buildMapFromOpenFDA();
    }

    // Backup existing crosswalk
    const crossFile = path.resolve(process.cwd(),'data','gtin_ndc_crosswalk.json');
    const backup = crossFile + '.bak-' + Date.now();
    if (fs.existsSync(crossFile)) fs.copyFileSync(crossFile, backup);

  // Merge with existing (preserve existing manual edits: do not overwrite existing keys)
  let existing = {};
  if (fs.existsSync(crossFile)) existing = JSON.parse(fs.readFileSync(crossFile,'utf8'));
  const merged = Object.assign({}, map, existing);
    fs.writeFileSync(crossFile, JSON.stringify(merged, null, 2), 'utf8');
    console.log('Wrote merged crosswalk with', Object.keys(merged).length, 'entries. Backup at', backup);

    // Remove .tmp scripts as requested
    const tmpDir = path.resolve(process.cwd(), '.tmp');
    if (fs.existsSync(tmpDir)) {
      const toRemove = fs.readdirSync(tmpDir).filter(fn => fn.startsWith('scripts') || fn.endsWith('.js'));
      for (const rm of toRemove) {
        const target = path.join(tmpDir, rm);
        console.log('Removing', target);
        // if directory, remove recursively
        if (fs.lstatSync(target).isDirectory()) {
          execSync(`powershell -c "Remove-Item -Recurse -Force '${target}'"`);
        } else {
          fs.unlinkSync(target);
        }
      }
    }

    console.log('Done');
  } catch (err) {
    console.error('Failed', err);
    process.exit(1);
  }
})();
