#!/bin/bash
set -e

echo "🚀 PMIS AI Engine — Setup Script"
echo "================================="

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd pmis-backend
pip install -r requirements.txt

echo ""
echo "🌱 Seeding database (500 candidates + 100 internships)..."
python seed/generate_seed.py

cd ..

# Frontend setup
echo ""
echo "⚛️  Installing frontend dependencies..."
cd pmis-frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start everything:"
echo "  Option 1 (Docker):  docker-compose up --build"
echo "  Option 2 (Manual):"
echo "    Terminal 1: cd pmis-backend && python run.py"
echo "    Terminal 2: cd pmis-frontend && npm run dev"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000/api/v1/health"
