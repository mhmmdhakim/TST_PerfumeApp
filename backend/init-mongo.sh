#!/bin/bash

echo "Starting MongoDB restore process..."

# Mencoba koneksi ke MongoDB (menggunakan mongosh atau mongorestore) hingga berhasil
RETRIES=5
while [ $RETRIES -gt 0 ]; do
    # Coba melakukan koneksi ke MongoDB
    mongosh --eval "db.runCommand({ connectionStatus: 1 })" $MONGODB_URL && break
    echo "MongoDB not ready yet. Retrying..."
    RETRIES=$((RETRIES-1))
    sleep 5
done

if [ $RETRIES -eq 0 ]; then
    echo "MongoDB not ready after several attempts, exiting."
    exit 1
fi

# Melakukan restore data menggunakan mongorestore
mongorestore \
    --uri="$MONGODB_URL" \
    --nsInclude="perfume_db.*" \
    --drop \
    --dir="/backup/perfume_db"

echo "MongoDB restore completed."
