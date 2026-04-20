import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_V1_URL } from "@/lib/api-url";

interface Tournament {
  id: string;
  name: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

interface TournamentContextType {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  activeTournament: Tournament | null;
  setActiveTournamentId: (id: string | null) => void;
  refreshTournaments: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const STORAGE_KEY = "active_public_tournament_id";

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentId, setActiveIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const refreshTournaments = useCallback(async () => {
    try {
      const res = await fetch(`${API_V1_URL}/tournaments`);
      if (res.ok) {
        const data = await res.json();
        const list: Tournament[] = Array.isArray(data) ? data : data?.data ?? [];
        setTournaments(list);

        // Auto-select first active tournament if none selected
        if (!localStorage.getItem(STORAGE_KEY) && list.length > 0) {
          const active = list.find((t) => t.status === "active") ?? list[0];
          setActiveIdState(active.id);
          localStorage.setItem(STORAGE_KEY, active.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tournaments", err);
    }
  }, []);

  useEffect(() => {
    refreshTournaments();
  }, [refreshTournaments]);

  const setActiveTournamentId = (id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setActiveIdState(id);
  };

  const activeTournament = tournaments.find((t) => t.id === activeTournamentId) ?? null;

  return (
    <TournamentContext.Provider
      value={{ tournaments, activeTournamentId, activeTournament, setActiveTournamentId, refreshTournaments }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
};
