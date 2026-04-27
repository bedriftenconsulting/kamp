import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import Loader from "@/components/ui/loader";
import { API_V1_URL } from "@/lib/api-url";
import { motion } from "framer-motion";

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<any>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance < 0) {
        setIsStarted(true);
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isStarted)
    return (
      <div className="text-sm font-bold text-white bg-primary/40 px-3 py-1.5 rounded-sm inline-block mb-6 border border-primary-foreground/20">
        Tournament in progress!
      </div>
    );

  return (
    <div className="flex gap-2 sm:gap-4 mb-8">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div
          key={unit}
          className="flex flex-col items-center justify-center bg-black/50 backdrop-blur-md rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[90px] border border-white/10 shadow-xl"
        >
          <span className="text-3xl sm:text-5xl font-black text-white">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 font-bold mt-1.5">
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // applyTournamentStyle
  // ────────────────────
  // Called after the tournament is fetched. Reads banner_image and
  // accent_color from the API response (stored in the DB since migration 000010)
  // and applies them:
  //   - accent_color → sets the CSS custom property --t-accent on <html>, which
  //     any element can reference with var(--t-accent). Adds the class
  //     "with-tournament-accent" so targeted CSS rules activate.
  //   - banner_image is used directly in the hero <section> backgroundImage style.
  const applyTournamentStyle = (t: any) => {
    if (t?.accent_color) {
      document.documentElement.style.setProperty("--t-accent", t.accent_color);
      document.documentElement.classList.add("with-tournament-accent");
    } else {
      document.documentElement.style.removeProperty("--t-accent");
      document.documentElement.classList.remove("with-tournament-accent");
    }
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const turl = `${API_V1_URL}/tournaments`;
        const tRes = await fetch(turl);
        const tData = await tRes.json();
        const toList = (payload: any) =>
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        const tList = toList(tData);

        if (tList.length === 0) {
          setTournament(null);
          setMatches([]);
          setUpcomingTournaments([]);
          setLoading(false);
          return;
        }

        const upcomingTList = tList.slice(0, 3).map((t: any) => ({
          id: t.id,
          name: t.name,
          location: t.location,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          surface: t.surface ?? "unknown",
          bannerImage: t.banner_image || "",
          accentColor: t.accent_color || "",
        }));

        setUpcomingTournaments(upcomingTList);

        const savedId = localStorage.getItem("active_public_tournament_id");
        if (savedId) {
          const savedT = upcomingTList.find((t: any) => t.id === savedId);
          if (savedT) {
            setTournament(savedT);
            return;
          }
        }
        // Initially set the first one as active
        setTournament(upcomingTList[0]);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!tournament?.id) return;

    // Apply global CSS vars for the active focal tournament
    applyTournamentStyle(tournament);

    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const [matchesRes, playersRes] = await Promise.all([
          fetch(`${API_V1_URL}/matches?tournament_id=${tournament.id}`),
          fetch(`${API_V1_URL}/players?tournament_id=${tournament.id}`),
        ]);

        const matchesData = await matchesRes.json();
        const playersData = await playersRes.json();

        const toList = (payload: any) =>
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        const matchesList = toList(matchesData);
        const playersList = toList(playersData);

        const formattedMatches = matchesList.map((m: any) => ({
          id: m.id,
          status: m.status,
          player1: {
            name: m.player1_name,
            country: "unknown",
          },
          player2: {
            name: m.player2_name,
            country: "unknown",
          },
          scheduledTime: m.scheduled_time,
        }));

        const formattedPlayers = playersList.map((p: any) => ({
          id: p.id,
          name:
            `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
            "Unknown Player",
          tennis_level: p.tennis_level || "Beginner",
          gender: p.gender || "Men",
        }));

        setMatches(formattedMatches);
        setPlayers(formattedPlayers);
      } catch (error) {
        console.error("Error fetching tournament context data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournament?.id]);

  // ✅ Correct filtering
  const liveMatches = (Array.isArray(matches) ? matches : []).filter(
    (m) => m.status === "live",
  );
  const upcomingMatches = (Array.isArray(matches) ? matches : []).filter(
    (m) => m.status === "scheduled",
  );
  const upcomingMatchesToShow = upcomingMatches.slice(0, 6);
  const participantsByLevel = {
    Beginner: players.filter(
      (p) => p.tennis_level === "Beginner" || p.tennis_level === "Beginner ",
    ),
    Intermediate: players.filter(
      (p) =>
        p.tennis_level === "Intermediate" || p.tennis_level === "Intermediate ",
    ),
    Advanced: players.filter(
      (p) => p.tennis_level === "Advanced" || p.tennis_level === "Advanced ",
    ),
  };

  // ✅ Safe loading states
  if (loading) {
    return <Loader />;
  }

  if (!tournament) {
    return <div className="p-10 text-center">No tournament found</div>;
  }

  return (
    <div>
      {/* Hero ──────────────────────────────────────────────────
           The background image is taken from the active tournament's
           bannerImage field (a base64 data URL stored in the DB).
           Falls back to /background.png if no custom image is set.
           ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-primary bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: (() => {
            const img = tournament.bannerImage?.trim()
              ? tournament.bannerImage
              : "/background.png";
            return `linear-gradient(90deg, rgba(18,8,14,0.62) 0%, rgba(18,8,14,0.45) 45%, rgba(18,8,14,0.42) 100%), url('${img}')`;
          })(),
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(330_86%_90%_/_0.24),_transparent_60%)]" />

        <div className="container relative py-20 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-bold uppercase bg-secondary text-secondary-foreground rounded-sm tracking-wider">
                {tournament.status === "scheduled" ? "TODAY" : "Now Playing"}
              </span>

              <span className="px-3 py-1 text-xs font-medium uppercase bg-primary-foreground/10 text-primary-foreground rounded-sm">
                {tournament.surface}
              </span>
            </div>

            {tournament.startDate && (
              <Countdown targetDate={tournament.startDate} />
            )}

            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-4 tracking-tight drop-shadow-md">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mb-8 text-white/80 font-medium">
              <span className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/10">
                <Calendar size={16} className="text-primary-foreground/80" />
                {new Date(tournament.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
                {" – "}
                {new Date(tournament.endDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <span className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/10">
                <MapPin size={16} className="text-primary-foreground/80" />
                {tournament.location}
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/live">
                <Button
                  size="lg"
                  className="gap-2 font-bold shadow-xl shadow-primary/20 bg-primary-foreground text-primary hover:bg-white transition-all hover:scale-105 active:scale-95 text-base"
                >
                  <Zap size={20} className="fill-current" />
                  Live Scores
                </Button>
              </Link>

              <Link to="/schedule">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 font-bold bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-black/60 hover:text-white transition-all text-base shadow-xl"
                >
                  <Calendar size={20} />
                  View Schedule
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 max-w-md ml-auto w-full"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-black tracking-widest text-sm uppercase">
                Upcoming Events
              </h3>
              <div className="h-[1px] bg-white/20 flex-1 ml-4" />
            </div>

            {upcomingTournaments.map((evt) => (
              <div
                key={evt.id}
                onClick={() => {
                  setTournament(evt);
                  localStorage.setItem("active_public_tournament_id", evt.id);
                }}
                className={`relative overflow-hidden ${tournament?.id === evt.id ? "bg-primary/40 ring-1 ring-primary border-primary/50" : "bg-black/40 border-white/10"} backdrop-blur-md border rounded-xl p-4 flex items-center gap-5 group cursor-pointer hover:bg-black/60 transition-all shadow-xl hover:-translate-y-1`}
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-primary/30 flex-shrink-0 shadow-inner">
                  <img
                    src={evt.bannerImage || "/background.png"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    alt={evt.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-lg leading-tight truncate">
                    {evt.name}
                  </h4>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <span className="text-white/60 text-xs flex items-center gap-1.5 font-medium">
                      <Calendar size={12} className="text-white/40" />
                      {new Date(evt.startDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-white/60 text-xs flex items-center gap-1.5 font-medium truncate">
                      <MapPin size={12} className="text-white/40" />
                      {evt.location}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-primary-foreground group-hover:text-primary transition-colors flex-shrink-0">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Live Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Coming Up</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatchesToShow.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
            {upcomingMatches.length > 6 && (
              <div className="mt-6">
                <Link to="/schedule">
                  <Button variant="outline" className="gap-2">
                    More
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
      {/* Participants */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["Beginner", "Intermediate", "Advanced"] as const).map(
              (level) => (
                <div key={level} className="p-6 border rounded-md bg-card">
                  <h3 className="font-bold mb-3">{level}</h3>
                  {participantsByLevel[level].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No participants yet.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <ol className="list-decimal list-inside text-sm">
                        {participantsByLevel[level].map((p: any) => (
                          <li
                            key={p.id}
                            className="text-muted-foreground py-0.5"
                          >
                            <span className="font-medium text-foreground">
                              {p.name}
                            </span>
                            {p.gender
                              ? ` ${(p.gender || "").toLowerCase() === "men" || (p.gender || "").toLowerCase() === "male" ? "(M)" : "(W)"}`
                              : ""}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Tournament Info */}
      <section className="py-12 bg-background">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-md">
            <Trophy className="mb-3" />
            <h3 className="font-bold">2 Categories</h3>
            <p className="text-sm text-muted-foreground">Men & Women Singles</p>
          </div>

          <div className="p-6 border rounded-md">
            <MapPin className="mb-3" />
            <h3 className="font-bold">{tournament.venue}</h3>
            <p className="text-sm text-muted-foreground">
              {tournament.location}
            </p>
          </div>

          <div className="p-6 border rounded-md">
            <Calendar className="mb-3" />
            <h3 className="font-bold">Tournament Duration</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(tournament.startDate).toLocaleDateString()} -{" "}
              {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
