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
  min_stipend_preference?: number;  // Phase 3 · Slot 1
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

export interface NSDCCourse {
  skill: string;
  course_name: string;
  url: string;
  duration: string;
  free: boolean;
}

export interface ConfidenceBand {
  match_percentage: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_note: string;
  scoring_mode_label: string;
}

export interface RecommendationBreakdown {
  score: number;
  reason?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  skill_gap_percentage?: number;
  courses_for_missing?: NSDCCourse[];
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
  required_skills?: string[];
  location: string;
  stipend_monthly: number;
  match_percentage: number;
  content_score: number;
  cf_score: number;
  affirmative_boost: number;
  final_score: number;
  scoring_mode: string;
  confidence?: ConfidenceBand;
  min_stipend_met?: boolean;
  stipend_warning?: string;
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
    confidence?: {
      band: string;
      note: string;
      label: string;
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

export interface Application {
  application_id: number;
  status: string;
}

export interface Stats {
  total_candidates: number;
  total_internships: number;
}
