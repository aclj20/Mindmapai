import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Shield, Trophy, Calendar, BarChart3, LogOut, Plus, Trash2, Edit2, Save, X,
  Star, Flame, Award, Target, Zap, BookOpen, Heart, Users, TrendingUp, Crown,
  CheckCircle, XCircle, AlertCircle, ChevronRight, Sparkles, Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { getToken, logout, getAuthUser } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL as string;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

type Achievement = {
  id: number; name: string; description: string; icon: string;
  color: string; xp_reward: number; criteria_type: string; criteria_value: number;
};

type Challenge = {
  id: number; title: string; description: string; challenge_type: string;
  target_value: number; xp_reward: number; week_start: string; week_end: string;
  is_active: number; created_at: string;
};

type Stats = {
  totalUsers: number; totalMaps: number; totalSessions: number;
  totalQuizzes: number; activeChallenges: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const CRITERIA_TYPES = [
  { value: "maps_created",     label: "Mapas creados",        icon: Target },
  { value: "streak",           label: "Racha de días",         icon: Flame },
  { value: "study_sessions",   label: "Sesiones de estudio",   icon: BookOpen },
  { value: "total_likes",      label: "Me gustas recibidos",   icon: Heart },
  { value: "comments_given",   label: "Comentarios dados",     icon: Users },
  { value: "quiz_score",       label: "Puntaje de quiz",       icon: Star },
  { value: "leaderboard_rank", label: "Top leaderboard",       icon: Trophy },
  { value: "fast_map",         label: "Mapa en < 5 min",       icon: Zap },
];

const ICON_OPTIONS = [
  "Trophy", "Star", "Flame", "Award", "Target", "Zap",
  "Crown", "Heart", "BookOpen", "Users", "TrendingUp", "Shield",
];

const COLOR_OPTIONS = [
  { value: "text-amber-600 bg-amber-100",   label: "Dorado"  },
  { value: "text-blue-600 bg-blue-100",     label: "Azul"    },
  { value: "text-emerald-600 bg-emerald-100", label: "Verde"  },
  { value: "text-purple-600 bg-purple-100", label: "Morado"  },
  { value: "text-rose-600 bg-rose-100",     label: "Rosa"    },
  { value: "text-orange-600 bg-orange-100", label: "Naranja" },
  { value: "text-cyan-600 bg-cyan-100",     label: "Cian"    },
  { value: "text-indigo-600 bg-indigo-100", label: "Índigo"  },
];

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().slice(0, 16),
    end: sunday.toISOString().slice(0, 16),
  };
}

const blankAchievement = (): Partial<Achievement> => ({
  name: "", description: "", icon: "Award",
  color: "text-amber-600 bg-amber-100",
  xp_reward: 100, criteria_type: "maps_created", criteria_value: 1,
});

