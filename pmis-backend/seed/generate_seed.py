import os
import sys
import json
import random
from faker import Faker

# Ensure 'app' is accessible from the seed directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, Candidate, Internship, Application

fake = Faker('en_IN')

# ─── Seed Data Config ─────────────────────────────────────────────────────────
EDUCATION_LEVELS = ['10th', '12th', 'ITI', 'Diploma', 'Graduate']
CATEGORIES = ['GEN', 'OBC', 'SC', 'ST']

SKILLS = [
    'Python', 'Java', 'JavaScript', 'React', 'SQL', 'Excel', 'Tally',
    'Communication', 'MS Office', 'Data Entry', 'Accounting', 'Customer Service',
    'Sales', 'English Speaking', 'Computer Basics', 'Web Design', 'Graphic Design',
    'Video Editing', 'Content Writing', 'Social Media', 'Electrical Work',
    'Mechanical', 'Welding', 'AutoCAD', 'Driving Licence', 'Data Analysis',
    'Machine Learning', 'C++', 'Network Administration', 'Cybersecurity',
    'Inventory Management', 'Supply Chain', 'HR Management', 'Legal Research',
    'Financial Analysis'
]

# Use same sector labels as real_internships.json
SECTORS = [
    'IT', 'Banking', 'Healthcare', 'Manufacturing', 'Automobile', 'Energy',
    'Retail', 'Agriculture', 'Education', 'Infrastructure', 'Media', 'Tourism',
    'Finance', 'Telecom', 'FMCG', 'Logistics'
]

STATES = [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh',
    'Gujarat', 'West Bengal', 'Rajasthan', 'Telangana', 'Punjab'
]

# ─── Candidate Generator ──────────────────────────────────────────────────────
def generate_candidates(num=500):
    candidates = []
    for _ in range(num):
        c = Candidate(
            name=fake.name(),
            education_level=random.choice(EDUCATION_LEVELS),
            field_of_study=fake.job(),
            cgpa=round(random.uniform(5.0, 10.0), 2),
            skills=random.sample(SKILLS, k=random.randint(2, 5)),
            sector_interests=random.sample(SECTORS, k=random.randint(1, 3)),
            state=random.choice(STATES),
            district=fake.city(),
            is_rural=random.choice([True, False]),
            category=random.choice(CATEGORIES),
            has_prior_internship=random.choices([True, False], weights=[0.3, 0.7])[0]
        )
        candidates.append(c)
    db.session.add_all(candidates)
    db.session.commit()
    print(f"Added {num} candidates.")
    return candidates

# ─── Internship Loader (from real_internships.json) ───────────────────────────
def load_real_internships():
    json_path = os.path.join(os.path.dirname(__file__), 'real_internships.json')
    if not os.path.exists(json_path):
        print(f"WARNING: {json_path} not found — falling back to fake internships.")
        return generate_fake_internships(80)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    internships = []
    for row in data:
        i = Internship(
            company=row['company'],
            role=row['role'],
            sector=row['sector'],
            required_skills=row['required_skills'],   # already a list
            min_education=row['min_education'],
            preferred_field=row['preferred_field'],
            location_state=row['location_state'],
            location_city=row['location_city'],
            stipend_monthly=row['stipend_monthly'],
            total_slots=row['total_slots'],
            filled_slots=row['filled_slots'],
            is_active=row.get('is_active', True)
        )
        internships.append(i)

    db.session.add_all(internships)
    db.session.commit()
    print(f"Loaded {len(internships)} real internships from real_internships.json.")
    return internships

def generate_fake_internships(num=80):
    """Fallback if JSON is missing."""
    internships = []
    for _ in range(num):
        i = Internship(
            company=fake.company(),
            role=fake.job(),
            sector=random.choice(SECTORS),
            required_skills=random.sample(SKILLS, k=random.randint(2, 5)),
            min_education=random.choice(EDUCATION_LEVELS),
            preferred_field=fake.job(),
            location_state=random.choice(STATES),
            location_city=fake.city(),
            stipend_monthly=random.randint(5, 20) * 1000,
            total_slots=random.randint(5, 50),
            filled_slots=0,
            is_active=True
        )
        internships.append(i)
    db.session.add_all(internships)
    db.session.commit()
    print(f"Added {num} fake internships.")
    return internships

# ─── Application Generator ────────────────────────────────────────────────────
def generate_applications(candidates, internships, num=200):
    applications = []
    seen = set()
    statuses = ['applied', 'accepted', 'rejected']

    attempts = 0
    while len(applications) < num and attempts < num * 10:
        attempts += 1
        c = random.choice(candidates)
        i = random.choice(internships)
        pair = (c.id, i.id)
        if pair in seen:
            continue
        seen.add(pair)

        status = random.choices(statuses, weights=[0.5, 0.2, 0.3])[0]
        if status == 'accepted':
            if i.filled_slots < i.total_slots:
                i.filled_slots += 1
            else:
                status = 'rejected'

        applications.append(Application(
            candidate_id=c.id,
            internship_id=i.id,
            status=status,
            recommendation_score=round(random.uniform(0.1, 1.0), 2)
        ))

    db.session.add_all(applications)
    db.session.commit()
    print(f"Added {len(applications)} applications.")

# ─── Main ─────────────────────────────────────────────────────────────────────
def seed_database():
    app = create_app()
    with app.app_context():
        # Drop and recreate all tables for a clean state
        db.drop_all()
        db.create_all()
        print("Database tables recreated.")

        candidates  = generate_candidates(500)
        internships = load_real_internships()
        generate_applications(candidates, internships, 200)

        print("=" * 50)
        print("Seeding complete.")
        print(f"  Candidates:  {len(candidates)}")
        print(f"  Internships: {len(internships)}")
        print("=" * 50)

if __name__ == '__main__':
    seed_database()
