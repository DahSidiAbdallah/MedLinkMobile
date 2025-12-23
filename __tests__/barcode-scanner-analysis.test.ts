/**
 * MedLink Barcode Scanner Analysis Test
 * Comprehensive test of barcode scanning, drug verification, and safety checking
 */

import { normalizeBarcode, parseGs1AIs, validateEAN13CheckDigit, getGtinFromAIs } from '../src/core/barcode';
import { verifyScannedCode } from '../src/utils/verification';

// Mock external dependencies
jest.mock('../src/utils/openfda', () => ({
  getRecallByGTINorNDC: jest.fn(async (code: string
    