export interface Gs1DataMatrix {
  gtin: string;
  expiry?: Date;
  lot?: string;
}

export function parseGs1DataMatrix(raw: string): Gs1DataMatrix | null {
  // Look for AI (01)GTIN-14, (17)YYMMDD, (10)batch until next AI or end
  const aiPattern = /\((\d{2})\)([^()]+)/g;
  let match;
  const gs1: Partial<Gs1DataMatrix> = {};
  while ((match = aiPattern.exec(raw)) !== null) {
    const [, ai, value] = match;
    switch (ai) {
      case '01':
        gs1.gtin = value.substring(0, 14);
        break;
      case '17': {
        // YYMMDD: convert to Date, assuming 20YY
        const year = parseInt(value.substring(0, 2), 10) + 2000;
        const month = parseInt(value.substring(2, 4), 10) - 1;
        const day = parseInt(value.substring(4, 6), 10);
        gs1.expiry = new Date(year, month, day);
        break;
      }
      case '10':
        gs1.lot = value;
        break;
      // add more AIs if needed
    }
  }
  return gs1.gtin ? (gs1 as Gs1DataMatrix) : null;
}
