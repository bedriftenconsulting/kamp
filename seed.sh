#!/bin/bash
API_URL="http://localhost:8080/api/v1"

echo "Creating Tournament..."
TOURNAMENT_RES=$(curl -s -X POST "$API_URL/tournaments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kamp Open 2026",
    "location": "Oslo Tennis Arena",
    "start_date": "2026-03-25T00:00:00Z",
    "end_date": "2026-04-01T00:00:00Z",
    "status": "upcoming",
    "surface": "Hard"
  }')
echo "$TOURNAMENT_RES"
TOURNAMENT_ID=$(echo $TOURNAMENT_RES | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.id || data.data?.id || data.tournament?.id)")
echo "Tournament ID: $TOURNAMENT_ID"

echo "Creating Players..."
P1_RES=$(curl -s -X POST "$API_URL/players" -H "Content-Type: application/json" -d "{\"first_name\":\"Rafael\",\"last_name\":\"Nadal\",\"gender\":\"Male\",\"age\":37,\"tennis_level\":\"Advanced\",\"ranking\":1,\"nationality\":\"ESP\",\"tournament_id\":\"$TOURNAMENT_ID\"}")
P2_RES=$(curl -s -X POST "$API_URL/players" -H "Content-Type: application/json" -d "{\"first_name\":\"Novak\",\"last_name\":\"Djokovic\",\"gender\":\"Male\",\"age\":36,\"tennis_level\":\"Advanced\",\"ranking\":2,\"nationality\":\"SRB\",\"tournament_id\":\"$TOURNAMENT_ID\"}")
echo "$P1_RES"
echo "$P2_RES"

P1_ID=$(echo $P1_RES | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.id || data.data?.id || data.player?.id)")
P2_ID=$(echo $P2_RES | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.id || data.data?.id || data.player?.id)")

echo "Creating Group..."
GROUP_RES=$(curl -s -X POST "$API_URL/groups" -H "Content-Type: application/json" -d '{"designation":"A","group_type":"Singles","gender":"Male","tennis_level":"Advanced","max_players":2,"qualifiers_count":1}')
echo "$GROUP_RES"

GROUP_ID=$(echo $GROUP_RES | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.id || data.data?.id || data.group?.id)")
echo "Group ID: $GROUP_ID"

echo "Adding players to Group..."
curl -s -X PUT "$API_URL/groups/$GROUP_ID/players" -H "Content-Type: application/json" -d "{\"player_ids\":[\"$P1_ID\",\"$P2_ID\"]}"

echo ""
echo "Locking Group..."
curl -s -X POST "$API_URL/groups/$GROUP_ID/lock" -H "Content-Type: application/json"

echo ""
echo "Done."
