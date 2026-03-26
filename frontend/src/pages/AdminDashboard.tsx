import { useEffect, useMemo, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { API_V1_URL } from "@/lib/api-url";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  Blocks,
  Zap,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "players", label: "Players", icon: Users },
  { id: "groups", label: "Groups", icon: Blocks },
  { id: "knockout", label: "Knockout", icon: Trophy },
  { id: "matches", label: "Matches", icon: Calendar },
  { id: "tournament", label: "Tournament", icon: Trophy },
];

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  tournament_name: string;
  gender: string;
  age: number;
  tennis_level: string;
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
  winner_name?: string;
  player1_score?: number | null;
  player2_score?: number | null;
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
  gender: string;
  age: string;
  tennis_level: string;
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

type TournamentForm = {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  surface: string;
};

type Group = {
  id: string;
  designation: string;
  gender: string;
  tennis_level: "Beginner" | "Intermediate" | "Advanced";
  max_players: number;
  qualifiers_count: number;
  is_locked: boolean;
  players_count: number;
  status: "open" | "locked" | "completed";
};

type GroupForm = {
  designation: string;
  gender: "Men" | "Women";
  tennis_level: "Beginner" | "Intermediate" | "Advanced";
  max_players: string;
  qualifiers_count: string;
};

type GroupMatch = {
  id: string;
  group_id: string;
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  status: string;
};

type GroupStanding = {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  score_for: number;
  score_against: number;
  score_diff: number;
  points: number;
  rank: number;
  is_qualified: boolean;
};

type KnockoutLevel = "Beginner" | "Intermediate" | "Advanced";

