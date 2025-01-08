#!/bin/bash
echo "Starting MongoDB restore process..."

mongorestore \
    --uri="mongodb://Hakim:Mohakim123098@localhost:27017/perfume_db?authSource=admin" \
    --nsInclude="perfume_db.*" \
    --drop \
    --dir="/backup/perfume_db"

echo "MongoDB restore completed."
