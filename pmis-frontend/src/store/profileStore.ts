import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../api/client';
import type { Recommendation, CandidateProfile } from '../types';

export interface CandidateState {
  education_level: string;
  field_of_study: string;
  cgpa: string;
  skills: string[];
  sector_interests: string[];
  preferred_state: string;
  open_to_pan_india: boolean;
  category: string;
  is_rural: boolean;
  district: string;
  name: string;
  phone: string;
  currentStep: number;
  min_stipend_preference: number;  // Phase 3 · Slot 1
  sessionFeedbackCount: number;
}

interface ProfileStore extends CandidateState {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  
  setField: <K extends keyof CandidateState>(key: K, value: CandidateState[K]) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  fetchRecommendations: () => Promise<void>;
  applyToInternshipLocal: (internshipId: number) => void;
  loadDemoProfile: () => void;
  incrementSessionFeedbackCount: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      education_level: '',
      field_of_study: '',
      cgpa: '',
      skills: [],
      sector_interests: [],
      preferred_state: '',
      open_to_pan_india: false,
      category: '',
      is_rural: false,
      district: '',
      name: '',
      phone: '',
      currentStep: 1,
      min_stipend_preference: 0,
      sessionFeedbackCount: 0,

      recommendations: [],
      isLoading: false,
      error: null,
      hasSearched: false,

      setField: (key, value) => set((state) => ({ ...state, [key]: value })),
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      incrementSessionFeedbackCount: () => set((state) => ({ sessionFeedbackCount: state.sessionFeedbackCount + 1 })),
      
      loadDemoProfile: () => set({
        education_level: '12th',           // matches DB enum: 10th|12th|ITI|Diploma|Graduate
        field_of_study: 'Arts',
        skills: ['Communication', 'Data Entry', 'MS Office'],
        sector_interests: ['Retail', 'Agriculture'],
        preferred_state: 'Maharashtra',
        open_to_pan_india: false,
        category: 'ST',
        is_rural: true,
        district: 'Nagpur',
        name: 'Demo Candidate',
        currentStep: 4
      }),

      fetchRecommendations: async () => {
        const state = get();
        set({ isLoading: true, error: null, hasSearched: true });
        
        try {
          const profilePayload = {
            education_level: state.education_level || "Graduate",
            field_of_study: state.field_of_study || "Computer Science",
            skills: state.skills.length > 0 ? state.skills : ["General"],
            sector_interests: state.sector_interests,
            state: state.preferred_state,
            category: state.category || "General",
            is_rural: state.is_rural,
            min_stipend_preference: state.min_stipend_preference ?? 0,
          } as unknown as CandidateProfile;
          
          const results = await api.getRecommendations(profilePayload);
          set({ recommendations: results, isLoading: false });
        } catch (err: any) {
          set({ 
            error: err.message || 'Something went wrong. Try again.', 
            isLoading: false,
            recommendations: [] 
          });
        }
      },

      applyToInternshipLocal: (id: number) => {
        // Used to optimistically update UI without heavy refetches
        console.log(`Marked internship ${id} as applied locally.`);
      }
    }),
    {
      name: 'pmis-profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        education_level: state.education_level,
        field_of_study: state.field_of_study,
        skills: state.skills,
        sector_interests: state.sector_interests,
        preferred_state: state.preferred_state,
        open_to_pan_india: state.open_to_pan_india,
        category: state.category,
        is_rural: state.is_rural,
        district: state.district,
        currentStep: state.currentStep,
        min_stipend_preference: state.min_stipend_preference,
      }), // Strip error/loading states from persistent storage
    }
  )
);