type KnockoutBracket = {
  id: string;
  tennis_level: KnockoutLevel;
  status: string;
  champion_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type KnockoutMatch = {
  id: string;
  bracket_id: string;
  round: string;
  round_order: number;
  match_number: number;
  player1_id?: string | null;
  player2_id?: string | null;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  winner_id?: string | null;
  winner_name?: string;
  status: string;
};

type KnockoutView = {
  bracket: KnockoutBracket | null;
  matches: KnockoutMatch[];
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
  gender: "",
  age: "",
  tennis_level: "",
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

const emptyTournamentForm: TournamentForm = {
  id: "",
  name: "",
  location: "",
  start_date: "",
  end_date: "",
  status: "scheduled",
  surface: "",
};

const emptyGroupForm: GroupForm = {
  designation: "",
  gender: "Men",
  tennis_level: "Beginner",
  max_players: "4",
  qualifiers_count: "2",
};

const knockoutLevels: KnockoutLevel[] = ["Beginner", "Intermediate", "Advanced"];

const calculateAgeFromDOB = (dob?: string | null) => {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
};

const normalizeGender = (raw?: string | null): "Men" | "Women" | "" => {
  const v = (raw || "").trim().toLowerCase();
  if (["male", "man", "men"].includes(v)) return "Men";
  if (["female", "woman", "women"].includes(v)) return "Women";
  return "";
};

const parseResponseBody = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const fetchJSONOrFallback = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const res = await fetch(url);
    const body = await parseResponseBody(res);

    if (!res.ok) {
      console.warn(`[AdminDashboard] ${url} returned ${res.status}`, body);
      return fallback;
    }

    return (body as T) ?? fallback;
  } catch (error) {
    console.error(`[AdminDashboard] request failed for ${url}`, error);
    return fallback;
  }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

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

  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [isEditingTournament, setIsEditingTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState<TournamentForm>(emptyTournamentForm);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupPlayerSelections, setGroupPlayerSelections] = useState<string[]>([]);
  const [groupMatches, setGroupMatches] = useState<GroupMatch[]>([]);
  const [groupStandings, setGroupStandings] = useState<GroupStanding[]>([]);
  const [groupScoreInputs, setGroupScoreInputs] = useState<Record<string, { p1: string; p2: string }>>({});
  const [isSavingGroupPlayers, setIsSavingGroupPlayers] = useState(false);
  const [isLockingGroup, setIsLockingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [knockoutViews, setKnockoutViews] = useState<Record<KnockoutLevel, KnockoutView>>({
    Beginner: { bracket: null, matches: [] },
    Intermediate: { bracket: null, matches: [] },
    Advanced: { bracket: null, matches: [] },
  });
  const [isGeneratingKnockout, setIsGeneratingKnockout] = useState<Record<KnockoutLevel, boolean>>({
    Beginner: false,
    Intermediate: false,
    Advanced: false,
  });
  const [knockoutScoreInputs, setKnockoutScoreInputs] = useState<
    Record<string, { p1: string; p2: string; winner_id: string }>
  >({});
  const [savingKnockoutMatchId, setSavingKnockoutMatchId] = useState<string | null>(null);

  const [matchPage, setMatchPage] = useState(1);
  const matchesPerPage = 20;

  const fetchData = async () => {
    try {
      const [matchesData, playersData, tournamentData, groupsData] = await Promise.all([
        fetchJSONOrFallback<any>(`${API_V1_URL}/matches`, []),
        fetchJSONOrFallback<any>(`${API_V1_URL}/players`, []),
        fetchJSONOrFallback<any>(`${API_V1_URL}/tournaments`, []),
        fetchJSONOrFallback<any>(`${API_V1_URL}/groups`, []),
      ]);
      console.log("DATA:", tournamentData);

      const toList = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

      const matchesList = toList(matchesData);
      const playersList = toList(playersData);
      const tournamentList = toList(tournamentData);
      const groupsList = toList(groupsData);

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
        winner_name: m.winner_name || "",
        player1_score: m.player1_score ?? null,
        player2_score: m.player2_score ?? null,
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
        first_name: p.first_name || p.firstName || "",
        last_name: p.last_name || p.lastName || "",
        date_of_birth: p.date_of_birth || p.dateOfBirth || "",
        nationality: p.nationality || p.country || "",
        tournament_name: p.tournament_name || p.tournamentName || "",
        gender: p.gender || p.Gender || "",
        age: Number(p.age || p.Age || calculateAgeFromDOB(p.date_of_birth || p.dateOfBirth)),
        tennis_level: p.tennis_level || p.tennisLevel || "",
        ranking: Number(p.ranking || 0),
        bio: p.bio || "",
        profile_image_url: p.profile_image_url || p.profileImageUrl || "",
        name: `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim(),
        country: p.nationality || p.country || "",
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

      const formattedGroups: Group[] = groupsList.map((g: any) => ({
        id: g.id,
        designation: g.designation,
        gender: normalizeGender(g.gender || g.Gender) || "",
        tennis_level: g.tennis_level,
        max_players: Number(g.max_players || 0),
        qualifiers_count: Number(g.qualifiers_count || 0),
        is_locked: Boolean(g.is_locked),
        players_count: Number(g.players_count || 0),
        status: g.status || (g.is_locked ? "locked" : "open"),
      }));

      setMatches(formattedMatches);
      setPlayers(formattedPlayers);
      setTournaments(formattedTournaments);
      setGroups(formattedGroups);
      setMatchPage(1);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab !== "groups") return;

    if (groups.length === 0) {
      setSelectedGroupId(null);
      setGroupPlayerSelections([]);
      setGroupMatches([]);
      setGroupStandings([]);
      return;
    }

    const hasSelected = selectedGroupId && groups.some((g) => g.id === selectedGroupId);
    const nextGroupID = hasSelected ? selectedGroupId! : groups[0].id;

    if (!hasSelected) {
      setSelectedGroupId(nextGroupID);
    }

    loadGroupDetails(nextGroupID).catch((error: any) => {
      console.error("Failed to auto-load group details:", error);
    });
  }, [activeTab, groups, selectedGroupId]);

  const loadKnockoutByLevel = async (level: KnockoutLevel) => {
    const data = await fetchJSONOrFallback<any>(`${API_V1_URL}/knockout/${level.toLowerCase()}`, {
      bracket: null,
      matches: [],
    });
    const matches: KnockoutMatch[] = (Array.isArray(data?.matches) ? data.matches : []).map((m: any) => ({
      id: m.id,
      bracket_id: m.bracket_id,
      round: m.round,
      round_order: Number(m.round_order || 0),
      match_number: Number(m.match_number || 0),
      player1_id: m.player1_id || null,
      player2_id: m.player2_id || null,
      player1_name: m.player1_name || "TBD",
      player2_name: m.player2_name || "TBD",
      player1_score: Number(m.player1_score || 0),
      player2_score: Number(m.player2_score || 0),
      winner_id: m.winner_id || null,
      winner_name: m.winner_name || "",
      status: m.status || "scheduled",
    }));
    const view: KnockoutView = {
      bracket: data?.bracket ?? null,
      matches,
    };

    setKnockoutViews((prev) => ({ ...prev, [level]: view }));
    setKnockoutScoreInputs((prev) => {
      const next = { ...prev };
      matches.forEach((m) => {
        next[m.id] = {
          p1: String(m.player1_score ?? 0),
          p2: String(m.player2_score ?? 0),
          winner_id: m.winner_id || "",
        };
      });
      return next;
    });
  };

  const loadAllKnockout = async () => {
    await Promise.all(knockoutLevels.map((level) => loadKnockoutByLevel(level)));
  };

  useEffect(() => {
    if (activeTab !== "knockout") return;
    loadAllKnockout().catch((error) => {
      console.error("Failed to load knockout data:", error);
    });
  }, [activeTab]);

  const handleGenerateKnockout = async (level: KnockoutLevel) => {
    setIsGeneratingKnockout((prev) => ({ ...prev, [level]: true }));
    try {
      const res = await fetch(`${API_V1_URL}/knockout/${level.toLowerCase()}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to generate ${level} knockout bracket`);
      }
      await loadKnockoutByLevel(level);
    } catch (error: any) {
      alert(error?.message || `Failed to generate ${level} knockout bracket`);
    } finally {
      setIsGeneratingKnockout((prev) => ({ ...prev, [level]: false }));
    }
  };

  const handleSaveKnockoutResult = async (match: KnockoutMatch) => {
    const input = knockoutScoreInputs[match.id];
    if (!input) return;
    if (!input.winner_id) {
      alert("Select a winner before saving.");
      return;
    }

    setSavingKnockoutMatchId(match.id);
    try {
      const res = await fetch(`${API_V1_URL}/knockout/matches/${match.id}/result`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner_id: input.winner_id,
          player1_score: Number(input.p1 || 0),
          player2_score: Number(input.p2 || 0),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save knockout result");
      }

      const level = (match.round && knockoutLevels.find((l) => knockoutViews[l].bracket?.id === match.bracket_id)) || null;
      if (level) {
        await loadKnockoutByLevel(level);
      } else {
        await loadAllKnockout();
      }
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to save knockout result");
    } finally {
      setSavingKnockoutMatchId(null);
    }
  };

  const finalizedMatches = useMemo(
    () => matches.filter((m) => m.status === "completed"),
    [matches],
  );
  const totalMatchPages = Math.max(1, Math.ceil(finalizedMatches.length / matchesPerPage));
  const paginatedMatches = useMemo(() => {
    const start = (matchPage - 1) * matchesPerPage;
    return finalizedMatches.slice(start, start + matchesPerPage);
  }, [matchPage, finalizedMatches]);

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
      gender: player.gender || "",
      age: String(player.age ?? ""),
      tennis_level: player.tennis_level || "",
      ranking: String(player.ranking ?? ""),
      bio: player.bio || "",
      profile_image_url: player.profile_image_url || "",
    });
    setIsPlayerDialogOpen(true);
  };

  const handleSavePlayer = async () => {
    if (
      !playerForm.first_name ||
      !playerForm.last_name
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
        date_of_birth: playerForm.date_of_birth ? `${playerForm.date_of_birth}T00:00:00Z` : undefined,
        nationality: playerForm.nationality,
        gender: playerForm.gender,
        age: Number(playerForm.age || 0),
        tennis_level: playerForm.tennis_level,
        ranking: playerForm.ranking ? Number(playerForm.ranking) : 0,
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

  const handleOpenAddTournament = () => {
    setIsEditingTournament(false);
    setTournamentForm(emptyTournamentForm);
    setIsTournamentDialogOpen(true);
  };

  const handleOpenEditTournament = (t: Tournament) => {
    setIsEditingTournament(true);
    setTournamentForm({
      id: t.id,
      name: t.name || "",
      location: t.location || "",
      start_date: t.start_date ? String(t.start_date).slice(0, 10) : "",
      end_date: t.end_date ? String(t.end_date).slice(0, 10) : "",
      status: t.status || "scheduled",
      surface: t.surface || "",
    });
    setIsTournamentDialogOpen(true);
  };

  const handleSaveTournament = async () => {
    if (!tournamentForm.name) {
      alert("Tournament name is required.");
      return;
    }

    setIsSavingTournament(true);
    try {
      const payload = {
        name: tournamentForm.name,
        location: tournamentForm.location,
        start_date: tournamentForm.start_date ? `${tournamentForm.start_date}T00:00:00Z` : undefined,
        end_date: tournamentForm.end_date ? `${tournamentForm.end_date}T00:00:00Z` : undefined,
        status: tournamentForm.status || "scheduled",
        surface: tournamentForm.surface || undefined,
      };

      const url = isEditingTournament
        ? `${API_V1_URL}/tournaments/${tournamentForm.id}`
        : `${API_V1_URL}/tournaments`;
      const method = isEditingTournament ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save tournament");
      }

      setIsTournamentDialogOpen(false);
      setTournamentForm(emptyTournamentForm);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to save tournament");
    } finally {
      setIsSavingTournament(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm("Delete this tournament?")) return;

    setDeletingTournamentId(id);
    try {
      const res = await fetch(`${API_V1_URL}/tournaments/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete tournament");
      }

      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to delete tournament");
    } finally {
      setDeletingTournamentId(null);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  const loadGroupDetails = async (groupID: string) => {
    const [playersData, matchesData, standingsData] = await Promise.all([
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/players`, { player_ids: [] }),
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/matches`, []),
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/standings`, []),
    ]);

    const playerIDs = Array.isArray(playersData?.player_ids) ? playersData.player_ids : [];
    setGroupPlayerSelections(playerIDs);

    const formattedMatches: GroupMatch[] = (Array.isArray(matchesData) ? matchesData : []).map((m: any) => ({
      id: m.id,
      group_id: m.group_id,
      player1_id: m.player1_id,
      player2_id: m.player2_id,
      player1_name: m.player1_name,
      player2_name: m.player2_name,
      player1_score: Number(m.player1_score || 0),
      player2_score: Number(m.player2_score || 0),
      status: m.status || "scheduled",
    }));
    setGroupMatches(formattedMatches);

    const scoreInputs: Record<string, { p1: string; p2: string }> = {};
    formattedMatches.forEach((m) => {
      scoreInputs[m.id] = {
        p1: String(m.player1_score ?? 0),
        p2: String(m.player2_score ?? 0),
      };
    });
    setGroupScoreInputs(scoreInputs);

    setGroupStandings(Array.isArray(standingsData) ? standingsData : []);
  };

  const handleOpenAddGroup = () => {
    setGroupForm(emptyGroupForm);
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.designation || !groupForm.max_players || !groupForm.qualifiers_count) {
      alert("Please fill all required group fields.");
      return;
    }

    setIsSavingGroup(true);
    try {
      const payload = {
        designation: groupForm.designation,
        gender: normalizeGender(groupForm.gender) || "Men",
        tennis_level: groupForm.tennis_level,
        max_players: Number(groupForm.max_players),
        qualifiers_count: Number(groupForm.qualifiers_count),
      };

      const res = await fetch(`${API_V1_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create group");
      }

      setIsGroupDialogOpen(false);
      setGroupForm(emptyGroupForm);
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to create group");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleSelectGroup = async (groupID: string) => {
    setSelectedGroupId(groupID);
    try {
      await loadGroupDetails(groupID);
    } catch (error: any) {
      alert(error?.message || "Failed to load group details");
    }
  };

  const handleSaveGroupPlayers = async () => {
    if (!selectedGroupId) return;
    setIsSavingGroupPlayers(true);
    try {
      const res = await fetch(`${API_V1_URL}/groups/${selectedGroupId}/players`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_ids: groupPlayerSelections }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save group players");
      }
      await fetchData();
      await loadGroupDetails(selectedGroupId);
    } catch (error: any) {
      alert(error?.message || "Failed to save group players");
    } finally {
      setIsSavingGroupPlayers(false);
    }
  };

  const handleLockGroup = async () => {
    if (!selectedGroupId) return;
    setIsLockingGroup(true);
    try {
      const res = await fetch(`${API_V1_URL}/groups/${selectedGroupId}/lock`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to lock group");
      }
      await fetchData();
      await loadGroupDetails(selectedGroupId);
    } catch (error: any) {
      alert(error?.message || "Failed to lock group");
    } finally {
      setIsLockingGroup(false);
    }
  };

  const handleSaveGroupMatchResult = async (matchID: string) => {
    if (!selectedGroupId) return;
    const input = groupScoreInputs[matchID];
    if (!input) return;

    try {
      const res = await fetch(`${API_V1_URL}/groups/${selectedGroupId}/matches/${matchID}/result`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1_score: Number(input.p1 || 0),
          player2_score: Number(input.p2 || 0),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save match result");
      }
      await fetchData();
      await loadGroupDetails(selectedGroupId);
    } catch (error: any) {
      alert(error?.message || "Failed to save match result");
    }
  };

  const handleDeleteGroup = async (groupID: string) => {
    if (!confirm("Delete this group? This also removes generated matches linked to it.")) return;

    setDeletingGroupId(groupID);
    try {
      const res = await fetch(`${API_V1_URL}/groups/${groupID}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete group");
      }

      if (selectedGroupId === groupID) {
        setSelectedGroupId(null);
        setGroupPlayerSelections([]);
        setGroupMatches([]);
        setGroupStandings([]);
      }

      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to delete group");
    } finally {
      setDeletingGroupId(null);
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
            <div className="mb-6">
              <h1 className="text-2xl font-black">Match Results</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Results are populated from finalized round-robin group matches.
              </p>
            </div>

            <div className="bg-card border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">No.</th>
                    <th className="px-4 py-3 text-left">Match-up</th>
                    <th className="px-4 py-3 text-left">Round</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Winner</th>
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
                      <td className="px-4 py-3">
                        {m.player1_score != null && m.player2_score != null
                          ? `${m.player1_score} - ${m.player2_score}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{m.winner_name || "-"}</td>
                      <td className="px-4 py-3 capitalize">{m.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteMatch(m.id)}
                            disabled={deletingMatchId === m.id}
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

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {finalizedMatches.length === 0 ? 0 : (matchPage - 1) * matchesPerPage + 1} - {Math.min(matchPage * matchesPerPage, finalizedMatches.length)} of {finalizedMatches.length}
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

        {activeTab === "knockout" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black">Knockout Brackets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Qualified players from completed round-robin groups advance into single-elimination playoffs by tennis level.
              </p>
            </div>

            {knockoutLevels.map((level) => {
              const view = knockoutViews[level];
              const matchesByRound = view.matches.reduce<Record<number, KnockoutMatch[]>>((acc, match) => {
                const key = Number(match.round_order || 0);
                if (!acc[key]) acc[key] = [];
                acc[key].push(match);
                return acc;
              }, {});
              const sortedRoundOrders = Object.keys(matchesByRound)
                .map(Number)
                .sort((a, b) => a - b);
              const championName =
                view.matches.find((m) => m.winner_id && m.winner_id === view.bracket?.champion_id)?.winner_name || "-";

              return (
                <div key={level} className="bg-card border rounded-md p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{level} Knockout Bracket</h2>
                      <div className="text-xs text-muted-foreground">
                        Status: {view.bracket?.status || "not generated"} | Champion: {championName}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateKnockout(level)}
                      disabled={isGeneratingKnockout[level]}
                    >
                      {isGeneratingKnockout[level] ? "Generating..." : `Generate ${level} Bracket`}
                    </Button>
                  </div>

                  {view.matches.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No knockout matches yet. Generate bracket after group standings are ready.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedRoundOrders.map((roundOrder) => (
                        <div key={`${level}-${roundOrder}`} className="space-y-2">
                          <h3 className="font-semibold">
                            {matchesByRound[roundOrder][0]?.round || `Round ${roundOrder}`}
                          </h3>
                          <div className="space-y-2">
                            {matchesByRound[roundOrder]
                              .sort((a, b) => a.match_number - b.match_number)
                              .map((match) => {
                                const input = knockoutScoreInputs[match.id] || {
                                  p1: "0",
                                  p2: "0",
                                  winner_id: "",
                                };
                                const isCompleted = match.status === "completed";
                                const canEdit = !isCompleted && !!match.player1_id && !!match.player2_id;

                                return (
                                  <div
                                    key={match.id}
                                    className="border rounded-md p-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3"
                                  >
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        Match {match.match_number}: {match.player1_name} vs {match.player2_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Status: {match.status}
                                        {match.winner_name ? ` | Winner: ${match.winner_name}` : ""}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Input
                                        className="w-20"
                                        type="number"
                                        value={input.p1}
                                        disabled={!canEdit}
                                        onChange={(e) =>
                                          setKnockoutScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: {
                                              p1: e.target.value,
                                              p2: prev[match.id]?.p2 ?? "0",
                                              winner_id: prev[match.id]?.winner_id ?? "",
                                            },
                                          }))
                                        }
                                      />
                                      <span>-</span>
                                      <Input
                                        className="w-20"
                                        type="number"
                                        value={input.p2}
                                        disabled={!canEdit}
                                        onChange={(e) =>
                                          setKnockoutScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: {
                                              p1: prev[match.id]?.p1 ?? "0",
                                              p2: e.target.value,
                                              winner_id: prev[match.id]?.winner_id ?? "",
                                            },
                                          }))
                                        }
                                      />
                                      <select
                                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={input.winner_id}
                                        disabled={!canEdit}
                                        onChange={(e) =>
                                          setKnockoutScoreInputs((prev) => ({
                                            ...prev,
                                            [match.id]: {
                                              p1: prev[match.id]?.p1 ?? "0",
                                              p2: prev[match.id]?.p2 ?? "0",
                                              winner_id: e.target.value,
                                            },
                                          }))
                                        }
                                      >
                                        <option value="">Winner</option>
                                        {match.player1_id && (
                                          <option value={match.player1_id}>{match.player1_name}</option>
                                        )}
                                        {match.player2_id && (
                                          <option value={match.player2_id}>{match.player2_name}</option>
                                        )}
                                      </select>
                                      <Button
                                        variant="outline"
                                        disabled={!canEdit || savingKnockoutMatchId === match.id}
                                        onClick={() => handleSaveKnockoutResult(match)}
                                      >
                                        {isCompleted
                                          ? "Saved"
                                          : savingKnockoutMatchId === match.id
                                            ? "Saving..."
                                            : "Save Result"}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
                    <th className="px-4 py-3 text-left">Gender</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Tennis Level</th>
                    <th className="px-4 py-3 text-left">Tournament</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, index) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.gender || "-"}</td>
                      <td className="px-4 py-3">{p.age || "-"}</td>
                      <td className="px-4 py-3">{p.tennis_level || "-"}</td>
                      <td className="px-4 py-3">{p.tournament_name || "-"}</td>
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

        {activeTab === "groups" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black">Groups</h1>
              <Button onClick={handleOpenAddGroup} className="gap-2">
                <Plus size={16} />
                Add Group
              </Button>
            </div>

            <div className="bg-card border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Group</th>
                    <th className="px-4 py-3 text-left">Gender</th>
                    <th className="px-4 py-3 text-left">Level</th>
                    <th className="px-4 py-3 text-left">Players</th>
                    <th className="px-4 py-3 text-left">Qualifiers</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No groups yet. Create one to start round robin setup.
                      </td>
                    </tr>
                  ) : (
                    groups.map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="px-4 py-3 font-semibold">{g.designation}</td>
                        <td className="px-4 py-3">{normalizeGender(g.gender) || "-"}</td>
                        <td className="px-4 py-3">{g.tennis_level}</td>
                        <td className="px-4 py-3">
                          {g.players_count} / {g.max_players}
                        </td>
                        <td className="px-4 py-3">Top {g.qualifiers_count}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              g.status === "completed"
                                ? "text-emerald-600 font-medium"
                                : g.status === "locked"
                                  ? "text-amber-600 font-medium"
                                  : "text-sky-600 font-medium"
                            }
                          >
                            {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant={selectedGroupId === g.id ? "default" : "outline"}
                              onClick={() => handleSelectGroup(g.id)}
                            >
                              {selectedGroupId === g.id ? "Selected" : "Manage"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteGroup(g.id)}
                              disabled={deletingGroupId === g.id}
                            >
                              {deletingGroupId === g.id ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedGroup && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                      {(normalizeGender(selectedGroup.gender) || "Unspecified")} {selectedGroup.tennis_level} {selectedGroup.designation}
                    </h2>
                    <div className="text-xs text-muted-foreground">
                      {selectedGroup.players_count}/{selectedGroup.max_players} players
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Players</Label>
                    <div className="max-h-56 overflow-auto rounded-md border p-3 space-y-2">
                      {players
                        .filter((p) => {
                          const levelMatches = (p.tennis_level || "").toLowerCase() === selectedGroup.tennis_level.toLowerCase();
                          const pg = normalizeGender(p.gender);
                          const sg = normalizeGender(selectedGroup.gender);
                          const genderMatches = sg !== "" && pg === sg;
                          return levelMatches && genderMatches;
                        })
                        .map((p) => {
                          const checked = groupPlayerSelections.includes(p.id);
                          const disableUnchecked =
                            !checked && groupPlayerSelections.length >= selectedGroup.max_players;

                          return (
                            <label key={p.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={selectedGroup.is_locked || disableUnchecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupPlayerSelections((prev) => [...prev, p.id]);
                                  } else {
                                    setGroupPlayerSelections((prev) => prev.filter((id) => id !== p.id));
                                  }
                                }}
                              />
                              <span>{p.name}</span>
                            </label>
                          );
                        })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Only players with level <strong>{selectedGroup.tennis_level}</strong> and gender{" "}
                      <strong>{normalizeGender(selectedGroup.gender) || "Unspecified"}</strong> are listed.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleSaveGroupPlayers}
                      disabled={selectedGroup.is_locked || isSavingGroupPlayers}
                    >
                      {isSavingGroupPlayers ? "Saving..." : "Save Players"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLockGroup}
                      disabled={selectedGroup.is_locked || isLockingGroup}
                    >
                      {isLockingGroup ? "Locking..." : "Finalize Group & Generate Round Robin"}
                    </Button>
                  </div>
                </div>

                <div className="bg-card border rounded-md p-4 space-y-4">
                  <h2 className="text-lg font-bold">Standings</h2>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Player</th>
                          <th className="px-3 py-2 text-left">W</th>
                          <th className="px-3 py-2 text-left">L</th>
                          <th className="px-3 py-2 text-left">Pts</th>
                          <th className="px-3 py-2 text-left">Diff</th>
                          <th className="px-3 py-2 text-left">Q</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                              No standings yet.
                            </td>
                          </tr>
                        ) : (
                          groupStandings.map((s) => (
                            <tr key={s.player_id} className="border-t">
                              <td className="px-3 py-2">{s.rank}</td>
                              <td className="px-3 py-2">{s.player_name}</td>
                              <td className="px-3 py-2">{s.wins}</td>
                              <td className="px-3 py-2">{s.losses}</td>
                              <td className="px-3 py-2">{s.points}</td>
                              <td className="px-3 py-2">{s.score_diff}</td>
                              <td className="px-3 py-2">{s.is_qualified ? "Yes" : "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {selectedGroup && (
              <div className="bg-card border rounded-md p-4 space-y-4">
                <h2 className="text-lg font-bold">Round Robin Matches</h2>
                <div className="space-y-3">
                  {groupMatches.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No fixtures yet. Lock the group after filling players to generate matches.
                    </div>
                  ) : (
                    groupMatches.map((m, i) => (
                      <div
                        key={m.id}
                        className="border rounded-md p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                      >
                        <div className="text-sm">
                          <span className="font-semibold mr-2">#{i + 1}</span>
                          {m.player1_name} vs {m.player2_name}
                          <span className="ml-2 text-muted-foreground">({m.status})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            className="w-20"
                            type="number"
                            value={groupScoreInputs[m.id]?.p1 ?? "0"}
                            onChange={(e) =>
                              setGroupScoreInputs((prev) => ({
                                ...prev,
                                [m.id]: { p1: e.target.value, p2: prev[m.id]?.p2 ?? "0" },
                              }))
                            }
                            disabled={!selectedGroup.is_locked || m.status === "completed"}
                          />
                          <span>-</span>
                          <Input
                            className="w-20"
                            type="number"
                            value={groupScoreInputs[m.id]?.p2 ?? "0"}
                            onChange={(e) =>
                              setGroupScoreInputs((prev) => ({
                                ...prev,
                                [m.id]: { p1: prev[m.id]?.p1 ?? "0", p2: e.target.value },
                              }))
                            }
                            disabled={!selectedGroup.is_locked || m.status === "completed"}
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleSaveGroupMatchResult(m.id)}
                            disabled={!selectedGroup.is_locked || m.status === "completed"}
                          >
                            {m.status === "completed" ? "Saved" : "Save Result"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tournament" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-black">Tournaments</h1>
              <Button onClick={handleOpenAddTournament} className="gap-2">
                <Plus size={16} />
                Add Tournament
              </Button>
            </div>

            {tournaments && tournaments.length > 0 ? (
              <div className="bg-card border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">Tournament ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Start Date</th>
                      <th className="px-4 py-3 text-left">End Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">{t.id}</td>
                        <td className="px-4 py-3">{t.name}</td>
                        <td className="px-4 py-3">{t.location || "-"}</td>
                        <td className="px-4 py-3">{t.start_date ? String(t.start_date).slice(0, 10) : "-"}</td>
                        <td className="px-4 py-3">{t.end_date ? String(t.end_date).slice(0, 10) : "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenEditTournament(t)}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteTournament(t.id)}
                              disabled={deletingTournamentId === t.id}
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
            <DialogDescription>
              Fill player details and save changes.
            </DialogDescription>
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

            <div className="space-y-2">
              <Label htmlFor="player-gender">Gender</Label>
              <Input
                id="player-gender"
                value={playerForm.gender}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, gender: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-age">Age</Label>
              <Input
                id="player-age"
                type="number"
                value={playerForm.age}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, age: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="player-tennis-level">Tennis Level</Label>
              <Input
                id="player-tennis-level"
                value={playerForm.tennis_level}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, tennis_level: e.target.value }))}
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
            <DialogDescription>
              Configure matchup details and scheduling.
            </DialogDescription>
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
            <DialogDescription>
              Enter final sets and games for both players.
            </DialogDescription>
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

      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingTournament ? "Edit Tournament" : "Add Tournament"}</DialogTitle>
            <DialogDescription>
              Create or update tournament metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tournament-id">Tournament ID</Label>
              <Input
                id="tournament-id"
                value={tournamentForm.id}
                disabled
                placeholder="Auto-generated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-name">Name</Label>
              <Input
                id="tournament-name"
                value={tournamentForm.name}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-location">Location</Label>
              <Input
                id="tournament-location"
                value={tournamentForm.location}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-start-date">Start Date</Label>
              <Input
                id="tournament-start-date"
                type="date"
                value={tournamentForm.start_date}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-end-date">End Date</Label>
              <Input
                id="tournament-end-date"
                type="date"
                value={tournamentForm.end_date}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-status">Status</Label>
              <select
                id="tournament-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={tournamentForm.status}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="completed">completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament-surface">Surface</Label>
              <select
                id="tournament-surface"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={tournamentForm.surface}
                onChange={(e) => setTournamentForm((prev) => ({ ...prev, surface: e.target.value }))}
              >
                <option value="">Select surface</option>
                <option value="Hard">Hard</option>
                <option value="Clay">Clay</option>
                <option value="Grass">Grass</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTournamentDialogOpen(false)} disabled={isSavingTournament}>
              Cancel
            </Button>
            <Button onClick={handleSaveTournament} disabled={isSavingTournament}>
              {isSavingTournament ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Set group level, capacity, and qualifier count.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-designation">Group Designation</Label>
              <Input
                id="group-designation"
                placeholder="A, B, C..."
                value={groupForm.designation}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, designation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-gender">Group Gender</Label>
              <select
                id="group-gender"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={groupForm.gender}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    gender: e.target.value as GroupForm["gender"],
                  }))
                }
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-level">Tennis Level</Label>
              <select
                id="group-level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={groupForm.tennis_level}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    tennis_level: e.target.value as GroupForm["tennis_level"],
                  }))
                }
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-max-players">Max Players</Label>
              <Input
                id="group-max-players"
                type="number"
                min={2}
                value={groupForm.max_players}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, max_players: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-qualifiers">Qualifiers</Label>
              <Input
                id="group-qualifiers"
                type="number"
                min={1}
                value={groupForm.qualifiers_count}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, qualifiers_count: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)} disabled={isSavingGroup}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={isSavingGroup}>
              {isSavingGroup ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
