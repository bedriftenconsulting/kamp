import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";

export default function Standings() {
  const [groupStandings, setGroupStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const activeTournamentId = localStorage.getItem("active_public_tournament_id");
        let tournamentPlayerIds = new Set<string>();

        if (activeTournamentId) {
          try {
            const playersRes = await fetch(`${API_V1_URL}/players?tournament_id=${activeTournamentId}`);
            const playersData = await playersRes.json();
            const toList = (payload: any) =>
              Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
            const playersList = toList(playersData);
            playersList.forEach((p: any) => tournamentPlayerIds.add(p.id));
          } catch (err) {
            console.error("Error fetching tournament players:", err);
          }
        }

        const groupsRes = await fetch(`${API_V1_URL}/groups`);
        const groupsData = await groupsRes.json();
        const toList = (payload: any) =>
          Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        const groups = toList(groupsData);

        const lockedGroups = groups.filter(
          (g: any) => g.is_locked || g.status === "locked" || g.status === "completed",
        );

        const standingsEntries = await Promise.all(
          lockedGroups.map(async (g: any) => {
            try {
              const res = await fetch(`${API_V1_URL}/groups/${g.id}/standings`);
              const standings = await res.json();
              return {
                group: g,
                standings: Array.isArray(standings) ? standings : [],
              };
            } catch {
              return { group: g, standings: [] };
            }
          }),
        );

        // Filter: Keep groups that have at least one player in the active tournament's player list
        // If no active tournament is selected, we could either show all, or show nothing.
        // Let's show all if activeTournamentId isn't set, otherwise filter.
        const filteredEntries = activeTournamentId
          ? standingsEntries.filter(
              (entry) =>
                entry.standings.length > 0 &&
                entry.standings.some((s: any) => tournamentPlayerIds.has(s.player_id))
            )
          : standingsEntries;

        setGroupStandings(filteredEntries);
      } catch (error) {
        console.error("Error fetching standings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading standings...</div>;
  }

  const byLevel = {
    Advanced: groupStandings.filter(({ group }: any) => group.tennis_level === "Advanced"),
    Intermediate: groupStandings.filter(({ group }: any) => group.tennis_level === "Intermediate"),
    Beginner: groupStandings.filter(({ group }: any) => group.tennis_level === "Beginner"),
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Live Standings</h1>
      </div>

      {groupStandings.length === 0 ? (
        <div className="bg-card border rounded-md p-6 text-sm text-muted-foreground">
          No locked groups available.
        </div>
      ) : (
        <div className="space-y-8">
          {(["Advanced", "Intermediate", "Beginner"] as const).map((level) => (
            <section key={level}>
              <h2 className="text-xl font-bold mb-4">{level}</h2>
              {byLevel[level].length === 0 ? (
                <div className="bg-card border rounded-md p-6 text-sm text-muted-foreground">
                  No {level.toLowerCase()} groups yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {byLevel[level].map(({ group, standings }: any) => (
                    <div key={group.id} className="bg-card border rounded-md overflow-hidden">
                      <div className="px-4 py-3 border-b bg-muted/40">
                        <div className="text-sm font-bold">
                          Group {group.designation}
                          {group.gender ? ` (${group.gender})` : ""}
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <thead className="bg-muted/20">
                          <tr>
                            <th className="px-4 py-2 text-left">Player</th>
                            <th className="px-4 py-2 text-left">W</th>
                            <th className="px-4 py-2 text-left">L</th>
                            <th className="px-4 py-2 text-left">Pts</th>
                            <th className="px-4 py-2 text-left">Diff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-3 text-muted-foreground">
                                No results yet.
                              </td>
                            </tr>
                          ) : (
                            standings.map((s: any) => (
                              <tr key={s.player_id} className="border-t">
                                <td className="px-4 py-2">{s.player_name}</td>
                                <td className="px-4 py-2">{s.wins}</td>
                                <td className="px-4 py-2">{s.losses}</td>
                                <td className="px-4 py-2">{s.points}</td>
                                <td className="px-4 py-2">{s.score_diff}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
