import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { motion } from "framer-motion";
import { API_V1_URL } from "@/lib/api-url";

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupMembersById, setGroupMembersById] = useState<Record<string, string[]>>({});
  const [tournament, setTournament] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, tournamentRes, groupsRes, playersRes] = await Promise.all([
          fetch(`${API_V1_URL}/matches`),
          fetch(`${API_V1_URL}/tournaments`),
          fetch(`${API_V1_URL}/groups`),
          fetch(`${API_V1_URL}/players`),
        ]);

        const matchesData = await matchesRes.json();
        const tournamentData = await tournamentRes.json();
        const groupsData = await groupsRes.json();
        const playersData = await playersRes.json();
        const toList = (payload: any) =>
          Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        const matchesList = toList(matchesData);
        const tournamentList = toList(tournamentData);
        const groupsList = toList(groupsData);
        const playersList = toList(playersData);

        // ✅ Ensure tournament exists
        if (tournamentList.length === 0) {
          setTournament(null);
          setMatches([]);
          return;
        }

        const t = tournamentList[0];

        // ✅ Transform tournament
        const formattedTournament = {
          name: t.name,
          location: t.location,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          surface: t.surface ?? "unknown",
        };


        // ✅ Transform matches (FIXED STRUCTURE)
        const formattedMatches = matchesList.map((m: any) => ({
          id: m.id,
          status: m.status,
          player1: {
            name: m.player1_name,
            country: "unknown",
          },
          player2: {
            name: m.player2_name,
            country: "unknown",
          },
          scheduledTime: m.scheduled_time,
        }));

        const formattedGroups = groupsList.map((g: any) => ({
          id: g.id,
          designation: g.designation,
          gender: g.gender || "",
          tennis_level: g.tennis_level || "",
          is_locked: Boolean(g.is_locked),
          status: g.status || "",
        }));

        const formattedPlayers = playersList.map((p: any) => ({
          id: p.id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown Player",
        }));
        const playerNameByID = new Map(formattedPlayers.map((p: any) => [p.id, p.name]));

        const lockedGroupIDs = formattedGroups
          .filter((g: any) => g.is_locked || g.status === "locked" || g.status === "completed")
          .map((g: any) => g.id);

        const groupMembersEntries = await Promise.all(
          lockedGroupIDs.map(async (groupID: string) => {
            try {
              const res = await fetch(`${API_V1_URL}/groups/${groupID}/players`);
              const payload = await res.json().catch(() => ({}));
              const ids = Array.isArray(payload?.player_ids) ? payload.player_ids : [];
              const names = ids.map((id: string) => playerNameByID.get(id) || id);
              return [groupID, names] as const;
            } catch {
              return [groupID, []] as const;
            }
          }),
        );
        setGroupMembersById(Object.fromEntries(groupMembersEntries));

        setTournament(formattedTournament);
        setMatches(formattedMatches);
        setGroups(formattedGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Correct filtering
  const liveMatches = (Array.isArray(matches) ? matches : []).filter(
    (m) => m.status === "live"
  );
  const upcomingMatches = (Array.isArray(matches) ? matches : []).filter(
    (m) => m.status === "scheduled"
  );
  const upcomingMatchesToShow = upcomingMatches.slice(0, 6);
  const lockedGroups = (Array.isArray(groups) ? groups : []).filter(
    (g) => g.is_locked || g.status === "locked" || g.status === "completed",
  );
  const participantsByLevel = {
    Beginner: lockedGroups.filter((g) => g.tennis_level === "Beginner"),
    Intermediate: lockedGroups.filter((g) => g.tennis_level === "Intermediate"),
    Advanced: lockedGroups.filter((g) => g.tennis_level === "Advanced"),
  };

  // ✅ Safe loading states
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-10 text-center">No tournament found</div>;
  }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-primary bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(18,8,14,0.62) 0%, rgba(18,8,14,0.45) 45%, rgba(18,8,14,0.42) 100%), url('/background.png')",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(330_86%_90%_/_0.24),_transparent_60%)]" />

        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-bold uppercase bg-secondary text-secondary-foreground rounded-sm tracking-wider">
                {tournament.status === "scheduled"
                  ? "TODAY"
                  : "Now Playing"}
              </span>

              <span className="px-3 py-1 text-xs font-medium uppercase bg-primary-foreground/10 text-primary-foreground rounded-sm">
                {tournament.surface}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-primary-foreground leading-[1.1] mb-4">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-8 text-primary-foreground/70">
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar size={16} />
                {new Date(tournament.startDate).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" }
                )}
                {" – "}
                {new Date(tournament.endDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>

              <span className="flex items-center gap-1.5 text-sm">
                <MapPin size={16} />
                {tournament.location}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/live">
                <Button className="gap-2 font-bold">
                  <Zap size={18} />
                  Live Scores
                </Button>
              </Link>

              <Link to="/schedule">
                <Button variant="outline" className="gap-2">
                  <Calendar size={18} />
                  View Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Live Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Coming Up</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatchesToShow.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
            {upcomingMatches.length > 6 && (
              <div className="mt-6">
                <Link to="/schedule">
                  <Button variant="outline" className="gap-2">
                    More
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
      {/* Participants */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
              <div key={level} className="p-6 border rounded-md bg-card">
                <h3 className="font-bold mb-3">{level}</h3>
                {participantsByLevel[level].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locked groups yet.</p>
                ) : (
                  <div className="space-y-2">
                    {participantsByLevel[level].map((g) => (
                      <div key={g.id} className="text-sm border rounded-sm px-3 py-2 bg-muted/50">
                        <div className="font-semibold">
                          Group {g.designation}
                          {g.gender ? ` (${g.gender})` : ""}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {groupMembersById[g.id]?.length ? (
                            <ol className="list-decimal list-inside space-y-0.5">
                              {groupMembersById[g.id].map((memberName, idx) => (
                                <li key={`${g.id}-${idx}`}>{memberName}</li>
                              ))}
                            </ol>
                          ) : (
                            "No members assigned"
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Tournament Info */}
      <section className="py-12 bg-background">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-md">
            <Trophy className="mb-3" />
            <h3 className="font-bold">2 Categories</h3>
            <p className="text-sm text-muted-foreground">
              Men & Women Singles
            </p>
          </div>

          <div className="p-6 border rounded-md">
            <MapPin className="mb-3" />
            <h3 className="font-bold">{tournament.venue}</h3>
            <p className="text-sm text-muted-foreground">
              {tournament.location}
            </p>
          </div>

          <div className="p-6 border rounded-md">
            <Calendar className="mb-3" />
            <h3 className="font-bold">Tournament Duration</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(tournament.startDate).toLocaleDateString()} -{" "}
              {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      
    </div>
  );
}
