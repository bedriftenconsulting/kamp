import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import LiveScoreCard from "@/components/matches/LiveScoreCard";
import { Zap } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";

export default function LiveScores() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_V1_URL}/matches`);
      const data = await res.json();

      // ✅ Transform backend → frontend shape
      const formattedMatches = data.map((m: any) => {
        const hasFinalScore =
          typeof m.player1_score === "number" && typeof m.player2_score === "number";

        return {
          id: m.id,
          status: m.status,
          round: m.round,
          court: "Court 1", // temp (until backend provides it)
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
          score: hasFinalScore
            ? {
                sets: [[m.player1_score, m.player2_score]],
                currentGame: [0, 0],
                servingPlayer: null,
              }
            : m.score || null,
        };
      });

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    // 🔥 Auto-refresh every 10s (important for live)
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Filters
  const liveMatches = matches.filter((m) => m.status === "live");
  const completedToday = matches.filter((m) => m.status === "completed");

  if (loading) {
    return <div className="p-10 text-center">Loading live scores...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={28} className="text-secondary" />
        <h1 className="text-3xl font-black">Live Scores</h1>
      </div>

      {/* LIVE MATCHES */}
      {liveMatches.length > 0 ? (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse-live" />
            <h2 className="text-lg font-bold">In Progress</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              Auto-updates every 10s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <LiveScoreCard
                key={match.id}
                match={match}
                onMatchFinished={() => {
                  // Re-fetch after a short delay to let backend update
                  setTimeout(fetchMatches, 1500);
                }}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 bg-card rounded-md border mb-12">
          <Zap size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <h2 className="text-xl font-bold mb-1">No Live Matches</h2>
          <p className="text-muted-foreground text-sm">
            Check back during match hours for live updates.
          </p>
        </div>
      )}

      {/* COMPLETED MATCHES */}
      {completedToday.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Completed Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedToday.map((match) => (
              <ScoreCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
