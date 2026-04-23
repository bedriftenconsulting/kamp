import { useEffect, useMemo, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { useAuth } from "@/components/auth/AuthContext";
import { API_V1_URL } from "@/lib/api-url";
import { api } from "@/api/api";
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
  CheckCircle2,
  Menu,
  X as CloseIcon,
  Settings,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, adminOnly: false },
  { id: "players", label: "Players", icon: Users, adminOnly: false },
  { id: "groups", label: "Groups", icon: Blocks, adminOnly: false },
  { id: "matches", label: "Matches", icon: Calendar, adminOnly: false },
  { id: "tournament", label: "Tournament", icon: Trophy, adminOnly: false },
  { id: "rules", label: "Rules & Settings", icon: Settings, adminOnly: false },
  { id: "playoffs", label: "Playoffs", icon: Zap, adminOnly: false },
  { id: "users", label: "Users", icon: Users, adminOnly: true },
  { id: "directors", label: "Directors", icon: ShieldCheck, adminOnly: true },
];

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  tournament_name: string;
  tournament_id: string;
  gender: string;
  age: number;
  tennis_level: string;
  ranking: number;
  bio: string;
  profile_image_url: string;
  name: string;
  country: string;
  is_team?: boolean;
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
  bracket_position?: number | null;
};

// Tournament mirrors the Go model returned by GET /tournaments.
// banner_image and accent_color were added in migration 000010 so that each
// tournament can store its own homepage background image (base64 data URL)
// and highlight colour (hex string like "#e91e8c") in the database.
type Tournament = {
  id: string;
  name: string;
  location: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  surface?: string | null;
  banner_image?: string | null; // base64 data URL stored as TEXT in DB
  accent_color?: string | null; // hex colour stored as TEXT in DB
  director_id?: string | null; 
};

type SystemUser = {
  id: string;
  email: string;
  role: string;
  tournament_id?: string;
  created_at: string;
};

type PlayerForm = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  tournament_id: string;
  gender: string;
  age: string;
  tennis_level: string;
  ranking: string;
  bio: string;
  profile_image_url: string;
};

type TeamForm = {
  player1_id: string;
  player2_id: string;
  gender: string;
  tennis_level: string;
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
  banner_image_url: string;
  accent_color: string;
  director_id: string;
};

type TournamentRules = {
  tournament_id: string;
  scoring_format: string;
  max_points: number;
  tie_break_trigger: number;
  tie_break_max_points: number;
  win_by_two: boolean;
};

type Group = {
  id: string;
  designation: string;
  gender: string;
  group_type: string;
  max_players: number;
  qualifiers_count: number;
  is_locked: boolean;
  players_count: number;
  status: "open" | "locked" | "completed";
};

type GroupForm = {
  designation_type: string;
  custom_designation: string;
  gender: "Men" | "Women";
  group_type: string;
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
  tournament_id: "",
  gender: "",
  age: "",
  tennis_level: "",
  ranking: "",
  bio: "",
  profile_image_url: "",
};

const emptyTeamForm: TeamForm = {
  player1_id: "",
  player2_id: "",
  gender: "Men",
  tennis_level: "Intermediate",
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
  banner_image_url: "",
  accent_color: "#e91e8c",
  director_id: "",
};

const emptyTournamentRules: TournamentRules = {
  tournament_id: "",
  scoring_format: "tennis",
  max_points: 11,
  tie_break_trigger: 10,
  tie_break_max_points: 5,
  win_by_two: true,
};

const emptyGroupForm: GroupForm = {
  designation_type: "A",
  custom_designation: "",
  gender: "Men",
  group_type: "Singles",
  max_players: "4",
  qualifiers_count: "2",
};

const knockoutLevels: KnockoutLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

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

