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
      colors: ['#7C3AED', '#8B5CF6', '#A78BFA'] // Purple theme confetti
    });
  };

  const achievements = [
    {
      icon: Trophy,
      name: "Explorador",
      desc: "Crea tu primer mapa conceptual",
      color: "text-amber-500 bg-amber-100",
      unlocked: true,
      date: "15 Mar 2026",
      xp: 100,
    },
    {
      icon: Star,
      name: "Creador Pro",
      desc: "Crea 20 mapas conceptuales",
      color: "text-blue-500 bg-blue-100",
      unlocked: true,
      date: "28 Abr 2026",
      xp: 500,
    },
    {
      icon: Flame,
      name: "Racha 7 días",
      desc: "Mantén una racha de 7 días consecutivos",
      color: "text-rose-500 bg-rose-100",
      unlocked: true,
      date: "2 May 2026",
      xp: 300,
    },
    {
      icon: Award,
      name: "Top 10",
      desc: "Entra al top 10 del leaderboard",
      color: "text-fuchsia-500 bg-fuchsia-100",
      unlocked: true,
      date: "5 May 2026",
      xp: 400,
    },
    {
      icon: Target,
      name: "Maestro de conceptos",
      desc: "Domina 500 conceptos",
      color: "text-teal-500 bg-teal-100",
      unlocked: false,
      progress: 312,
      total: 500,
      xp: 800,
    },
    {
      icon: Zap,
      name: "Velocista",
      desc: "Crea un mapa en menos de 5 minutos",
      color: "text-orange-500 bg-orange-100",
      unlocked: false,
      xp: 200,
    },
    {
      icon: Crown,
      name: "Rey del leaderboard",
      desc: "Alcanza el #1 en tu clase",
      color: "text-amber-600 bg-amber-100",
      unlocked: false,
      xp: 1000,
    },
    {
      icon: Heart,
      name: "Popular",
      desc: "Recibe 100 me gusta en tus mapas",
      color: "text-pink-500 bg-pink-100",
      unlocked: false,
      progress: 34,
      total: 100,
      xp: 300,
    },
    {
      icon: BookOpen,
      name: "Erudito",
      desc: "Completa 100 sesiones de estudio",
      color: "text-indigo-500 bg-indigo-100",
      unlocked: false,
      progress: 47,
      total: 100,
      xp: 600,
    },
    {
      icon: Users,
      name: "Colaborador",
      desc: "Comenta en 50 mapas de otros",
      color: "text-cyan-600 bg-cyan-100",
      unlocked: false,
      progress: 12,
      total: 50,
      xp: 400,
    },
    {
      icon: TrendingUp,
      name: "Imparable",
      desc: "Mantén una racha de 30 días",
      color: "text-red-500 bg-red-100",
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      <nav className="p-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
            <Trophy className="w-4 h-4 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Logros</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-purple-50 border border-purple-100 shadow-sm mb-8"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-900 mb-1">
                {stats.unlocked}/{stats.total}
              </div>
              <div className="text-purple-700 font-medium text-sm">Logros desbloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">
                {stats.totalXp}
              </div>
              <div className="text-purple-700 font-medium text-sm">XP de logros</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-900 mb-1">
                {Math.round((stats.unlocked / stats.total) * 100)}%
              </div>
              <div className="text-purple-700 font-medium text-sm">Completado</div>
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
              className={`p-6 rounded-xl border transition-all ${
                achievement.unlocked
                  ? "bg-white border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md cursor-pointer group"
                  : "bg-gray-50 border-gray-200 opacity-70 grayscale"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${achievement.color} shadow-sm ${
                  achievement.unlocked ? "group-hover:scale-110 transition-transform" : ""
                }`}
              >
                <achievement.icon className="w-8 h-8" />
              </div>

              <h3 className={`text-xl font-bold text-center mb-2 ${achievement.unlocked ? "text-gray-900" : "text-gray-500"}`}>
                {achievement.name}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4 font-medium">
                {achievement.desc}
              </p>

              {achievement.unlocked ? (
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-600 mb-1 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">
                    ✓ Desbloqueado
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">{achievement.date}</div>
                  <div className="mt-3 inline-block px-3 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">
                    +{achievement.xp} XP
                  </div>
                </div>
              ) : achievement.progress !== undefined ? (
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                    <span>Progreso</span>
                    <span>
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${achievement.color.split(' ')[1]}`}
                      style={{
                        width: `${(achievement.progress! / achievement.total!) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-400 text-center mt-3 border-t border-gray-100 pt-2">
                    {achievement.xp} XP al desbloquear
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500">
                    🔒 Bloqueado
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-2 border-t border-gray-100 pt-2">
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
