from app.models import db, Candidate, Internship
from app.ml.content_based import content_based_recommender
from app.ml.collaborative import collaborative_filter
from app.utils.affirmative_action import affirmative_action_scorer


class HybridScorer:

    def get_recommendations(
        self,
        candidate_id=None,
        top_n: int = 5,
        candidate_obj=None,
        min_stipend: int = 0,
    ) -> list[dict]:
        """
        candidate_id  : int | None  — DB id for saved candidates
        candidate_obj : Candidate   — transient object for anonymous / verify flows
        top_n         : int         — max results
        min_stipend   : int         — monthly stipend floor; passed through to
                        content_based recommender. 0 = no filter (default).
                        Existing callers that omit the param are unaffected.
        """
        candidate = candidate_obj if candidate_obj else Candidate.query.get(candidate_id)
        if not candidate:
            return []

        # Ensure models are ready
        if not content_based_recommender._is_loaded:
            content_based_recommender.load_internships()
        if not collaborative_filter.is_trained:
            try:
                collaborative_filter.retrain()
            except Exception as e:
                print(f"Error training CF model: {e}")

        # Determine CB/CF blend weights
        if candidate_obj:
            interactions = 0
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

        # Content-based pass — fetch a large pool, stipend filter applied inside
        cb_results = content_based_recommender.recommend(
            candidate_id=None,
            candidate_obj=candidate,
            top_n=10000,
            min_stipend=min_stipend,       # ← pass through
        )

        hybrid_results: list[dict] = []

        for cb in cb_results:
            internship_id = cb['internship_id']
            content_score = cb['final_score']

            cf_score = (
                0.5 if scoring_mode == "content_only"
                else collaborative_filter.predict_score(candidate_id, internship_id)
            )

            hybrid_score = (cb_weight * content_score) + (cf_weight * cf_score)
            boosted_score, boost_breakdown = affirmative_action_scorer.apply_boost(
                candidate, hybrid_score
            )

            reasons = cb['reasons'].copy()
            reasons['affirmative_action'] = boost_breakdown

            internship_db = Internship.query.get(internship_id)
            if not internship_db:
                continue
            location = (
                f"{internship_db.location_city}, {internship_db.location_state}"
                if internship_db.location_city
                else internship_db.location_state
            )

            result = {
                "internship_id":    internship_id,
                "company":          cb['company'],
                "role":             cb['role'],
                "sector":           internship_db.sector,
                "required_skills":  cb.get('required_skills', []),
                "location":         location,
                "stipend_monthly":  internship_db.stipend_monthly,
                "match_percentage": int(boosted_score * 100),
                "content_score":    round(content_score, 4),
                "cf_score":         round(cf_score, 4),
                "affirmative_boost": boost_breakdown.get('total_boost', 0.0),
                "final_score":      round(boosted_score, 4),
                "reasons":          reasons,
                "scoring_mode":     scoring_mode,
            }

            # Surface stipend fields from CB result (only present when min_stipend > 0)
            if 'min_stipend_met' in cb:
                result['min_stipend_met'] = cb['min_stipend_met']
            if 'stipend_warning' in cb:
                result['stipend_warning'] = cb['stipend_warning']

            hybrid_results.append(result)

        hybrid_results.sort(key=lambda x: x['final_score'], reverse=True)
        return hybrid_results[:top_n]


hybrid_scorer = HybridScorer()
