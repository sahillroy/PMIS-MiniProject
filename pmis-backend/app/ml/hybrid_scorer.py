from app.models import db, Candidate, Internship
from app.ml.content_based import content_based_recommender
from app.ml.collaborative import collaborative_filter
from app.utils.affirmative_action import affirmative_action_scorer

class HybridScorer:
    
    def get_recommendations(self, candidate_id, top_n=5, candidate_obj=None):
        candidate = candidate_obj if candidate_obj else Candidate.query.get(candidate_id)
        if not candidate:
            return []
            
        # Ensure base models are loaded and trained
        if not content_based_recommender._is_loaded:
            content_based_recommender.load_internships()
            
        if not collaborative_filter.is_trained:
            try:
                collaborative_filter.retrain()
            except Exception as e:
                print(f"Error training CF model: {e}")
            
        # Determine weights based on CF interactions
        if candidate_obj:
            interactions = 0 # Anonymous users have 0 interactions
        else:
            interactions = collaborative_filter.interaction_counts.get(candidate_id, 0)
        
        if interactions < 2:
            cb_weight, cf_weight = 1.0, 0.0
            scoring_mode = "content_only"
        elif interactions <= 10:
            cb_weight, cf_weight = 0.8, 0.2
            scoring_mode = "hybrid"
        else:
            cb_weight, cf_weight = 0.6, 0.4
            scoring_mode = "hybrid"
            
        # Get all CB scores
        cb_results = content_based_recommender.recommend(candidate_id, top_n=10000, candidate_obj=candidate_obj)
        
        hybrid_results = []
        
        for cb in cb_results:
            internship_id = cb['internship_id']
            content_score = cb['final_score']
            
            # Calculate CF Score
            if scoring_mode == "content_only":
                cf_score = 0.5
            else:
                cf_score = collaborative_filter.predict_score(candidate_id, internship_id)
                
            # Base Hybrid Score
            hybrid_score = (cb_weight * content_score) + (cf_weight * cf_score)
            
            # Affirmative Action Boost
            boosted_score, boost_breakdown = affirmative_action_scorer.apply_boost(candidate, hybrid_score)
            
            # Construct reasons dict combining CB reasons + affirmative boost
            reasons = cb['reasons'].copy()
            reasons['affirmative_action'] = boost_breakdown
            
            # Fetch remaining detail fields directly from DB
            internship_db = Internship.query.get(internship_id)
            location = f"{internship_db.location_city}, {internship_db.location_state}" if internship_db.location_city else internship_db.location_state
            
            hybrid_results.append({
                "internship_id": internship_id,
                "company": cb['company'],
                "role": cb['role'],
                "sector": internship_db.sector,
                "location": location,
                "stipend_monthly": internship_db.stipend_monthly,
                "match_percentage": int(boosted_score * 100),
                "content_score": round(content_score, 4),
                "cf_score": round(cf_score, 4),
                "affirmative_boost": boost_breakdown.get('total_boost', 0.0),
                "final_score": round(boosted_score, 4),
                "reasons": reasons,
                "scoring_mode": scoring_mode
            })
            
        # Sort by best matching
        hybrid_results.sort(key=lambda x: x['final_score'], reverse=True)
        return hybrid_results[:top_n]

hybrid_scorer = HybridScorer()
