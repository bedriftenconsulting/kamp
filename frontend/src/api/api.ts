const BASE_URL = "http://localhost:8080/api/v1";

export const api = {
  getMatches: async () => {
    const res = await fetch(`${BASE_URL}/matches`);
    return res.json();
  },

  addPoint: async (matchId: string, player: number) => {
    await fetch(`${BASE_URL}/matches/${matchId}/point`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player }),
    });
  },
};