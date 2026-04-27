import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { Calendar, Trophy } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";
import { useTournament } from "@/components/tournament/TournamentContext";
import Loader from "@/components/ui/loader";

const PLAYOFF_ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Final"
];
const rounds = ["All", ...PLAYOFF_ROUNDS];

export default function Schedule() {
  const { activeTournamentId, activeTournament } = useTournament();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const savedId = activeTournamentId || "";
      const url = savedId ? `${API_V1_URL}/matches?tournament_id=${savedId}` : `${API_V1_URL}/matches`;
      const matchesRes = await fetch(url);
      const matchesData = await matchesRes.json();
      const toList = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const data = toList(matchesData);

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
            servingPlayer: null, // would need live state for this
          } : null,
          bracketPosition: m.bracket_position ?? 999,

        };
      });

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
    setLoading(true);
    fetchMatches();
  }, [activeTournamentId]);

  if (loading) {
    return <Loader label="Loading schedule…" />;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-2">
        <Calendar size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Match Schedule</h1>
      </div>
      {activeTournament && (
        <p className="text-sm text-muted-foreground mb-6">{activeTournament.name}</p>
      )}

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
        
        {(() => {
          const hasPlayoffMatches = matches.some(m => PLAYOFF_ROUNDS.includes(m.round));
          const hasRoundRobinMatches = matches.length > 0 && !hasPlayoffMatches;

          if (hasRoundRobinMatches && !hasPlayoffMatches) {
            return (
              <div className="bg-card border rounded-md p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Trophy className="opacity-20 mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Awaiting Draw</h3>
                <p>The group stages have commenced, but the playoff bracket has not yet been generated for this tournament.</p>
              </div>
            );
          }

          if (!hasPlayoffMatches) {
             return (
              <div className="bg-card border rounded-md p-10 text-center text-muted-foreground">
                No bracket available yet.
              </div>
             );
          }

          // Filter out missing rounds
          let activeRounds = PLAYOFF_ROUNDS.filter(round => matches.some(m => m.round === round));

          // If a specific stage is selected, focus the bracket view on it
          if (selectedRound !== "All" && PLAYOFF_ROUNDS.includes(selectedRound)) {
            activeRounds = activeRounds.filter(r => r === selectedRound);
          }

          return (
            <div className="bg-card border rounded-md p-6 overflow-x-auto">
              <div className="flex gap-8 min-w-[600px]">
                {activeRounds.map((round, ri) => {
                  const roundMatches = matches
                    .filter((m) => m.round === round)
                    .sort((a,b) => a.bracketPosition - b.bracketPosition);

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
                              <div className="flex gap-1 ml-2 font-black text-secondary">
                                {m.score.sets?.[0]?.[0]}
                                {m.status === 'live' && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    ({m.score.currentGame?.[0]})
                                  </span>
                                )}
                              </div>
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
                              <div className="flex gap-1 ml-2 font-black text-secondary">
                                {m.score.sets?.[0]?.[1]}
                                {m.status === 'live' && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    ({m.score.currentGame?.[1]})
                                  </span>
                                )}
                              </div>
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
          );
        })()}
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
