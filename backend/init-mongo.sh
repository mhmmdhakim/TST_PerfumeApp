#!/bin/bash

echo "Starting MongoDB restore process..."

# Gunakan environment variable dari Railway
mongorestore \
    --uri="$MONGODB_URL" \
    --nsInclude="perfume_db.*" \
    --drop \
    --dir="/backup/perfume_db"

echo "MongoDB restore completed."