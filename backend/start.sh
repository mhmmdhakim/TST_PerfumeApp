#!/bin/bash
echo "Running init-mongo.sh..."

uvicorn app.main:app --host 0.0.0.0 --port $PORT