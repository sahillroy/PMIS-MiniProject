import axios from 'axios';
import type { CandidateProfile, Recommendation, Application, Stats } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add generic logging or loading state config
apiClient.interceptors.request.use(config => {
  return config;
});

// Response interceptor: normalise errors safely
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Normalise error object return structure
    let errorMessage = "Something went wrong. Try again.";
    
    if (!error.response) {
      errorMessage = "Could not connect. Please check your internet.";
    } else if (error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export const api = {
  getRecommendations: async (profile: CandidateProfile): Promise<Recommendation[]> => {
    const response = await apiClient.post<{recommendations: Recommendation[]}>('/recommend/', { profile });
    return response.data.recommendations;
  },
  
  createProfile: async (profile: CandidateProfile): Promise<{candidate_id: number}> => {
    const response = await apiClient.post('/profile/create', profile);
    return response.data;
  },

  applyToInternship: async (candidateId: number, internshipId: number): Promise<Application> => {
    const response = await apiClient.post('/apply/', { candidate_id: candidateId, internship_id: internshipId });
    return response.data;
  },

  getStats: async (): Promise<Stats> => {
    const response = await apiClient.get('/stats');
    return response.data;
  }
};
