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

  getKnockoutByLevel: async (level: string) => {
    const normalized = normalizeKnockoutLevel(level);
    const res = await fetch(`${BASE_URL}/knockout/${normalized}`);
    return res.json();
  },

  generateKnockoutByLevel: async (level: string) => {
    const normalized = normalizeKnockoutLevel(level);
    const res = await fetch(`${BASE_URL}/knockout/${normalized}/generate`, {
      method: "POST",
    });
    return res.json();
  },

  saveKnockoutResult: async (matchId: string, payload: {
    winner_id: string;
    player1_score: number;
    player2_score: number;
  }) => {
    const res = await fetch(`${BASE_URL}/knockout/matches/${matchId}/result`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
