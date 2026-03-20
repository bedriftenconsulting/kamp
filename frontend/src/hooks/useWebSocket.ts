import { useEffect } from "react";

export const useWebSocket = (
  matchId: string,
  onMessage: (data: any) => void
) => {
  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:8080/ws?match_id=${matchId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onopen = () => console.log("✅ WS Connected");
    ws.onclose = () => console.log("❌ WS Disconnected");

    return () => ws.close();
  }, [matchId]);
};