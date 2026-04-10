export interface CandidateProfile {
  id?: number;
  name: string;
  education_level: string;
  field_of_study: string;
  cgpa: number;
  skills: string[];
  sector_interests: string[];
  state: string;
  district: string;
  is_rural: boolean;
  category: string;
  has_prior_internship: boolean;
}

export interface Internship {
  id: number;
  company: string;
  role: string;
  sector: string;
  location_state: string;
  location_city?: string;
  stipend_monthly: number;
  total_slots: number;
  filled_slots: number;
  is_active: boolean;
}

export interface RecommendationBreakdown {
  score: number;
  reason?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  slots_available?: number;
}

export interface AffirmativeBoost {
  reason: string;
  boost: number;
}

export interface Recommendation {
  internship_id: number;
  company: string;
  role: string;
  sector: string;
  location: string;
  stipend_monthly: number;
  match_percentage: number;
  content_score: number;
  cf_score: number;
  affirmative_boost: number;
  final_score: number;
  scoring_mode: string;
  reasons: {
    skill_match?: RecommendationBreakdown;
    education_match?: RecommendationBreakdown;
    sector_match?: RecommendationBreakdown;
    location_match?: RecommendationBreakdown;
    capacity?: RecommendationBreakdown;
    affirmative_action?: {
      affirmative_boosts_applied: AffirmativeBoost[];
      total_boost: number;
      note: string;
    };
  };
}

export enum WizardStep {
  EDUCATION = 1,
  SKILLS = 2,
  SECTOR = 3,
  LOCATION = 4
}

export enum SkillCategory {
  IT = 'IT/Software',
  MANUFACTURING = 'Manufacturing',
  HEALTHCARE = 'Healthcare',
  RETAIL = 'Retail',
  AGRICULTURE = 'Agriculture',
  EDUCATION = 'Education',
  FINANCE = 'Finance/Banking',
  TOURISM = 'Tourism'
}
