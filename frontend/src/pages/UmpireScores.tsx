import { useEffect, useState } from "react";
import { api } from "@/api/api";
import { ScoreBoard } from "@/components/ScoreBoard";
import { Zap } from "lucide-react";

export default function LiveScores() {
  const [matches, setMatches] = useState<any[]>([]);

  // 🔥 Fetch real matches
  useEffect(() => {
    api.getMatches().then((data) => {
      console.log("MATCHES FROM API:", data); // 👈 ADD THIS
    setMatches(data);
    });
  }, []);

  const liveMatches = matches.filter((m) => m.status === "live");
  const completedToday = matches.filter((m) => m.status === "completed");

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={28} className="text-secondary" />
        <h1 className="text-3xl font-black">Live Scores</h1>
      </div>

      {liveMatches.length > 0 ? (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse-live" />
            <h2 className="text-lg font-bold">In Progress</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              Live Updates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <ScoreBoard key={match.id} matchId={match.id} />
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

      {completedToday.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">Completed Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedToday.map((match) => (
              <ScoreBoard key={match.id} matchId={match.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}