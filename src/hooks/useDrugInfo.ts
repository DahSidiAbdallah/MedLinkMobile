import { useState } from 'react';
import { searchDrug, getDrugSuggestions, getDrugSuggestionsAsync, verifyDrugByQrCode, DataMedication } from '../core/drugInfo';

export function useDrugInfo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const searchDrugHook = async (query: string): Promise<DataMedication | null> => {
    setLoading(true);
    setError(null);
    try {
      return await searchDrug(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drug information');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Instant local suggestions for responsive UI, then refresh from Firestore
  const getSuggestions = (query: string): string[] => {
    const instant = getDrugSuggestions(query);
    setSuggestions(instant);
    // Async refresh from Firestore in background
    getDrugSuggestionsAsync(query).then(remote => {
      if (remote.length > 0) setSuggestions(remote);
    });
    return instant;
  };

  const verifyByQrCode = async (qrData: string): Promise<{
    drug: DataMedication | null;
    verified: boolean;
    message: string;
    similarityScore?: number;
    imageMatch?: boolean;
  }> => {
    setLoading(true);
    setError(null);
    try {
      return await verifyDrugByQrCode(qrData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify drug');
      return { drug: null, verified: false, message: 'Verification failed' };
    } finally {
      setLoading(false);
    }
  };

  return { searchDrug: searchDrugHook, getSuggestions, verifyByQrCode, suggestions, loading, error };
}
