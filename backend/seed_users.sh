#!/bin/bash
API_URL="http://localhost:8080/api/v1/auth/register"
PASSWORD="12345677"

users=("admin@example.com" "director@example.com" "umpire@example.com" "user@example.com")

for email in "${users[@]}"; do
  echo "Registering $email..."
  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\", \"password\":\"$PASSWORD\"}"
  echo -e "\n"
done

# Update roles in database
echo "Updating roles in database..."
docker exec -i kamp-postgres psql -U admin -d kampdb << 'SQL'
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
UPDATE users SET role = 'director' WHERE email = 'director@example.com';
UPDATE users SET role = 'umpire' WHERE email = 'umpire@example.com';
UPDATE users SET role = 'user' WHERE email = 'user@example.com';
SELECT email, role FROM users WHERE email IN ('admin@example.com', 'director@example.com', 'umpire@example.com', 'user@example.com');
SQL
