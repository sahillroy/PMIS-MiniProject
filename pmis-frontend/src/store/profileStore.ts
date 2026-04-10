import { create } from 'zustand';

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
}

interface ProfileStore extends CandidateState {
  setField: <K extends keyof CandidateState>(key: K, value: CandidateState[K]) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
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

  setField: (key, value) => set((state) => ({ ...state, [key]: value })),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) }))
}));
