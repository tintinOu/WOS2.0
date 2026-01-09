#!/bin/bash
set -e

# Configuration
PROJECT_ID="bodyshop-work-order"
SERVICE_NAME="bodyshop-backend"
REGION="us-central1"

echo "🚀 Starting Deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "Please install it here: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "🔹 Logging in to Google Cloud..."
gcloud auth login

echo "🔹 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo "🔹 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

echo "🔹 Deploying Backend (this may take a few minutes)..."
cd backend
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated

echo "✅ Backend Deployment Complete!"
echo "⚠️  Look for the 'Service URL' in the output above. You will need it for the frontend."
