const BASE_URL = "http://localhost:8000/api"; // adjust if needed

export const getPlayers = async () => {
  const res = await fetch(`${BASE_URL}/players`);
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
};

export const createPlayer = async (data: any) => {
  const res = await fetch(`${BASE_URL}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create player");
  return res.json();
};

export const updatePlayer = async (id: string, data: any) => {
  const res = await fetch(`${BASE_URL}/players/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update player");
  return res.json();
};

export const deletePlayer = async (id: string) => {
  const res = await fetch(`${BASE_URL}/players/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete player");
  return true;
};