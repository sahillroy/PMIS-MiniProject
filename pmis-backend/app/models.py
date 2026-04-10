from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class Candidate(db.Model):
    __tablename__ = 'candidates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    education_level = db.Column(db.String(50))
    field_of_study = db.Column(db.String(100))
    cgpa = db.Column(db.Float)
    skills = db.Column(db.JSON)
    sector_interests = db.Column(db.JSON)
    state = db.Column(db.String(50))
    district = db.Column(db.String(50))
    is_rural = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(10)) # GEN/OBC/SC/ST
    has_prior_internship = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Internship(db.Model):
    __tablename__ = 'internships'
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    sector = db.Column(db.String(50))
    required_skills = db.Column(db.JSON)
    min_education = db.Column(db.String(50))
    preferred_field = db.Column(db.String(100))
    location_state = db.Column(db.String(50))
    location_city = db.Column(db.String(50))
    stipend_monthly = db.Column(db.Integer)
    total_slots = db.Column(db.Integer, default=1)
    filled_slots = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    status = db.Column(db.String(20), default='applied') # applied/accepted/rejected
    recommendation_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = db.relationship('Candidate', backref=db.backref('applications', lazy=True))
    internship = db.relationship('Internship', backref=db.backref('applications', lazy=True))

class RecommendationLog(db.Model):
    __tablename__ = 'recommendation_logs'
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    content_score = db.Column(db.Float)
    cf_score = db.Column(db.Float)
    affirmative_boost = db.Column(db.Float)
    final_score = db.Column(db.Float)
    reasons = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = db.relationship('Candidate', backref=db.backref('recommendation_logs', lazy=True))
    internship = db.relationship('Internship', backref=db.backref('recommendation_logs', lazy=True))
