import { Link, useNavigate } from "react-router";
import {
  Brain,
  Users,
  TrendingUp,
  Trophy,
  Settings,
  Plus,
  Eye,
  LogOut,
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
import { getAuthUser, getAvatarInitials, logout } from "../hooks/useAuth";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      <nav className="p-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                MindMap AI <span className="text-purple-600 font-medium">Docente</span>
              </span>
              {authUser && (
                <p className="text-xs text-gray-500 leading-none mt-0.5">
                  {authUser.name} · {authUser.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/groups"
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium text-sm"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline">Grupos</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium text-sm"
            >
              <Trophy className="w-5 h-5" />
              <span className="hidden md:inline">Rankings</span>
            </Link>
            <Link
              to="/settings"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors font-medium text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            ¡Hola, {authUser?.name ?? "Docente"}!
          </h1>
          <p className="text-gray-500 font-medium">
            Supervisa el progreso y actividad de tus estudiantes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col"
              >
                <Users className="w-8 h-8 text-blue-500 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">78</div>
                <div className="text-sm text-gray-500 font-medium">
                  Estudiantes activos
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col"
              >
                <Brain className="w-8 h-8 text-purple-500 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">234</div>
                <div className="text-sm text-gray-500 font-medium">
                  Mapas esta semana
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col"
              >
                <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">91%</div>
                <div className="text-sm text-gray-500 font-medium">
                  Participación promedio
                </div>
              </motion.div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Actividad Semanal
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#111827",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="mapas" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar
                    dataKey="sesiones"
                    fill="#c4b5fd"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-6 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="text-gray-600">Mapas creados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-300" />
                  <span className="text-gray-600">Sesiones de estudio</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Asignaciones Recientes
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Nueva asignación
                </button>
              </div>

              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-purple-200 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {assignment.title}
                        </h4>
                        <p className="text-sm font-medium text-purple-600">
                          {assignment.class}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Vence: {assignment.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(assignment.completed / assignment.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                        {assignment.completed}/{assignment.total} completado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Estudiantes
              </h3>
              <div className="space-y-3">
                {topStudents.map((student, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                          i === 0
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : i === 1
                              ? "bg-gray-200 text-gray-700 border border-gray-300"
                              : "bg-orange-100 text-orange-800 border border-orange-200"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {student.name}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {student.class} • Nivel {student.level}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          {student.points.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-gray-500">puntos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Mis Clases</h3>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <Link
                    key={cls.id}
                    to={`/groups?class=${cls.id}`}
                    className="block p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{cls.name}</h4>
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-gray-500">{cls.students} estudiantes</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {cls.activity}% activo
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
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
