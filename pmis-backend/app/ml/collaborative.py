"""
PMIS Collaborative Filter (SVD-based)
======================================
Enhancements:
  - retrain_lock: prevents concurrent SVD retrains
  - is_training flag: visible in /feedback/status
  - last_trained_at + training_sample_count: audit trail
  - Thread-safe retrain() method
"""

import threading
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from app.models import db, Application


class CollaborativeFilter:
    def __init__(self):
        self.interaction_counts: dict[int, int] = {}
        self.users:  list = []
        self.items:  list = []
        self.U      = None
        self.sigma  = None
        self.Vt     = None
        self.user_ratings_mean = None
        self.is_trained  = False

        # ── Thread-safety & observability ─────────────────────────────────────
        self.retrain_lock          = threading.Lock()
        self.is_training           = False
        self.last_trained_at:  datetime | None = None
        self.training_sample_count: int        = 0

    # ── Retrain ───────────────────────────────────────────────────────────────

    def retrain(self) -> bool:
        """
        Rebuild the SVD model from the current Application table.
        Thread-safe: concurrent calls block on retrain_lock.
        Returns True if a model was successfully trained, False otherwise.
        """
        if not self.retrain_lock.acquire(blocking=True, timeout=30):
            print("CF retrain: could not acquire lock within 30 s — skipping.")
            return False

        self.is_training = True
        try:
            apps = Application.query.all()
            if not apps:
                self.is_trained = False
                print("CF retrain: no applications found.")
                return False

            status_to_rating = {
                'accepted': 5.0,
                'applied':  3.0,
                'rejected': 1.0,
            }

            data_list = []
            counts:  dict[int, int] = {}

            for app in apps:
                rating = status_to_rating.get(app.status, 3.0)
                data_list.append({
                    'candidate_id':  app.candidate_id,
                    'internship_id': app.internship_id,
                    'rating':        rating,
                })
                counts[app.candidate_id] = counts.get(app.candidate_id, 0) + 1

            self.interaction_counts  = counts
            self.training_sample_count = len(data_list)

            df = pd.DataFrame(data_list)
            pivot = pd.pivot_table(
                df, values='rating',
                index='candidate_id', columns='internship_id',
                fill_value=0.0,
            )

            self.users  = pivot.index.tolist()
            self.items  = pivot.columns.tolist()
            matrix      = pivot.values

            if matrix.shape[0] < 2 or matrix.shape[1] < 2:
                self.is_trained = False
                print("CF retrain: not enough data for SVD.")
                return False

            self.user_ratings_mean = np.mean(matrix, axis=1)
            matrix_demeaned        = matrix - self.user_ratings_mean.reshape(-1, 1)

            U, sigma, Vt = np.linalg.svd(matrix_demeaned, full_matrices=False)
            self.U      = U
            self.sigma  = np.diag(sigma)
            self.Vt     = Vt
            self.is_trained     = True
            self.last_trained_at = datetime.now(timezone.utc)

            print(f"CF Model retrained on {self.training_sample_count} interactions.")
            return True

        except Exception as e:
            print(f"CF retrain error: {e}")
            self.is_trained = False
            return False

        finally:
            self.is_training = False
            self.retrain_lock.release()

    # ── Query helpers ─────────────────────────────────────────────────────────

    def is_cold_start(self, candidate_id) -> bool:
        return self.interaction_counts.get(candidate_id, 0) < 2

    def predict_score(self, candidate_id, internship_id) -> float:
        if not self.is_trained or self.is_cold_start(candidate_id):
            return 0.5
        if candidate_id not in self.users or internship_id not in self.items:
            return 0.5

        user_idx = self.users.index(candidate_id)
        item_idx = self.items.index(internship_id)

        predicted_matrix = (
            np.dot(np.dot(self.U, self.sigma), self.Vt)
            + self.user_ratings_mean.reshape(-1, 1)
        )
        predicted_rating = float(np.clip(predicted_matrix[user_idx, item_idx], 1.0, 5.0))
        return round((predicted_rating - 1.0) / 4.0, 4)   # normalise → [0, 1]

    def get_status(self, candidate_id: int | None = None) -> dict:
        """Return observability dict for /feedback/status endpoint."""
        interactions = self.interaction_counts.get(candidate_id, 0) if candidate_id else 0

        if interactions < 2:
            mode, cf_weight = "content_only", 0.0
            next_threshold  = f"{2 - interactions} more interaction(s) to unlock content-heavy mode"
        elif interactions <= 10:
            mode, cf_weight = "content_heavy", 0.2
            next_threshold  = f"{11 - interactions} more interaction(s) for full hybrid mode"
        else:
            mode, cf_weight = "hybrid", 0.4
            next_threshold  = "Already in full hybrid mode"

        return {
            "interaction_count":     interactions,
            "scoring_mode":          mode,
            "cf_weight":             cf_weight,
            "next_threshold":        next_threshold,
            "is_training":           self.is_training,
            "last_trained_at":       self.last_trained_at.isoformat() if self.last_trained_at else None,
            "training_sample_count": self.training_sample_count,
        }


collaborative_filter = CollaborativeFilter()
