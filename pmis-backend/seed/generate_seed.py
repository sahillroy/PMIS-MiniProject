import os
import sys
import random
from faker import Faker

# Ensure 'app' is accessible from the seed directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, Candidate, Internship, Application

fake = Faker('en_IN')

# Data configuration
EDUCATION_LEVELS = ['10th', '12th', 'ITI', 'Diploma', 'Graduate']
CATEGORIES = ['GEN', 'OBC', 'SC', 'ST']

SKILLS = [
    'Python', 'Java', 'C++', 'Data Entry', 'Accounting', 'Welding', 'Plumbing', 
    'Electrician', 'Carpentry', 'Digital Marketing', 'Graphic Design', 'SEO', 
    'Content Writing', 'Customer Support', 'Sales', 'Machine Learning', 
    'Web Development', 'AutoCAD', 'Tally', 'Communication', 'Teamwork', 
    'Leadership', 'Project Management', 'Nursing', 'Retail Management'
]

SECTORS_24 = [
    'IT/Software', 'Manufacturing', 'Construction', 'Healthcare', 'Retail', 
    'Agriculture', 'Education', 'Finance/Banking', 'Automotive', 'Logistics', 
    'Hospitality', 'Media', 'Telecommunications', 'Energy', 'Real Estate', 
    'Pharmaceuticals', 'FMCG', 'Textiles', 'Tourism', 'E-commerce', 
    'Food Processing', 'Aviation', 'NGO/Social Work', 'Government'
]

STATES_10 = [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh', 
    'Gujarat', 'West Bengal', 'Rajasthan', 'Telangana', 'Kerala'
]

def generate_candidates(num=500):
    candidates = []
    for _ in range(num):
        skills_sample = random.sample(SKILLS, k=random.randint(1, 4))
        sectors_sample = random.sample(SECTORS_24, k=random.randint(1, 3))
        
        c = Candidate(
            name=fake.name(),
            education_level=random.choice(EDUCATION_LEVELS),
            field_of_study=fake.job(),
            cgpa=round(random.uniform(5.0, 10.0), 2),
            skills=skills_sample,
            sector_interests=sectors_sample,
            state=random.choice(STATES_10),
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

def generate_internships(num=100):
    internships = []
    for _ in range(num):
        skills_sample = random.sample(SKILLS, k=random.randint(1, 4))
        
        i = Internship(
            company=fake.company(),
            role=fake.job(),
            sector=random.choice(SECTORS_24),
            required_skills=skills_sample,
            min_education=random.choice(EDUCATION_LEVELS),
            preferred_field=fake.job(),
            location_state=random.choice(STATES_10),
            location_city=fake.city(),
            stipend_monthly=random.randint(5, 15) * 1000,
            total_slots=random.randint(1, 10),
            filled_slots=0,
            is_active=True
        )
        internships.append(i)
    
    db.session.add_all(internships)
    db.session.commit()
    print(f"Added {num} internships.")
    return internships

def generate_applications(candidates, internships, num=200):
    applications = []
    seen = set()
    
    statuses = ['applied', 'accepted', 'rejected']
    
    while len(applications) < num:
        c = random.choice(candidates)
        i = random.choice(internships)
        pair = (c.id, i.id)
        
        if pair not in seen:
            seen.add(pair)
            
            status = random.choices(statuses, weights=[0.5, 0.2, 0.3])[0]
            if status == 'accepted':
                if i.filled_slots < i.total_slots:
                    i.filled_slots += 1
                else:
                    status = 'rejected'
                    
            app = Application(
                candidate_id=c.id,
                internship_id=i.id,
                status=status,
                recommendation_score=round(random.uniform(0.1, 1.0), 2)
            )
            applications.append(app)

    db.session.add_all(applications)
    db.session.commit()
    print(f"Added {num} applications.")

def seed_database():
    app = create_app()
    with app.app_context():
        # Recreate tables to ensure clean state
        db.drop_all()
        db.create_all()
        print("Database tables recreated.")
        
        candidates = generate_candidates(500)
        internships = generate_internships(100)
        generate_applications(candidates, internships, 200)
        print("Seeding complete.")

if __name__ == '__main__':
    seed_database()
