import { useEffect, useMemo, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { API_V1_URL } from "@/lib/api-url";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  Zap,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "matches", label: "Matches", icon: Calendar },
  { id: "players", label: "Players", icon: Users },
  { id: "tournament", label: "Tournament", icon: Trophy },
];

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  ranking: number;
  bio: string;
  profile_image_url: string;
  name: string;
  country: string;
};

type Match = {
  id: string;
  tournament_id?: string | null;
  player1_id?: string | null;
  player2_id?: string | null;
  court_id?: string | null;
  round: string;
  scheduled_time?: string | null;
  status: string;
  winner_id?: string | null;
  created_at?: string;
  player1_name?: string;
  player2_name?: string;
  player1: { id?: string | null; name: string };
  player2: { id?: string | null; name: string };
  court: string;
};

type Tournament = {
  id: string;
  name: string;
  location: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  surface?: string | null;
};

type PlayerForm = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  ranking: string;
  bio: string;
  profile_image_url: string;
};

type MatchForm = {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  round: string;
  court_id: string;
  status: string;
  scheduled_time: string;
};

type CompleteForm = {
  match_id: string;
  player1_id: string;
  player2_id: string;
  player1_sets: string;
  player2_sets: string;
  player1_games: string;
  player2_games: string;
};

const emptyPlayerForm: PlayerForm = {
  id: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  nationality: "",
  ranking: "",
  bio: "",
  profile_image_url: "",
};

const emptyMatchForm: MatchForm = {
  id: "",
  tournament_id: "",
  player1_id: "",
  player2_id: "",
  round: "",
  court_id: "",
  status: "scheduled",
  scheduled_time: "",
};

