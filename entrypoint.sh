#!/bin/sh

echo "Waiting for database connection..."
max_attempts=10
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER"; then
    echo "Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "Failed to connect to database after $max_attempts attempts"
  exit 1
fi

echo "Running migrations..."
npm run migration:run

echo "Running seeds..."
npm run seed:run

echo "Starting application..."
exec npm run start:dev

