import { API_V1_URL } from "@/lib/api-url";

const BASE_URL = API_V1_URL;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

type KnockoutLevel = (typeof LEVELS)[number];

const normalizeKnockoutLevel = (level: string): KnockoutLevel => {
  const v = level.trim().toLowerCase();
  if (LEVELS.includes(v as KnockoutLevel)) {
    return v as KnockoutLevel;
  }
  throw new Error(`Invalid knockout level: ${level}`);
};

export const api = {
  getTournaments: async () => {
    const res = await fetch(`${BASE_URL}/tournaments`);
    return res.json();
  },

  getGroups: async (tournamentId?: string) => {
    let url = `${API_V1_URL}/groups`;
    if (tournamentId) {
      url += `?tournament_id=${encodeURIComponent(tournamentId)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json();
  },

  getMatches: async () => {
    const res = await fetch(`${BASE_URL}/matches`);
    return res.json();
  },

  getMatchState: async (matchId: string) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}/state`);
    return res.json();
  },

  updateMatch: async (matchId: string, payload: any) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update match");
    }
    return res.json();
  },

  addPoint: async (matchId: string, player: number) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}/point`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player }),
    });
    return res.json();
  },

  createTeam: async (payload: { tournament_id: string; player1_id: string; player2_id: string; player1_name: string; player2_name: string; gender: string; tennis_level: string }) => {
    const res = await fetch(`${BASE_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create team");
    }
    return res.json();
  },

  getTournamentRules: async (tournamentId: string) => {
    const res = await fetch(`${BASE_URL}/tournaments/${tournamentId}/rules`);
    if (!res.ok) return null;
    return res.json();
  },

  updateTournamentRules: async (tournamentId: string, payload: any) => {
    const res = await fetch(`${BASE_URL}/tournaments/${tournamentId}/rules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update rules");
    }
    return res.json();
  },

  getTournamentQualifiers: async (tournamentId: string) => {
    const res = await fetch(`${BASE_URL}/groups/qualifiers?tournament_id=${tournamentId}`);
    if (!res.ok) return [];
    return res.json();
  },

  generateBracket: async (tournamentId: string, payload: { size: number; player_ids: string[] }) => {
    const res = await fetch(`${BASE_URL}/tournaments/${tournamentId}/bracket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate bracket");
    }
    return res.json();
  },
};
