#!/bin/bash
T_ID="db4bdd70-3281-49f7-af0e-feee075e6b37"

echo "Creating Players..."
P1_ID=$(curl -s -X POST http://localhost:8080/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Joe", "last_name": "Biden", "tournament_id": "'$T_ID'", "date_of_birth": "1942-11-20T00:00:00Z", "gender": "Men", "tennis_level": "Singles", "nationality": "US"}' | jq -r .id)

P2_ID=$(curl -s -X POST http://localhost:8080/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Barack", "last_name": "Obama", "tournament_id": "'$T_ID'", "date_of_birth": "1961-08-04T00:00:00Z", "gender": "Men", "tennis_level": "Singles", "nationality": "US"}' | jq -r .id)

P3_ID=$(curl -s -X POST http://localhost:8080/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"first_name": "George", "last_name": "Bush", "tournament_id": "'$T_ID'", "date_of_birth": "1946-07-06T00:00:00Z", "gender": "Men", "tennis_level": "Singles", "nationality": "US"}' | jq -r .id)

P4_ID=$(curl -s -X POST http://localhost:8080/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Bill", "last_name": "Clinton", "tournament_id": "'$T_ID'", "date_of_birth": "1946-08-19T00:00:00Z", "gender": "Men", "tennis_level": "Singles", "nationality": "US"}' | jq -r .id)

echo "Players Created: $P1_ID, $P2_ID, $P3_ID, $P4_ID"

echo "Creating Group..."
G_ID=$(curl -s -X POST http://localhost:8080/api/v1/groups \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": "'$T_ID'", "designation": "Presidents", "gender": "Men", "group_type": "Singles", "max_players": 4, "qualifiers_count": 2}' | jq -r .id)

echo "Group Created: $G_ID"

echo "Assigning Players to Group..."
curl -s -X PUT http://localhost:8080/api/v1/groups/$G_ID/players \
  -H "Content-Type: application/json" \
  -d '{"player_ids": ["'$P1_ID'", "'$P2_ID'", "'$P3_ID'", "'$P4_ID'"]}' | jq .

echo "Done!"
