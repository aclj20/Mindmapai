import { Link } from "react-router";
import {
  ArrowLeft,
  Trophy,
  Star,
  Flame,
  Award,
  Target,
  Zap,
  Crown,
  Heart,
  BookOpen,
  Users,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

export default function AchievementsPage() {
  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const achievements = [
    {
      icon: Trophy,
      name: "Explorador",
      desc: "Crea tu primer mapa conceptual",
      color: "from-amber-500 to-yellow-500",
      unlocked: true,
      date: "15 Mar 2026",
      xp: 100,
    },
    {
      icon: Star,
      name: "Creador Pro",
      desc: "Crea 20 mapas conceptuales",
      color: "from-cyan-500 to-blue-500",
      unlocked: true,
      date: "28 Abr 2026",
      xp: 500,
    },
    {
      icon: Flame,
      name: "Racha 7 días",
      desc: "Mantén una racha de 7 días consecutivos",
      color: "from-red-500 to-pink-500",
      unlocked: true,
      date: "2 May 2026",
      xp: 300,
    },
    {
      icon: Award,
      name: "Top 10",
      desc: "Entra al top 10 del leaderboard",
      color: "from-purple-500 to-pink-500",
      unlocked: true,
      date: "5 May 2026",
      xp: 400,
    },
    {
      icon: Target,
      name: "Maestro de conceptos",
      desc: "Domina 500 conceptos",
      color: "from-emerald-500 to-teal-500",
      unlocked: false,
      progress: 312,
      total: 500,
      xp: 800,
    },
    {
      icon: Zap,
      name: "Velocista",
      desc: "Crea un mapa en menos de 5 minutos",
      color: "from-yellow-500 to-orange-500",
      unlocked: false,
      xp: 200,
    },
    {
      icon: Crown,
      name: "Rey del leaderboard",
      desc: "Alcanza el #1 en tu clase",
      color: "from-amber-500 to-yellow-500",
      unlocked: false,
      xp: 1000,
    },
    {
      icon: Heart,
      name: "Popular",
      desc: "Recibe 100 me gusta en tus mapas",
      color: "from-pink-500 to-rose-500",
      unlocked: false,
      progress: 34,
      total: 100,
      xp: 300,
    },
    {
      icon: BookOpen,
      name: "Erudito",
      desc: "Completa 100 sesiones de estudio",
      color: "from-indigo-500 to-purple-500",
      unlocked: false,
      progress: 47,
      total: 100,
      xp: 600,
    },
    {
      icon: Users,
      name: "Colaborador",
      desc: "Comenta en 50 mapas de otros",
      color: "from-teal-500 to-cyan-500",
      unlocked: false,
      progress: 12,
      total: 50,
      xp: 400,
    },
    {
      icon: TrendingUp,
      name: "Imparable",
      desc: "Mantén una racha de 30 días",
      color: "from-orange-500 to-red-500",
      unlocked: false,
      progress: 7,
      total: 30,
      xp: 1500,
    },
  ];

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
    totalXp: achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xp, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Logros</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-md border border-amber-500/20 mb-8"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {stats.unlocked}/{stats.total}
              </div>
              <div className="text-gray-300">Logros desbloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                {stats.totalXp}
              </div>
              <div className="text-gray-300">XP de logros</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {Math.round((stats.unlocked / stats.total) * 100)}%
              </div>
              <div className="text-gray-300">Completado</div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={achievement.unlocked ? handleCelebrate : undefined}
              className={`p-6 rounded-2xl backdrop-blur-md border transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:scale-105 cursor-pointer"
                  : "bg-white/5 border-white/10 opacity-60"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-4 mx-auto ${
                  !achievement.unlocked && "grayscale"
                }`}
              >
                <achievement.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-2">
                {achievement.name}
              </h3>
              <p className="text-sm text-gray-400 text-center mb-4">
                {achievement.desc}
              </p>

              {achievement.unlocked ? (
                <div className="text-center">
                  <div className="text-xs text-emerald-400 mb-1">
                    ✓ Desbloqueado
                  </div>
                  <div className="text-xs text-gray-500">{achievement.date}</div>
                  <div className="mt-3 inline-block px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 text-xs font-semibold">
                    +{achievement.xp} XP
                  </div>
                </div>
              ) : achievement.progress !== undefined ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${achievement.color} transition-all`}
                      style={{
                        width: `${(achievement.progress! / achievement.total!) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {achievement.xp} XP al desbloquear
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    🔒 Bloqueado
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {achievement.xp} XP al desbloquear
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
