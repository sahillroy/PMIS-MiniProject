#!/bin/bash
echo "Setting up PMIS Backend Infrastructure..."
cd pmis-backend
pip install -r requirements.txt

echo "Building core ML dependencies and seeding datasets..."
# Python scripts natively populate database schemas
python seed/generate_seed.py

echo "Binding Frontend Libraries..."
cd ../pmis-frontend
npm install

echo "Orchestrating Complete Docker Pipeline..."
cd ..
docker-compose up --build
