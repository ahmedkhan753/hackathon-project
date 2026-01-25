#!/bin/bash

# Quick Start Script for Search Engine Demo

echo "🚀 Starting Neighbourly with Search Engine..."
echo ""

# Step 1: Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Step 2: Rebuild with new dependencies
echo "🔨 Building containers (this may take 3-5 minutes for ML models)..."
docker-compose up --build -d

# Step 3: Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Step 4: Run database migration
echo "🗄️  Running database migration..."
docker-compose exec backend python migrate_db.py

# Step 5: Backfill embeddings (optional)
echo "🧠 Generating embeddings for existing services..."
docker-compose exec backend python backfill_embeddings.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Adminer: http://localhost:8081"
echo ""
echo "🔍 Test the search:"
echo "  1. Go to http://localhost:3000/services"
echo "  2. Allow location access"
echo "  3. Search for 'bike repair' or 'math tutor'"
echo ""
echo "📊 Check search stats:"
echo "  curl http://localhost:8000/search/stats"
echo ""
