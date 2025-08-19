
import { verifyDrugByQrCode } from '../core/drugInfo';
import { parseGs1DataMatrix } from './gs1';
import { getRecallByGTINorNDC, getLabelingByGTINorNDC } from './openfda';
import { fetchDrugLabelByNDC } from './openfdaDrugInfo';
import { fetchDrugInfoFromScraper } from './webscraperDrugInfo';
import { findLocalRecall } from './localRecalls';

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
}


export async function verifyScannedCode(data: string, type: string): Promise<VerificationResult> {
  // 1. Check local recall lists first (offline, EMA, SAHPRA, NAFDAC, PPB, etc.)
  const localRecall = findLocalRecall(data);
  if (localRecall) {
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall: localRecall,
      label: undefined,
      message: `Product recalled by ${localRecall.source}`,
    };
  }
  // Check MedLink QR authenticity
  if (data.startsWith('MedLink:AUTH:')) {
    const { verified, drug } = await verifyDrugByQrCode(data);
    return {
      verified,
      counterfeit: !verified,
      expired: false,
      message: verified ? 'Authenticity verified via MedLink code' : 'Invalid MedLink authenticity code',
    };
  }

  // Parse DataMatrix for GTIN/expiry
  if (type === 'datamatrix') {
    const parsed = parseGs1DataMatrix(data);
    if (parsed) {
      const expired = parsed.expiry ? parsed.expiry < new Date() : false;
      // Check local recall for GTIN
      const localRecall = findLocalRecall(parsed.gtin);
      if (localRecall) {
        return {
          verified: false,
          counterfeit: false,
          expired,
          recall: localRecall,
          label: undefined,
          message: expired ? 'Product expired' : `Product recalled by ${localRecall.source}`,
        };
      }
      // Always call both openFDA and webscraper for GTIN/NDC
      const [recall, label, labelInfo, webscraperInfo] = await Promise.all([
        getRecallByGTINorNDC(parsed.gtin),
        getLabelingByGTINorNDC(parsed.gtin),
        /^\d{10,11}$/.test(parsed.gtin) ? fetchDrugLabelByNDC(parsed.gtin) : Promise.resolve(null),
        fetchDrugInfoFromScraper(parsed.gtin)
      ]);
      return {
        verified: false, // no authenticity code
        counterfeit: false,
        expired,
        recall,
        label,
        labelInfo,
        webscraperInfo,
        message: expired ? 'Product expired' : (recall ? 'Product recalled' : 'No authenticity data available'),
      };
    }
  }

  // Check NDC codes (UPC/EAN may map to NDC)
  if (/^\d{10,11}$/.test(data)) {
    const localRecall = findLocalRecall(data);
    if (localRecall) {
      return {
        verified: false,
        counterfeit: false,
        expired: false,
        recall: localRecall,
        label: undefined,
        message: `Product recalled by ${localRecall.source}`,
      };
    }
    // Always call both openFDA and webscraper for NDC
    const [recall, label, labelInfo, webscraperInfo] = await Promise.all([
      getRecallByGTINorNDC(data),
      getLabelingByGTINorNDC(data),
      fetchDrugLabelByNDC(data),
      fetchDrugInfoFromScraper(data)
    ]);
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall,
      label,
      labelInfo,
      webscraperInfo,
      message: recall ? 'Product recalled' : 'No authenticity data available',
    };
  }

  return {
    verified: false,
    counterfeit: false,
    expired: false,
    message: 'Unrecognized code format',
  };
}
