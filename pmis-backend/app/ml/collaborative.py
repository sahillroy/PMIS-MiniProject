import numpy as np
import pandas as pd
from app.models import db, Application

class CollaborativeFilter:
    def __init__(self):
        self.interaction_counts = {}
        self.users = []
        self.items = []
        self.U = None
        self.sigma = None
        self.Vt = None
        self.user_ratings_mean = None
        self.is_trained = False
        
    def retrain(self):
        apps = Application.query.all()
        if not apps:
            self.is_trained = False
            return
            
        status_to_rating = {
            'accepted': 5.0,
            'applied': 3.0,
            'rejected': 1.0
        }
        
        data_list = []
        counts = {}
        
        for app in apps:
            rating = status_to_rating.get(app.status, 3.0)
            data_list.append({
                'candidate_id': app.candidate_id,
                'internship_id': app.internship_id,
                'rating': rating
            })
            counts[app.candidate_id] = counts.get(app.candidate_id, 0) + 1
            
        self.interaction_counts = counts
        
        df = pd.DataFrame(data_list)
        
        # Build user-item matrix
        # Pivot table with candidates as rows and internships as columns
        pivot = pd.pivot_table(df, values='rating', index='candidate_id', columns='internship_id', fill_value=0.0)
        
        self.users = pivot.index.tolist()
        self.items = pivot.columns.tolist()
        matrix = pivot.values
        
        if matrix.shape[0] < 2 or matrix.shape[1] < 2:
            self.is_trained = False
            print("Not enough data to train SVD.")
            return
            
        # Demean the data by user row
        self.user_ratings_mean = np.mean(matrix, axis=1)
        matrix_demeaned = matrix - self.user_ratings_mean.reshape(-1, 1)
        
        # Compute SVD
        # k could be limited, but for small datasets we can just do full factorization
        U, sigma, Vt = np.linalg.svd(matrix_demeaned, full_matrices=False)
        self.U = U
        self.sigma = np.diag(sigma)
        self.Vt = Vt
        
        self.is_trained = True
        print(f"CF Model (numpy SVD) retrained on {len(df)} interactions.")

    def is_cold_start(self, candidate_id):
        # True if fewer than 2 interactions
        return self.interaction_counts.get(candidate_id, 0) < 2

    def predict_score(self, candidate_id, internship_id):
        if not self.is_trained or self.is_cold_start(candidate_id):
            return 0.5
            
        if candidate_id not in self.users or internship_id not in self.items:
            # Item or User not in train set
            return 0.5
            
        user_idx = self.users.index(candidate_id)
        item_idx = self.items.index(internship_id)
        
        # Predict: U * Sigma * Vt + user_mean
        predicted_matrix = np.dot(np.dot(self.U, self.sigma), self.Vt) + self.user_ratings_mean.reshape(-1, 1)
        predicted_rating = predicted_matrix[user_idx, item_idx]
        
        # Clip back to 1.0 - 5.0 range
        predicted_rating = max(1.0, min(5.0, float(predicted_rating)))
        
        # Normalize to 0.0 - 1.0 for hybrid scorer
        normalized_score = (predicted_rating - 1.0) / 4.0
        return round(normalized_score, 4)

collaborative_filter = CollaborativeFilter()
