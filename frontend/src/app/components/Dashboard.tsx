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
  Sparkles,
  ArrowRight,
  BookOpen,
  X,
  User,
  Edit2,
} from "lucide-react";
import { motion } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import * as Dialog from "@radix-ui/react-dialog";
import MobileNav from "./MobileNav";
import { getAuthUser, getAvatarInitials, getToken, logout } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

const CRITERIA_LABELS: Record<string, string> = {
  maps_created:    "mapas creados",
  streak:          "días de racha",
  study_sessions:  "sesiones de estudio",
  total_likes:     "me gustas recibidos",
  comments_given:  "comentarios dados",
  quiz_score:      "puntos en quiz",
  leaderboard_rank:"posición en ranking",
  fast_map:        "mapa en < 5 min",
};

interface RecentMap {
  id: number;
  public_id: string;
  title: string;
  node_count: number;
  updated_at: string;
}

interface Group {
  id: number;
  public_id: string;
  name: string;
  join_code: string;
  teacher_id: number;
  teacher: string;
  students: number;
}

interface UserData {
  level: number;
  xp: number;
  xp_to_next: number;
  streak: number;
  total_points: number;
  maps_created: number;
  study_sessions: number;
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  Trophy, Star, Flame, Award, Target,
};

const MAP_COLORS = [
  "bg-primary-subtle text-primary",
  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  "bg-blue-50 text-blue-600 border border-blue-100",
];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const [recentMaps, setRecentMaps] = useState<RecentMap[]>([]);
  const [mapsLoading, setMapsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rank, setRank] = useState<number | string>("-");
  const [featuredBadges, setFeaturedBadges] = useState<{
    name: string; icon: string; unlocked: boolean;
    criteria_type: string; criteria_value: number;
    xp_reward: number; progress: number;
  }[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);
  const [mapsThisWeek, setMapsThisWeek] = useState(0);

  // Estados de grupos
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const WEEKLY_GOAL = 5;

  const handleFetchResponse = async (r: Response) => {
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
  };

  const fetchGroups = () => {
    setGroupsLoading(true);
    fetch(`${API_URL}/groups/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(handleFetchResponse)
      .then(setGroups)
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  };

  useEffect(() => {
    const h = { Authorization: `Bearer ${getToken()}` };

    // Mapas recientes
    fetch(`${API_URL}/maps/my`, { headers: h })
      .then(handleFetchResponse)
      .then((data: (RecentMap & { node_count: number; created_at: string })[]) => {
        setRecentMaps(data.slice(0, 8));
        setTotalNodes(data.reduce((s, m) => s + (m.node_count ?? 0), 0));
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setMapsThisWeek(
          data.filter((m) => new Date(m.created_at + "Z").getTime() > oneWeekAgo).length
        );
      })
      .catch(() => {})
      .finally(() => setMapsLoading(false));

    // Datos del usuario
    fetch(`${API_URL}/users/me`, { headers: h })
      .then(handleFetchResponse)
      .then((data) => {
        setUserData(data);
        // Marcar tutorial pendiente si el usuario no lo ha visto
        const localDone = localStorage.getItem("tutorial_done");
        if (!localDone && !data.has_seen_tutorial) {
          localStorage.setItem("tutorial_should_start", "true");
        }
      })
      .catch(() => {});

    // Rank en leaderboard
    fetch(`${API_URL}/leaderboard`, { headers: h })
      .then(handleFetchResponse)
      .then((data: { isCurrentUser: boolean; rank: number }[]) => {
        const me = data.find((u) => u.isCurrentUser);
        if (me) setRank(me.rank);
      })
      .catch(() => {});

    // Logros: desbloqueados primero, luego los próximos a alcanzar
    fetch(`${API_URL}/achievements`, { headers: h })
      .then(handleFetchResponse)
      .then((data: { name: string; icon: string; unlocked: boolean }[]) => {
        const unlocked = data.filter((a) => a.unlocked);
        const locked = data.filter((a) => !a.unlocked);
        setFeaturedBadges([...unlocked, ...locked].slice(0, 4));
      })
      .catch(() => {});

    // Grupos
    fetchGroups();
  }, []);

  const user = {
    name: userData?.name ?? authUser?.name ?? "Usuario",
    avatar: authUser ? getAvatarInitials(authUser.name) : "?",
    avatarUrl: (userData as any)?.avatar_url ?? null,
    level: userData?.level ?? 1,
    xp: userData?.xp ?? 0,
    xpToNext: userData?.xp_to_next ?? 1000,
    streak: userData?.streak ?? 0,
    totalPoints: userData?.total_points ?? 0,
    rank,
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setActionLoading(true);
    fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ name: newGroupName }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Error al crear clase");
        return data;
      })
      .then((data) => {
        toast.success(`Grupo "${data.name}" creado · Código: ${data.join_code}`);
        setShowCreateModal(false);
        setNewGroupName("");
        navigate(`/groups/${data.public_id}`);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setActionLoading(false));
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setActionLoading(true);
    fetch(`${API_URL}/groups/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ join_code: joinCode.trim() }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Código inválido");
        return data;
      })
      .then((data) => {
        toast.success(data.message || "Te uniste al grupo con éxito");
        setShowJoinModal(false);
        setJoinCode("");
        navigate(`/groups/${data.group.public_id}`);
      })
      .catch((err) => toast.error(err.message || "Código inválido"))
      .finally(() => setActionLoading(false));
  };

  const stats = [
    { label: "Mapas creados", value: userData?.maps_created ?? 0, icon: Brain },
    { label: "Sesiones de estudio", value: userData?.study_sessions ?? 0, icon: TrendingUp },
    { label: "Conceptos dominados", value: totalNodes, icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 text-foreground">
      <nav className="p-4 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-xl font-bold tracking-tight text-foreground">MindMap AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6" data-tutorial="nav-links">
            <Link
              to="/communities"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
            >
              <Users className="w-4 h-4" />
              <span>Comunidades</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
            >
              <Trophy className="w-4 h-4" />
              <span>Ranking</span>
            </Link>
            {(authUser?.role === "admin" || authUser?.role === "teacher") && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            <Link
              to="/settings"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
            >
              <User className="w-4 h-4" />
              <span>Mi perfil</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de bienvenida y Gamificación */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-md"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <Link to="/profile" className="relative group shrink-0" title="Editar perfil">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary text-lg sm:text-xl font-extrabold shadow-sm">
                        {user.avatar}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-4 h-4 text-white" />
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                      ¡Hola, {user.name}!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold truncate">
                      {user.rank === null || user.rank === "-" || user.rank === 0 ? (
                        <>Nivel {user.level} · {user.xp} XP · Sin clasificación</>
                      ) : (
                        <>Nivel {user.level} · {user.xp} XP · Rank #{user.rank}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <span>{user.xp} / {user.xpToNext} XP</span>
                  <span>Nivel {user.level + 1}</span>
                </div>
                <Progress.Root
                  className="relative h-2 overflow-hidden rounded-full bg-muted border border-border/10"
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

              <div className="flex gap-3 sm:gap-4 mt-6">
                <div className="flex-1 p-3 sm:p-4 rounded-xl bg-muted/60 border border-border flex items-center gap-2 sm:gap-3">
                  <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{user.streak}</div>
                    <div className="text-xs text-muted-foreground font-semibold">Días de racha</div>
                  </div>
                </div>
                <div className="flex-1 p-3 sm:p-4 rounded-xl bg-muted/60 border border-border flex items-center gap-2 sm:gap-3">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{user.totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground font-semibold">Puntos totales</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* MAPAS RECIENTES */}
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-md">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight">Tus mapas recientes</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Tus lienzos personales y colaborativos</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted/80 text-foreground transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Unirse con código
                  </button>
                  <Link
                    to="/map/create"
                    data-tutorial="btn-crear-mapa"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-colors font-semibold text-xs shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear mapa
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {mapsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Cargando mapas...</p>
                ) : recentMaps.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/30">
                    <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Aún no tienes mapas conceptuales</p>
                    <Link to="/map/create" className="text-xs text-primary font-bold mt-1 inline-block">¡Crea tu primer mapa ahora!</Link>
                  </div>
                ) : (
                  recentMaps.map((map, i) => (
                    <Link
                      key={map.id}
                      to={`/map/${map.public_id}`}
                      className="block p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:bg-muted/30 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg ${MAP_COLORS[i % MAP_COLORS.length]} flex items-center justify-center font-bold`}
                        >
                          <Brain className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground leading-tight">
                            {map.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-semibold mt-1">
                            {map.node_count} conceptos • {formatRelativeTime(map.updated_at)} {map.owner_name ? `• De ${map.owner_name}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* SECCIÓN DE ESPACIOS DE COLABORACIÓN (Originally Clases) */}
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-md">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight">Mis Grupos</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Crea un grupo o únete con un código</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="cursor-pointer px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    Unirse
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear grupo
                  </button>
                </div>
              </div>

              {groupsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-6">Cargando espacios...</p>
              ) : groups.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/30">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">Aún no perteneces a ningún grupo</p>
                  <p className="text-xs text-muted-foreground mt-1">Crea un grupo o pídele el código a alguien para unirte</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {groups.map((group) => {
                    const isTeacher = group.teacher_id === authUser?.id;
                    return (
                      <Link
                        key={group.id}
                        to={`/groups/${group.public_id}`}
                        className="block p-5 rounded-xl border border-border hover:border-primary/20 bg-card hover:bg-muted/30 transition-all shadow-sm group relative overflow-hidden"
                      >
                        <div className="absolute right-3 top-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/10">
                          {isTeacher ? "Propietario" : "Colaborador"}
                        </div>
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight pr-16 mb-2">
                          {group.name}
                        </h4>
                        <div className="space-y-1 text-xs text-muted-foreground font-semibold">
                          <p>Creador: {isTeacher ? "Tú" : group.teacher}</p>
                          <p>{group.students} miembros</p>
                          {isTeacher && (
                            <p className="text-primary mt-2 flex items-center gap-1">
                              <span>Código de invitación:</span>
                              <span className="font-extrabold bg-primary-subtle border border-primary/10 px-1.5 py-0.5 rounded">{group.join_code}</span>
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 sm:p-4 rounded-xl bg-card border border-border shadow-sm text-center"
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1.5 sm:mb-2" />
                  <div className="text-lg sm:text-2xl font-extrabold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider leading-tight mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* COLUMNA LATERAL: LOGROS Y DESAFÍO SEMANAL */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-md">
              <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3 tracking-tight">
                <Award className="w-5 h-5 text-primary animate-bounce" />
                Logros destacados
              </h3>
              <div className="space-y-2">
                {featuredBadges.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No hay logros configurados aún
                  </p>
                ) : (
                  featuredBadges.map((badge, i) => {
                    const Icon = BADGE_ICONS[badge.icon] ?? Award;
                    const pct = badge.criteria_value > 0
                      ? Math.min(100, Math.round((badge.progress / badge.criteria_value) * 100))
                      : 100;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          badge.unlocked
                            ? "bg-primary-subtle border-primary/20"
                            : "bg-muted/20 border-border"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          badge.unlocked ? "bg-primary/15" : "bg-muted/50"
                        }`}>
                          <Icon className={`w-5 h-5 ${badge.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-foreground truncate">{badge.name}</span>
                            {badge.unlocked
                              ? <span className="text-[10px] text-emerald-500 font-bold shrink-0">✓ Logrado</span>
                              : <span className="text-[10px] text-amber-500 font-semibold shrink-0">+{badge.xp_reward} XP</span>
                            }
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {badge.unlocked
                              ? `${CRITERIA_LABELS[badge.criteria_type] ?? badge.criteria_type}`
                              : `${badge.progress}/${badge.criteria_value} ${CRITERIA_LABELS[badge.criteria_type] ?? badge.criteria_type}`
                            }
                          </p>
                          {!badge.unlocked && (
                            <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-md">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-none">
                      Desafío semanal
                    </h3>
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-primary-subtle border border-primary/10 flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-[10px] font-bold text-primary">+12 XP</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground">
                  Crea {WEEKLY_GOAL} mapas conceptuales esta semana
                </p>

                <Progress.Root
                  className="relative h-2 bg-muted overflow-hidden rounded-full border border-border/10"
                  value={Math.min((mapsThisWeek / WEEKLY_GOAL) * 100, 100)}
                >
                  <Progress.Indicator
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{
                      transform: `translateX(-${100 - Math.min((mapsThisWeek / WEEKLY_GOAL) * 100, 100)}%)`,
                    }}
                  />
                </Progress.Root>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{mapsThisWeek} de {WEEKLY_GOAL} creados</span>
                  </div>
                  <span className="text-muted-foreground">
                    {Math.round((mapsThisWeek / WEEKLY_GOAL) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav />

      {/* MODAL CREAR CLASE */}
      <Dialog.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Crear nuevo espacio de colaboración
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nombre del Espacio</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej. Ciencias Naturales - 5to Grado"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading || !newGroupName.trim()}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-sm shadow-md shadow-primary/10"
              >
                {actionLoading ? "Creando..." : "Crear Espacio"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL UNIRSE A CLASE */}
      <Dialog.Root open={showJoinModal} onOpenChange={setShowJoinModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Unirse con código
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Código de invitación o de clase</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Introduce el código de 6 caracteres"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-center tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading || joinCode.length < 6}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-sm shadow-md shadow-primary/10"
              >
                {actionLoading ? "Uniéndose..." : "Unirse"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
