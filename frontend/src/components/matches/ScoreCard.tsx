import { motion } from "framer-motion";

interface ScoreCardProps {
  match: any;
  compact?: boolean;
}

export default function ScoreCard({ match, compact = false }: ScoreCardProps) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  // ✅ SAFE FALLBACK SCORE STRUCTURE
  const score = match.score || {
    sets: [],
    currentGame: [0, 0],
    currentPoints: ["0", "0"],
    servingPlayer: null,
  };

  const gameScore = score.currentGame || [0, 0];
  const pointScore = score.currentPoints || ["0", "0"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-md border overflow-hidden ${
        isLive ? "ring-2 ring-live/30 border-live/20" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
              <span className="text-xs font-bold uppercase text-live">LIVE</span>
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-semibold uppercase text-court">FINAL</span>
          )}
          {match.status === "scheduled" && (
            <span className="text-xs font-semibold uppercase text-muted-foreground">UPCOMING</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{match.round || "Match"}</span>
          {!compact && <span>· {match.court || "Court 1"}</span>}
        </div>
      </div>

      {/* Column Headers */}
      {(isLive || isCompleted) && score.sets.length > 0 && (
        <div className="flex items-center px-4 py-1 bg-muted/30 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex-1" />
          <div className="w-2 flex-shrink-0" />
          <div className="flex items-center gap-0">
            {score.sets.map((_: any, i: number) => (
              <span key={i} className="w-7 text-center">S{i + 1}</span>
            ))}
            {isLive && (
              <>
                <span className="w-8 text-center">GM</span>
                <span className="w-8 text-center">PT</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Players & Scores */}
      <div className="divide-y divide-border">
        {[match.player1, match.player2].map((player: any, idx: number) => {
          if (!player) return null;

          const isWinner = match.winner === player.id;
          const isServing = score.servingPlayer === idx;

          return (
            <div
              key={idx}
              className={`flex items-center px-4 py-3 gap-3 ${
                isWinner ? "bg-court/5" : ""
              }`}
            >
              {/* Serve indicator */}
              <div className="w-2 flex-shrink-0">
                {isServing && isLive && (
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                )}
              </div>

              {/* Player info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`text-sm truncate ${
                    isWinner ? "font-bold" : "font-medium"
                  }`}
                >
                  {player?.seed && (
                    <span className="text-muted-foreground mr-1">
                      [{player.seed}]
                    </span>
                  )}
                  {player?.name || "Player"}
                </span>
              </div>

              {/* Set scores */}
              <div className="flex items-center gap-0">
                {score.sets.map((set: number[], setIdx: number) => (
                  <span
                    key={setIdx}
                    className={`score-font w-7 text-center text-sm font-bold ${
                      set[idx] > set[1 - idx]
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {set[idx]}
                  </span>
                ))}

                {/* Current game score (live only) */}
                {isLive && (
                  <span className="score-font w-8 text-center text-sm font-bold text-secondary bg-primary/10 rounded-sm py-0.5">
                    {gameScore[idx]}
                  </span>
                )}

                {/* Current point score (live only) */}
                {isLive && (
                  <span className="score-font w-8 text-center text-sm font-bold text-accent-foreground bg-secondary/15 rounded-sm py-0.5 ml-0.5">
                    {pointScore[idx]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {!compact && match.status === "scheduled" && (
        <div className="px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground">
          {match.scheduledTime
            ? new Date(match.scheduledTime).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
          {" · "}
          {match.court || "Court 1"}
        </div>
      )}
    </motion.div>
  );
}