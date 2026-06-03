import { Link, useNavigate } from "react-router";
import { Trophy, Medal, Crown, Flame, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";
import { useState, useEffect, useCallback } from "react";
import { getToken, getAvatarInitials, logout } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");

  const handleFetchResponse = useCallback(async (r: Response) => {
    if (r.status === 401) {
      logout();
      navigate("/login");
      throw new Error("Sesión vencida. Inicia sesión de nuevo.");
    }
    const data = await r.json();
    if (!r.ok) {
      throw new Error(data.message || "Error al realizar la petición");
    }
    return data;
  }, [navigate]);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/leaderboard?period=${period}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(handleFetchResponse)
      .then((data) => {
        // Filtrar solo los usuarios clasificados (puntos > 0)
        setPlayers(data.filter((p: any) => p.rank !== null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, handleFetchResponse]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-amber-500 animate-pulse" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-muted-foreground font-bold text-sm">#{rank}</span>;
  };

  const renderLeaderboardList = () => {
    if (loading) {
      return (
        <div className="text-center py-16 text-sm text-muted-foreground font-semibold">
          Cargando clasificación...
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border shadow-sm">
          <Trophy className="w-10 h-10 text-muted-foreground/45 mx-auto mb-3" />
          <p className="font-semibold text-sm">Aún no hay clasificación registrada para este período.</p>
          <p className="text-xs text-muted-foreground mt-1">Completa quizzes para empezar a ganar puntos de aprendizaje.</p>
        </div>
      );
    }

    const topThree = players.slice(0, 3);
    const rest = players.slice(3);

    return (
      <div className="space-y-8">
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {topThree.map((player, i) => {
            const initials = getAvatarInitials(player.name);
            const rank = i + 1;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-xl border relative shadow-sm ${
                  rank === 1
                    ? "bg-amber-50/50 border-amber-200 shadow-amber-100/50 md:-translate-y-4"
                    : rank === 2
                      ? "bg-muted/40 border-border"
                      : "bg-orange-50/40 border-orange-200"
                }`}
              >
                <div className="text-center">
                  <div className="inline-flex mb-4 p-2 bg-card rounded-full border border-border shadow-sm">
                    {getRankIcon(rank)}
                  </div>
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-md ${
                      rank === 1
                        ? "bg-amber-500"
                        : rank === 2
                          ? "bg-gray-400"
                          : "bg-orange-500"
                    }`}
                  >
                    {initials}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {player.name}
                  </h3>
                  <div className="text-2xl font-extrabold text-primary mb-4 tracking-tight">
                    {player.points.toLocaleString()} pts
                  </div>
                  <div className="flex justify-center gap-3 text-xs text-muted-foreground font-semibold">
                    <div className="bg-card px-3 py-1 rounded-full shadow-sm border border-border">Nivel {player.level}</div>
                    <div className="flex items-center gap-1 bg-card px-3 py-1 rounded-full shadow-sm border border-border">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {player.streak} d
                    </div>
                  </div>
                </div>
                {rank === 1 && <div className="absolute -top-3 -right-3 text-2xl">🏆</div>}
              </motion.div>
            );
          })}
        </div>

        {rest.length > 0 && (
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {rest.map((player, i) => {
                const initials = getAvatarInitials(player.name);
                const rank = i + 4;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-4 transition-all hover:bg-muted/10 flex items-center justify-between ${
                      player.isCurrentUser ? "bg-primary-subtle/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 text-center text-muted-foreground font-bold">
                        {getRankIcon(rank)}
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm shrink-0 ${
                          player.isCurrentUser ? "bg-primary" : "bg-primary-subtle text-primary"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate flex items-center gap-1.5 text-sm">
                          {player.name}
                          {player.isCurrentUser && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wide">
                              Tú
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          Nivel {player.level} • {player.badges} insignias
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div>
                        <div className="font-extrabold text-foreground text-sm">
                          {player.points.toLocaleString()} pts
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Aprendizaje</p>
                      </div>
                      <div className="w-12 flex items-center justify-end gap-1 text-orange-500 font-bold text-sm">
                        <Flame className="w-4 h-4" />
                        {player.streak}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans text-foreground">
      <nav className="p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Trophy className="w-6 h-6 text-primary animate-bounce" />
          <h1 className="text-xl font-bold text-foreground tracking-tight">Leaderboard Global</h1>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <Tabs.Root value={period} onValueChange={setPeriod} className="space-y-6">
          <Tabs.List className="flex gap-1.5 p-1 rounded-xl bg-card border border-border shadow-sm w-fit mx-auto md:mx-0">
            <Tabs.Trigger
              value="weekly"
              className="px-5 py-2 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Semanal
            </Tabs.Trigger>
            <Tabs.Trigger
              value="monthly"
              className="px-5 py-2 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Mensual
            </Tabs.Trigger>
            <Tabs.Trigger
              value="alltime"
              className="px-5 py-2 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todo el tiempo
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="weekly" className="space-y-8">
            {renderLeaderboardList()}
          </Tabs.Content>

          <Tabs.Content value="monthly" className="space-y-8">
            {renderLeaderboardList()}
          </Tabs.Content>

          <Tabs.Content value="alltime" className="space-y-8">
            {renderLeaderboardList()}
          </Tabs.Content>
        </Tabs.Root>
      </div>
      <MobileNav />
    </div>
  );
}
