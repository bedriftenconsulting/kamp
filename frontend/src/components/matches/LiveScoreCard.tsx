import { useEffect, useState } from "react";
import ScoreCard from "./ScoreCard";
import { api } from "@/api/api";
import { useWebSocket } from "@/hooks/useWebSocket";

interface LiveScoreCardProps {
  match: any;
  compact?: boolean;
  onMatchFinished?: (matchId: string, winner: string) => void;
}

export default function LiveScoreCard({ match, compact = false, onMatchFinished }: LiveScoreCardProps) {
  const [liveScore, setLiveScore] = useState<any>(null);

  useEffect(() => {
    if (match.status === "live") {
      api.getMatchState(match.id).then((state) => {
        setLiveScore(state);
      });
    }
  }, [match.id, match.status]);

  useWebSocket(match.id, (data) => {
    if (data.type === "score_update") {
      setLiveScore(data.state);
      // Notify parent if match just finished
      if (data.state?.match_finished && onMatchFinished) {
        onMatchFinished(match.id, data.state.winner);
      }
    }
  });

  // Synthesize a match object for ScoreCard
  const displayMatch = { ...match };

  // If match finished via WebSocket, mark it as completed
  if (liveScore?.match_finished) {
    displayMatch.status = "completed";
    if (liveScore.winner === "player1") {
      displayMatch.winner = match.player1?.id || match.player1_id;
    } else if (liveScore.winner === "player2") {
      displayMatch.winner = match.player2?.id || match.player2_id;
    }
  }

  if (liveScore) {
    const p1Sets = parseInt(liveScore["player1_sets"] || "0", 10);
    const p2Sets = parseInt(liveScore["player2_sets"] || "0", 10);
    const p1Games = parseInt(liveScore["player1_games"] || "0", 10);
    const p2Games = parseInt(liveScore["player2_games"] || "0", 10);

    const synthesizedSets = [];
    if (p1Sets > 0 || p2Sets > 0) {
      synthesizedSets.push([p1Sets, p2Sets]);
    }
    synthesizedSets.push([p1Games, p2Games]);

    displayMatch.score = {
      sets: synthesizedSets,
      currentGame: [
        liveScore["player1_points"] || "0",
        liveScore["player2_points"] || "0",
      ],
      servingPlayer: null,
    };
  }

  return <ScoreCard match={displayMatch} compact={compact} />;
}
