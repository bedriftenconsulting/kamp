import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { Calendar } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";

const rounds = ["All", "Round of 16", "Quarterfinal", "Semifinal", "Final"];

export default function Schedule() {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const matchesRes = await fetch(`${API_V1_URL}/matches`);
      const matchesData = await matchesRes.json();
      const toList = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const data = toList(matchesData);

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
        score: m.score || null, // ✅ now connected
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const normalize = (str: string) =>
    str?.toLowerCase().replace(/\s+/g, "").trim();

  const filtered =
    selectedRound === "All"
      ? matches
      : matches.filter(
          (m) => normalize(m.round) === normalize(selectedRound)
        );

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading schedule...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Calendar size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Match Schedule</h1>
      </div>

      {/* Round Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {rounds.map((round) => (
          <button
            key={round}
            onClick={() => setSelectedRound(round)}
            className={`px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              selectedRound === round
                ? "bg-primary text-primary-foreground"
                : "bg-card border text-foreground hover:bg-muted"
            }`}
          >
            {round}
          </button>
        ))}
      </div>

      {/* Bracket Preview */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">Draw Bracket</h2>
        <div className="bg-card border rounded-md p-6 overflow-x-auto">
          <div className="flex gap-8 min-w-[600px]">
            {["Quarterfinal", "Semifinal", "Final"].map((round, ri) => {
              const roundMatches = matches.filter((m) => m.round === round);

              return (
                <div key={round} className="flex-1 min-w-[180px]">
                  <div className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">
                    {round}
                  </div>

                  <div
                    className="flex flex-col gap-4"
                    style={{ paddingTop: ri * 24 }}
                  >
                    {roundMatches.length > 0 ? (
                      roundMatches.map((m) => (
                        <div
                          key={m.id}
                          className={`border rounded-sm text-xs ${
                            m.status === "live"
                              ? "border-live/40 ring-1 ring-live/20"
                              : "border-border"
                          }`}
                        >
                          {/* Player 1 */}
                          <div
                            className={`flex justify-between px-3 py-2 ${
                              m.winner === m.player1.id ? "font-bold" : ""
                            }`}
                          >
                            <span className="truncate">
                              {m.player1.name}
                            </span>

                            {m.score && (
                              <span className="score-font ml-2">
                                {m.score.sets
                                  ?.map((s: number[]) => s[0])
                                  .join(" ")}
                              </span>
                            )}
                          </div>

                          {/* Player 2 */}
                          <div
                            className={`flex justify-between px-3 py-2 border-t ${
                              m.winner === m.player2.id ? "font-bold" : ""
                            }`}
                          >
                            <span className="truncate">
                              {m.player2.name}
                            </span>

                            {m.score && (
                              <span className="score-font ml-2">
                                {m.score.sets
                                  ?.map((s: number[]) => s[1])
                                  .join(" ")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border rounded-sm text-xs border-dashed">
                        <div className="px-3 py-2 text-muted-foreground">
                          TBD
                        </div>
                        <div className="px-3 py-2 border-t text-muted-foreground">
                          TBD
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Match List */}
      <section>
        <h2 className="text-lg font-bold mb-4">All Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((match) => (
            <ScoreCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
