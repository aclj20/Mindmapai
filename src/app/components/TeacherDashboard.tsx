import { Link } from "react-router";
import {
  Brain,
  Users,
  TrendingUp,
  Trophy,
  BookOpen,
  Settings,
  Plus,
  BarChart3,
  Eye,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TeacherDashboard() {
  const classes = [
    { id: "1", name: "4to A - Ciencias", students: 28, activity: 94 },
    { id: "2", name: "4to B - Ciencias", students: 26, activity: 87 },
    { id: "3", name: "5to A - Biología", students: 24, activity: 91 },
  ];

  const topStudents = [
    { name: "María G.", points: 2840, level: 24, class: "4to A" },
    { name: "Carlos R.", points: 2512, level: 22, class: "4to B" },
    { name: "Laura S.", points: 1489, level: 15, class: "5to A" },
  ];

  const activityData = [
    { day: "Lun", mapas: 12, sesiones: 45 },
    { day: "Mar", mapas: 19, sesiones: 52 },
    { day: "Mié", mapas: 15, sesiones: 48 },
    { day: "Jue", mapas: 22, sesiones: 61 },
    { day: "Vie", mapas: 18, sesiones: 55 },
    { day: "Sáb", mapas: 8, sesiones: 23 },
    { day: "Dom", mapas: 5, sesiones: 15 },
  ];

  const recentAssignments = [
    {
      id: "1",
      title: "Sistema Solar - Evaluación",
      class: "4to A",
      completed: 23,
      total: 28,
      dueDate: "Mañana",
    },
    {
      id: "2",
      title: "Ciclo del Agua",
      class: "4to B",
      completed: 18,
      total: 26,
      dueDate: "En 3 días",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">
              MindMap AI - Docente
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/groups"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline">Grupos</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Trophy className="w-5 h-5" />
              <span className="hidden md:inline">Rankings</span>
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

      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Panel de Docente
          </h1>
          <p className="text-gray-300">
            Supervisa el progreso y actividad de tus estudiantes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-cyan-500/20"
              >
                <Users className="w-8 h-8 text-cyan-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">78</div>
                <div className="text-sm text-gray-300">
                  Estudiantes activos
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/20"
              >
                <Brain className="w-8 h-8 text-purple-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">234</div>
                <div className="text-sm text-gray-300">
                  Mapas esta semana
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-500/20"
              >
                <TrendingUp className="w-8 h-8 text-emerald-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">91%</div>
                <div className="text-sm text-gray-300">
                  Participación promedio
                </div>
              </motion.div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">
                Actividad Semanal
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="mapas" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  <Bar
                    dataKey="sesiones"
                    fill="#a855f7"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-gray-300">Mapas creados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-300">Sesiones de estudio</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Asignaciones Recientes
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 transition-all">
                  <Plus className="w-4 h-4" />
                  Nueva asignación
                </button>
              </div>

              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {assignment.class}
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400">
                        Vence: {assignment.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(assignment.completed / assignment.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-300 whitespace-nowrap">
                        {assignment.completed}/{assignment.total} completado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Top Estudiantes
              </h3>
              <div className="space-y-3">
                {topStudents.map((student, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          i === 0
                            ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                            : i === 1
                              ? "bg-gradient-to-br from-gray-400 to-slate-500"
                              : "bg-gradient-to-br from-orange-600 to-orange-700"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.class} • Nivel {student.level}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cyan-400">
                          {student.points}
                        </div>
                        <div className="text-xs text-gray-400">puntos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Mis Clases</h3>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <Link
                    key={cls.id}
                    to={`/groups?class=${cls.id}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{cls.name}</h4>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{cls.students} estudiantes</span>
                      <span className="text-emerald-400">
                        {cls.activity}% activo
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full mt-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva clase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
