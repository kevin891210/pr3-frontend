#!/bin/bash
# Production deployment script

set -e

REGISTRY=${REGISTRY:-"your-registry.com"}
IMAGE_NAME="hrm-frontend"
VERSION=${VERSION:-$(date +%Y%m%d-%H%M%S)}
FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$VERSION"

echo "=== Production Deployment ==="
echo "Image: $FULL_IMAGE_NAME"

# 1. Build production image
echo "Building production image..."
docker build -t $FULL_IMAGE_NAME .
docker tag $FULL_IMAGE_NAME $REGISTRY/$IMAGE_NAME:latest

# 2. Push to registry
echo "Pushing to registry..."
docker push $FULL_IMAGE_NAME
docker push $REGISTRY/$IMAGE_NAME:latest

# 3. Deploy to production (customize based on your infrastructure)
echo "Deploying to production..."
# kubectl set image deployment/hrm-frontend hrm-frontend=$FULL_IMAGE_NAME
# or docker-compose based deployment
# docker-compose -f docker-compose.prod.yml up -d

echo "✅ Production deployment completed!"
echo "Image: $FULL_IMAGE_NAME"