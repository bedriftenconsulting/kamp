import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";
import { API_V1_URL } from "@/lib/api-url";
import { useTournament } from "@/components/tournament/TournamentContext";
import Loader from "@/components/ui/loader";

export default function Players() {
  const { activeTournamentId, activeTournament } = useTournament();
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedPlayer = players.find((p) => p.id === selected);
  const groupedPlayers = useMemo(() => {
    const normalizeLevel = (v: string) => {
      const s = (v || "").trim().toLowerCase();
      if (s === "beginner") return "Beginner";
      if (s === "intermediate") return "Intermediate";
      if (s === "advanced") return "Advanced";
      return "Unspecified";
    };
    const normalizeGender = (v: string) => {
      const s = (v || "").trim().toLowerCase();
      if (["male", "man", "men"].includes(s)) return "Men";
      if (["female", "woman", "women"].includes(s)) return "Women";
      return "Unspecified";
    };

    const byGroup = new Map<string, { title: string; items: any[] }>();
    players.forEach((p) => {
      const level = normalizeLevel(p.tennis_level);
      const gender = normalizeGender(p.gender);
      const title = `${level} - ${gender}`;
      if (!byGroup.has(title)) byGroup.set(title, { title, items: [] });
      byGroup.get(title)!.items.push(p);
    });

    const levelOrder = ["Beginner", "Intermediate", "Advanced", "Unspecified"];
    const genderOrder = ["Men", "Women", "Unspecified"];

    return Array.from(byGroup.values()).sort((a, b) => {
      const [al, ag] = a.title.split(" - ");
      const [bl, bg] = b.title.split(" - ");
      const lDiff = levelOrder.indexOf(al) - levelOrder.indexOf(bl);
      if (lDiff !== 0) return lDiff;
      return genderOrder.indexOf(ag) - genderOrder.indexOf(bg);
    });
  }, [players]);

  const fetchData = async () => {
    try {
      const savedId = activeTournamentId || "";
      const pUrl = savedId ? `${API_V1_URL}/players?tournament_id=${savedId}` : `${API_V1_URL}/players`;
      const mUrl = savedId ? `${API_V1_URL}/matches?tournament_id=${savedId}` : `${API_V1_URL}/matches`;

      const [playersRes, matchesRes] = await Promise.all([
        fetch(pUrl),
        fetch(mUrl),
      ]);

      const playersData = await playersRes.json();
      const matchesData = await matchesRes.json();

      // ✅ Transform players
      const formattedPlayers = playersData.map((p: any) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        country: p.nationality,
        gender: p.gender || "",
        tennis_level: p.tennis_level || "",
        ranking: p.ranking,
        wins: 0,   // placeholder (can compute later)
        losses: 0, // placeholder
      }));

      // ✅ Transform matches (for history)
      const formattedMatches = matchesData.map((m: any) => ({
        id: m.id,
        status: m.status,
        round: m.round,
        player1: {
          id: m.player1_id,
          name: m.player1_name,
        },
        player2: {
          id: m.player2_id,
          name: m.player2_name,
        },
        winner: m.winner_id,
      }));

      setPlayers(formattedPlayers);
      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    fetchData();
  }, [activeTournamentId]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-2">
        <Users size={28} className="text-primary" />
        <h1 className="text-3xl font-black">Players</h1>
      </div>
      {activeTournament && (
        <p className="text-sm text-muted-foreground mb-6">{activeTournament.name}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Player Grid */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {groupedPlayers.map((group) => (
              <div key={group.title}>
                <h2 className="text-lg font-bold mb-3">{group.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.items.map((player, i) => (
                    <motion.button
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(player.id)}
                      className={`bg-card border rounded-md p-4 text-left transition-all hover:shadow-md ${
                        selected === player.id
                          ? "ring-2 ring-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center font-display font-black text-primary text-lg">
                          {player.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">
                            {player.name}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {player.country}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">W-L</span>
                          <span className="ml-1 font-bold text-court">
                            {player.wins}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-bold text-live">
                            {player.losses}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {selectedPlayer ? (
            <motion.div
              key={selectedPlayer.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border rounded-md p-6 sticky top-20"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-sm bg-primary/10 flex items-center justify-center font-display font-black text-primary text-2xl mx-auto mb-3">
                  {selectedPlayer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>

                <h2 className="text-xl font-bold">
                  {selectedPlayer.name}
                </h2>

                <div className="text-sm text-muted-foreground mt-1">
                  {selectedPlayer.country}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Wins", value: selectedPlayer.wins },
                  { label: "Losses", value: selectedPlayer.losses },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-3 bg-muted/50 rounded-sm"
                  >
                    <div className="text-lg font-bold score-font">
                      {stat.value}
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Match History */}
              <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp size={14} />
                Match History
              </h3>

              <div className="space-y-2">
                {matches
                  .filter(
                    (m) =>
                      m.player1.id === selectedPlayer.id ||
                      m.player2.id === selectedPlayer.id
                  )
                  .map((m) => {
                    const opponent =
                      m.player1.id === selectedPlayer.id
                        ? m.player2
                        : m.player1;

                    const won = m.winner === selectedPlayer.id;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 text-xs border rounded-sm px-3 py-2"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.status === "live"
                              ? "bg-live animate-pulse-live"
                              : won
                              ? "bg-court"
                              : m.status === "completed"
                              ? "bg-live"
                              : "bg-muted-foreground/30"
                          }`}
                        />

                        <span className="flex-1 truncate">
                          vs {opponent.name}
                        </span>

                        <span className="text-muted-foreground">
                          {m.round}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          ) : (
            <div className="bg-card border rounded-md p-6 text-center text-muted-foreground sticky top-20">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                Select a player to view profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
