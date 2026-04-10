import { useEffect } from 'react';
import { useProfileStore } from '../store/profileStore';

export function useRecommendations() {
  const store = useProfileStore();

  useEffect(() => {
    // If the store is populated but results are missing (like after a hardware reload), refetch automatically!
    if (store.recommendations.length === 0) {
      store.fetchRecommendations();
    }
  }, []); // Run on component mount

  return {
    recommendations: store.recommendations,
    isLoading: store.isLoading,
    error: store.error,
    hasSearched: store.hasSearched,
    fetchRecommendations: store.fetchRecommendations,
    applyToInternshipLocal: store.applyToInternshipLocal
  };
}
