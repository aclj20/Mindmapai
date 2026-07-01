import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Trophy, Star, Flame, TrendingUp, Calendar,
  Edit2, Camera, Save, X, User, FileText, CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import MobileNav from "./MobileNav";
import { getAuthUser, getAvatarInitials, getToken } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

interface UserData {
  level: number; xp: number; xp_to_next: number; streak: number;
  total_points: number; created_at: string; maps_created: number;
  study_sessions: number; avatar_url?: string; bio?: string; name?: string;
}

interface Achievement {
  name: string; icon: string; description: string; xp_reward: number;
  unlocked: boolean; criteria_type: string; criteria_value: number; progress: number;
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  Trophy, Star, Flame, TrendingUp,
  Award: Trophy, Target: Star, Zap: Flame, Crown: Trophy,
  BookOpen: Star, Users: TrendingUp,
};

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}Z`);
  if (Number.isNaN(date.getTime())) return "—";
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}


export default function ProfilePage() {
  const authUser = getAuthUser();
  const [userData, setUserData]     = useState<UserData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);

  // Modal de edición
  const [editOpen, setEditOpen]           = useState(false);
  const [editName, setEditName]           = useState("");
  const [editBio, setEditBio]             = useState("");
  const [pendingFile, setPendingFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    fetch(`${API_URL}/users/me`, { headers })
      .then((r) => r.json())
      .then((data: UserData) => setUserData(data))
      .catch(() => {});

    fetch(`${API_URL}/achievements`, { headers })
      .then((r) => r.json())
      .then((data: Achievement[]) => setAchievements(data))
      .catch(() => {});

    fetch(`${API_URL}/maps/my`, { headers })
      .then((r) => r.json())
      .then((data: { node_count?: number }[]) =>
        setTotalNodes(data.reduce((sum, m) => sum + (m.node_count ?? 0), 0))
      )
      .catch(() => {});
  }, []);

  const openEdit = () => {
    setEditName(userData?.name ?? authUser?.name ?? "");
    setEditBio(userData?.bio ?? "");
    setPendingFile(null);
    setRemoveAvatar(false);
    setAvatarPreview(userData?.avatar_url ?? null);
    setEditOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("La imagen no puede superar 5 MB");
    setPendingFile(file);
    setRemoveAvatar(false);
    // Preview local sin subir aún
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  };

  const handleSave = async () => {
    if (!editName.trim()) return toast.error("El nombre no puede estar vacío");
    setSaving(true);
    try {
      let newAvatarUrl: string | null = removeAvatar ? null : (userData?.avatar_url ?? null);

      // 1. Subir foto a S3 si el usuario eligió una nueva
      if (pendingFile) {
        const form = new FormData();
        form.append("avatar", pendingFile);
        const r = await fetch(`${API_URL}/upload/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: form,
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message);
        newAvatarUrl = data.url;
      }

      // 2. Guardar nombre, bio y la URL resultante
      const r = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: editName.trim(), bio: editBio.trim() || null, avatar_url: newAvatarUrl }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);

      // Sincronizar localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...parsed, name: data.user.name, avatar_url: data.user.avatar_url }));
      }

      setUserData((prev) => prev ? { ...prev, name: data.user.name, bio: data.user.bio, avatar_url: data.user.avatar_url } : prev);
      toast.success("Perfil actualizado correctamente");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const displayName   = userData?.name ?? authUser?.name ?? "Usuario";
  const displayAvatar = userData?.avatar_url ?? null;
  const initials      = getAvatarInitials(displayName);
  const xp            = userData?.xp ?? 0;
  const xpToNext      = userData?.xp_to_next ?? 1000;
  const xpPercent     = xpToNext > 0 ? (xp / xpToNext) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans overflow-x-hidden">
      <nav className="p-4 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Mi Perfil</h1>
        </div>
      </nav>

      <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Tarjeta principal ── */}
          <div className="p-4 sm:p-8 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-4 sm:gap-6 mb-6">
              {/* Avatar */}
              <div className="relative shrink-0 group">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20 shadow-md" />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl sm:text-3xl font-bold border-4 border-primary/20">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1 tracking-tight truncate">
                  {displayName}
                </h2>
                <p className="text-muted-foreground mb-1 font-medium text-sm">{authUser?.email}</p>
                {userData?.bio && (
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{userData.bio}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Calendar className="w-4 h-4" />
                  Miembro desde {formatJoinDate(userData?.created_at)}
                </div>
              </div>

              {/* Botón editar */}
              <button onClick={openEdit}
                className="hover:cursor-pointer px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2 font-semibold text-sm shrink-0">
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar perfil</span>
              </button>
            </div>

            {/* XP bar */}
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between text-sm font-semibold text-foreground">
                <span>Nivel {userData?.level ?? 1}</span>
                <span className="text-muted-foreground">{xp} / {xpToNext} XP</span>
              </div>
              <Progress.Root className="relative h-2.5 overflow-hidden rounded-full bg-muted" value={xpPercent}>
                <Progress.Indicator
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ transform: `translateX(-${100 - xpPercent}%)` }}
                />
              </Progress.Root>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
            {[
              { icon: Flame, color: "text-orange-500", value: userData?.streak ?? 0, label: "Días de racha" },
              { icon: Trophy, color: "text-amber-500", value: (userData?.total_points ?? 0).toLocaleString(), label: "Puntos totales" },
              { icon: Star, color: "text-primary", value: totalNodes, label: "Conceptos dominados" },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="p-3 sm:p-6 rounded-2xl bg-card border border-border shadow-sm">
                <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${color} mb-2 sm:mb-3`} />
                <div className="text-xl sm:text-3xl font-bold text-foreground mb-1">{value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Logros ── */}
          <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-5">Logros</h3>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay logros configurados aún</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((a, i) => {
                  const Icon = BADGE_ICONS[a.icon] ?? Trophy;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border flex items-center gap-4 ${a.unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border opacity-70"}`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.unlocked ? "bg-primary/15" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${a.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-foreground truncate">{a.name}</h4>
                          {a.unlocked
                            ? <span className="text-[10px] text-emerald-500 font-bold shrink-0 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Logrado</span>
                            : <span className="text-[10px] text-amber-500 font-semibold shrink-0">+{a.xp_reward} XP</span>
                          }
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>
                        {!a.unlocked && (
                          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, (a.progress / a.criteria_value) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Estadísticas ── */}
          <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-5">Estadísticas</h3>
            <div className="space-y-3">
              {[
                { label: "Mapas creados", value: userData?.maps_created ?? 0 },
                { label: "Sesiones de estudio", value: userData?.study_sessions ?? 0 },
                { label: "Conceptos dominados", value: totalNodes },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground font-medium text-sm">{label}</span>
                  <span className="font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════ MODAL EDICIÓN ══════════════ */}
      <AnimatePresence>
        {editOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" /> Editar perfil
                </h2>
                <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-primary/20">
                        {getAvatarInitials(editName || displayName)}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    <Camera className="w-3.5 h-3.5" /> Cambiar foto de perfil
                  </button>
                  {avatarPreview && (
                    <button onClick={() => { setAvatarPreview(null); setPendingFile(null); setRemoveAvatar(true); }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Quitar foto
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <p className="text-[11px] text-muted-foreground">JPG, PNG o GIF · máx 5 MB</p>
                </div>

                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nombre completo
                  </label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm font-medium placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Biografía <span className="font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Cuéntanos algo sobre ti..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-foreground text-sm font-medium placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setEditOpen(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                    : <><Save className="w-4 h-4" /> Guardar cambios</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
