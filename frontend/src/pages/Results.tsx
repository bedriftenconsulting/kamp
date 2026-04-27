import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { Trophy } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";
import { useTournament } from "@/components/tournament/TournamentContext";
import Loader from "@/components/ui/loader";

export default function Results() {
  const { activeTournamentId, activeTournament } = useTournament();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const savedId = activeTournamentId || "";
      const url = savedId ? `${API_V1_URL}/matches?tournament_id=${savedId}` : `${API_V1_URL}/matches`;
      const res = await fetch(url);
      const data = await res.json();

      // ✅ Transform backend → frontend
      const formattedMatches = data.map((m: any) => {
        const hasScore = m.player1_score != null || m.player2_score != null;

        return {
          id: m.id,
          status: m.status,
          round: m.round,
          court: "Court 1", // temp
          scheduledTime: m.scheduled_time,
          player1: {
            id: m.player1_id,
            name: m.player1_name,
          },
          player2: {
            id: m.player2_id,
            name: m.player2_name,
          },
          winner: m.winner_id,
          // Construct the nested score object expected by UI components
          score: hasScore ? {
            sets: [[Number(m.player1_score || 0), Number(m.player2_score || 0)]],
            currentGame: [Number(m.player1_games || 0), Number(m.player2_games || 0)],
            currentPoints: [String(m.player1_points || "0"), String(m.player2_points || "0")],
            servingPlayer: null, 
          } : null,
        };
      });

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [activeTournamentId]);

  // ✅ Only completed matches
  const completed = matches.filter((m) => m.status === "completed");

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-2">
        <Trophy size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Results</h1>
      </div>
      {activeTournament && (
        <p className="text-sm text-muted-foreground mb-6">{activeTournament.name}</p>
      )}

      {completed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completed.map((match) => (
            <ScoreCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-md border">
          <Trophy
            size={40}
            className="mx-auto text-muted-foreground/30 mb-3"
          />
          <h2 className="text-xl font-bold mb-1">No Results Yet</h2>
          <p className="text-muted-foreground text-sm">
            Completed match results will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
