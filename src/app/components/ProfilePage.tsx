import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Star,
  Flame,
  TrendingUp,
  Calendar,
  Edit,
} from "lucide-react";
import { motion } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import MobileNav from "./MobileNav";
import { getAuthUser, getAvatarInitials, getToken } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

interface UserData {
  level: number;
  xp: number;
  xp_to_next: number;
  streak: number;
  total_points: number;
  created_at: string;
  maps_created: number;
  study_sessions: number;
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}Z`);
  if (Number.isNaN(date.getTime())) return "—";
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProfilePage() {
  const authUser = getAuthUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalNodes, setTotalNodes] = useState(0);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    fetch(`${API_URL}/users/me`, { headers })
      .then((r) => r.json())
      .then(setUserData)
      .catch(() => {});

    fetch(`${API_URL}/maps/my`, { headers })
      .then((r) => r.json())
      .then((data: { node_count?: number }[]) =>
        setTotalNodes(data.reduce((sum, m) => sum + (m.node_count ?? 0), 0))
      )
      .catch(() => {});
  }, []);

  const xp = userData?.xp ?? 0;
  const xpToNext = userData?.xp_to_next ?? 1000;
  const xpPercent = xpToNext > 0 ? (xp / xpToNext) * 100 : 0;

  const user = {
    name: authUser?.name ?? "Usuario",
    email: authUser?.email ?? "",
    avatar: authUser ? getAvatarInitials(authUser.name) : "?",
    level: userData?.level ?? 1,
    xp,
    xpToNext,
    streak: userData?.streak ?? 0,
    totalPoints: userData?.total_points ?? 0,
    joinDate: formatJoinDate(userData?.created_at),
    mapsCreated: userData?.maps_created ?? 0,
    studySessions: userData?.study_sessions ?? 0,
    conceptsMastered: totalNodes,
  };

  const achievements = [
    { icon: Trophy, name: "Explorador", desc: "Crea tu primer mapa", unlocked: true },
    { icon: Star, name: "Creador Pro", desc: "Crea 20 mapas", unlocked: true },
    { icon: Flame, name: "Racha 7 días", desc: "Mantén una racha de 7 días", unlocked: true },
    { icon: TrendingUp, name: "Imparable", desc: "Racha de 30 días", unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      <nav className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-8 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-bold border border-purple-200 z-10">
                {user.avatar}
              </div>
              <div className="flex-1 z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                  {user.name}
                </h2>
                <p className="text-gray-500 mb-2 font-medium">{user.email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                  <Calendar className="w-4 h-4" />
                  Miembro desde {user.joinDate}
                </div>
              </div>
              <button className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm z-10">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            </div>

            <div className="space-y-3 z-10 relative">
              <div className="flex justify-between text-sm font-semibold text-gray-700">
                <span>Nivel {user.level}</span>
                <span className="text-gray-500">
                  {user.xp} / {user.xpToNext} XP
                </span>
              </div>
              <Progress.Root
                className="relative h-2.5 overflow-hidden rounded-full bg-gray-100"
                value={xpPercent}
              >
                <Progress.Indicator
                  className="h-full bg-purple-600 transition-all duration-500 rounded-full"
                  style={{
                    transform: `translateX(-${100 - xpPercent}%)`,
                  }}
                />
              </Progress.Root>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Flame className="w-8 h-8 text-orange-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {user.streak}
              </div>
              <div className="text-sm text-gray-500 font-medium">Días de racha</div>
            </div>
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Trophy className="w-8 h-8 text-amber-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {user.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 font-medium">Puntos totales</div>
            </div>
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Star className="w-8 h-8 text-purple-600 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {user.conceptsMastered}
              </div>
              <div className="text-sm text-gray-500 font-medium">Conceptos dominados</div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Logros</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    achievement.unlocked
                      ? "bg-purple-50 border-purple-100 shadow-sm"
                      : "bg-gray-50 border-gray-200 opacity-60 grayscale"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked
                          ? "bg-purple-100"
                          : "bg-gray-200"
                      }`}
                    >
                      <achievement.icon className={`w-6 h-6 ${achievement.unlocked ? "text-purple-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${achievement.unlocked ? "text-gray-900" : "text-gray-500"}`}>
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-500">{achievement.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link
              to="/achievements"
              className="mt-6 block text-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Ver todos los logros &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Estadísticas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Mapas creados</span>
                <span className="font-bold text-gray-900">{user.mapsCreated}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Sesiones de estudio</span>
                <span className="font-bold text-gray-900">{user.studySessions}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Conceptos dominados</span>
                <span className="font-bold text-purple-600">
                  {user.conceptsMastered}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <MobileNav />
    </div>
  );
}
