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
};
