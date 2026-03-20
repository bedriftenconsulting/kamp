import { API_V1_URL } from "@/lib/api-url";

export const getTournament = async () => {
  const res = await fetch(`${API_V1_URL}/tournaments`);
  return res.json();
};