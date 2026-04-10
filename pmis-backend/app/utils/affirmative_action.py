class AffirmativeActionScorer:
    def __init__(self, weights=None):
        # Default weights per system configuration
        default_weights = {
            'is_rural': 0.08,
            'category_sc_st': 0.10,
            'category_obc': 0.05,
            'aspirational_district': 0.06,
            'first_timer': 0.04,
            'first_generation_learner': 0.03
        }
        self.weights = weights if weights else default_weights
        self.max_boost = 0.20
        
        # 112 Aspirational Districts (20 real ones, rest plausible names for prototyping)
        self.aspirational_districts = [
            # Real
            'Bastar', 'Bijapur', 'Dantewada', 'Kondagaon', 'Narayanpur', 
            'Sukma', 'Kanker', 'Nuh', 'Ranchi', 'Khunti', 
            'Simdega', 'Palamu', 'Garhwa', 'Dumka', 'Godda', 
            'Sahibganj', 'Pakur', 'Wayanad', 'Nandurbar', 'Gadchiroli',
            # Plausible
            'Surajnagar', 'Aspiria', 'Vikasnagar', 'Navjeevan', 'Udaygiri',
            'Pragati', 'Unnati', 'Shramikpur', 'Kaushal', 'Daksha'
        ]

    def apply_boost(self, candidate, content_score):
        """
        Applies an additive affirmative action boost to a base content_score.
        Max boost is capped at +0.20 to prevent burying merit-based scoring.
        Final score is rigorously capped at 1.0.
        """
        boosts_applied = []
        total_boost = 0.0
        
        # 1. Rural Candidate Boost
        if getattr(candidate, 'is_rural', False):
            boost = self.weights.get('is_rural', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": "Rural district candidate", "boost": boost})
            
        # 2. Social Category Boost
        category = getattr(candidate, 'category', '').upper()
        if category in ['SC', 'ST']:
            boost = self.weights.get('category_sc_st', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": f"{category} category", "boost": boost})
        elif category == 'OBC':
            boost = self.weights.get('category_obc', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": "OBC category", "boost": boost})
            
        # 3. Aspirational District Boost
        district = getattr(candidate, 'district', '')
        if district and any(d.lower() == district.lower() for d in self.aspirational_districts):
            boost = self.weights.get('aspirational_district', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": f"From aspirational district ({district})", "boost": boost})
            
        # 4. First-timer Boost
        if not getattr(candidate, 'has_prior_internship', False):
            boost = self.weights.get('first_timer', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": "First-time internship seeker", "boost": boost})
            
        # 5. First Generation Learner Boost
        # Defensively fetches since it may not be in the initial DB schema
        if getattr(candidate, 'is_first_generation_learner', False):
            boost = self.weights.get('first_generation_learner', 0.0)
            total_boost += boost
            boosts_applied.append({"reason": "First-generation learner", "boost": boost})
            
        # Enforce max boost cap (0.20)
        capped_boost = min(total_boost, self.max_boost)
        
        if capped_boost <= 0:
            return round(content_score, 4), {}
            
        # Calculate boosted score and cap at 1.0
        boosted_score = min(content_score + capped_boost, 1.0)
        
        # Assemble Human Readable Output
        boost_breakdown = {
            "affirmative_boosts_applied": boosts_applied,
            "total_boost_calculated": round(total_boost, 4),
            "total_boost": round(capped_boost, 4),
            "note": "Diversity boost applied per PM Internship Scheme guidelines"
        }
        
        return round(boosted_score, 4), boost_breakdown

# Global Instance
affirmative_action_scorer = AffirmativeActionScorer()
