export interface RecallNotice {
  source: string;       // e.g. 'EMA', 'SAHPRA', 'NAFDAC', 'PPB', 'WHO_GSMS'
  code: string;         // GTIN, NDC or national identifier
  reason: string;
  status?: string;
  url?: string;         // link to the official notice
}

export type RecallDatabase = RecallNotice[];
