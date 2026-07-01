import { Link, useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Trophy, Flame, Star, MapPin, Heart, Eye,
  BookOpen, LayoutGrid, Award, Lock,
} from "lucide-react";
import { motion } from "motion/react";
import MobileNav from "./MobileNav";
import { getAvatarInitials, getToken, getAuthUser } from "../hooks/useAuth";
import * as LucideIcons from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Achievement {
  id: number; name: string; description: string;
  icon: string; color: string; xp_reward: number; unlocked_at: string;
}
interface PublicMap {
  id: number; public_id: string; title: string;
  node_count: number; like_count: number; view_count: number; updated_at: string;
}
interface PublicUser {
  id: number; name: string; avatar_url: string | null; bio: string | null;
  level: number; xp: number; xp_to_next: number; streak: number;
  total_points: number; created_at: string;
  achievements: Achievement[];
  maps: PublicMap[];
  stats: { maps_public: number; maps_total: number; total_likes: number };
}

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Trophy;
  return <Icon className={className} />;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = getToken();
  const authUser = getAuthUser();

  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"achievements" | "maps">("achievements");

  useEffect(() => {
    // Si el id es el propio usuario, redirigir al perfil propio
    if (authUser && String(authUser.id) === id) {
      navigate("/profile", { replace: true });
      return;
    }
    if (!id || !token) return;
    fetch(`${API_URL}/users/${id}/public`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.id) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token, authUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <p className="text-lg font-bold text-foreground">Usuario no encontrado</p>
          <Link to="/dashboard" className="text-sm text-primary mt-2 inline-block">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const initials = getAvatarInitials(user.name);
  const _utc = (s: string) => s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
  const memberSince = new Date(_utc(user.created_at)).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const xpPct = Math.min(100, Math.round((user.xp / user.xp_to_next) * 100));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans text-foreground">
      {/* Nav */}
      <nav className="p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-bold text-foreground tracking-tight">Perfil</h1>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl p-4 md:p-6 space-y-5">
        {/* Tarjeta de perfil */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Fondo decorativo */}
          <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          <div className="px-6 pb-6 -mt-12">
            {/* Avatar */}
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-extrabold border-4 border-card shadow-md">
                {initials}
              </div>
            )}
            <div className="mt-3">
              <h2 className="text-xl font-extrabold text-foreground">{user.name}</h2>
              {user.bio && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{user.bio}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-semibold flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Miembro desde {memberSince}</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {user.streak} días de racha</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Nivel", value: user.level, icon: <Star className="w-4 h-4 text-amber-500" /> },
                { label: "Logros", value: user.achievements.length, icon: <Trophy className="w-4 h-4 text-primary" /> },
                { label: "Me gustas", value: user.stats.total_likes, icon: <Heart className="w-4 h-4 text-rose-500" /> },
              ].map(s => (
                <div key={s.label} className="bg-muted/50 border border-border rounded-xl px-3 py-3 text-center">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="text-lg font-extrabold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Barra de XP */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                <span>Nivel {user.level}</span>
                <span>{user.xp.toLocaleString()} / {user.xp_to_next.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "achievements", label: "Logros", icon: Award },
            { id: "maps", label: `Mapas (${user.stats.maps_public})`, icon: BookOpen },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all relative ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-4 h-4" /> {t.label}
                {active && <motion.div layoutId="pub-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
              </button>
            );
          })}
        </div>

        {/* Logros */}
        {tab === "achievements" && (
          <div>
            {user.achievements.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Sin logros desbloqueados aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.achievements.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                      <AchievementIcon name={a.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(_utc(a.unlocked_at)).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-amber-500">+{a.xp_reward}</p>
                      <p className="text-[9px] text-muted-foreground font-bold">XP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mapas públicos */}
        {tab === "maps" && (
          <div>
            {user.maps.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No hay mapas públicos</p>
                {user.stats.maps_total > 0 && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Este usuario tiene {user.stats.maps_total} mapa{user.stats.maps_total !== 1 ? "s" : ""} pero ninguno es público
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.maps.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <Link to={`/map/${m.public_id}`}
                      className="block p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <LayoutGrid className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-rose-400" /> {m.like_count}</span>
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {m.view_count}</span>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.node_count} nodos · {new Date(_utc(m.updated_at)).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
