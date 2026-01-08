#!/bin/bash

# Check if site and command parameters are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <site> <command> [aws_profile]"
  exit 1
fi

site=$1
command=$2
aws_profile=$3

# Define environment variables for each site
case $site in
  staging)
    # Staging environment configuration
    S3_BUCKET=hathor-web-wallet-staging
    CLOUDFRONT_ID=EDTXNP1KSR1BR
    # TODO: This will be changed to SNAP_ORIGIN=npm:@hathor/snap when the next version of the snap package is published
    SNAP_ORIGIN=local:http://localhost:8080
    STAGE=staging
    ;;
  production)
    # Production environment configuration
    S3_BUCKET=hathor-web-wallet-production
    CLOUDFRONT_ID=EWUF3A8EL37EC
    SNAP_ORIGIN=npm:@hathor/snap
    STAGE=production
    ;;
  *)
    echo "Unknown site: $site"
    echo "Available sites: staging, production"
    exit 1
    ;;
esac

export S3_BUCKET
export CLOUDFRONT_ID
export SNAP_ORIGIN

case $command in
  build)
    echo "Building for site: $site"
    echo "S3_BUCKET: $S3_BUCKET"
    echo "CLOUDFRONT_ID: $CLOUDFRONT_ID"
    echo "SNAP_ORIGIN: $SNAP_ORIGIN"
    # Run the build command using yarn workspace
    cd "$(dirname "$0")/.." || exit 1
    yarn build:nocheck
    ;;
  sync)
    echo "Syncing for site: $site"
    cd "$(dirname "$0")/.." || exit 1
    if [ -n "$aws_profile" ]; then
      aws s3 sync --delete ./dist/ s3://$S3_BUCKET --profile $aws_profile
    else
      aws s3 sync --delete ./dist/ s3://$S3_BUCKET
    fi
    ;;
  clear_cache)
    echo "Clearing CloudFront cache for site: $site"
    if [ -n "$aws_profile" ]; then
      aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" --profile $aws_profile
    else
      aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
    fi
    ;;
  *)
    echo "Unknown command: $command"
    echo "Available commands: build, sync, clear_cache"
    exit 1
    ;;
esac
