
import { verifyDrugByQrCode } from '../core/drugInfo';
import { parseGs1DataMatrix } from './gs1';
import { resolveDigitalLink } from './gs1DigitalLink';
import { getRecallByGTINorNDC, getLabelingByGTINorNDC } from './openfda';
import { fetchDrugLabelByNDC } from './openfdaDrugInfo';
import { fetchDrugInfoFromScraper } from './webscraperDrugInfo';
import { findLocalRecall } from './localRecalls';
import { normalizeGtinTo14, normalizeNdc } from './codeUtils';

import type { DrugLabelInfo } from './openfdaDrugInfo';


export interface VerificationResult {
  verified: boolean;
  counterfeit: boolean;
  expired: boolean;
  recall?: any;
  label?: any;
  labelInfo?: DrugLabelInfo | null;
  webscraperInfo?: any | null;
  message: string;
  telemetry?: {
    latencies?: Record<string, number>
    cacheHits?: Record<string, boolean>
  }
}


export async function verifyScannedCode(data: string, type: string): Promise<VerificationResult> {
  const latencies: Record<string, number> = {}
  const cacheHits: Record<string, boolean> = {}
  async function timeAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    const res = await fn()
    const elapsed = Date.now() - start
    latencies[key] = elapsed
    // detect cache hint
    try {
      if (res && typeof res === 'object' && ('__cacheHit' in (res as any))) {
        cacheHits[key] = !!(res as any).__cacheHit
      }
    } catch {}
    return res
  }
  // Extracted handlers (inside function scope so they can access latencies/cacheHits/timeAsync)
  async function handleDataMatrix(parsed: any) {
    const expired = parsed.expiry ? parsed.expiry < new Date() : false;
    const canonical = normalizeGtinTo14(parsed.gtin || '');
    const localRecall2 = findLocalRecall(canonical || parsed.gtin);
    if (localRecall2) {
      cacheHits['localRecall'] = true
      return {
        verified: false,
        counterfeit: false,
        expired,
        recall: localRecall2,
        label: undefined,
        message: expired ? 'Product expired' : `Product recalled by ${localRecall2.source}`,
        telemetry: { latencies, cacheHits },
      } as VerificationResult
    }
    const codeToQuery = canonical || parsed.gtin;
      const recall = await timeAsync('getRecallByGTINorNDC', () => getRecallByGTINorNDC(codeToQuery));
      const label = await timeAsync('getLabelingByGTINorNDC', () => getLabelingByGTINorNDC(codeToQuery));
      const labelInfoFromNdc = await timeAsync('fetchDrugLabelByNDC', () => (/^\d{10,11}$/.test(codeToQuery) ? fetchDrugLabelByNDC(codeToQuery) : Promise.resolve(null)));
      let labelInfo = labelInfoFromNdc
      if (!labelInfo && label) {
        try {
          labelInfo = {
            indications: (label.indications_and_usage && label.indications_and_usage[0]) || undefined,
            dosage: (label.dosage_and_administration && label.dosage_and_administration[0]) || undefined,
            sideEffects: (label.adverse_reactions && label.adverse_reactions[0]) || undefined,
          } as any
        } catch {}
      }
      const webscraperInfo = await timeAsync('fetchDrugInfoFromScraper', () => fetchDrugInfoFromScraper(codeToQuery));
    const message = expired ? 'Product expired' : (recall ? 'Product recalled' : 'No authenticity data available');
    return {
      verified: false,
      counterfeit: false,
      expired,
      recall,
      label,
      labelInfo,
      webscraperInfo,
      message,
      telemetry: { latencies, cacheHits },
    } as VerificationResult
  }

  async function handleNdc(code: string) {
    const canonical = normalizeNdc(code || '');
    const localRecall3 = findLocalRecall(canonical || code);
    if (localRecall3) {
      cacheHits['localRecall'] = true
      return {
        verified: false,
        counterfeit: false,
        expired: false,
        recall: localRecall3,
        label: undefined,
        message: `Product recalled by ${localRecall3.source}`,
        telemetry: { latencies, cacheHits },
      } as VerificationResult
    }
    const codeToQuery = canonical || code;
    const recall = await timeAsync('getRecallByGTINorNDC', () => getRecallByGTINorNDC(codeToQuery));
    const label = await timeAsync('getLabelingByGTINorNDC', () => getLabelingByGTINorNDC(codeToQuery));
    const labelInfoFromNdc = await timeAsync('fetchDrugLabelByNDC', () => fetchDrugLabelByNDC(codeToQuery));
    let labelInfo = labelInfoFromNdc
    if (!labelInfo && label) {
      try {
        labelInfo = {
          indications: (label.indications_and_usage && label.indications_and_usage[0]) || undefined,
          dosage: (label.dosage_and_administration && label.dosage_and_administration[0]) || undefined,
          sideEffects: (label.adverse_reactions && label.adverse_reactions[0]) || undefined,
        } as any
      } catch {}
    }
    const webscraperInfo = await timeAsync('fetchDrugInfoFromScraper', () => fetchDrugInfoFromScraper(codeToQuery));
    const message = recall ? 'Product recalled' : 'No authenticity data available'
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall,
      label,
      labelInfo,
      webscraperInfo,
      message,
      telemetry: { latencies, cacheHits },
    } as VerificationResult
  }
  // 1. Check local recall lists first (offline, EMA, SAHPRA, NAFDAC, PPB, etc.)
  const localRecall = findLocalRecall(data);
  if (localRecall) {
    cacheHits['localRecall'] = true
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall: localRecall,
      label: undefined,
      message: `Product recalled by ${localRecall.source}`,
      telemetry: { latencies, cacheHits },
    };
  }
  // Check MedLink QR authenticity
  if (data.startsWith('MedLink:AUTH:')) {
    const { verified, drug } = await timeAsync('verifyDrugByQrCode', () => verifyDrugByQrCode(data));
    return {
      verified,
      counterfeit: !verified,
      expired: false,
      message: verified ? 'Authenticity verified via MedLink code' : 'Invalid MedLink authenticity code',
      telemetry: { latencies, cacheHits },
    };
  }

  // Parse DataMatrix for GTIN/expiry
  if (type === 'datamatrix') {
    const parsed = parseGs1DataMatrix(data);
    if (parsed) {
      // Try GS1 Digital Link resolver first (may return brand/resource info)
      const dl = await timeAsync('resolveDigitalLink', () => resolveDigitalLink(parsed.gtin || ''))
      if (dl) {
        cacheHits['resolveDigitalLink'] = true
      }
      const expired = parsed.expiry ? parsed.expiry < new Date() : false;
      // Check local recall for GTIN
      const canonical = normalizeGtinTo14(parsed.gtin || '');
      const localRecall2 = findLocalRecall(canonical || parsed.gtin);
      if (localRecall2) {
        cacheHits['localRecall'] = true
        return {
          verified: false,
          counterfeit: false,
          expired,
          recall: localRecall2,
          label: undefined,
          message: expired ? 'Product expired' : `Product recalled by ${localRecall2.source}`,
          telemetry: { latencies, cacheHits },
        };
      }
      // Always call both openFDA and webscraper for GTIN/NDC, measure each
      const codeToQuery = canonical || parsed.gtin;
  const recall = await timeAsync('getRecallByGTINorNDC', () => getRecallByGTINorNDC(codeToQuery));
      const label = await timeAsync('getLabelingByGTINorNDC', () => getLabelingByGTINorNDC(codeToQuery));
      const labelInfo = await timeAsync('fetchDrugLabelByNDC', () => (/^\d{10,11}$/.test(codeToQuery) ? fetchDrugLabelByNDC(codeToQuery) : Promise.resolve(null)));
      const webscraperInfo = await timeAsync('fetchDrugInfoFromScraper', () => fetchDrugInfoFromScraper(codeToQuery));
      return {
        verified: false, // no authenticity code
        counterfeit: false,
        expired,
        recall,
        label,
        labelInfo,
        webscraperInfo,
        message: expired ? 'Product expired' : (recall ? 'Product recalled' : 'No authenticity data available'),
        telemetry: { latencies, cacheHits },
      };
    }
  }

  // Check NDC codes (UPC/EAN may map to NDC)
  if (/^\d{10,11}$/.test(data)) {
    const canonical = normalizeNdc(data || '');
    const localRecall3 = findLocalRecall(canonical || data);
    if (localRecall3) {
      cacheHits['localRecall'] = true
      return {
        verified: false,
        counterfeit: false,
        expired: false,
        recall: localRecall3,
        label: undefined,
        message: `Product recalled by ${localRecall3.source}`,
        telemetry: { latencies, cacheHits },
      };
    }
    // Always call both openFDA and webscraper for NDC (measure each)
    const codeToQuery = canonical || data;
    const recall = await timeAsync('getRecallByGTINorNDC', () => getRecallByGTINorNDC(codeToQuery));
    const label = await timeAsync('getLabelingByGTINorNDC', () => getLabelingByGTINorNDC(codeToQuery));
    const labelInfoFromNdc = await timeAsync('fetchDrugLabelByNDC', () => fetchDrugLabelByNDC(codeToQuery));
    let labelInfo = labelInfoFromNdc
    if (!labelInfo && label) {
      try {
        labelInfo = {
          indications: (label.indications_and_usage && label.indications_and_usage[0]) || undefined,
          dosage: (label.dosage_and_administration && label.dosage_and_administration[0]) || undefined,
          sideEffects: (label.adverse_reactions && label.adverse_reactions[0]) || undefined,
        } as any
      } catch {}
    }
    const webscraperInfo = await timeAsync('fetchDrugInfoFromScraper', () => fetchDrugInfoFromScraper(codeToQuery));
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall,
      label,
      labelInfo,
      webscraperInfo,
      message: recall ? 'Product recalled' : 'No authenticity data available',
      telemetry: { latencies, cacheHits },
    };
  }

  // Check EAN-8 / UPC-A / EAN-13 / GTIN-14 — the most common retail barcodes on
  // medication boxes. Previously these fell through to "Unrecognized code format"
  // without any lookup.
  if (/^\d{8}$|^\d{12,14}$/.test(data)) {
    // US drug UPC-A embeds the NDC-10: '3' + 10-digit NDC + check digit.
    // EAN-13 with a leading 0 wraps the same UPC ('03' + NDC + check).
    if (/^3\d{11}$/.test(data)) {
      return await handleNdc(data.slice(1, 11));
    }
    if (/^03\d{11}$/.test(data)) {
      return await handleNdc(data.slice(2, 12));
    }

    const canonical = normalizeGtinTo14(data);
    const localRecallG = findLocalRecall(canonical || data);
    if (localRecallG) {
      cacheHits['localRecall'] = true
      return {
        verified: false,
        counterfeit: false,
        expired: false,
        recall: localRecallG,
        label: undefined,
        message: `Product recalled by ${localRecallG.source}`,
        telemetry: { latencies, cacheHits },
      };
    }

    const codeToQuery = canonical || data;
    const recall = await timeAsync('getRecallByGTINorNDC', () => getRecallByGTINorNDC(codeToQuery));
    // getLabelingByGTINorNDC handles GTINs via the NDC crosswalk + tail heuristics
    const label = await timeAsync('getLabelingByGTINorNDC', () => getLabelingByGTINorNDC(codeToQuery));
    let labelInfo: DrugLabelInfo | null = null
    if (label) {
      try {
        labelInfo = {
          indications: (label.indications_and_usage && label.indications_and_usage[0]) || undefined,
          dosage: (label.dosage_and_administration && label.dosage_and_administration[0]) || undefined,
          sideEffects: (label.adverse_reactions && label.adverse_reactions[0]) || undefined,
        } as any
      } catch {}
    }
    const webscraperInfo = await timeAsync('fetchDrugInfoFromScraper', () => fetchDrugInfoFromScraper(data));
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall,
      label,
      labelInfo,
      webscraperInfo,
      message: recall ? 'Product recalled' : 'No authenticity data available',
      telemetry: { latencies, cacheHits },
    };
  }

  return {
    verified: false,
    counterfeit: false,
    expired: false,
  message: 'Unrecognized code format',
  telemetry: { latencies, cacheHits },
  };
}