const fetchJSONOrFallback = async <T,>(
  url: string,
  fallback: T,
): Promise<T> => {
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

export default function AdminDashboard({ forcedTournamentId }: { forcedTournamentId?: string }) {
  const { token, user: authUser } = useAuth();
  const { toast } = useToast();
  const isAdmin = authUser?.role === "admin";
  const isDirector = authUser?.role === "director";

  // Directors are always locked to their assigned tournament, regardless of how
  // they arrived at this page (via DirectorDashboard prop or direct URL navigation).
  const lockedTournamentId = forcedTournamentId || (isDirector ? (authUser?.tournament_id ?? "") : "");

  const [activeTab, setActiveTab] = useState("overview");
  const [globalTournamentId, setGlobalTournamentId] = useState<string>(lockedTournamentId || "");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayerForm);
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [matchForm, setMatchForm] = useState<MatchForm>(emptyMatchForm);
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeForm, setCompleteForm] =
    useState<CompleteForm>(emptyCompleteForm);
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);

  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [isEditingTournament, setIsEditingTournament] = useState(false);
  const [tournamentForm, setTournamentForm] =
    useState<TournamentForm>(emptyTournamentForm);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [deletingTournamentId, setDeletingTournamentId] = useState<
    string | null
  >(null);

  const [tournamentRules, setTournamentRules] = useState<TournamentRules>(emptyTournamentRules);
  const [isSavingRules, setIsSavingRules] = useState(false);

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupPlayerSelections, setGroupPlayerSelections] = useState<string[]>(
    [],
  );
  const [groupMatches, setGroupMatches] = useState<GroupMatch[]>([]);
  const [groupStandings, setGroupStandings] = useState<GroupStanding[]>([]);
  const [groupScoreInputs, setGroupScoreInputs] = useState<
    Record<string, { p1: string; p2: string }>
  >({});
  const [isSavingGroupPlayers, setIsSavingGroupPlayers] = useState(false);
  const [isLockingGroup, setIsLockingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [knockoutViews, setKnockoutViews] = useState<
    Record<KnockoutLevel, KnockoutView>
  >({
    Beginner: { bracket: null, matches: [] },
    Intermediate: { bracket: null, matches: [] },
    Advanced: { bracket: null, matches: [] },
  });
  const [isGeneratingKnockout, setIsGeneratingKnockout] = useState<
    Record<KnockoutLevel, boolean>
  >({
    Beginner: false,
    Intermediate: false,
    Advanced: false,
  });
  const [knockoutScoreInputs, setKnockoutScoreInputs] = useState<
    Record<string, { p1: string; p2: string; winner_id: string }>
  >({});
  const [savingKnockoutMatchId, setSavingKnockoutMatchId] = useState<
    string | null
  >(null);

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState<string | null>(null);
  const [directors, setDirectors] = useState<any[]>([]);
  const [isCreateUmpireOpen, setIsCreateUmpireOpen] = useState(false);
  const [umpireForm, setUmpireForm] = useState({ email: "", password: "", tournament_id: "" });
  const [isCreatingUmpire, setIsCreatingUmpire] = useState(false);

  const [isCreateDirectorOpen, setIsCreateDirectorOpen] = useState(false);
  const [directorForm, setDirectorForm] = useState({ email: "", password: "", tournament_id: "" });
  const [isCreatingDirector, setIsCreatingDirector] = useState(false);

  const [matchPage, setMatchPage] = useState(1);
  const matchesPerPage = 20;

  const [bracketSize, setBracketSize] = useState<number>(4);
  const [bracketPlayers, setBracketPlayers] = useState<string[]>(
    Array(4).fill(""),
  );
  const [bracketName, setBracketName] = useState<string>("Main Bracket");
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);

  const [playoffQualifiers, setPlayoffQualifiers] = useState<any[]>([]);
  const [selectedPlayoffGroupId, setSelectedPlayoffGroupId] = useState<string>("");
  const [playoffGroupStandings, setPlayoffGroupStandings] = useState<GroupStanding[]>([]);
  const [playoffView, setPlayoffView] = useState<"setup" | "bracket">("setup");

  // Keep the tournament locked if a forced ID is provided (director mode).
  useEffect(() => {
    if (lockedTournamentId) {
      setGlobalTournamentId(lockedTournamentId);
    }
  }, [lockedTournamentId]);

  useEffect(() => {
    setBracketPlayers((prev) => {
      if (prev.length === bracketSize) return prev;
      const arr = Array(bracketSize).fill("");
      for (let i = 0; i < Math.min(prev.length, bracketSize); i++) {
        arr[i] = prev[i];
      }
      return arr;
    });
  }, [bracketSize]);

  const handleGenerateBracket = async () => {
    if (!globalTournamentId) {
      alert(
        "Please select a tournament first from the global dropdown (top right).",
      );
      return;
    }
    if (!bracketName.trim()) {
      alert("Please enter a bracket name.");
      return;
    }
    if (bracketPlayers.some((p) => !p)) {
      alert("Please select players for all bracket slots.");
      return;
    }

    const nameToCheck = bracketName.trim();
    const hasExistingByName = matches.some(
      (m) =>
        m.bracket_position !== null &&
        m.tournament_id === globalTournamentId &&
        m.bracket_name === nameToCheck,
    );
    if (hasExistingByName) {
      const confirmOverwrite = window.confirm(
        `A bracket named "${nameToCheck}" already exists. Regenerating it will delete its current match data. Continue?`,
      );
      if (!confirmOverwrite) return;
    }

    setIsGeneratingBracket(true);
    try {
      const res = await fetch(
        `${API_V1_URL}/tournaments/${globalTournamentId}/bracket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            size: bracketSize,
            player_ids: bracketPlayers,
            bracket_name: nameToCheck,
          }),
        },
      );
      if (!res.ok) {
        const err = await parseResponseBody(res);
        throw new Error(err?.error || "Failed to generate bracket");
      }
      await fetchData();
      setPlayoffView("bracket");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGeneratingBracket(false);
    }
  };

  const fetchData = async () => {
    try {
      const tournamentRes = await fetchJSONOrFallback<any>(
        `${API_V1_URL}/tournaments`,
        [],
      );
      const toList = (payload: any) =>
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      const tournamentList = toList(tournamentRes);

      let tId = globalTournamentId;
      if (!tId && tournamentList.length > 0) {
        tId = tournamentList[0].id;
        setGlobalTournamentId(tId);
      }

      const pUrl =
        tId === "all"
          ? `${API_V1_URL}/players`
          : `${API_V1_URL}/players?tournament_id=${tId}`;
      const mUrl =
        tId === "all"
          ? `${API_V1_URL}/matches`
          : `${API_V1_URL}/matches?tournament_id=${tId}`;
      const gUrl =
        tId === "all"
          ? `${API_V1_URL}/groups`
          : `${API_V1_URL}/groups?tournament_id=${tId}`;
      const [matchesData, playersData, groupsData] = await Promise.all([
        fetchJSONOrFallback<any>(mUrl, []),
        fetchJSONOrFallback<any>(pUrl, []),
        fetchJSONOrFallback<any>(gUrl, []),
      ]);

      const matchesList = toList(matchesData);
      const playersList = toList(playersData);
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
        bracket_position: m.bracket_position ?? null,
      }));

      const formattedPlayers: Player[] = playersList.map((p: any) => ({
        id: p.id,
        first_name: p.first_name || p.firstName || "",
        last_name: p.last_name || p.lastName || "",
        date_of_birth: p.date_of_birth || p.dateOfBirth || "",
        nationality: p.nationality || p.country || "",
        tournament_name: p.tournament_name || p.tournamentName || "",
        tournament_id: p.tournament_id || "",
        gender: p.gender || p.Gender || "",
        age: Number(
          p.age ||
            p.Age ||
            calculateAgeFromDOB(p.date_of_birth || p.dateOfBirth),
        ),
        tennis_level: p.tennis_level || p.tennisLevel || "",
        ranking: Number(p.ranking || 0),
        bio: p.bio || "",
        profile_image_url: p.profile_image_url || p.profileImageUrl || "",
        name: `${p.first_name || p.firstName || ""} ${p.last_name || p.lastName || ""}`.trim(),
        country: p.nationality || p.country || "",
        is_team: Boolean(p.is_team),
      }));

      const formattedTournaments: Tournament[] = tournamentList.map(
        (t: any) => ({
          id: t.id,
          name: t.name,
          location: t.location,
          start_date: t.start_date,
          end_date: t.end_date,
          status: t.status,
          surface: t.surface,
          director_id: t.director_id ?? null,
          banner_image: t.banner_image ?? null,
          accent_color: t.accent_color ?? null,
        }),
      );

      const formattedGroups: Group[] = groupsList.map((g: any) => ({
        id: g.id,
        designation: g.designation,
        gender: normalizeGender(g.gender || g.Gender) || "",
        group_type: g.group_type,
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

      if (tId && tId !== "all") {
        fetch(`${API_V1_URL}/tournaments/${tId}/rules`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed");
          })
          .then((rules) => {
            if (rules) setTournamentRules(rules);
          })
          .catch(() => {
            setTournamentRules({ ...emptyTournamentRules, tournament_id: tId });
          });

        fetch(`${API_V1_URL}/groups/qualifiers?tournament_id=${tId}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed");
          })
          .then((qualifiers) => {
            setPlayoffQualifiers(qualifiers || []);
          })
          .catch(() => {
            setPlayoffQualifiers([]);
          });
      }

      // Fetch users for director selection (Admins only really need this, but we'll fetch for now)
      fetch(`${API_V1_URL}/admin/users?role=director`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setDirectors(Array.isArray(data) ? data : []))
        .catch(() => setDirectors([]));

      // Fetch all system users for the Users tab
      fetch(`${API_V1_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setSystemUsers(Array.isArray(data) ? data : []))
        .catch(() => setSystemUsers([]));

    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [globalTournamentId]);

  useEffect(() => {
    if (activeTab !== "groups") return;

    if (groups.length === 0) {
      setSelectedGroupId(null);
      setGroupPlayerSelections([]);
      setGroupMatches([]);
      setGroupStandings([]);
      return;
    }

    const hasSelected =
      selectedGroupId && groups.some((g) => g.id === selectedGroupId);
    const nextGroupID = hasSelected ? selectedGroupId! : groups[0].id;

    if (!hasSelected) {
      setSelectedGroupId(nextGroupID);
    }

    loadGroupDetails(nextGroupID).catch((error: any) => {
      console.error("Failed to auto-load group details:", error);
    });
  }, [activeTab, groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedPlayoffGroupId) {
      setPlayoffGroupStandings([]);
      return;
    }
    fetch(`${API_V1_URL}/groups/${selectedPlayoffGroupId}/standings`)
      .then(res => res.json())
      .then(data => setPlayoffGroupStandings(data || []))
      .catch(() => setPlayoffGroupStandings([]));
  }, [selectedPlayoffGroupId]);

  const finalizedMatches = useMemo(
    () => matches.filter((m) => m.status === "completed"),
    [matches],
  );
  const totalMatchPages = Math.max(
    1,
    Math.ceil(finalizedMatches.length / matchesPerPage),
  );
  const paginatedMatches = useMemo(() => {
    const start = (matchPage - 1) * matchesPerPage;
    return finalizedMatches.slice(start, start + matchesPerPage);
  }, [matchPage, finalizedMatches]);

  const handleOpenAddPlayer = () => {
    setIsEditingPlayer(false);
    setPlayerForm({ ...emptyPlayerForm, tournament_id: globalTournamentId });
    setIsPlayerDialogOpen(true);
  };

  const handleOpenEditPlayer = (player: Player) => {
    setIsEditingPlayer(true);
    setPlayerForm({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      date_of_birth: player.date_of_birth
        ? String(player.date_of_birth).slice(0, 10)
        : "",
      nationality: player.nationality,
      tournament_id: player.tournament_id || "",
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
    if (!playerForm.first_name || !playerForm.last_name) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSavingPlayer(true);

    try {
      const payload = {
        id: playerForm.id || undefined,
        first_name: playerForm.first_name,
        last_name: playerForm.last_name,
        date_of_birth: playerForm.date_of_birth
          ? `${playerForm.date_of_birth}T00:00:00Z`
          : undefined,
        nationality: playerForm.nationality,
        tournament_id: playerForm.tournament_id || null,
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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

  const handleOpenAddTeam = () => {
    setTeamForm({ ...emptyTeamForm });
    setIsTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamForm.player1_id || !teamForm.player2_id) {
       alert("Please select both players");
       return;
    }
    if (teamForm.player1_id === teamForm.player2_id) {
       alert("A player cannot be paired with themselves");
       return;
    }
    setIsSavingTeam(true);

    try {
      const p1 = players.find(p => p.id === teamForm.player1_id);
      const p2 = players.find(p => p.id === teamForm.player2_id);
      
      const res = await fetch(`${API_V1_URL}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          tournament_id: globalTournamentId,
          player1_id: teamForm.player1_id,
          player2_id: teamForm.player2_id,
          player1_name: p1?.name || "",
          player2_name: p2?.name || "",
          gender: teamForm.gender,
          tennis_level: teamForm.tennis_level
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save team");
      }

      setIsTeamDialogOpen(false);
      setTeamForm(emptyTeamForm);
      await fetchData();
      alert("Team created successfully! Teams act exactly like players but are managed independently.");
    } catch(e: any) {
      alert(e.message || "Failed to save team.");
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Delete this player?")) return;

    setDeletingPlayerId(id);
    try {
      const res = await fetch(`${API_V1_URL}/players/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
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
      scheduled_time: match.scheduled_time
        ? String(match.scheduled_time).slice(0, 16)
        : "",
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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

      const res = await fetch(
        `${API_V1_URL}/matches/${completeForm.match_id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      );

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

  /**
   * handleOpenEditTournament
   * ─────────────────────────
   * Opens the tournament dialog pre-filled with the existing row.
   * banner_image and accent_color come directly from the database
   * (via the API response) — no localStorage involved.
   */
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
      // Read appearance fields directly from the DB-backed Tournament object
      banner_image_url: t.banner_image || "",
      accent_color: t.accent_color || "#e91e8c",
      director_id: t.director_id || "",
    });
    setIsTournamentDialogOpen(true);
  };

  const handleCreateUmpire = async () => {
    if (!umpireForm.email || !umpireForm.password || !umpireForm.tournament_id) {
      alert("All fields are required.");
      return;
    }
    setIsCreatingUmpire(true);
    try {
      await api.createUmpire(umpireForm, token!);
      toast({ title: "Umpire Created", description: `Credentials created for ${umpireForm.email}` });
      setIsCreateUmpireOpen(false);
      setUmpireForm({ email: "", password: "", tournament_id: "" });
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to create umpire");
    } finally {
      setIsCreatingUmpire(false);
    }
  };

  const handleDeleteDirector = async (directorId: string, email: string) => {
    if (!confirm(`Delete director ${email}? This will also unassign them from their tournament.`)) return;
    try {
      await api.deleteUser(directorId, token!);
      toast({ title: "Director Deleted", description: `${email} has been removed.` });
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to delete director");
    }
  };

  const handleCreateDirector = async () => {
    if (!directorForm.email || !directorForm.password || !directorForm.tournament_id) {
      alert("All fields are required.");
      return;
    }
    setIsCreatingDirector(true);
    try {
      await api.createDirector(directorForm, token!);
      toast({ title: "Director Created", description: `Director credentials created for ${directorForm.email}` });
      setIsCreateDirectorOpen(false);
      setDirectorForm({ email: "", password: "", tournament_id: "" });
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to create director");
    } finally {
      setIsCreatingDirector(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setIsUpdatingUserRole(userId);
    try {
      const res = await fetch(`${API_V1_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update user role");
      }

      toast({
        title: "Role Updated",
        description: `User role has been changed to ${newRole}`,
      });
      await fetchData();
    } catch (error: any) {
      alert(error?.message || "Failed to update user role");
    } finally {
      setIsUpdatingUserRole(null);
    }
  };

  /**
   * handleSaveTournament
   * ─────────────────────
   * Sends the full tournament payload (including appearance fields) to the
   * API as a single JSON object.
   *
   * How the appearance fields are stored:
   *   - banner_image : the base64 data URL string produced by FileReader in
   *                    the form's file <input>. It is sent as-is and stored
   *                    as TEXT in PostgreSQL.
   *   - accent_color : the hex colour chosen with the colour picker, stored
   *                    as a TEXT column. The homepage reads it from the API
   *                    and injects it as --t-accent on <html>.
   *
   * No localStorage is used — all data lives in the database.
   */
  const handleSaveTournament = async () => {
    if (!tournamentForm.name) {
      alert("Tournament name is required.");
      return;
    }

    setIsSavingTournament(true);
    try {
      // Build the request body — mirror every field in model.Tournament
      const payload = {
        name: tournamentForm.name,
        location: tournamentForm.location,
        start_date: tournamentForm.start_date
          ? `${tournamentForm.start_date}T00:00:00Z`
          : undefined,
        end_date: tournamentForm.end_date
          ? `${tournamentForm.end_date}T00:00:00Z`
          : undefined,
        status: tournamentForm.status || "scheduled",
        surface: tournamentForm.surface || undefined,
        // Appearance fields (stored in DB; migration 000010)
        banner_image: tournamentForm.banner_image_url || null,
        accent_color: tournamentForm.accent_color || null,
        director_id: tournamentForm.director_id || null,
      };

      const url = isEditingTournament
        ? `${API_V1_URL}/tournaments/${tournamentForm.id}`
        : `${API_V1_URL}/admin/tournaments`;
      const method = isEditingTournament ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save tournament");
      }

      const savedData = await res.json();
      setIsTournamentDialogOpen(false);
      setTournamentForm(emptyTournamentForm);
      setGlobalTournamentId(savedData.id || "");
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
      const res = await fetch(`${API_V1_URL}/admin/tournaments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

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

  const handleSaveRules = async () => {
    if (!globalTournamentId || globalTournamentId === "all") {
       alert("Please select a specific tournament first!");
       return;
    }
    setIsSavingRules(true);
    try {
      const res = await fetch(`${API_V1_URL}/tournaments/${globalTournamentId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(tournamentRules),
      });
      if (!res.ok) {
         const err = await res.json().catch(() => ({}));
         throw new Error(err.error || "Failed to update rules.");
      }
      alert("Tournament rules successfully updated!");
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSavingRules(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  const loadGroupDetails = async (groupID: string) => {
    const [playersData, matchesData, standingsData] = await Promise.all([
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/players`, {
        player_ids: [],
      }),
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/matches`, []),
      fetchJSONOrFallback<any>(`${API_V1_URL}/groups/${groupID}/standings`, []),
    ]);

    const playerIDs = Array.isArray(playersData?.player_ids)
      ? playersData.player_ids
      : [];
    setGroupPlayerSelections(playerIDs);

    const formattedMatches: GroupMatch[] = (
      Array.isArray(matchesData) ? matchesData : []
    ).map((m: any) => ({
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
    const finalDesignation =
      groupForm.designation_type === "Custom"
        ? groupForm.custom_designation
        : groupForm.designation_type;

    if (
      !finalDesignation ||
      !groupForm.max_players ||
      !groupForm.qualifiers_count
    ) {
      alert("Please fill all required group fields.");
      return;
    }

    if (globalTournamentId === "all" || !globalTournamentId) {
      alert("Please select a specific tournament before creating a group.");
      return;
    }

    setIsSavingGroup(true);
    try {
      const payload = {
        tournament_id: globalTournamentId,
        designation: finalDesignation,
        gender: normalizeGender(groupForm.gender) || "Men",
        group_type: groupForm.group_type,
        max_players: Number(groupForm.max_players),
        qualifiers_count: Number(groupForm.qualifiers_count),
      };

      const res = await fetch(`${API_V1_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
      const res = await fetch(
        `${API_V1_URL}/groups/${selectedGroupId}/players`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ player_ids: groupPlayerSelections }),
        },
      );
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
        headers: { "Authorization": `Bearer ${token}` },
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
      const res = await fetch(
        `${API_V1_URL}/groups/${selectedGroupId}/matches/${matchID}/result`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            player1_score: Number(input.p1 || 0),
            player2_score: Number(input.p2 || 0),
          }),
        },
      );
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
    if (
      !confirm(
        "Delete this group? This also removes generated matches linked to it.",
      )
    )
      return;

    setDeletingGroupId(groupID);
    try {
      const res = await fetch(`${API_V1_URL}/groups/${groupID}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
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
      {/* ── Mobile Overlay ── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible, mobile: slide-in drawer) ── */}
      <aside
        className={`fixed lg:relative z-50 top-0 left-0 h-100 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
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
            <button
              className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {tabs.filter((t) => !t.adminOnly || isAdmin).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileSidebarOpen(false);
              }}
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

        <div className="p-4 border-t border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50 rounded-sm transition-colors"
          >
            <Globe size={18} />
            Go to Website
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-3 sm:p-6 min-w-0">
        {/* ── Mobile top bar ── */}
        <div className="lg:hidden flex items-center gap-3 mb-6 -mt-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-md bg-card border border-border text-foreground"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Manage Content</h2>
          {lockedTournamentId ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted border text-sm font-medium text-muted-foreground">
              <Trophy size={14} className="shrink-0" />
              <span className="truncate max-w-[180px]">
                {tournaments.find((t) => t.id === lockedTournamentId)?.name ?? "Assigned Tournament"}
              </span>
            </div>
          ) : (
            <select
              title="Select tournament"
              className="p-2 border rounded-md text-sm bg-card min-w-0 max-w-full sm:max-w-[220px]"
              value={globalTournamentId}
              onChange={(e) => setGlobalTournamentId(e.target.value)}
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {activeTab === "overview" && (
          <div>
            <h1 className="text-2xl font-black mb-6">Dashboard</h1>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
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

            <div className="bg-card border rounded-md overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
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
                      <td className="px-4 py-3">
                        {(matchPage - 1) * matchesPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        {m.player1.name} vs {m.player2.name}
                      </td>
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {finalizedMatches.length === 0
                  ? 0
                  : (matchPage - 1) * matchesPerPage + 1}{" "}
                -{" "}
                {Math.min(matchPage * matchesPerPage, finalizedMatches.length)}{" "}
                of {finalizedMatches.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMatchPage((p) => Math.max(1, p - 1))}
                  disabled={matchPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {matchPage} / {totalMatchPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setMatchPage((p) => Math.min(totalMatchPages, p + 1))
                  }
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
                Qualified players from completed round-robin groups advance into
                single-elimination playoffs by tennis level.
              </p>
            </div>

            {knockoutLevels.map((level) => {
              const view = knockoutViews[level];
              const matchesByRound = view.matches.reduce<
                Record<number, KnockoutMatch[]>
              >((acc, match) => {
                const key = Number(match.round_order || 0);
                if (!acc[key]) acc[key] = [];
                acc[key].push(match);
                return acc;
              }, {});
              const sortedRoundOrders = Object.keys(matchesByRound)
                .map(Number)
                .sort((a, b) => a - b);
              const championName =
                view.matches.find(
                  (m) =>
                    m.winner_id && m.winner_id === view.bracket?.champion_id,
                )?.winner_name || "-";

              return (
                <div
                  key={level}
                  className="bg-card border rounded-md p-4 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">
                        {level} Knockout Bracket
                      </h2>
                      <div className="text-xs text-muted-foreground">
                        Status: {view.bracket?.status || "not generated"} |
                        Champion: {championName}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateKnockout(level)}
                      disabled={isGeneratingKnockout[level]}
                    >
                      {isGeneratingKnockout[level]
                        ? "Generating..."
                        : `Generate ${level} Bracket`}
                    </Button>
                  </div>

                  {view.matches.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No knockout matches yet. Generate bracket after group
                      standings are ready.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedRoundOrders.map((roundOrder) => (
                        <div
                          key={`${level}-${roundOrder}`}
                          className="space-y-2"
                        >
                          <h3 className="font-semibold">
                            {matchesByRound[roundOrder][0]?.round ||
                              `Round ${roundOrder}`}
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
                                const isCompleted =
                                  match.status === "completed";
                                const canEdit =
                                  !isCompleted &&
                                  !!match.player1_id &&
                                  !!match.player2_id;

                                return (
                                  <div
                                    key={match.id}
                                    className="border rounded-md p-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3"
                                  >
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        Match {match.match_number}:{" "}
                                        {match.player1_name} vs{" "}
                                        {match.player2_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Status: {match.status}
                                        {match.winner_name
                                          ? ` | Winner: ${match.winner_name}`
                                          : ""}
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
                                              winner_id:
                                                prev[match.id]?.winner_id ?? "",
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
                                              winner_id:
                                                prev[match.id]?.winner_id ?? "",
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
                                          <option value={match.player1_id}>
                                            {match.player1_name}
                                          </option>
                                        )}
                                        {match.player2_id && (
                                          <option value={match.player2_id}>
                                            {match.player2_name}
                                          </option>
                                        )}
                                      </select>
                                      <Button
                                        variant="outline"
                                        disabled={
                                          !canEdit ||
                                          savingKnockoutMatchId === match.id
                                        }
                                        onClick={() =>
                                          handleSaveKnockoutResult(match)
                                        }
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-black">Players & Teams</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleOpenAddTeam} className="gap-2" variant="outline">
                  <Plus size={16} />
                  Add Team
                </Button>
                <Button onClick={handleOpenAddPlayer} className="gap-2">
                  <Plus size={16} />
                  Add Player
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-md overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">No.</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Gender</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Level</th>
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenEditPlayer(p)}
                          >
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-black">Groups</h1>
              <Button onClick={handleOpenAddGroup} className="gap-2">
                <Plus size={16} />
                Add Group
              </Button>
            </div>

            <div className="bg-card border rounded-md overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
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
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No groups yet. Create one to start round robin setup.
                      </td>
                    </tr>
                  ) : (
                    groups.map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="px-4 py-3 font-semibold">
                          {g.designation}
                        </td>
                        <td className="px-4 py-3">
                          {normalizeGender(g.gender) || "-"}
                        </td>
                        <td className="px-4 py-3">{g.group_type}</td>
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
                            {g.status.charAt(0).toUpperCase() +
                              g.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant={
                                selectedGroupId === g.id ? "default" : "outline"
                              }
                              onClick={() => handleSelectGroup(g.id)}
                            >
                              {selectedGroupId === g.id ? "Selected" : "Manage"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteGroup(g.id)}
                              disabled={deletingGroupId === g.id}
                            >
                              {deletingGroupId === g.id
                                ? "Removing..."
                                : "Remove"}
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
                      {normalizeGender(selectedGroup.gender) || "Unspecified"}{" "}
                      {selectedGroup.group_type} {selectedGroup.designation}
                    </h2>
                    <div className="text-xs text-muted-foreground">
                      {selectedGroup.players_count}/{selectedGroup.max_players}{" "}
                      players
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Players</Label>
                    <div className="max-h-56 overflow-auto rounded-md border p-3 space-y-2">
                      {players
                        .filter((p) => {
                          const gt = (selectedGroup.group_type || "").trim().toLowerCase();
                          const isMixed = gt.includes("mixed");
                          const isDoubles = gt.includes("double");
                          
                          // For Doubles/Mixed Groups, only display Teams. For Singles, only display Individuals.
                          if (isDoubles && !p.is_team) return false;
                          if (!isDoubles && p.is_team) return false;

                          const pg = normalizeGender(p.gender);
                          const sg = normalizeGender(selectedGroup.gender);
                          const genderMatches = isMixed || (sg !== "" && pg === sg);
                          return genderMatches;
                        })
                        .map((p) => {
                          const checked = groupPlayerSelections.includes(p.id);
                          const disableUnchecked = false; // Groups can now accommodate any number of players

                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={
                                  selectedGroup.is_locked || disableUnchecked
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupPlayerSelections((prev) => [
                                      ...prev,
                                      p.id,
                                    ]);
                                  } else {
                                    setGroupPlayerSelections((prev) =>
                                      prev.filter((id) => id !== p.id),
                                    );
                                  }
                                }}
                              />
                              <span>{p.name}</span>
                            </label>
                          );
                        })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Only players matching the group's gender{" "}
                      <strong>
                        {normalizeGender(selectedGroup.gender) || "Unspecified"}
                      </strong>{" "}
                      are listed (Mixed Doubles ignores gender filters).
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
                      {isLockingGroup
                        ? "Locking..."
                        : "Finalize Group & Generate Round Robin"}
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
                            <td
                              colSpan={7}
                              className="px-3 py-6 text-center text-muted-foreground"
                            >
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
                              <td className="px-3 py-2">
                                {selectedGroup?.status === "completed" &&
                                s.is_qualified ? (
                                  <span className="bg-green-500/20 text-green-500 font-bold px-2 py-1 rounded text-xs">
                                    Qualified
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </td>
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
                      No fixtures yet. Lock the group after filling players to
                      generate matches.
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
                          <span className="ml-2 text-muted-foreground">
                            ({m.status})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            className="w-20"
                            type="number"
                            value={groupScoreInputs[m.id]?.p1 ?? "0"}
                            onChange={(e) =>
                              setGroupScoreInputs((prev) => ({
                                ...prev,
                                [m.id]: {
                                  p1: e.target.value,
                                  p2: prev[m.id]?.p2 ?? "0",
                                },
                              }))
                            }
                            disabled={
                              !selectedGroup.is_locked ||
                              m.status === "completed"
                            }
                          />
                          <span>-</span>
                          <Input
                            className="w-20"
                            type="number"
                            value={groupScoreInputs[m.id]?.p2 ?? "0"}
                            onChange={(e) =>
                              setGroupScoreInputs((prev) => ({
                                ...prev,
                                [m.id]: {
                                  p1: prev[m.id]?.p1 ?? "0",
                                  p2: e.target.value,
                                },
                              }))
                            }
                            disabled={
                              !selectedGroup.is_locked ||
                              m.status === "completed"
                            }
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleSaveGroupMatchResult(m.id)}
                            disabled={
                              !selectedGroup.is_locked ||
                              m.status === "completed"
                            }
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-black">Tournaments</h1>
              <Button onClick={handleOpenAddTournament} className="gap-2">
                <Plus size={16} />
                Add Tournament
              </Button>
            </div>

            {tournaments && tournaments.length > 0 ? (
              <div className="bg-card border rounded-md overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Director</th>
                      <th className="px-4 py-3 text-left">Start Date</th>
                      <th className="px-4 py-3 text-left">End Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3 max-w-[80px] truncate text-xs text-muted-foreground font-mono">{t.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3">{t.name}</td>
                        <td className="px-4 py-3">{t.location || "-"}</td>
                        <td className="px-4 py-3">
                          {t.director_id
                            ? (() => {
                                const dir = directors.find((d) => d.id === t.director_id);
                                return dir
                                  ? <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">{dir.email}</Badge>
                                  : <span className="text-muted-foreground/40 text-sm">—</span>;
                              })()
                            : <span className="text-muted-foreground/40 text-sm">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {t.start_date
                            ? String(t.start_date).slice(0, 10)
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {t.end_date ? String(t.end_date).slice(0, 10) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenEditTournament(t)}
                            >
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

        {/* =========================================================
            RULES & SETTINGS
            ========================================================= */}
        {activeTab === "rules" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black">Rules & Settings</h1>
            </div>

            {!globalTournamentId || globalTournamentId === "all" ? (
              <div className="bg-card border rounded-md p-10 text-center text-muted-foreground">
                Please select a specific tournament from the top right dropdown first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-card p-6 rounded-xl border">
                    <h2 className="text-xl font-bold mb-4">Match Scoring Rules</h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Scoring Format</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tournamentRules.scoring_format}
                          onChange={(e) => setTournamentRules({ ...tournamentRules, scoring_format: e.target.value })}
                        >
                          <option value="tennis">Standard Tennis (15, 30, 40, Adv, Games, Sets)</option>
                          <option value="numeric">Numeric Points (1, 2, 3... - e.g. Table Tennis)</option>
                        </select>
                      </div>

                      {tournamentRules.scoring_format === "numeric" && (
                        <>
                          <div className="space-y-2">
                            <Label>Match Win Condition (Target Points)</Label>
                            <Input
                              type="number"
                              min={1}
                              value={tournamentRules.max_points}
                              onChange={(e) => setTournamentRules({ ...tournamentRules, max_points: parseInt(e.target.value) || 11 })}
                            />
                            <p className="text-xs text-muted-foreground">The points needed to win the match (or game)</p>
                          </div>

                          <div className="space-y-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="winByTwo"
                              className="h-4 w-4"
                              checked={tournamentRules.win_by_two}
                              onChange={(e) => setTournamentRules({ ...tournamentRules, win_by_two: e.target.checked })}
                            />
                            <Label htmlFor="winByTwo">Must Win By Two Points</Label>
                          </div>
                        </>
                      )}

                      {/* Display Tie Break options for tennis format */}
                      {tournamentRules.scoring_format === "tennis" && (
                        <>
                          <div className="space-y-2">
                            <Label>Tie Break Trigger (Games)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={tournamentRules.tie_break_trigger}
                              onChange={(e) => setTournamentRules({ ...tournamentRules, tie_break_trigger: parseInt(e.target.value) || 10 })}
                            />
                            <p className="text-xs text-muted-foreground">The game score that triggers a tiebreak (e.g. 6-6).</p>
                          </div>
                        </>
                      )}

                      <Button onClick={handleSaveRules} disabled={isSavingRules} className="w-full mt-4">
                        {isSavingRules ? "Saving..." : "Save Match Rules"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card p-6 rounded-xl border bg-muted/20">
                    <h3 className="font-bold mb-2">Quick Templates</h3>
                    <p className="text-sm text-muted-foreground mb-4">Click to apply common configurations instantly.</p>
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" className="justify-start" onClick={() => setTournamentRules({ ...tournamentRules, scoring_format: "tennis", tie_break_trigger: 6, win_by_two: true })}>
                        🎾 Standard Tennis Rules
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => setTournamentRules({ ...tournamentRules, scoring_format: "numeric", max_points: 11, win_by_two: true })}>
                        🏓 Standard Ping Pong (11 pts / Win by 2)
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => setTournamentRules({ ...tournamentRules, scoring_format: "numeric", max_points: 9, win_by_two: false })}>
                        ⚡ Sudden Death 9 Points
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => setTournamentRules({ ...tournamentRules, scoring_format: "numeric", max_points: 21, win_by_two: true })}>
                        🏸 Doubles Badminton (21 pts)
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* =========================================================
            PLAYOFFS
            ========================================================= */}
        {activeTab === "playoffs" && (() => {
          // Bracket matches = those with a bracket_position set for this tournament
          const bracketMatches = matches.filter(
            (m) => m.bracket_position !== null && m.bracket_position !== undefined
          );

          // Group bracket matches by bracket_name
          const roundOrder = ["Round of 64", "Round of 32", "Round of 16", "Quarterfinal", "Semifinal", "Final"];
          const bracketsByName: Record<string, typeof bracketMatches> = {};
          bracketMatches.forEach((m) => {
            const name = m.bracket_name || "Main Bracket";
            if (!bracketsByName[name]) bracketsByName[name] = [];
            bracketsByName[name].push(m);
          });
          const bracketNames = Object.keys(bracketsByName);

          // For legacy display - all rounds across all brackets
          const matchesByRound: Record<string, typeof bracketMatches> = {};
          bracketMatches.forEach((m) => {
            if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
            matchesByRound[m.round].push(m);
          });
          const sortedRounds = roundOrder.filter((r) => matchesByRound[r]);
          // stage label preview
          const stagePreview: Record<number, string[]> = {
            2: ["Final"],
            4: ["Semifinals", "Final"],
            8: ["Quarterfinals", "Semifinals", "Final"],
            16: ["Round of 16", "Quarterfinals", "Semifinals", "Final"],
            32: ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"],
          };

          return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black">Playoff Bracket</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bracketMatches.length > 0
                      ? `${bracketMatches.length} bracket matches generated. Winners auto-advance to the next round.`
                      : "No bracket generated yet. Use the Setup panel below to create one."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={playoffView === "setup" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlayoffView("setup")}
                  >
                    ⚙️ Setup
                  </Button>
                  <Button
                    variant={playoffView === "bracket" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlayoffView("bracket")}
                    disabled={bracketMatches.length === 0}
                  >
                    🏆 View Bracket
                  </Button>
                </div>
              </div>

              {!globalTournamentId ? (
                <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  Please select a tournament from the top right dropdown first.
                </div>
              ) : playoffView === "setup" ? (
                /* ── SETUP VIEW ── */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left: Builder */}
                  <div className="bg-card p-6 rounded-xl border space-y-6">
                    <h2 className="text-lg font-bold">Build The Bracket</h2>

                    {/* Stage preview banner */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                        Stages for {bracketSize} players
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(stagePreview[bracketSize] || []).map((stage, i) => (
                          <span
                            key={stage}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${i === (stagePreview[bracketSize] || []).length - 1
                                ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                : "bg-muted text-muted-foreground border-border"}`}
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Bracket Size</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 4, 8, 16, 32].map((size) => (
                          <button
                            key={size}
                            onClick={() => setBracketSize(size)}
                            className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${bracketSize === size
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}
                          >
                            {size}P
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Seed Players into First Round
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Pair consecutive seeds as matchups. Slot 1 vs 2, Slot 3 vs 4, etc.
                      </p>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {Array.from({ length: bracketSize }).map((_, idx) => {
                          const matchNum = Math.floor(idx / 2) + 1;
                          const isFirstOfPair = idx % 2 === 0;
                          return (
                            <div key={`seed-${idx}`}>
                              {isFirstOfPair && (
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-3 mb-1">
                                  Match {matchNum}
                                </div>
                              )}
                              <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isFirstOfPair
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-orange-500/20 text-orange-400"}`}
                                >
                                  {idx + 1}
                                </span>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                  value={bracketPlayers[idx] || ""}
                                  onChange={(e) => {
                                    const newArr = [...bracketPlayers];
                                    newArr[idx] = e.target.value;
                                    setBracketPlayers(newArr);
                                  } }
                                >
                                  <option value="">Select player…</option>
                                  {playoffQualifiers.length > 0
                                    ? playoffQualifiers.map((p) => (
                                      <option key={p.player_id} value={p.player_id}>
                                        {p.player_name}
                                      </option>
                                    ))
                                    : players
                                      .filter((p) => !p.is_team || true)
                                      .map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name || `${p.first_name} ${p.last_name}`.trim()}
                                        </option>
                                      ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                      {/* Bracket Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Bracket Name</Label>
                      <input
                        type="text"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        placeholder="e.g. Men's Singles, Women's Beginner…"
                        value={bracketName}
                        onChange={(e) => setBracketName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Each unique name creates a separate bracket. Use the same name to regenerate an existing one.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleGenerateBracket}
                      disabled={isGeneratingBracket || bracketPlayers.some((p) => !p)}
                    >
                      {isGeneratingBracket ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Generating…
                        </span>
                      ) : (
                        <>
                          <Trophy size={16} />
                          Generate {bracketSize}-Player Bracket
                        </>
                      )}
                    </Button>
                    {bracketPlayers.some((p) => !p) && (
                      <p className="text-xs text-center text-muted-foreground">
                        Fill all {bracketSize} slots to generate the bracket
                      </p>
                    )}
                  </div>

                  {/* Right: Group Reference */}
                  <div className="space-y-4">
                    <div className="bg-card p-6 rounded-xl border">
                      <h3 className="text-lg font-bold mb-1">Qualified Players</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {playoffQualifiers.length} players qualified across all groups.
                      </p>
                      {playoffQualifiers.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {playoffQualifiers.map((q: any, i: number) => (
                            <div
                              key={q.player_id}
                              className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="font-medium">{q.player_name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {q.wins}W – {q.losses}L
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                          No qualified players found. Complete group stage matches first.
                        </div>
                      )}
                    </div>

                    <div className="bg-card p-6 rounded-xl border">
                      <h3 className="font-bold mb-3">Group Reference</h3>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
                        value={selectedPlayoffGroupId}
                        onChange={(e) => setSelectedPlayoffGroupId(e.target.value)}
                      >
                        <option value="">Select a completed group…</option>
                        {groups
                          .filter((g) => g.is_locked)
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.group_type} – Group {g.designation}{g.gender ? ` (${g.gender})` : ""}
                            </option>
                          ))}
                      </select>
                      {selectedPlayoffGroupId && playoffGroupStandings.length > 0 && (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Player</th>
                              <th className="px-3 py-2 text-left">W-L</th>
                              <th className="px-3 py-2 text-left">Q</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playoffGroupStandings.map((s) => (
                              <tr key={s.player_id} className="border-t">
                                <td className="px-3 py-2 text-muted-foreground">{s.rank}</td>
                                <td className="px-3 py-2 font-medium">{s.player_name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{s.wins}-{s.losses}</td>
                                <td className="px-3 py-2">
                                  {s.is_qualified ? (
                                    <span className="bg-green-500/20 text-green-500 font-bold px-2 py-0.5 rounded text-xs">✓ Q</span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── BRACKET VIEW ── */
                <div className="space-y-8">
                  {bracketMatches.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                      No bracket generated yet.
                      <button className="block mt-3 text-sm text-primary underline mx-auto" onClick={() => setPlayoffView("setup")}>
                        Go to Setup →
                      </button>
                    </div>
                  ) : bracketNames.map((bName) => {
                    const bMatches = bracketsByName[bName];
                    const bByRound: Record<string, typeof bMatches> = {};
                    bMatches.forEach((m) => {
                      if (!bByRound[m.round]) bByRound[m.round] = [];
                      bByRound[m.round].push(m);
                    });
                    const bSortedRounds = roundOrder.filter((r) => bByRound[r]);
                    return (
                    <div key={bName} className="space-y-4">
                      <h2 className="text-lg font-bold border-b pb-2">{bName}</h2>
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-6 min-w-max">
                        {bSortedRounds.map((round) => (
                          <div key={round} className="flex flex-col gap-3 min-w-[220px]">
                            {/* Round Header */}
                            <div
                              className={`text-center py-2 px-4 rounded-full text-xs font-bold uppercase tracking-wider ${round === "Final"
                                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                  : round === "Semifinal"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : round === "Quarterfinal"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-muted text-muted-foreground border border-border"}`}
                            >
                              {round}
                            </div>
                            {/* Match Cards */}
                            <div className="flex flex-col gap-4 flex-1 justify-around">
                              {(bByRound[round] || [])
                                .sort((a, b) => (a.bracket_position ?? 0) - (b.bracket_position ?? 0))
                                .map((m) => {
                                  const isCompleted = m.status === "completed";
                                  const isLive = m.status === "live";
                                  const p1Name = m.player1_name || m.player1?.name || "TBD";
                                  const p2Name = m.player2_name || m.player2?.name || "TBD";
                                  return (
                                    <div
                                      key={m.id}
                                      className={`rounded-xl border overflow-hidden ${isCompleted
                                          ? "border-green-500/30 bg-green-500/5"
                                          : isLive
                                            ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/30"
                                            : "border-border bg-card"}`}
                                    >
                                      {/* Status bar */}
                                      <div
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isCompleted
                                            ? "bg-green-500/20 text-green-500"
                                            : isLive
                                              ? "bg-red-500/20 text-red-400"
                                              : "bg-muted/50 text-muted-foreground"}`}
                                      >
                                        {isCompleted ? "✓ Final" : isLive ? "● Live" : "Scheduled"}
                                      </div>
                                      {/* Player 1 */}
                                      <div
                                        className={`flex items-center justify-between px-3 py-2.5 border-b border-border/50 ${m.winner_id === m.player1_id && m.player1_id ? "bg-yellow-500/10" : ""}`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {m.winner_id === m.player1_id && m.player1_id && (
                                            <span className="text-yellow-500 text-xs">🏆</span>
                                          )}
                                          <span
                                            className={`text-sm truncate max-w-[140px] ${!m.player1_id ? "text-muted-foreground italic" : "font-medium"} ${m.winner_id === m.player1_id && m.player1_id ? "font-bold text-yellow-500" : ""}`}
                                          >
                                            {p1Name}
                                          </span>
                                        </div>
                                        {isCompleted && (
                                          <span className="text-sm font-bold ml-2 text-muted-foreground">
                                            {m.player1_score ?? "—"}
                                          </span>
                                        )}
                                      </div>
                                      {/* Player 2 */}
                                      <div
                                        className={`flex items-center justify-between px-3 py-2.5 ${m.winner_id === m.player2_id && m.player2_id ? "bg-yellow-500/10" : ""}`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {m.winner_id === m.player2_id && m.player2_id && (
                                            <span className="text-yellow-500 text-xs">🏆</span>
                                          )}
                                          <span
                                            className={`text-sm truncate max-w-[140px] ${!m.player2_id ? "text-muted-foreground italic" : "font-medium"} ${m.winner_id === m.player2_id && m.player2_id ? "font-bold text-yellow-500" : ""}`}
                                          >
                                            {p2Name}
                                          </span>
                                        </div>
                                        {isCompleted && (
                                          <span className="text-sm font-bold ml-2 text-muted-foreground">
                                            {m.player2_score ?? "—"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Champion callout */}
                      {(() => {
                        const finalMatches = bByRound["Final"] || [];
                        const finalMatch = finalMatches.find((m) => m.status === "completed");
                        const champName = finalMatch?.winner_name?.trim();
                        if (!champName) return null;
                        return (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-2">🏆</div>
                            <div className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-1">Champion</div>
                            <div className="text-2xl font-black">{champName}</div>
                          </div>
                        );
                      })()}
                    </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">System Users</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user roles and permissions across the entire platform.
                </p>
              </div>
              <Button onClick={() => setIsCreateUmpireOpen(true)} size="sm">
                + Create Umpire
              </Button>
            </div>

            <div className="border rounded-xl overflow-x-auto bg-card">
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Tournament</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                        No users registered in the system yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    systemUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`
                        ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''}
                        ${u.role === 'director' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : ''}
                        ${u.role === 'umpire' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                        ${u.role === 'user' ? 'bg-slate-500/10 text-slate-500' : ''}
                      `}
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {u.tournament_id
                            ? (tournaments.find((t) => t.id === u.tournament_id)?.name ?? u.tournament_id.slice(0, 8) + "…")
                            : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            disabled={isUpdatingUserRole === u.id}
                            value={u.role}
                            onValueChange={(val) => handleUpdateUserRole(u.id, val)}
                          >
                            <SelectTrigger className="w-[120px] sm:w-[160px] ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User (Fan)</SelectItem>
                              <SelectItem value="umpire">Umpire</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                              <SelectItem value="admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* =========================================================
            DIRECTORS  (super admin only)
            ========================================================= */}
        {activeTab === "directors" && isAdmin && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Tournament Directors</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create director credentials and assign them to a tournament. Directors can manage players, matches, and settings for their tournament only.
                </p>
              </div>
              <Button onClick={() => setIsCreateDirectorOpen(true)} size="sm">
                + Create Director
              </Button>
            </div>

            <div className="border rounded-xl overflow-x-auto bg-card">
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Director Email</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                        No directors assigned yet. Use the button above to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    directors.map((d) => {
                      const assignedTournament = tournaments.find((t) => t.director_id === d.id);
                      return (
                        <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{d.email}</TableCell>
                          <TableCell>
                            {assignedTournament ? (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                                {assignedTournament.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 text-sm">— unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                            {new Date(d.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteDirector(d.id, d.email)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

      </main><Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditingPlayer ? "Edit Player" : "Add Player"}
              </DialogTitle>
              <DialogDescription>
                Fill player details and save changes.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="player-tournament-id">
                  Tournament Assignment
                </Label>
                <select
                  id="player-tournament-id"
                  className="w-full h-10 flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={playerForm.tournament_id}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    tournament_id: e.target.value,
                  }))}
                >
                  <option value="">No Tournament Assigned</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-id">ID</Label>
                <Input
                  id="player-id"
                  placeholder="UUID (optional for create)"
                  value={playerForm.id}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, id: e.target.value }))}
                  disabled={isEditingPlayer} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-first-name">First Name</Label>
                <Input
                  id="player-first-name"
                  value={playerForm.first_name}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-last-name">Last Name</Label>
                <Input
                  id="player-last-name"
                  value={playerForm.last_name}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-dob">Date of Birth</Label>
                <Input
                  id="player-dob"
                  type="date"
                  value={playerForm.date_of_birth}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    date_of_birth: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-nationality">Nationality</Label>
                <Input
                  id="player-nationality"
                  value={playerForm.nationality}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    nationality: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-ranking">Ranking</Label>
                <Input
                  id="player-ranking"
                  type="number"
                  value={playerForm.ranking}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    ranking: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-gender">Gender</Label>
                <Input
                  id="player-gender"
                  value={playerForm.gender}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, gender: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-age">Age</Label>
                <Input
                  id="player-age"
                  type="number"
                  value={playerForm.age}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, age: e.target.value }))} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="player-tennis-level">Tennis Level</Label>
                <Input
                  id="player-tennis-level"
                  value={playerForm.tennis_level}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    tennis_level: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="player-bio">Bio</Label>
                <Textarea
                  id="player-bio"
                  value={playerForm.bio}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, bio: e.target.value }))} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="player-image-url">Profile Image URL</Label>
                <Input
                  id="player-image-url"
                  value={playerForm.profile_image_url}
                  onChange={(e) => setPlayerForm((prev) => ({
                    ...prev,
                    profile_image_url: e.target.value,
                  }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPlayerDialogOpen(false)}
                disabled={isSavingPlayer}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePlayer} disabled={isSavingPlayer}>
                {isSavingPlayer ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog><Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditingMatch ? "Edit Match" : "Add Match"}
              </DialogTitle>
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
                  onChange={(e) => setMatchForm((prev) => ({
                    ...prev,
                    player1_id: e.target.value,
                  }))}
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
                  onChange={(e) => setMatchForm((prev) => ({
                    ...prev,
                    player2_id: e.target.value,
                  }))}
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
                  placeholder="e.g. Quarterfinal" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="match-court">Court</Label>
                <Input
                  id="match-court"
                  value={matchForm.court_id}
                  onChange={(e) => setMatchForm((prev) => ({
                    ...prev,
                    court_id: e.target.value,
                  }))}
                  placeholder="Court ID" />
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
                  onChange={(e) => setMatchForm((prev) => ({
                    ...prev,
                    scheduled_time: e.target.value,
                  }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsMatchDialogOpen(false)}
                disabled={isSavingMatch}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveMatch} disabled={isSavingMatch}>
                {isSavingMatch ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog><Dialog
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Complete Match</DialogTitle>
              <DialogDescription>
                Enter final sets and games for both players.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="complete-p1-sets">Player 1 Sets</Label>
                <Input
                  id="complete-p1-sets"
                  type="number"
                  value={completeForm.player1_sets}
                  onChange={(e) => setCompleteForm((prev) => ({
                    ...prev,
                    player1_sets: e.target.value,
                  }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-p2-sets">Player 2 Sets</Label>
                <Input
                  id="complete-p2-sets"
                  type="number"
                  value={completeForm.player2_sets}
                  onChange={(e) => setCompleteForm((prev) => ({
                    ...prev,
                    player2_sets: e.target.value,
                  }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-p1-games">Player 1 Games</Label>
                <Input
                  id="complete-p1-games"
                  type="number"
                  value={completeForm.player1_games}
                  onChange={(e) => setCompleteForm((prev) => ({
                    ...prev,
                    player1_games: e.target.value,
                  }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-p2-games">Player 2 Games</Label>
                <Input
                  id="complete-p2-games"
                  type="number"
                  value={completeForm.player2_games}
                  onChange={(e) => setCompleteForm((prev) => ({
                    ...prev,
                    player2_games: e.target.value,
                  }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCompleteDialogOpen(false)}
                disabled={isCompletingMatch}
              >
                Cancel
              </Button>
              <Button onClick={handleCompleteMatch} disabled={isCompletingMatch}>
                {isCompletingMatch ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog><Dialog
          open={isTournamentDialogOpen}
          onOpenChange={setIsTournamentDialogOpen}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditingTournament ? "Edit Tournament" : "Add Tournament"}
              </DialogTitle>
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
                  placeholder="Auto-generated" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-name">Name</Label>
                <Input
                  id="tournament-name"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-location">Location</Label>
                <Input
                  id="tournament-location"
                  value={tournamentForm.location}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-start-date">Start Date</Label>
                <Input
                  id="tournament-start-date"
                  type="date"
                  value={tournamentForm.start_date}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-end-date">End Date</Label>
                <Input
                  id="tournament-end-date"
                  type="date"
                  value={tournamentForm.end_date}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-status">Status</Label>
                <select
                  id="tournament-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={tournamentForm.status}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))}
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
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    surface: e.target.value,
                  }))}
                >
                  <option value="">Select surface</option>
                  <option value="Hard">Hard</option>
                  <option value="Clay">Clay</option>
                  <option value="Grass">Grass</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-director">Tournament Director</Label>
                <select
                  id="tournament-director"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={tournamentForm.director_id}
                  onChange={(e) => setTournamentForm((prev) => ({
                    ...prev,
                    director_id: e.target.value,
                  }))}
                >
                  <option value="">Unassigned</option>
                  {directors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.first_name} {d.last_name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Visual Customisation — stored in DB columns banner_image and accent_color ── */}
              <div className="space-y-2 md:col-span-2 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Homepage Appearance
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tournament-banner">Background Image</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="tournament-banner"
                    className="flex-1 flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground flex-shrink-0"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="truncate text-muted-foreground">
                      {tournamentForm.banner_image_url
                        ? "Image selected ✓"
                        : "Click to upload image…"}
                    </span>
                  </label>
                  <input
                    id="tournament-banner"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        setTournamentForm((prev) => ({
                          ...prev,
                          banner_image_url: dataUrl,
                        }));
                      };
                      reader.readAsDataURL(file);
                    } } />
                  {tournamentForm.banner_image_url && (
                    <button
                      type="button"
                      onClick={() => setTournamentForm((prev) => ({
                        ...prev,
                        banner_image_url: "",
                      }))}
                      className="text-xs text-destructive hover:underline flex-shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {tournamentForm.banner_image_url && (
                  <div className="mt-2 rounded-md overflow-hidden border h-24 bg-muted">
                    <img
                      src={tournamentForm.banner_image_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Replaces the hero background on the homepage for this
                  tournament.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament-accent">Accent Colour</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="tournament-accent"
                    type="color"
                    value={tournamentForm.accent_color}
                    onChange={(e) => setTournamentForm((prev) => ({
                      ...prev,
                      accent_color: e.target.value,
                    }))}
                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1" />
                  <Input
                    value={tournamentForm.accent_color}
                    onChange={(e) => setTournamentForm((prev) => ({
                      ...prev,
                      accent_color: e.target.value,
                    }))}
                    placeholder="#e91e8c"
                    className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sets the pink/highlight colour used site-wide for this
                  tournament.
                </p>
              </div>

              {/* Live preview swatch */}
              {tournamentForm.accent_color && (
                <div className="space-y-1">
                  <Label>Preview</Label>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-6 rounded-full border"
                      style={{ background: tournamentForm.accent_color }} />
                    <span
                      className="text-sm font-bold"
                      style={{ color: tournamentForm.accent_color }}
                    >
                      Live Score · FINAL
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsTournamentDialogOpen(false)}
                disabled={isSavingTournament}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTournament}
                disabled={isSavingTournament}
              >
                {isSavingTournament ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog><Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>
                Set group level, capacity, and qualifier count.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="group-designation">
                  Group Designation (Naming format)
                </Label>
                <div className="flex gap-2">
                  <select
                    id="group-designation"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={groupForm.designation_type}
                    onChange={(e) => setGroupForm((prev) => ({
                      ...prev,
                      designation_type: e.target.value,
                    }))}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="Custom">Custom (user-defined)</option>
                  </select>
                  {groupForm.designation_type === "Custom" && (
                    <Input
                      placeholder="Enter custom name"
                      value={groupForm.custom_designation}
                      onChange={(e) => setGroupForm((prev) => ({
                        ...prev,
                        custom_designation: e.target.value,
                      }))} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-gender">Group Gender</Label>
                <select
                  id="group-gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={groupForm.gender}
                  onChange={(e) => setGroupForm((prev) => ({
                    ...prev,
                    gender: e.target.value as GroupForm["gender"],
                  }))}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-type">Group Type</Label>
                <select
                  id="group-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={groupForm.group_type}
                  onChange={(e) => setGroupForm((prev) => ({
                    ...prev,
                    group_type: e.target.value,
                  }))}
                >
                  <option value="Singles">Singles</option>
                  <option value="Doubles">Doubles</option>
                  <option value="Mixed Doubles">Mixed Doubles</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-max-players">Max Players</Label>
                <Input
                  id="group-max-players"
                  type="number"
                  min={2}
                  value={groupForm.max_players}
                  onChange={(e) => setGroupForm((prev) => ({
                    ...prev,
                    max_players: e.target.value,
                  }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-qualifiers">Qualifiers</Label>
                <Input
                  id="group-qualifiers"
                  type="number"
                  min={1}
                  value={groupForm.qualifiers_count}
                  onChange={(e) => setGroupForm((prev) => ({
                    ...prev,
                    qualifiers_count: e.target.value,
                  }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsGroupDialogOpen(false)}
                disabled={isSavingGroup}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveGroup} disabled={isSavingGroup}>
                {isSavingGroup ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog><Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Doubles Team</DialogTitle>
              <DialogDescription>
                Pair two players to form a new team for Doubles groups.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Player 1</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={teamForm.player1_id}
                  onChange={(e) => setTeamForm({ ...teamForm, player1_id: e.target.value })}
                >
                  <option value="">Select a player...</option>
                  {players.filter(p => !p.is_team).map((p) => (
                    <option key={`p1-${p.id}`} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Player 2</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={teamForm.player2_id}
                  onChange={(e) => setTeamForm({ ...teamForm, player2_id: e.target.value })}
                >
                  <option value="">Select a player...</option>
                  {players.filter(p => !p.is_team).map((p) => (
                    <option key={`p2-${p.id}`} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={teamForm.gender}
                    onChange={(e) => setTeamForm({ ...teamForm, gender: e.target.value })}
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tennis Level</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={teamForm.tennis_level}
                    onChange={(e) => setTeamForm({ ...teamForm, tennis_level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)} disabled={isSavingTeam}>
                Cancel
              </Button>
              <Button onClick={handleSaveTeam} disabled={isSavingTeam}>
                {isSavingTeam ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* ── Create Director Credentials Dialog ── */}
      <Dialog open={isCreateDirectorOpen} onOpenChange={setIsCreateDirectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Director Credentials</DialogTitle>
            <DialogDescription>
              Create a login for a tournament director. They will only be able to manage their assigned tournament.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="director-email">Email</Label>
              <Input
                id="director-email"
                type="email"
                placeholder="director@example.com"
                value={directorForm.email}
                onChange={(e) => setDirectorForm({ ...directorForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="director-password">Password</Label>
              <Input
                id="director-password"
                type="password"
                placeholder="Min. 6 characters"
                value={directorForm.password}
                onChange={(e) => setDirectorForm({ ...directorForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="director-tournament">Assign Tournament</Label>
              <Select
                value={directorForm.tournament_id}
                onValueChange={(val) => setDirectorForm({ ...directorForm, tournament_id: val })}
              >
                <SelectTrigger id="director-tournament">
                  <SelectValue placeholder="Select a tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.director_id && (
                        <span className="ml-2 text-xs text-muted-foreground">(has director)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateDirectorOpen(false)} disabled={isCreatingDirector}>
              Cancel
            </Button>
            <Button onClick={handleCreateDirector} disabled={isCreatingDirector}>
              {isCreatingDirector ? "Creating…" : "Create Director"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Umpire Credentials Dialog ── */}
      <Dialog open={isCreateUmpireOpen} onOpenChange={setIsCreateUmpireOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Umpire Credentials</DialogTitle>
            <DialogDescription>
              Create a login for an umpire tied to a specific tournament. They will only see matches for that tournament.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="umpire-email">Email</Label>
              <Input
                id="umpire-email"
                type="email"
                placeholder="umpire@example.com"
                value={umpireForm.email}
                onChange={(e) => setUmpireForm({ ...umpireForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="umpire-password">Password</Label>
              <Input
                id="umpire-password"
                type="password"
                placeholder="Min. 6 characters"
                value={umpireForm.password}
                onChange={(e) => setUmpireForm({ ...umpireForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="umpire-tournament">Tournament</Label>
              <Select
                value={umpireForm.tournament_id}
                onValueChange={(val) => setUmpireForm({ ...umpireForm, tournament_id: val })}
              >
                <SelectTrigger id="umpire-tournament">
                  <SelectValue placeholder="Select a tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateUmpireOpen(false)} disabled={isCreatingUmpire}>
              Cancel
            </Button>
            <Button onClick={handleCreateUmpire} disabled={isCreatingUmpire}>
              {isCreatingUmpire ? "Creating…" : "Create Umpire"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
