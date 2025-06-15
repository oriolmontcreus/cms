#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error occurred in script"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker-compose down 2>/dev/null
    exit 1
}

# Set error handling
trap handle_error ERR

# Ensure backend directory exists
if [ ! -d "backend" ]; then
    echo "Backend directory not found. Please ensure the backend is properly set up."
    exit 1
fi

# Start MongoDB and Redis
echo "Starting MongoDB and Redis..."
docker-compose up -d mongodb redis || { echo "Failed to start services"; exit 1; }

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Start backend
echo "Starting backend..."
cd backend
npm install || { echo "Failed to install backend dependencies"; exit 1; }
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend..."
npm install || { echo "Failed to install frontend dependencies"; exit 1; }
npm run dev:frontend &
FRONTEND_PID=$!

# Handle script termination
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT TERM

# Keep script running
wait 