import { useEffect, useState, useCallback } from "react";
import { Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UmpireScoring() {
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [scoringState, setScoringState] = useState<any>(null);
  const [tournamentRules, setTournamentRules] = useState<any>(null);

  // Load matches
  useEffect(() => {
    api.getTournaments().then((data) => {
      const toList = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setTournaments(toList(data));
    });

    api.getMatches().then((data) => {
      const availableMatches = data.filter(
        (m: any) => m.status === "scheduled" || m.status === "live"
      );
      setMatches(availableMatches);
    });
  }, []);

  // Web socket for live scoring updates
  useWebSocket(selectedMatch?.id || "", (data) => {
    if (data.type === "score_update") {
      setScoringState(data.state);
    }
  });

  // Load initial score state and rules when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      api.getMatchState(selectedMatch.id).then((state) => {
        setScoringState(state);
      });
      if (selectedMatch.tournament_id) {
        api.getTournamentRules(selectedMatch.tournament_id)
           .then(setTournamentRules)
           .catch(() => setTournamentRules(null));
      } else {
        setTournamentRules(null);
      }
    }
  }, [selectedMatch]);

  const isNumeric = tournamentRules?.scoring_format === "numeric";

  const handleSelectMatch = async (match: any) => {
    if (match.status === "scheduled") {
      // Set to live
      await api.updateMatch(match.id, {
        tournament_id: match.tournament_id || "",
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        round: match.round,
        status: "live",
      });
      match.status = "live";
    }
    setSelectedMatch(match);
  };

  const scorePoint = useCallback(
    async (playerIdx: 1 | 2) => {
      if (!selectedMatch) return;
      // Backend automatically determines if match is over, tiebreaks, etc.
      const newState = await api.addPoint(selectedMatch.id, playerIdx);
      setScoringState(newState);
    },
    [selectedMatch]
  );

  const filteredMatches = selectedTournamentId === "all"
    ? matches
    : matches.filter((m) => m.tournament_id === selectedTournamentId);

  if (!selectedMatch) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-md p-8 w-full max-w-md text-center border"
        >
          <Shield size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-black mb-2">Umpire Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Select a match to start scoring
          </p>

          <div className="mb-6">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="All Tournaments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredMatches.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No active or scheduled matches available for this selection.
              </p>
            ) : (
              filteredMatches.map((match) => (
                <Button
                  key={match.id}
                  variant="outline"
                  onClick={() => handleSelectMatch(match)}
                  className="flex flex-col items-start p-4 h-auto border-primary/20 hover:border-primary w-full"
                >
                  <div className="flex items-center gap-2 mb-2 w-full">
                    {match.status === "live" && (
                      <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
                    )}
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      {match.round}
                    </span>
                  </div>
                  <div className="font-bold text-base flex justify-between w-full">
                    <span>{match.player1_name}</span>
                    <span className="text-muted-foreground font-normal">vs</span>
                    <span>{match.player2_name}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // The scoring UI
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="bg-primary p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMatch(null)}
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Back
            </Button>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-live/10 rounded-full">
              <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
              <span className="text-xs font-bold uppercase text-live">LIVE</span>
            </span>
          </div>

          {/* Score Display */}
          <div className="bg-primary-foreground/5 rounded-md border border-primary-foreground/10 overflow-hidden mb-4">
            {[1, 2].map((playerNum) => {
              const playerName = playerNum === 1 ? selectedMatch.player1_name : selectedMatch.player2_name;
              const points = scoringState ? scoringState[`player${playerNum}_points`] : "0";
              const games = scoringState ? scoringState[`player${playerNum}_games`] : 0;
              const sets = scoringState ? scoringState[`player${playerNum}_sets`] : 0;

              return (
                <div
                  key={playerNum}
                  className={`flex items-center px-4 py-4 ${
                    playerNum === 2 ? "border-t border-primary-foreground/10" : ""
                  }`}
                >
                  <span className="flex-1 text-primary-foreground font-bold text-lg">
                    {playerName}
                  </span>
                  <div className="flex items-center gap-4">
                    {!isNumeric && (
                      <>
                        <span className="score-font text-primary-foreground/60 w-8 text-center text-xl font-bold bg-primary-foreground/5 rounded px-2 py-1">
                          {sets}
                        </span>
                        <span className="score-font text-primary-foreground w-8 text-center text-xl font-bold bg-primary-foreground/10 rounded px-2 py-1">
                          {games}
                        </span>
                      </>
                    )}
                    <span className="score-font w-12 text-center text-2xl font-black text-secondary bg-secondary/10 rounded py-1">
                      {points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-primary-foreground/50 flex justify-center gap-4">
            {!isNumeric && (
              <>
                <span>SETS</span>
                <span>GAMES</span>
              </>
            )}
            <span className="text-secondary/70">POINTS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full justify-center">
        {scoringState?.match_finished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <span className="text-7xl mb-6">🏆</span>
            <h2 className="text-3xl font-black text-primary-foreground mb-3">
              Match Over
            </h2>
            <p className="text-primary-foreground/80 text-xl font-bold mb-2">
              {scoringState.winner === "player1"
                ? selectedMatch.player1_name
                : selectedMatch.player2_name}{" "}
              wins!
            </p>
            <p className="text-primary-foreground/50 text-sm mb-8">
              {scoringState.player1_sets} – {scoringState.player2_sets} sets
            </p>
            <Button
              onClick={() => {
                setScoringState(null);
                setSelectedMatch(null);
              }}
              className="bg-secondary text-secondary-foreground font-bold px-8"
              size="lg"
            >
              Back to Matches
            </Button>
          </motion.div>
        ) : (
          <>
            <button
              onClick={() => scorePoint(1)}
              className="flex-1 bg-secondary hover:bg-secondary/90 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center min-h-[140px] shadow-lg border border-secondary/20"
            >
              <div className="flex flex-col items-center">
                <span className="text-secondary-foreground font-black text-2xl mb-2">
                  {selectedMatch.player1_name}
                </span>
                <span className="text-secondary-foreground/70 font-semibold text-sm bg-black/10 px-4 py-1 rounded-full uppercase tracking-wider">
                  Score Point
                </span>
              </div>
            </button>

            <button
              onClick={() => scorePoint(2)}
              className="flex-1 bg-primary-foreground hover:bg-primary-foreground/90 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center min-h-[140px] shadow-lg border border-primary-foreground/20"
            >
              <div className="flex flex-col items-center">
                <span className="text-primary font-black text-2xl mb-2">
                  {selectedMatch.player2_name}
                </span>
                <span className="text-primary/70 font-semibold text-sm bg-black/5 px-4 py-1 rounded-full uppercase tracking-wider">
                  Score Point
                </span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
