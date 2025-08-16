import { useState } from 'react';
import { searchDrug, getDrugSuggestions, verifyDrugByQrCode, DataMedication } from '../core/drugInfo';

export function useDrugInfo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const searchDrugHook = async (query: string): Promise<DataMedication | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchDrug(query);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drug information');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = (query: string): string[] => {
    const matches = getDrugSuggestions(query);
    setSuggestions(matches);
    return matches;
  };

  const verifyByQrCode = async (qrData: string): Promise<{ drug: DataMedication | null; verified: boolean; message: string; similarityScore?: number; imageMatch?: boolean }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyDrugByQrCode(qrData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify drug');
      return {
        drug: null,
        verified: false,
        message: 'Verification failed'
      };
    } finally {
      setLoading(false);
    }
  };

  return { searchDrug: searchDrugHook, getSuggestions, verifyByQrCode, suggestions, loading, error };
}
