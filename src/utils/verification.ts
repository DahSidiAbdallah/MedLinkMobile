import { verifyDrugByQrCode } from '../core/drugInfo';
import { parseGs1DataMatrix } from './gs1';
import { getRecallByGTINorNDC, getLabelingByGTINorNDC } from './openfda';

export interface VerificationResult {
  verified: boolean;
  counterfeit: boolean;
  expired: boolean;
  recall?: any;
  label?: any;
  message: string;
}

export async function verifyScannedCode(data: string, type: string): Promise<VerificationResult> {
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
      const recall = await getRecallByGTINorNDC(parsed.gtin);
      const label = await getLabelingByGTINorNDC(parsed.gtin);
      return {
        verified: false, // no authenticity code
        counterfeit: false,
        expired,
        recall,
        label,
        message: expired ? 'Product expired' : (recall ? 'Product recalled' : 'No authenticity data available'),
      };
    }
  }

  // Check NDC codes (UPC/EAN may map to NDC)
  if (/^\d{10,11}$/.test(data)) {
    const recall = await getRecallByGTINorNDC(data);
    const label = await getLabelingByGTINorNDC(data);
    return {
      verified: false,
      counterfeit: false,
      expired: false,
      recall,
      label,
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
