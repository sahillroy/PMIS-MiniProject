"""
PMIS Hybrid Scorer
===================
Enhancements:
  - min_stipend pass-through (Slot 2)
  - compute_confidence_band(): ±uncertainty range based on scoring mode (Slot 5)
  - Every recommendation now includes a 'confidence' field
"""

from app.models import db, Candidate, Internship
from app.ml.content_based import content_based_recommender
from app.ml.collaborative import collaborative_filter
from app.utils.affirmative_action import affirmative_action_scorer


class HybridScorer:

    # ── Confidence band ───────────────────────────────────────────────────────

    def compute_confidence_band(
        self,
        match_percentage: int,
        content_score:    float,
        scoring_mode:     str,
        num_candidate_skills: int = 0,
    ) -> dict:
        """
        Returns a confidence dict with lower/upper bounds and notes.

        Base uncertainty by mode (cold-start = widest):
          content_only  → ±12 %
          content_heavy → ±7 %
          hybrid        → ±4 %

        Adjustments:
          content_score < 0.5            → +3 % (low base match)
          fewer than 3 candidate skills  → +2 % (sparse profile)
          content_score > 0.9            → −2 % (very high match)
        """
        base: dict[str, float] = {
            "content_only":  0.12,
            "content_heavy": 0.07,
            "hybrid":        0.04,
        }
        uncertainty = base.get(scoring_mode, 0.12)

        if content_score < 0.5:
            uncertainty += 0.03
        if num_candidate_skills < 3:
            uncertainty += 0.02
        if content_score > 0.9:
            uncertainty -= 0.02

        uncertainty = min(uncertainty, 0.15)
        band_pts    = round(uncertainty * 100)

        lower = max(0,   match_percentage - band_pts)
        upper = min(100, match_percentage + band_pts)

        mode_label = (
            "Personalised match"   if scoring_mode == "hybrid"
            else "Profile-based match"
        )
        note = (
            f"Estimated {lower}–{upper}% match. "
            + ("More interactions improve accuracy." if scoring_mode != "hybrid"
               else "Based on your interaction history.")
        )

        return {
            "match_percentage":   match_percentage,
            "confidence_lower":   lower,
            "confidence_upper":   upper,
            "confidence_note":    note,
            "scoring_mode_label": mode_label,
        }

    # ── Main recommendation pipeline ──────────────────────────────────────────

    def get_recommendations(
        self,
        candidate_id=None,
        top_n:        int = 5,
        candidate_obj=None,
        min_stipend:  int = 0,
    ) -> list[dict]:
        """
        Parameters
        ----------
        candidate_id  : DB id for saved candidates
        candidate_obj : transient Candidate for anonymous / verify flows
        top_n         : max results
        min_stipend   : monthly stipend floor; 0 = no filter (backward-compatible)
        """
        candidate = candidate_obj if candidate_obj else Candidate.query.get(candidate_id)
        if not candidate:
            return []

        # ── Ensure models are ready ───────────────────────────────────────────
        if not content_based_recommender._is_loaded:
            content_based_recommender.load_internships()
        if not collaborative_filter.is_trained:
            try:
                collaborative_filter.retrain()
            except Exception as e:
                print(f"Error training CF model: {e}")

        # ── Determine blend weights ───────────────────────────────────────────
        interactions = (
            0 if candidate_obj
            else collaborative_filter.interaction_counts.get(candidate_id, 0)
        )

        if interactions < 2:
            cb_weight, cf_weight = 1.0, 0.0
            scoring_mode = "content_only"
        elif interactions <= 10:
            cb_weight, cf_weight = 0.8, 0.2
            scoring_mode = "content_heavy"
        else:
            cb_weight, cf_weight = 0.6, 0.4
            scoring_mode = "hybrid"

        # ── Content-based pass (includes stipend filter) ──────────────────────
        cb_results = content_based_recommender.recommend(
            candidate_id=None,
            candidate_obj=candidate,
            top_n=10000,
            min_stipend=min_stipend,
        )

        # Number of candidate skills for confidence-band calculation
        num_skills = len(content_based_recommender._parse_skills(candidate.skills))

        hybrid_results: list[dict] = []

        for cb in cb_results:
            internship_id = cb['internship_id']
            content_score = cb['final_score']

            cf_score = (
                0.5 if scoring_mode == "content_only"
                else collaborative_filter.predict_score(candidate_id, internship_id)
            )

            hybrid_score                     = (cb_weight * content_score) + (cf_weight * cf_score)
            boosted_score, boost_breakdown   = affirmative_action_scorer.apply_boost(candidate, hybrid_score)

            match_pct = int(boosted_score * 100)

            # ── Confidence band ───────────────────────────────────────────────
            confidence = self.compute_confidence_band(
                match_percentage      = match_pct,
                content_score         = content_score,
                scoring_mode          = scoring_mode,
                num_candidate_skills  = num_skills,
            )

            reasons = cb['reasons'].copy()
            reasons['affirmative_action'] = boost_breakdown
            reasons['confidence'] = {
                "band":  f"{confidence['confidence_lower']}–{confidence['confidence_upper']}%",
                "note":  confidence['confidence_note'],
                "label": confidence['scoring_mode_label'],
            }

            internship_db = Internship.query.get(internship_id)
            if not internship_db:
                continue
            location = (
                f"{internship_db.location_city}, {internship_db.location_state}"
                if internship_db.location_city else internship_db.location_state
            )

            result: dict = {
                "internship_id":    internship_id,
                "company":          cb['company'],
                "role":             cb['role'],
                "sector":           internship_db.sector,
                "required_skills":  cb.get('required_skills', []),
                "location":         location,
                "stipend_monthly":  internship_db.stipend_monthly,
                "match_percentage": match_pct,
                "content_score":    round(content_score, 4),
                "cf_score":         round(cf_score, 4),
                "affirmative_boost": boost_breakdown.get('total_boost', 0.0),
                "final_score":      round(boosted_score, 4),
                "confidence":       confidence,      # ← Slot 5 addition
                "reasons":          reasons,
                "scoring_mode":     scoring_mode,
            }

            # Surface stipend fields from CB result (present only when min_stipend > 0)
            if 'min_stipend_met' in cb:
                result['min_stipend_met'] = cb['min_stipend_met']
            if 'stipend_warning' in cb:
                result['stipend_warning'] = cb['stipend_warning']

            hybrid_results.append(result)

        hybrid_results.sort(key=lambda x: x['final_score'], reverse=True)
        return hybrid_results[:top_n]


hybrid_scorer = HybridScorer()