const blankChallenge = (): Partial<Challenge> => {
  const { start, end } = getWeekBounds();
  return {
    title: "", description: "", challenge_type: "maps_created",
    target_value: 3, xp_reward: 150, week_start: start, week_end: end, is_active: 1,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const [authUser] = useState(() => getAuthUser());
  const [section, setSection] = useState<"overview" | "achievements" | "challenges">("overview");

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges]     = useState<Challenge[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);

  // Modal logro
  const [achModal, setAchModal] = useState<Partial<Achievement> | null>(null);
  const [isNewAch, setIsNewAch] = useState(false);

  // Modal reto
  const [chalModal, setChalModal] = useState<Partial<Challenge> | null>(null);
  const [isNewChal, setIsNewChal] = useState(false);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };

  const handleFetch = useCallback(async (r: Response) => {
    if (r.status === 401) { logout(); navigate("/admin/login"); throw new Error("Sesión vencida"); }
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Error");
    return data;
  }, [navigate]);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/admin/achievements`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(handleFetch),
      fetch(`${API_URL}/admin/challenges`,   { headers: { Authorization: `Bearer ${getToken()}` } }).then(handleFetch),
      fetch(`${API_URL}/admin/stats`,        { headers: { Authorization: `Bearer ${getToken()}` } }).then(handleFetch),
    ])
      .then(([ach, chal, st]) => { setAchievements(ach); setChallenges(chal); setStats(st); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [handleFetch]);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      navigate("/admin/login");
      return;
    }
    fetchAll();
    // fetchAll y navigate son estables; solo ejecutar al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CRUD logros ─────────────────────────────────────────────────────────────

  const saveAchievement = async () => {
    if (!achModal?.name?.trim()) return toast.error("El nombre es obligatorio");
    if (!achModal?.criteria_type) return toast.error("Selecciona un criterio");
    try {
      const url    = isNewAch ? `${API_URL}/admin/achievements` : `${API_URL}/admin/achievements/${achModal.id}`;
      const method = isNewAch ? "POST" : "PUT";
      await fetch(url, { method, headers: authHeaders, body: JSON.stringify(achModal) }).then(handleFetch);
      toast.success(isNewAch ? "Logro creado con éxito" : "Logro actualizado");
      setAchModal(null);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteAchievement = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar el logro "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`${API_URL}/admin/achievements/${id}`, { method: "DELETE", headers: authHeaders }).then(handleFetch);
      toast.success("Logro eliminado");
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── CRUD retos ──────────────────────────────────────────────────────────────

  const saveChallenge = async () => {
    if (!chalModal?.title?.trim()) return toast.error("El título es obligatorio");
    if (!chalModal?.week_start || !chalModal?.week_end) return toast.error("Define las fechas del reto");
    try {
      const url    = isNewChal ? `${API_URL}/admin/challenges` : `${API_URL}/admin/challenges/${chalModal.id}`;
      const method = isNewChal ? "POST" : "PUT";
      await fetch(url, { method, headers: authHeaders, body: JSON.stringify(chalModal) }).then(handleFetch);
      toast.success(isNewChal ? "Reto creado con éxito" : "Reto actualizado");
      setChalModal(null);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteChallenge = async (id: number, title: string) => {
    if (!confirm(`¿Eliminar el reto "${title}"?`)) return;
    try {
      await fetch(`${API_URL}/admin/challenges/${id}`, { method: "DELETE", headers: authHeaders }).then(handleFetch);
      toast.success("Reto eliminado");
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleChallenge = async (c: Challenge) => {
    try {
      await fetch(`${API_URL}/admin/challenges/${c.id}`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ ...c, is_active: c.is_active ? 0 : 1 }),
      }).then(handleFetch);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  const criteriaLabel = (type: string) => CRITERIA_TYPES.find(c => c.value === type)?.label ?? type;

  const toUTC = (s: string) => s.includes('T') ? s : s.length === 10 ? s + 'T00:00:00Z' : s.replace(' ', 'T') + 'Z';
  const isActiveChallenge = (c: Challenge) => {
    const now = Date.now();
    return c.is_active === 1 && now >= new Date(toUTC(c.week_start)).getTime() && now <= new Date(toUTC(c.week_end)).getTime();
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white tracking-tight leading-none">Admin Panel</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">MindMap AI</p>
            </div>
          </div>
        </div>

        {/* Perfil admin */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-extrabold text-primary-foreground">
              {(authUser?.name ?? "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{authUser?.name ?? "Admin"}</p>
              <p className="text-[10px] text-slate-500 capitalize">{authUser?.role}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview",      label: "Resumen",          icon: BarChart3  },
            { id: "achievements",  label: "Logros",           icon: Trophy     },
            { id: "challenges",    label: "Retos Semanales",  icon: Calendar   },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                section === id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {section === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Botón salir */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">
              {section === "overview"     && "Resumen de la plataforma"}
              {section === "achievements" && "Gestión de Logros"}
              {section === "challenges"  && "Retos Semanales"}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {section === "overview"     && "Métricas globales de uso"}
              {section === "achievements" && "Define qué logros pueden desbloquear los usuarios"}
              {section === "challenges"   && "Crea y programa retos semanales con recompensas de XP"}
            </p>
          </div>
          {section === "achievements" && (
            <button
              onClick={() => { setAchModal(blankAchievement()); setIsNewAch(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-colors shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Nuevo logro
            </button>
          )}
          {section === "challenges" && (
            <button
              onClick={() => { setChalModal(blankChallenge()); setIsNewChal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-colors shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Nuevo reto
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-primary animate-spin" />
            </div>
          )}

          {/* ═══ OVERVIEW ═══ */}
          {!loading && section === "overview" && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Usuarios registrados", value: stats?.totalUsers   ?? 0, icon: Users,    color: "from-blue-600 to-blue-800",    bg: "bg-blue-500/10"    },
                  { label: "Mapas creados",         value: stats?.totalMaps    ?? 0, icon: Target,   color: "from-emerald-600 to-emerald-800", bg: "bg-emerald-500/10" },
                  { label: "Sesiones de estudio",   value: stats?.totalSessions ?? 0, icon: BookOpen, color: "from-purple-600 to-purple-800", bg: "bg-purple-500/10"  },
                  { label: "Quizzes completados",   value: stats?.totalQuizzes ?? 0, icon: Star,     color: "from-amber-600 to-amber-800",   bg: "bg-amber-500/10"   },
                  { label: "Retos activos",          value: stats?.activeChallenges ?? 0, icon: Zap, color: "from-rose-600 to-rose-800",    bg: "bg-rose-500/10"    },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl ${bg} border border-slate-800 flex flex-col gap-3`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-white">{value}</div>
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">{label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Resumen de logros y retos activos */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logros configurados */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" /> Logros configurados
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">{achievements.length} total</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {achievements.slice(0, 8).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${a.color}`}>
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{a.name}</p>
                          <p className="text-[10px] text-slate-500">{criteriaLabel(a.criteria_type)}: {a.criteria_value} · {a.xp_reward} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSection("achievements")} className="w-full mt-3 py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                    Ver todos <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Retos activos */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Retos activos esta semana
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">{challenges.filter(isActiveChallenge).length} activos</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {challenges.filter(isActiveChallenge).length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-semibold">No hay retos activos esta semana</p>
                        <button onClick={() => { setChalModal(blankChallenge()); setIsNewChal(true); setSection("challenges"); }}
                          className="mt-3 text-xs text-primary font-bold hover:underline">
                          Crear un reto →
                        </button>
                      </div>
                    ) : (
                      challenges.filter(isActiveChallenge).map((c) => (
                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{c.title}</p>
                            <p className="text-[10px] text-slate-400">{criteriaLabel(c.challenge_type)}: {c.target_value} · {c.xp_reward} XP</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                  <button onClick={() => setSection("challenges")} className="w-full mt-3 py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                    Gestionar retos <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LOGROS ═══ */}
          {!loading && section === "achievements" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Los logros se desbloquean automáticamente cuando un usuario cumple con el criterio definido. Se otorga el XP configurado al momento del desbloqueo.
              </p>

              {achievements.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
                  <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No hay logros configurados</p>
                  <button onClick={() => { setAchModal(blankAchievement()); setIsNewAch(true); }}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl">
                    <Plus className="w-4 h-4" /> Crear primer logro
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {achievements.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors group"
                    >
                      {/* Ícono */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                        <Award className="w-6 h-6" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{a.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{a.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                            <Target className="w-3 h-3" />
                            {criteriaLabel(a.criteria_type)}: <strong>{a.criteria_value}</strong>
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {a.xp_reward} XP
                          </span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setAchModal({ ...a }); setIsNewAch(false); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => deleteAchievement(a.id, a.name)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-950/40 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RETOS SEMANALES ═══ */}
          {!loading && section === "challenges" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Los retos semanales son objetivos temporales con recompensas de XP. Los estudiantes los ven en su dashboard durante el período activo.
              </p>

              {/* Retos activos primero */}
              {challenges.filter(isActiveChallenge).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Activos ahora
                  </h3>
                  <div className="grid gap-3">
                    {challenges.filter(isActiveChallenge).map(c => <ChallengeCard key={c.id} c={c} onEdit={() => { setChalModal({ ...c }); setIsNewChal(false); }} onDelete={deleteChallenge} onToggle={toggleChallenge} criteriaLabel={criteriaLabel} isActive />)}
                  </div>
                </div>
              )}

              {/* Resto de retos */}
              {challenges.filter(c => !isActiveChallenge(c)).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Otros retos</h3>
                  <div className="grid gap-3">
                    {challenges.filter(c => !isActiveChallenge(c)).map(c => <ChallengeCard key={c.id} c={c} onEdit={() => { setChalModal({ ...c }); setIsNewChal(false); }} onDelete={deleteChallenge} onToggle={toggleChallenge} criteriaLabel={criteriaLabel} isActive={false} />)}
                  </div>
                </div>
              )}

              {challenges.length === 0 && (
                <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No hay retos creados todavía</p>
                  <p className="text-xs text-slate-600 mt-1">Crea retos semanales para motivar a los estudiantes.</p>
                  <button onClick={() => { setChalModal(blankChallenge()); setIsNewChal(true); }}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl">
                    <Plus className="w-4 h-4" /> Crear primer reto
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══ MODAL LOGRO ═══ */}
      <AnimatePresence>
        {achModal && (
          <Modal title={isNewAch ? "Crear nuevo logro" : "Editar logro"} icon={<Trophy className="w-5 h-5 text-amber-400" />} onClose={() => setAchModal(null)}>
            <div className="space-y-4">
              <Field label="Nombre del logro *">
                <input value={achModal.name ?? ""} onChange={e => setAchModal(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej. Explorador" className={inputCls} />
              </Field>
              <Field label="Descripción">
                <input value={achModal.description ?? ""} onChange={e => setAchModal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Crea tu primer mapa conceptual" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Criterio de desbloqueo *">
                  <select value={achModal.criteria_type ?? "maps_created"} onChange={e => setAchModal(p => ({ ...p, criteria_type: e.target.value }))} className={inputCls}>
                    {CRITERIA_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </Field>
                <Field label="Valor objetivo *">
                  <input type="number" min={1} value={achModal.criteria_value ?? 1}
                    onChange={e => setAchModal(p => ({ ...p, criteria_value: Number(e.target.value) }))} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="XP de recompensa">
                  <input type="number" min={0} value={achModal.xp_reward ?? 0}
                    onChange={e => setAchModal(p => ({ ...p, xp_reward: Number(e.target.value) }))} className={inputCls} />
                </Field>
                <Field label="Ícono">
                  <select value={achModal.icon ?? "Award"} onChange={e => setAchModal(p => ({ ...p, icon: e.target.value }))} className={inputCls}>
                    {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Color">
                <select value={achModal.color ?? ""} onChange={e => setAchModal(p => ({ ...p, color: e.target.value }))} className={inputCls}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
            </div>
            <ModalFooter onCancel={() => setAchModal(null)} onSave={saveAchievement} label={isNewAch ? "Crear logro" : "Guardar cambios"} />
          </Modal>
        )}
      </AnimatePresence>

      {/* ═══ MODAL RETO ═══ */}
      <AnimatePresence>
        {chalModal && (
          <Modal title={isNewChal ? "Crear reto semanal" : "Editar reto"} icon={<Calendar className="w-5 h-5 text-primary" />} onClose={() => setChalModal(null)}>
            <div className="space-y-4">
              <Field label="Título del reto *">
                <input value={chalModal.title ?? ""} onChange={e => setChalModal(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej. Semana del Explorador" className={inputCls} />
              </Field>
              <Field label="Descripción">
                <input value={chalModal.description ?? ""} onChange={e => setChalModal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Crea 3 mapas esta semana" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de reto *">
                  <select value={chalModal.challenge_type ?? "maps_created"} onChange={e => setChalModal(p => ({ ...p, challenge_type: e.target.value }))} className={inputCls}>
                    {CRITERIA_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </Field>
                <Field label="Meta (cantidad)">
                  <input type="number" min={1} value={chalModal.target_value ?? 1}
                    onChange={e => setChalModal(p => ({ ...p, target_value: Number(e.target.value) }))} className={inputCls} />
                </Field>
              </div>
              <Field label="XP al completar">
                <input type="number" min={0} value={chalModal.xp_reward ?? 0}
                  onChange={e => setChalModal(p => ({ ...p, xp_reward: Number(e.target.value) }))} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de inicio">
                  <input type="datetime-local" value={chalModal.week_start ?? ""}
                    onChange={e => setChalModal(p => ({ ...p, week_start: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Fecha de fin">
                  <input type="datetime-local" value={chalModal.week_end ?? ""}
                    onChange={e => setChalModal(p => ({ ...p, week_end: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-800 border border-slate-700">
                <input type="checkbox" checked={chalModal.is_active === 1}
                  onChange={e => setChalModal(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-slate-300 font-medium">Reto activo (visible para los estudiantes)</span>
              </label>
            </div>
            <ModalFooter onCancel={() => setChalModal(null)} onSave={saveChallenge} label={isNewChal ? "Crear reto" : "Guardar cambios"} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, icon, children, onClose }: { title: string; icon: React.ReactNode; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">{icon}{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ModalFooter({ onCancel, onSave, label }: { onCancel: () => void; onSave: () => void; label: string }) {
  return (
    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
      <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
        Cancelar
      </button>
      <button onClick={onSave} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {label}
      </button>
    </div>
  );
}

function ChallengeCard({ c, onEdit, onDelete, onToggle, criteriaLabel, isActive }: {
  c: Challenge; onEdit: () => void; onDelete: (id: number, title: string) => void;
  onToggle: (c: Challenge) => void; criteriaLabel: (t: string) => string; isActive: boolean;
}) {
  const now = Date.now();
  const _toUTC = (s: string) => s.includes('T') ? s : s.length === 10 ? s + 'T00:00:00Z' : s.replace(' ', 'T') + 'Z';
  const past = now > new Date(_toUTC(c.week_end)).getTime();
  const upcoming = now < new Date(_toUTC(c.week_start)).getTime();

  return (
    <motion.div
      layout
      className={`flex items-center gap-5 p-5 rounded-2xl border transition-colors group ${
        isActive ? "bg-primary/5 border-primary/30" : "bg-slate-900 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary/15" : "bg-slate-800"}`}>
        <Calendar className={`w-6 h-6 ${isActive ? "text-primary" : "text-slate-500"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-white text-sm">{c.title}</p>
          {isActive && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Activo</span>}
          {past && !isActive && <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-[10px] font-bold rounded-full uppercase">Terminado</span>}
          {upcoming && <span className="px-2 py-0.5 bg-blue-900/60 text-blue-400 text-[10px] font-bold rounded-full uppercase">Próximamente</span>}
          {!isActive && !past && !upcoming && <span className="px-2 py-0.5 bg-slate-700 text-slate-500 text-[10px] font-bold rounded-full uppercase">Inactivo</span>}
        </div>
        {c.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.description}</p>}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            <Target className="w-3 h-3" /> {criteriaLabel(c.challenge_type)}: <strong>{c.target_value}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" /> {c.xp_reward} XP
          </span>
          <span className="text-[11px] text-slate-500">
            {new Date(_toUTC(c.week_start)).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} → {new Date(_toUTC(c.week_end)).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 items-center">
        <button onClick={() => onToggle(c)} title={c.is_active ? "Desactivar" : "Activar"}
          className={`p-2 rounded-xl transition-colors text-xs font-bold ${c.is_active ? "text-emerald-400 hover:bg-emerald-950/40" : "text-slate-500 hover:bg-slate-700 hover:text-white"}`}>
          {c.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> Editar
        </button>
        <button onClick={() => onDelete(c.id, c.title)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-950/40 rounded-xl transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </motion.div>
  );
}
