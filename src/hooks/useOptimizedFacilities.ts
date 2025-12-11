import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, Query } from 'firebase/firestore';
import type { Facility } from '../types';

// Optimized hook with query capabilities
export function useOptimizedFacilities(filters?: {
  type?: 'clinic' | 'hospital' | 'pharmacy';
  search?: string;
  limit?: number;
}) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacilities() {
      setLoading(true);
      try {
        let facilitiesQuery: Query = collection(db, 'facilities');
        
        // Add filters if provided (requires composite indexes for multiple fields)
        const constraints = [];
        
        if (filters?.type) {
          constraints.push(where('type', '==', filters.type));
        }
        
        if (filters?.limit) {
          constraints.push(limit(filters.limit));
        }
        
        // Note: If adding search + type filter together, create composite index:
        // Console will show error with link to create it automatically
        if (constraints.length > 0) {
          facilitiesQuery = query(facilitiesQuery, ...constraints);
        }
        
        const querySnapshot = await getDocs(facilitiesQuery);
        let data: Facility[] = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Facility[];
        
        // Client-side search (can be optimized with Algolia for large datasets)
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          data = data.filter(f => 
            f.name.toLowerCase().includes(searchLower) ||
            f.address?.toLowerCase().includes(searchLower) ||
            f.specialty?.toLowerCase().includes(searchLower)
          );
        }
        
        setFacilities(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load facilities');
      } finally {
        setLoading(false);
      }
    }
    fetchFacilities();
  }, [filters?.type, filters?.search, filters?.limit]);

  // Memoized filtered results
  const filteredData = useMemo(() => {
    if (!filters) return facilities;
    
    return facilities.filter(f => {
      if (filters.type && f.type !== filters.type) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return f.name.toLowerCase().includes(searchLower) ||
               f.address?.toLowerCase().includes(searchLower) ||
               f.specialty?.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [facilities, filters]);

  return { 
    facilities: filteredData, 
    loading, 
    error,
    clinics: filteredData.filter(f => f.type === 'clinic'),
    hospitals: filteredData.filter(f => f.type === 'hospital'),
    pharmacies: filteredData.filter(f => f.type === 'pharmacy'),
  };
}
