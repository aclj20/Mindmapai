import { Link, useNavigate } from "react-router";
import { Trophy, Medal, Crown, Flame, ArrowLeft, TrendingUp, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";
import { useState, useEffect, useCallback } from "react";
import { getToken, getAvatarInitials, logout, getAuthUser } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function Leaderboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("alltime");

  const handleFetchResponse = useCallback(async (r: Response) => {
    if (r.status === 401) { logout(); navigate("/login"); throw new Error("Sesión vencida."); }
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Error");
    return data;
  }, [navigate]);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/leaderboard?period=${period}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(handleFetchResponse)
      .then((data) => setPlayers(data.filter((p: any) => p.rank !== null || p.isCurrentUser)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, handleFetchResponse]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-500" />;
    return <span className="text-muted-foreground font-extrabold text-sm">#{rank}</span>;
  };

  const periodLabel: Record<string, string> = {
    weekly: "últimos 7 días",
    monthly: "último mes",
    alltime: "todos los tiempos",
  };

  const renderLeaderboard = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-semibold">Cargando clasificación...</p>
        </div>
      );
    }

    const rankedPlayers = players.filter(p => p.rank !== null && !p.isBelowCut);

    if (rankedPlayers.length === 0) {
      return (
        <div className="p-14 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-bold text-sm">Sin clasificación registrada</p>
          <p className="text-xs mt-1">
          {period === "alltime"
              ? "Crea mapas y completa actividades para acumular XP."
              : "Crea mapas, completa sesiones o quizzes para ganar XP este período."}
          </p>
        </div>
      );
    }

    const topThree = rankedPlayers.slice(0, 3);
    const rest = rankedPlayers.slice(3);
    const currentUserEntry = players.find(p => p.isCurrentUser);
    const currentUserInTop = rankedPlayers.some(p => p.isCurrentUser);

    // Ordenar el podio: 2º, 1º, 3º (visual)
    const podiumOrder = [
      topThree[1] || null,
      topThree[0] || null,
      topThree[2] || null,
    ];
    const podiumHeights = ["h-24", "h-32", "h-20"];
    const podiumColors = [
      "bg-slate-100 border-slate-300",
      "bg-amber-50 border-amber-300",
      "bg-orange-50 border-orange-300",
    ];
    const podiumRanks = [2, 1, 3];

    return (
      <div className="space-y-8">
        {/* Podium top 3 */}
        {topThree.length >= 1 && (
          <div className="flex items-end justify-center gap-4 pt-4">
            {podiumOrder.map((player, i) => {
              if (!player) return <div key={i} className="flex-1 max-w-[140px]" />;
              const initials = getAvatarInitials(player.name);
              const rank = podiumRanks[i];
              const isMe = player.isCurrentUser;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex-1 max-w-[160px] flex flex-col items-center gap-3 p-4 rounded-2xl border-2 ${podiumColors[i]} ${isMe ? "ring-2 ring-primary/40" : ""} relative`}
                >
                  {rank === 1 && <span className="absolute -top-3 text-xl">👑</span>}
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.name}
                      className={`w-14 h-14 rounded-full object-cover shadow-md ring-2 ${
                        rank === 1 ? "ring-amber-400" : rank === 2 ? "ring-slate-400" : "ring-orange-400"
                      }`} />
                  ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-md ${
                      rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-slate-400" : "bg-orange-500"
                    }`}>
                      {initials}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-bold text-xs text-foreground truncate max-w-[120px]">{player.name}</p>
                    {isMe && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wide">Tú</span>}
                    <p className="text-lg font-extrabold text-foreground mt-1">
                      {player.points.toLocaleString()}
                      <span className="text-xs font-bold text-muted-foreground ml-0.5">pts</span>
                    </p>
                  </div>
                  <div className={`${podiumHeights[i]} w-full rounded-xl flex flex-col items-center justify-center gap-1 ${
                    rank === 1 ? "bg-amber-100" : rank === 2 ? "bg-slate-100" : "bg-orange-100"
                  }`}>
                    {getRankIcon(rank)}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {player.streak}d
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Lista del resto */}
        {rest.length > 0 && (
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clasificación completa</span>
            </div>
            <div className="divide-y divide-border">
              {rest.map((player, i) => {
                const initials = getAvatarInitials(player.name);
                const rank = i + 4;
                const isMe = player.isCurrentUser;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 flex items-center justify-between transition-all ${isMe ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/20"}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 text-center shrink-0">{getRankIcon(rank)}</div>
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.name}
                          className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 ring-1 ring-border" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                          {player.name}
                          {isMe && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wide">Tú</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-semibold">Nv. {player.level}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{player.badges} insignias</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-extrabold text-foreground text-sm">{player.points.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">pts</p>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500 font-bold text-xs w-10 justify-end">
                        <Flame className="w-3.5 h-3.5" />{player.streak}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Usuario actual si está fuera del top 50 */}
        <AnimatePresence>
          {!currentUserInTop && currentUserEntry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 flex items-center gap-3"
            >
              <div className="w-8 text-center shrink-0">
                {currentUserEntry.rank ? getRankIcon(currentUserEntry.rank) : <span className="text-xs text-muted-foreground font-bold">—</span>}
              </div>
              {currentUserEntry.avatar_url ? (
                <img src={currentUserEntry.avatar_url} alt={currentUserEntry.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/40" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-extrabold text-sm text-primary-foreground shrink-0">
                  {getAvatarInitials(currentUserEntry.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  {currentUserEntry.name}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wide">Tú</span>
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Nv. {currentUserEntry.level} · {currentUserEntry.badges} insignias
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-foreground text-sm">{currentUserEntry.points.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">pts</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans text-foreground">
      <nav className="p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Leaderboard Global</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
        {/* Info de período */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>
            {period === "alltime"
              ? "XP total acumulada de todas las actividades"
              : `XP ganada ${period === "weekly" ? "esta semana" : "este mes"} (mapas, sesiones, quizzes, logros)`}
          </span>
        </div>

        <Tabs.Root value={period} onValueChange={(v) => { setPeriod(v); }} className="space-y-6">
          <Tabs.List className="flex gap-1 p-1 rounded-xl bg-card border border-border shadow-sm w-fit">
            {[
              { value: "alltime", label: "Todo el tiempo" },
              { value: "monthly", label: "Este mes" },
              { value: "weekly",  label: "Esta semana" },
            ].map(({ value, label }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="weekly">{renderLeaderboard()}</Tabs.Content>
          <Tabs.Content value="monthly">{renderLeaderboard()}</Tabs.Content>
          <Tabs.Content value="alltime">{renderLeaderboard()}</Tabs.Content>
        </Tabs.Root>
      </div>
      <MobileNav />
    </div>
  );
}