const emptyCompleteForm: CompleteForm = {
  match_id: "",
  player1_id: "",
  player2_id: "",
  player1_sets: "",
  player2_sets: "",
  player1_games: "",
  player2_games: "",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayerForm);
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeForm, setCompleteForm] = useState<CompleteForm>(emptyCompleteForm);
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);

  const [matchPage, setMatchPage] = useState(1);
  const matchesPerPage = 20;

  const fetchData = async () => {
    try {
      const [matchesRes, playersRes, tournamentRes] = await Promise.all([
        fetch(`${API_V1_URL}/matches`),
        fetch(`${API_V1_URL}/players`),
        fetch(`${API_V1_URL}/tournaments`),
      ]);

      const matchesData = await matchesRes.json();
      const playersData = await playersRes.json();
      const tournamentData = await tournamentRes.json();
      console.log("DATA:", tournamentData);

      const toList = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

      const matchesList = toList(matchesData);
      const playersList = toList(playersData);
      const tournamentList = toList(tournamentData);

      const formattedMatches: Match[] = matchesList.map((m: any) => ({
        id: m.id,
        tournament_id: m.tournament_id,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        court_id: m.court_id,
        round: m.round,
        scheduled_time: m.scheduled_time,
        status: m.status,
        winner_id: m.winner_id,
        created_at: m.created_at,
        player1_name: m.player1_name,
        player2_name: m.player2_name,
        player1: {
          id: m.player1_id,
          name: m.player1_name || "TBD",
        },
        player2: {
          id: m.player2_id,
          name: m.player2_name || "TBD",
        },
        court: m.court_id || "-",
      }));

      const formattedPlayers: Player[] = playersList.map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        nationality: p.nationality,
        ranking: p.ranking,
        bio: p.bio || "",
        profile_image_url: p.profile_image_url || "",
        name: `${p.first_name} ${p.last_name}`,
        country: p.nationality,
      }));

      const formattedTournaments: Tournament[] = tournamentList.map((t: any) => ({
        id: t.id,
        name: t.name,
        location: t.location,
        start_date: t.start_date,
        end_date: t.end_date,
        status: t.status,
        surface: t.surface,
      }));

      setMatches(formattedMatches);
      setPlayers(formattedPlayers);
      setTournaments(formattedTournaments);
      setMatchPage(1);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalMatchPages = Math.max(1, Math.ceil(matches.length / matchesPerPage));
  const paginatedMatches = useMemo(() => {
    const start = (matchPage - 1) * matchesPerPage;
    return matches.slice(start, start + matchesPerPage);
  }, [matchPage, matches]);

  const handleOpenAddPlayer = () => {
    setIsEditingPlayer(false);
    setPlayerForm(emptyPlayerForm);
    setIsPlayerDialogOpen(true);
  };

  const handleOpenEditPlayer = (player: Player) => {
    setIsEditingPlayer(true);
    setPlayerForm({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      date_of_birth: player.date_of_birth ? String(player.date_of_birth).slice(0, 10) : "",
      nationality: player.nationality,
      ranking: String(player.ranking ?? ""),
      bio: player.bio || "",
      profile_image_url: player.profile_image_url || "",
    });
    setIsPlayerDialogOpen(true);
  };

  const handleSavePlayer = async () => {
    if (
      !playerForm.first_name ||
      !playerForm.last_name ||
      !playerForm.date_of_birth ||
      !playerForm.nationality ||
      !playerForm.ranking
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSavingPlayer(true);

    try {
      const payload = {
        id: playerForm.id || undefined,
        first_name: playerForm.first_name,
        last_name: playerForm.last_name,
        date_of_birth: `${playerForm.date_of_birth}T00:00:00Z`,
        nationality: playerForm.nationality,
        ranking: Number(playerForm.ranking),
        bio: playerForm.bio,
        profile_image_url: playerForm.profile_image_url,
      };

      const url = isEditingPlayer
        ? `${API_V1_URL}/players/${playerForm.id}`
        : `${API_V1_URL}/players`;

      const method = isEditingPlayer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save player");
      }

      setIsPlayerDialogOpen(false);
      setPlayerForm(emptyPlayerForm);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to save player");
    } finally {
      setIsSavingPlayer(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Delete this player?")) return;

    setDeletingPlayerId(id);
    try {
      const res = await fetch(`${API_V1_URL}/players/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete player");
      }

      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to delete player");
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const handleOpenAddMatch = () => {
    setIsEditingMatch(false);
    setMatchForm(emptyMatchForm);
    setIsMatchDialogOpen(true);
  };

  const handleOpenEditMatch = (match: Match) => {
    setIsEditingMatch(true);
    setMatchForm({
      id: match.id,
      tournament_id: match.tournament_id || "",
      player1_id: match.player1_id || "",
      player2_id: match.player2_id || "",
      round: match.round || "",
      court_id: match.court_id || "",
      status: match.status || "scheduled",
      scheduled_time: match.scheduled_time ? String(match.scheduled_time).slice(0, 16) : "",
    });
    setIsMatchDialogOpen(true);
  };

  const handleSaveMatch = async () => {
    if (!matchForm.player1_id || !matchForm.player2_id || !matchForm.round) {
      alert("Please fill player1, player2 and round.");
      return;
    }

    if (matchForm.player1_id === matchForm.player2_id) {
      alert("Player 1 and Player 2 must be different.");
      return;
    }

    setIsSavingMatch(true);

    try {
      const payload = {
        tournament_id: matchForm.tournament_id || undefined,
        player1_id: matchForm.player1_id,
        player2_id: matchForm.player2_id,
        round: matchForm.round,
        court_id: matchForm.court_id || undefined,
        status: matchForm.status,
        scheduled_time: matchForm.scheduled_time
          ? new Date(matchForm.scheduled_time).toISOString()
          : undefined,
      };

      const url = isEditingMatch
        ? `${API_V1_URL}/matches/${matchForm.id}`
        : `${API_V1_URL}/matches`;
      const method = isEditingMatch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save match");
      }

      setIsMatchDialogOpen(false);
      setMatchForm(emptyMatchForm);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to save match");
    } finally {
      setIsSavingMatch(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Delete this match?")) return;

    setDeletingMatchId(id);
    try {
      const res = await fetch(`${API_V1_URL}/matches/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete match");
      }

      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to delete match");
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleOpenCompleteMatch = (match: Match) => {
    setCompleteForm({
      match_id: match.id,
      player1_id: match.player1_id || "",
      player2_id: match.player2_id || "",
      player1_sets: "",
      player2_sets: "",
      player1_games: "",
      player2_games: "",
    });
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteMatch = async () => {
    if (!completeForm.match_id) return;

    setIsCompletingMatch(true);
    try {
      const payload = {
        player1_id: completeForm.player1_id,
        player2_id: completeForm.player2_id,
        player1_sets: Number(completeForm.player1_sets || 0),
        player2_sets: Number(completeForm.player2_sets || 0),
        player1_games: Number(completeForm.player1_games || 0),
        player2_games: Number(completeForm.player2_games || 0),
      };

      const res = await fetch(`${API_V1_URL}/matches/${completeForm.match_id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to complete match");
      }

      setIsCompleteDialogOpen(false);
      setCompleteForm(emptyCompleteForm);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to complete match");
    } finally {
      setIsCompletingMatch(false);
    }
  };

  const liveCount = matches.filter((m) => m.status === "live").length;
  const completedCount = matches.filter((m) => m.status === "completed").length;
  const upcomingCount = matches.filter((m) => m.status === "scheduled").length;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden lg:flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-sidebar-primary flex items-center justify-center font-display font-black text-sidebar-primary-foreground text-sm">
              GS
            </div>
            <div>
              <div className="font-bold text-sm">Admin Panel</div>
              <div className="text-[10px] text-sidebar-foreground/50">
                Tournament Management
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        {activeTab === "overview" && (
          <div>
            <h1 className="text-2xl font-black mb-6">Dashboard</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Live Matches", value: liveCount, icon: Zap },
                { label: "Completed", value: completedCount, icon: Trophy },
                { label: "Upcoming", value: upcomingCount, icon: Calendar },
                { label: "Total Players", value: players.length, icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border rounded-md p-4">
                  <stat.icon size={18} />
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-bold mb-4">Active Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches
                .filter((m) => m.status === "live")
                .map((match) => (
                  <ScoreCard key={match.id} match={match} />
                ))}
            </div>
          </div>
        )}

        {activeTab === "matches" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-black">Matches</h1>
              <Button onClick={handleOpenAddMatch} className="gap-2">
                <Plus size={16} />
                Add Match
              </Button>
            </div>

            <div className="bg-card border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">No.</th>
                    <th className="px-4 py-3 text-left">Match-up</th>
                    <th className="px-4 py-3 text-left">Round</th>
                    <th className="px-4 py-3 text-left">Court</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMatches.map((m, idx) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">{(matchPage - 1) * matchesPerPage + idx + 1}</td>
                      <td className="px-4 py-3">{m.player1.name} vs {m.player2.name}</td>
                      <td className="px-4 py-3">{m.round}</td>
                      <td className="px-4 py-3">{m.court}</td>
                      <td className="px-4 py-3 capitalize">{m.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenEditMatch(m)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteMatch(m.id)}
                            disabled={deletingMatchId === m.id}
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => handleOpenCompleteMatch(m)}
                            disabled={m.status === "completed"}
                          >
                            <CheckCircle2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(matchPage - 1) * matchesPerPage + 1} - {Math.min(matchPage * matchesPerPage, matches.length)} of {matches.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setMatchPage((p) => Math.max(1, p - 1))} disabled={matchPage === 1}>
                  Previous
                </Button>
                <div className="text-sm">Page {matchPage} / {totalMatchPages}</div>
                <Button
                  variant="outline"
                  onClick={() => setMatchPage((p) => Math.min(totalMatchPages, p + 1))}
                  disabled={matchPage === totalMatchPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "players" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-black">Players</h1>
              <Button onClick={handleOpenAddPlayer} className="gap-2">
                <Plus size={16} />
                Add Player
              </Button>
            </div>

            <div className="bg-card border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">No.</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Country</th>
                    <th className="px-4 py-3 text-left">Ranking</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, index) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.country}</td>
                      <td className="px-4 py-3">#{p.ranking}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenEditPlayer(p)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeletePlayer(p.id)}
                            disabled={deletingPlayerId === p.id}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tournament" && (
          <div>
            <h1 className="text-2xl font-black mb-6">Tournaments</h1>

            {tournaments && tournaments.length > 0 ? (
              <div className="bg-card border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">No.</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Surface</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t, index) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{t.name}</td>
                        <td className="px-4 py-3">{t.location || "-"}</td>
                        <td className="px-4 py-3">{t.surface || "-"}</td>
                        <td className="px-4 py-3 capitalize">{t.status}</td>
                        <td className="px-4 py-3">
                          {t.start_date ? String(t.start_date).slice(0, 10) : "-"}
                          {t.end_date ? ` to ${String(t.end_date).slice(0, 10)}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-card border rounded-md p-10 text-center text-muted-foreground">
                No tournaments available
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingPlayer ? "Edit Player" : "Add Player"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="player-id">ID</Label>
              <Input
                id="player-id"
                placeholder="UUID (optional for create)"
                value={playerForm.id}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, id: e.target.value }))}
                disabled={isEditingPlayer}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-first-name">First Name</Label>
              <Input
                id="player-first-name"
                value={playerForm.first_name}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-last-name">Last Name</Label>
              <Input
                id="player-last-name"
                value={playerForm.last_name}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-dob">Date of Birth</Label>
              <Input
                id="player-dob"
                type="date"
                value={playerForm.date_of_birth}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-nationality">Nationality</Label>
              <Input
                id="player-nationality"
                value={playerForm.nationality}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, nationality: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-ranking">Ranking</Label>
              <Input
                id="player-ranking"
                type="number"
                value={playerForm.ranking}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, ranking: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="player-bio">Bio</Label>
              <Textarea
                id="player-bio"
                value={playerForm.bio}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="player-image-url">Profile Image URL</Label>
              <Input
                id="player-image-url"
                value={playerForm.profile_image_url}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, profile_image_url: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPlayerDialogOpen(false)} disabled={isSavingPlayer}>
              Cancel
            </Button>
            <Button onClick={handleSavePlayer} disabled={isSavingPlayer}>
              {isSavingPlayer ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingMatch ? "Edit Match" : "Add Match"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="match-player1">Player 1</Label>
              <select
                id="match-player1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={matchForm.player1_id}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, player1_id: e.target.value }))}
              >
                <option value="">Select Player 1</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-player2">Player 2</Label>
              <select
                id="match-player2"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={matchForm.player2_id}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, player2_id: e.target.value }))}
              >
                <option value="">Select Player 2</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-round">Round</Label>
              <Input
                id="match-round"
                value={matchForm.round}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, round: e.target.value }))}
                placeholder="e.g. Quarterfinal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-court">Court</Label>
              <Input
                id="match-court"
                value={matchForm.court_id}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, court_id: e.target.value }))}
                placeholder="Court ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-status">Status</Label>
              <select
                id="match-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={matchForm.status}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="completed">completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-time">Scheduled Time</Label>
              <Input
                id="match-time"
                type="datetime-local"
                value={matchForm.scheduled_time}
                onChange={(e) => setMatchForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)} disabled={isSavingMatch}>
              Cancel
            </Button>
            <Button onClick={handleSaveMatch} disabled={isSavingMatch}>
              {isSavingMatch ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Match</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="complete-p1-sets">Player 1 Sets</Label>
              <Input
                id="complete-p1-sets"
                type="number"
                value={completeForm.player1_sets}
                onChange={(e) => setCompleteForm((prev) => ({ ...prev, player1_sets: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-p2-sets">Player 2 Sets</Label>
              <Input
                id="complete-p2-sets"
                type="number"
                value={completeForm.player2_sets}
                onChange={(e) => setCompleteForm((prev) => ({ ...prev, player2_sets: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-p1-games">Player 1 Games</Label>
              <Input
                id="complete-p1-games"
                type="number"
                value={completeForm.player1_games}
                onChange={(e) => setCompleteForm((prev) => ({ ...prev, player1_games: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-p2-games">Player 2 Games</Label>
              <Input
                id="complete-p2-games"
                type="number"
                value={completeForm.player2_games}
                onChange={(e) => setCompleteForm((prev) => ({ ...prev, player2_games: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)} disabled={isCompletingMatch}>
              Cancel
            </Button>
            <Button onClick={handleCompleteMatch} disabled={isCompletingMatch}>
              {isCompletingMatch ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
