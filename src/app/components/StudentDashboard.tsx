import { Link } from "react-router";
import {
  Brain,
  Trophy,
  Star,
  TrendingUp,
  Flame,
  Award,
  Plus,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { motion } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import MobileNav from "./MobileNav";

export default function StudentDashboard() {
  const user = {
    name: "Alex García",
    avatar: "AG",
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    streak: 7,
    totalPoints: 15240,
    rank: 3,
  };

  const badges = [
    { icon: Trophy, name: "Explorador", color: "from-amber-500 to-orange-500" },
    { icon: Star, name: "Creador Pro", color: "from-cyan-500 to-blue-500" },
    { icon: Flame, name: "Racha 7 días", color: "from-red-500 to-pink-500" },
    { icon: Award, name: "Top 10", color: "from-purple-500 to-pink-500" },
  ];

  const recentMaps = [
    {
      id: "1",
      title: "Sistema Solar",
      concepts: 24,
      lastEdit: "Hace 2 horas",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "2",
      title: "Revolución Francesa",
      concepts: 31,
      lastEdit: "Ayer",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      title: "Ciclo del Agua",
      concepts: 18,
      lastEdit: "Hace 3 días",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  const stats = [
    { label: "Mapas creados", value: "23", icon: Brain },
    { label: "Sesiones de estudio", value: "47", icon: TrendingUp },
    { label: "Conceptos dominados", value: "312", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 pb-20 md:pb-0">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-7 h-7 md:w-8 md:h-8 text-cyan-400" />
            <span className="text-lg md:text-xl font-bold text-white">MindMap AI</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Trophy className="w-5 h-5" />
              <span>Leaderboard</span>
            </Link>
            <Link
              to="/groups"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Grupos</span>
            </Link>
            <Link
              to="/settings"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-white/10"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-lg md:text-xl font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      ¡Hola, {user.name}!
                    </h2>
                    <p className="text-sm md:text-base text-gray-300">
                      Nivel {user.level} • Top #{user.rank}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="hidden md:block px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                >
                  Ver perfil
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>
                    {user.xp} / {user.xpToNext} XP
                  </span>
                  <span>Nivel {user.level + 1}</span>
                </div>
                <Progress.Root
                  className="relative h-3 overflow-hidden rounded-full bg-white/10"
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

              <div className="flex gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="flex-1 p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-400 mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {user.streak}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Días de racha</div>
                </div>
                <div className="flex-1 p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400 mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">Puntos totales</div>
                </div>
              </div>
            </motion.div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Tus mapas recientes
                </h3>
                <Link
                  to="/map/create"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Crear mapa
                </Link>
              </div>

              <div className="space-y-4">
                {recentMaps.map((map) => (
                  <Link
                    key={map.id}
                    to={`/map/${map.id}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${map.color} flex items-center justify-center`}
                      >
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">
                          {map.title}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {map.concepts} conceptos • {map.lastEdit}
                        </p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10"
                >
                  <stat.icon className="w-6 h-6 text-cyan-400 mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                Logros desbloqueados
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl bg-gradient-to-br ${badge.color} flex flex-col items-center justify-center`}
                  >
                    <badge.icon className="w-8 h-8 text-white mb-2" />
                    <span className="text-xs text-white text-center">
                      {badge.name}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Link
                to="/achievements"
                className="mt-4 block text-center text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver todos los logros
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/20">
              <h3 className="text-xl font-bold text-white mb-4">
                🎯 Desafío semanal
              </h3>
              <p className="text-gray-300 mb-4">
                Crea 5 mapas conceptuales esta semana
              </p>
              <Progress.Root
                className="relative h-3 overflow-hidden rounded-full bg-white/10"
                value={60}
              >
                <Progress.Indicator
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ transform: "translateX(-40%)" }}
                />
              </Progress.Root>
              <p className="text-sm text-gray-400 mt-2">3 de 5 completados</p>
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
