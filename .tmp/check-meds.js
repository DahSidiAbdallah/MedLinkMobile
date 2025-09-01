"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
// Use require() so tests can mock node-fetch without TypeScript complaining about missing types
const fetch = require('node-fetch');
const fs_1 = require("fs");
const path_1 = require("path");
async function rxnormRxcui(drugName) {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`;
    const r = await fetch(url);
    const j = await r.json();
    return { url, body: j, rxcui: j.idGroup?.rxnormId?.[0] ?? null };
}
async function openFdaLabel(query) {
    const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query)}&limit=1`;
    const r = await fetch(url);
    if (r.status === 404)
        return { url, body: null, label: null };
    const j = await r.json();
    return { url, body: j, label: j.results?.[0] ?? null };
}
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
}
async function run() {
    const tests = [
        { barcode: '3400933071998', guessName: 'Doliprane 500 mg' },
        { barcode: '3400936864986', guessName: 'Nurofen 400 mg' },
        { barcode: '5024071210002', guessName: 'Paracetamol 500 mg' },
        { barcode: '312843536371', guessName: 'Bayer Aspirin 81 mg' },
    ];
    const record = !!process.env.RECORD_FIXTURES;
    const outDir = path_1.default.resolve(process.cwd(), 'tests', 'fixtures', 'check-meds');
    if (record)
        ensureDir(outDir);
    let failing = false;
    for (const t of tests) {
        const rxcuiResp = await rxnormRxcui(t.guessName);
        let labelResp = null;
        if (/^\d+$/.test(t.barcode)) {
            labelResp = await openFdaLabel(`openfda.product_ndc:${t.barcode}`);
            if (!labelResp.label)
                labelResp = await openFdaLabel(t.barcode);
        }
        if (!labelResp?.label) {
            const brandToken = t.guessName.split(/\s+/)[0];
            labelResp = await openFdaLabel(`openfda.brand_name:"${brandToken}"`);
        }
        // Assertions
        const hasRequired = !!(rxcuiResp.rxcui || (labelResp && (labelResp.label?.openfda?.brand_name || labelResp.label?.indications_and_usage || labelResp.label?.adverse_reactions)));
        if (!hasRequired)
            failing = true;
        console.log(t.barcode, { rxcui: rxcuiResp.rxcui, labelOk: !!labelResp?.label, requiredPresent: hasRequired });
        if (record) {
            const filename = path_1.default.join(outDir, `${t.barcode}.json`);
            fs_1.default.writeFileSync(filename, JSON.stringify({ rxcui: rxcuiResp, label: labelResp }, null, 2), 'utf8');
            console.log('Wrote fixture', filename);
        }
    }
    if (failing) {
        console.error('One or more barcodes failed required field assertions');
        return false;
    }
    return true;
}
if (require.main === module) {
    run().then(ok => { if (!ok)
        process.exit(2); }).catch(err => { console.error(err); process.exit(1); });
}
