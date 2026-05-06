import { Link } from "react-router";
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

export default function ProfilePage() {
  const user = {
    name: "Alex García",
    email: "alex.garcia@email.com",
    avatar: "AG",
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    streak: 7,
    totalPoints: 15240,
    joinDate: "15 Feb 2026",
    mapsCreated: 23,
    studySessions: 47,
    conceptsMastered: 312,
  };

  const achievements = [
    { icon: Trophy, name: "Explorador", desc: "Crea tu primer mapa", unlocked: true },
    { icon: Star, name: "Creador Pro", desc: "Crea 20 mapas", unlocked: true },
    { icon: Flame, name: "Racha 7 días", desc: "Mantén una racha de 7 días", unlocked: true },
    { icon: TrendingUp, name: "Imparable", desc: "Racha de 30 días", unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 pb-20 md:pb-0">
      <nav className="p-3 md:p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-1">
                  {user.name}
                </h2>
                <p className="text-gray-300 mb-2">{user.email}</p>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Miembro desde {user.joinDate}
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Nivel {user.level}</span>
                <span>
                  {user.xp} / {user.xpToNext} XP
                </span>
              </div>
              <Progress.Root
                className="relative h-4 overflow-hidden rounded-full bg-white/10"
                value={(user.xp / user.xpToNext) * 100}
              >
                <Progress.Indicator
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{
                    transform: `translateX(-${100 - (user.xp / user.xpToNext) * 100}%)`,
                  }}
                />
              </Progress.Root>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <Flame className="w-8 h-8 text-orange-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {user.streak}
              </div>
              <div className="text-sm text-gray-400">Días de racha</div>
            </div>
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <Trophy className="w-8 h-8 text-amber-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {user.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Puntos totales</div>
            </div>
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <Star className="w-8 h-8 text-cyan-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {user.conceptsMastered}
              </div>
              <div className="text-sm text-gray-400">Conceptos dominados</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Logros</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30"
                      : "bg-white/5 border-white/10 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-cyan-500 to-purple-500"
                          : "bg-gray-600"
                      }`}
                    >
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-400">{achievement.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link
              to="/achievements"
              className="mt-4 block text-center text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todos los logros →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">
              Estadísticas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Mapas creados</span>
                <span className="font-bold text-white">{user.mapsCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Sesiones de estudio</span>
                <span className="font-bold text-white">{user.studySessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Conceptos dominados</span>
                <span className="font-bold text-white">
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
