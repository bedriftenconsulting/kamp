package realtime

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn    *websocket.Conn
	matchID string
}

var clients = make(map[*Client]bool)

// matchID → clients
var rooms = make(map[string]map[*Client]bool)

var broadcast = make(chan Message)

type Message struct {
	MatchID string
	Data    map[string]interface{}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// 🔌 Connect client
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	matchID := r.URL.Query().Get("match_id")

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		conn:    conn,
		matchID: matchID,
	}

	clients[client] = true

	// Add to room
	if rooms[matchID] == nil {
		rooms[matchID] = make(map[*Client]bool)
	}
	rooms[matchID][client] = true
}

// 📡 Broadcast only to match room
func HandleMessages() {
	for {
		msg := <-broadcast

		room, ok := rooms[msg.MatchID]
		if !ok {
			continue // no clients for this match
		}

		for client := range room {
			err := client.conn.WriteJSON(msg.Data)
			if err != nil {
				client.conn.Close()
				delete(room, client)
				delete(clients, client)
			}
		}
	}
}

// 🔥 Public function
func Broadcast(matchID string, data map[string]interface{}) {
	broadcast <- Message{
		MatchID: matchID,
		Data:    data,
	}
}
