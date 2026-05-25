import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  Brain,
  Trophy,
  Star,
  TrendingUp,
  Flame,
  Award,
  Plus,
  Users,
  Settings,
  LogOut,
  Target,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import MobileNav from "./MobileNav";
import { getAuthUser, getAvatarInitials, getToken, logout } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

interface RecentMap {
  id: number;
  public_id: string;
  title: string;
  node_count: number;
  updated_at: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? "s" : ""}`;
}

const MAP_COLORS = [
  "bg-primary-subtle text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const [recentMaps, setRecentMaps] = useState<RecentMap[]>([]);
  const [mapsLoading, setMapsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/maps/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data: RecentMap[]) => setRecentMaps(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setMapsLoading(false));
  }, []);

  const user = {
    name: authUser?.name ?? "Estudiante",
    avatar: authUser ? getAvatarInitials(authUser.name) : "?",
    level: 1,
    xp: 0,
    xpToNext: 1000,
    streak: 0,
    totalPoints: 0,
    rank: "-",
  };

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const badges = [
    { icon: Trophy, name: "Explorador", color: "bg-muted" },
    { icon: Star, name: "Creador Pro", color: "bg-muted" },
    { icon: Flame, name: "Racha 7 días", color: "bg-muted" },
    { icon: Award, name: "Top 10", color: "bg-muted" },
  ];

  const stats = [
    { label: "Mapas creados", value: "23", icon: Brain },
    { label: "Sesiones de estudio", value: "47", icon: TrendingUp },
    { label: "Conceptos dominados", value: "312", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 text-foreground">
      <nav className="p-4 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            <span className="text-lg md:text-xl font-semibold text-foreground tracking-tight">MindMap AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              <Trophy className="w-4 h-4" />
              <span>Ranking</span>
            </Link>
            <Link
              to="/groups"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>Grupos</span>
            </Link>
            <Link
              to="/settings"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 md:p-8 rounded-xl bg-card border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-lg md:text-xl font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      ¡Hola, {user.name}!
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      Nivel {user.level} • Top #{user.rank}
                    </p>
                    <p className="text-xs text-muted-foreground">{authUser?.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="hidden md:block px-4 py-2 rounded-md bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm font-medium text-sm"
                >
                  Ver perfil
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                  <span>
                    {user.xp} / {user.xpToNext} XP
                  </span>
                  <span>Nivel {user.level + 1}</span>
                </div>
                <Progress.Root
                  className="relative h-2 overflow-hidden rounded-full bg-muted"
                  value={(user.xp / user.xpToNext) * 100}
                >
                  <Progress.Indicator
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{
                      transform: `translateX(-${100 - (user.xp / user.xpToNext) * 100}%)`,
                    }}
                  />
                </Progress.Root>
              </div>

              <div className="flex gap-4 md:gap-6 mt-6 md:mt-8">
                <div className="flex-1 p-4 md:p-5 rounded-xl bg-muted border border-border">
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {user.streak}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Días de racha</div>
                </div>
                <div className="flex-1 p-4 md:p-5 rounded-xl bg-muted border border-border">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Puntos totales</div>
                </div>
              </div>
            </motion.div>

            <div className="p-6 md:p-8 rounded-xl bg-card border border-border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                  Tus mapas recientes
                </h3>
                <Link
                  to="/map/create"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Crear mapa
                </Link>
              </div>

              <div className="space-y-4">
                {mapsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Cargando mapas...</p>
                ) : recentMaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no tienes mapas. ¡Crea tu primero!
                  </p>
                ) : (
                  recentMaps.map((map, i) => (
                    <Link
                      key={map.id}
                      to={`/map/${map.public_id}`}
                      className="block p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg ${MAP_COLORS[i] ?? MAP_COLORS[1]} flex items-center justify-center`}
                        >
                          <Brain className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {map.title}
                          </h4>
                          <p className="text-sm text-muted-foreground font-medium">
                            {map.node_count} conceptos • {formatRelativeTime(map.updated_at)}
                          </p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-card border border-border shadow-sm"
                >
                  <stat.icon className="w-6 h-6 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
                <Award className="w-6 h-6 text-primary" />
                Logros destacados
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl ${badge.color} border border-border flex flex-col items-center justify-center`}
                  >
                    <badge.icon className="w-8 h-8 text-primary mb-2" />
                    <span className="text-xs font-semibold text-muted-foreground text-center">
                      {badge.name}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Link
                to="/achievements"
                className="mt-4 block text-center text-primary hover:text-primary-hover font-medium transition-colors text-sm"
              >
                Ver todos los logros
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center text-primary">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-none mb-1">
                      Desafío semanal
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Mantén tu ritmo de aprendizaje
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary-subtle border border-primary/10 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-xs font-bold text-primary">+12 XP</span>
                </div>
              </div>

              <div className="h-px bg-border/50 mb-6" />

              <div className="space-y-4">
                <p className="text-base font-bold text-foreground">
                  Crea 5 mapas conceptuales esta semana
                </p>
                
                <Progress.Root
                  className="relative h-2 bg-muted overflow-hidden rounded-full"
                  value={60}
                >
                  <Progress.Indicator
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ transform: "translateX(-40%)" }}
                  />
                </Progress.Root>
                
                <div className="flex justify-between items-center text-sm font-medium">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full border border-primary/30 flex items-center justify-center text-primary">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>3 de 5 completados</span>
                  </div>
                  <span className="text-muted-foreground">60%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
