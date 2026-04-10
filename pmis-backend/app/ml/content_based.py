import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models import db, Candidate, Internship

class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.education_hierarchy = {
            '10th': 1,
            '12th': 2,
            'ITI': 3,
            'Diploma': 4,
            'Graduate': 5,
            'Postgraduate': 6
        }
        
        # Mapping for related sectors to give partial credit (score 0.5)
        self.sector_relations = {
            'IT/Software': ['Telecommunications', 'E-commerce', 'Media'],
            'Manufacturing': ['Automotive', 'Logistics', 'Food Processing'],
            'Healthcare': ['Pharmaceuticals', 'NGO/Social Work'],
            'Retail': ['E-commerce', 'FMCG'],
            'Agriculture': ['Food Processing'],
            'Education': ['NGO/Social Work'],
            'Finance/Banking': ['Real Estate'],
            'Tourism': ['Hospitality', 'Aviation']
        }
        
        self.internships_data = []
        self.internship_tfidf = None
        self._is_loaded = False

    def load_internships(self):
        """Loads all active internships from DB at startup and caches them."""
        # Using context since this might be called outside request context initially
        internships = Internship.query.filter_by(is_active=True).all()
        self.internships_data = []
        
        for i in internships:
            skills_str = " ".join(i.required_skills) if i.required_skills else ""
            self.internships_data.append({
                'id': i.id,
                'company': i.company,
                'role': i.role,
                'sector': i.sector,
                'required_skills': i.required_skills or [],
                'skills_text': skills_str,
                'min_education': i.min_education,
                'preferred_field': i.preferred_field,
                'location_state': i.location_state,
                'total_slots': i.total_slots,
                'filled_slots': i.filled_slots,
            })
            
        corpus = [i['skills_text'] for i in self.internships_data]
        if corpus:
            self.internship_tfidf = self.vectorizer.fit_transform(corpus)
        else:
            self.internship_tfidf = None
            
        self._is_loaded = True

    def _calculate_skill_match(self, candidate_skills, internship_dict, index):
        if not candidate_skills or not internship_dict['required_skills']:
            return 0.0, [], internship_dict['required_skills']
            
        cand_skills_str = " ".join(candidate_skills)
        cand_vector = self.vectorizer.transform([cand_skills_str])
        
        if self.internship_tfidf is not None:
            similarity = cosine_similarity(cand_vector, self.internship_tfidf[index:index+1])[0][0]
        else:
            similarity = 0.0
            
        cand_set = set([s.lower().strip() for s in candidate_skills])
        
        matched = [s for s in internship_dict['required_skills'] if s.lower().strip() in cand_set]
        missing = [s for s in internship_dict['required_skills'] if s.lower().strip() not in cand_set]
        
        return float(similarity), matched, missing

    def _calculate_education_match(self, cand_edu, req_edu):
        if not req_edu:
            return 1.0, "No specific education required"
        if not cand_edu:
            return 0.0, "Candidate education not provided"
            
        cand_level = self.education_hierarchy.get(cand_edu, 0)
        req_level = self.education_hierarchy.get(req_edu, 0)
        
        if cand_level >= req_level:
            return 1.0, f"{cand_edu} meets or exceeds {req_edu} requirement"
        elif cand_level == req_level - 1:
            return 0.5, f"{cand_edu} is one level below {req_edu} requirement"
        else:
            return 0.0, f"{cand_edu} is significantly below {req_edu} requirement"

    def _calculate_sector_match(self, cand_sectors, req_sector):
        if not req_sector:
            return 1.0, "Internship has no specific sector."
        if not cand_sectors:
            return 0.0, "No candidate sector preferences matched."
            
        if req_sector in cand_sectors:
            return 1.0, f"{req_sector} sector exactly matches your interests."
            
        related = self.sector_relations.get(req_sector, [])
        for cs in cand_sectors:
            if cs in related or req_sector in self.sector_relations.get(cs, []):
                return 0.5, f"{req_sector} is related to your interested sectors."
                
        return 0.0, f"{req_sector} does not match your sector interests."

    def _calculate_location_match(self, cand_state, req_state):
        if not req_state:
            return 1.0, "Internship has no strict location preference."
        
        if not cand_state or cand_state.lower() == 'pan-india':
            return 0.6, "Candidate prefers pan-India location."
            
        if cand_state.lower() == req_state.lower():
            return 1.0, f"Located in {req_state}, perfectly matching your state."
        else:
            return 0.3, f"Located in {req_state}, different from {cand_state}."

    def _calculate_capacity_check(self, total, filled):
        if not total or total <= 0:
            return 0.0, 0
        if filled >= total:
            return 0.0, 0
        score = (total - filled) / total
        return float(score), (total - filled)

    def recommend(self, candidate_id, top_n=5):
        if not self._is_loaded:
            self.load_internships()
            
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return []
            
        recommendations = []
        for idx, internship in enumerate(self.internships_data):
            # 1. Skill Match (35%)
            skill_score, matched_skills, missing_skills = self._calculate_skill_match(
                candidate.skills, internship, idx)
                
            # 2. Education Match (25%)
            edu_score, edu_reason = self._calculate_education_match(
                candidate.education_level, internship['min_education'])
                
            # 3. Sector Match (20%)
            sector_score, sector_reason = self._calculate_sector_match(
                candidate.sector_interests, internship['sector'])
                
            # 4. Location Match (15%)
            loc_score, loc_reason = self._calculate_location_match(
                candidate.state, internship['location_state'])
                
            # 5. Capacity Check (5%)
            cap_score, slots_avail = self._calculate_capacity_check(
                internship['total_slots'], internship['filled_slots'])
                
            # Skip full internships entirely
            if cap_score == 0.0:
                continue
                
            # Weighted calculation
            final_score = (
                skill_score * 0.35 +
                edu_score * 0.25 +
                sector_score * 0.20 +
                loc_score * 0.15 +
                cap_score * 0.05
            )
            
            reasons = {
                "skill_match": {
                    "score": round(skill_score, 2), 
                    "matched_skills": matched_skills, 
                    "missing_skills": missing_skills
                },
                "education_match": {
                    "score": round(edu_score, 2), 
                    "reason": edu_reason
                },
                "sector_match": {
                    "score": round(sector_score, 2), 
                    "reason": sector_reason
                },
                "location_match": {
                    "score": round(loc_score, 2), 
                    "reason": loc_reason
                },
                "capacity": {
                    "score": round(cap_score, 2), 
                    "slots_available": slots_avail
                }
            }
            
            recommendations.append({
                "internship_id": internship['id'],
                "company": internship['company'],
                "role": internship['role'],
                "final_score": round(final_score, 4),
                "reasons": reasons
            })
            
        recommendations.sort(key=lambda x: x['final_score'], reverse=True)
        return recommendations[:top_n]

# Global instance
content_based_recommender = ContentBasedRecommender()

