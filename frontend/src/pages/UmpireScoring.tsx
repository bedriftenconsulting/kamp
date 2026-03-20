import { useState, useCallback } from "react";
import { Undo2, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { players } from "@/data/mockData";
import { motion } from "framer-motion";

interface UmpireMatchState {
  player1: string;
  player2: string;
  sets: [number, number][];
  currentGame: [number, number];
  servingPlayer: 0 | 1;
  history: string[];
  matchOver: boolean;
  winner: string | null;
  bestOf: 3 | 5;
}

const POINT_SEQUENCE = [0, 15, 30, 40];

function getInitialState(): UmpireMatchState {
  return {
    player1: players[0].name,
    player2: players[3].name,
    sets: [[0, 0]],
    currentGame: [0, 0],
    servingPlayer: 0,
    history: [],
    matchOver: false,
    winner: null,
    bestOf: 3,
  };
}

export default function UmpireScoring() {
  const [state, setState] = useState<UmpireMatchState>(getInitialState());
  const [showLogin, setShowLogin] = useState(true);

  const scorePoint = useCallback((playerIdx: 0 | 1) => {
    setState((prev) => {
      if (prev.matchOver) return prev;

      const next = { ...prev, history: [...prev.history, JSON.stringify(prev)] };
      const game = [...prev.currentGame] as [number, number];
      const otherIdx = (1 - playerIdx) as 0 | 1;
      const currentSet = [...prev.sets[prev.sets.length - 1]] as [number, number];
      const sets = prev.sets.map((s) => [...s] as [number, number]);

      // Deuce logic
      if (game[0] === 40 && game[1] === 40) {
        // Advantage or win
        game[playerIdx] = 50; // "AD"
        next.currentGame = game;
        return next;
      }

      if (game[playerIdx] === 50) {
        // Win the game from AD
        return winGame(next, sets, currentSet, playerIdx, otherIdx);
      }

      if (game[otherIdx] === 50) {
        // Back to deuce
        game[0] = 40;
        game[1] = 40;
        next.currentGame = game;
        return next;
      }

      const currentIdx = POINT_SEQUENCE.indexOf(game[playerIdx]);
      if (game[playerIdx] === 40) {
        // Win the game
        return winGame(next, sets, currentSet, playerIdx, otherIdx);
      }

      game[playerIdx] = POINT_SEQUENCE[currentIdx + 1];
      next.currentGame = game;
      return next;
    });
  }, []);

  const undoLast = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      return JSON.parse(prev.history[prev.history.length - 1]);
    });
  }, []);

  if (showLogin) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-md p-8 w-full max-w-sm text-center"
        >
          <Shield size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-black mb-2">Umpire Login</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access your assigned matches</p>
          <Button
            onClick={() => setShowLogin(false)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            size="lg"
          >
            Enter Scoring Mode
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Demo mode — no authentication required</p>
        </motion.div>
      </div>
    );
  }

  const gameScoreDisplay = (val: number) => {
    if (val === 50) return "AD";
    return String(val);
  };

  const currentSet = state.sets[state.sets.length - 1];

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Scoreboard */}
      <div className="bg-primary p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase text-secondary tracking-wider">Umpire Scoring</span>
          </div>

          {/* Score Display */}
          <div className="bg-primary-foreground/5 rounded-md border border-primary-foreground/10 overflow-hidden mb-4">
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className={`flex items-center px-4 py-3 ${idx === 0 ? "" : "border-t border-primary-foreground/10"}`}
              >
                <div className="w-3 flex-shrink-0">
                  {state.servingPlayer === idx && (
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  )}
                </div>
                <span className={`flex-1 text-primary-foreground font-bold text-base ${
                  state.winner === (idx === 0 ? state.player1 : state.player2) ? "text-secondary" : ""
                }`}>
                  {idx === 0 ? state.player1 : state.player2}
                </span>
                <div className="flex items-center gap-0">
                  {state.sets.map((set, si) => (
                    <span
                      key={si}
                      className={`score-font w-8 text-center text-lg font-bold ${
                        set[idx] > set[1 - idx] ? "text-primary-foreground" : "text-primary-foreground/40"
                      }`}
                    >
                      {set[idx]}
                    </span>
                  ))}
                  <span className="score-font w-10 text-center text-xl font-black text-secondary bg-secondary/10 rounded-sm py-1">
                    {gameScoreDisplay(state.currentGame[idx])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Match info */}
          <div className="text-center text-xs text-primary-foreground/50">
            Set {state.sets.length} · Game {currentSet[0] + currentSet[1] + 1} · Best of {state.bestOf}
          </div>
        </div>
      </div>

      {/* Scoring Buttons */}
      <div className="flex-1 flex flex-col p-4 gap-3 max-w-lg mx-auto w-full">
        {state.matchOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <span className="text-6xl mb-4">🏆</span>
            <h2 className="text-2xl font-black text-primary-foreground mb-2">Match Over</h2>
            <p className="text-primary-foreground/70 text-lg font-semibold mb-6">{state.winner} wins!</p>
            <Button
              onClick={() => setState(getInitialState())}
              className="bg-secondary text-secondary-foreground font-bold"
              size="lg"
            >
              New Match
            </Button>
          </motion.div>
        ) : (
          <>
            <button
              onClick={() => scorePoint(0)}
              className="flex-1 bg-secondary/90 hover:bg-secondary active:scale-[0.98] transition-all rounded-md flex items-center justify-center min-h-[120px]"
            >
              <span className="text-secondary-foreground font-black text-xl">{state.player1}</span>
            </button>
            <button
              onClick={() => scorePoint(1)}
              className="flex-1 bg-primary-foreground/90 hover:bg-primary-foreground active:scale-[0.98] transition-all rounded-md flex items-center justify-center min-h-[120px]"
            >
              <span className="text-primary font-black text-xl">{state.player2}</span>
            </button>
            <div className="flex gap-3">
              <Button
                onClick={undoLast}
                variant="outline"
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
                disabled={state.history.length === 0}
              >
                <Undo2 size={16} />
                Undo
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
              >
                <Check size={16} />
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function winGame(
  next: UmpireMatchState,
  sets: [number, number][],
  currentSet: [number, number],
  playerIdx: 0 | 1,
  otherIdx: 0 | 1
): UmpireMatchState {
  currentSet[playerIdx]++;
  sets[sets.length - 1] = currentSet;
  next.currentGame = [0, 0];
  next.servingPlayer = (next.servingPlayer === 0 ? 1 : 0) as 0 | 1;

  // Check if set is won (6 games with 2 lead, or 7-5, or tiebreak 7-6)
  if (
    (currentSet[playerIdx] >= 6 && currentSet[playerIdx] - currentSet[otherIdx] >= 2) ||
    (currentSet[playerIdx] === 7)
  ) {
    // Set won
    const setsWon = sets.filter((s) => s[playerIdx] > s[otherIdx]).length;
    const setsNeeded = Math.ceil(next.bestOf / 2);

    if (setsWon >= setsNeeded) {
      next.matchOver = true;
      next.winner = playerIdx === 0 ? next.player1 : next.player2;
    } else {
      sets.push([0, 0]);
    }
  }

  next.sets = sets;
  return next;
}
