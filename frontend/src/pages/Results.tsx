import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { Trophy } from "lucide-react";

export default function Results() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/v1/matches");
      const data = await res.json();

      // ✅ Transform backend → frontend
      const formattedMatches = data.map((m: any) => ({
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
        score: m.score || null, // ✅ supports your JSONB scores
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // ✅ Only completed matches
  const completed = matches.filter((m) => m.status === "completed");

  if (loading) {
    return <div className="p-10 text-center">Loading results...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Results</h1>
      </div>

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