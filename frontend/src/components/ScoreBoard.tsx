import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useWebSocket } from "../hooks/useWebSocket";

type Props = {
  matchId: string;
};

export const ScoreBoard = ({ matchId }: Props) => {
  const [state, setState] = useState<any>(null);

  // 🔥 Realtime updates
  useWebSocket(matchId, (data) => {
    if (data.type === "score_update") {
      setState(data.state);
    }
  });

  // Initial load
  useEffect(() => {
    api.getMatchState(matchId).then((data) => {
      setState(data);
    });
  }, [matchId]);

  const handleScore = async (player: number) => {
    const data = await api.addPoint(matchId, player);
    setState(data);
  };

  if (!state) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow w-[400px]">
      <h2 className="text-xl font-bold mb-4">🎾 Live Match</h2>

      <div className="mb-4 space-y-2">
        <div>
          <strong>Points:</strong> {state.player1_points} - {state.player2_points}
        </div>
        <div>
          <strong>Games:</strong> {state.player1_games} - {state.player2_games}
        </div>
        <div>
          <strong>Sets:</strong> {state.player1_sets || 0} - {state.player2_sets || 0}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleScore(1)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Player 1 Scores
        </button>

        <button
          onClick={() => handleScore(2)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Player 2 Scores
        </button>
      </div>
    </div>
  );
};
