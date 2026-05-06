import { Link } from "react-router";
import { ArrowLeft, Users, Plus, TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";

export default function GroupsPage() {
  const groups = [
    {
      id: "1",
      name: "4to A - Ciencias Naturales",
      teacher: "Prof. Martínez",
      students: 28,
      myRank: 3,
      activity: 94,
    },
    {
      id: "2",
      name: "Club de Biología",
      teacher: "Prof. García",
      students: 15,
      myRank: 7,
      activity: 87,
    },
  ];

  const classmates = [
    { name: "María González", rank: 1, points: 2840, avatar: "MG" },
    { name: "Carlos Ruiz", rank: 2, points: 2512, avatar: "CR" },
    { name: "Alex García", rank: 3, points: 1524, avatar: "AG", isMe: true },
    { name: "Laura Sánchez", rank: 4, points: 1489, avatar: "LS" },
    { name: "Diego Martínez", rank: 5, points: 1365, avatar: "DM" },
  ];

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
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Mis Grupos</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Grupos activos</h2>
              <button className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm font-medium text-sm">
                <Plus className="w-4 h-4" />
                Unirse a grupo
              </button>
            </div>

            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-purple-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-gray-500 font-medium">{group.teacher}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 font-medium mb-1">Tu posición</div>
                    <div className="text-2xl font-bold text-purple-600 tracking-tight">
                      #{group.myRank}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Estudiantes</span>
                    </div>
                    <div className="font-bold text-gray-900">{group.students}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Actividad</span>
                    </div>
                    <div className="font-bold text-emerald-600">
                      {group.activity}%
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      to={`/leaderboard?group=${group.id}`}
                      className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-colors text-sm font-medium shadow-sm"
                    >
                      Ver ranking
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top de mi clase
              </h3>
              <div className="space-y-3">
                {classmates.map((student, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border transition-colors ${
                      student.isMe
                        ? "bg-purple-50 border-purple-200"
                        : "bg-gray-50/50 border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                          student.rank === 1
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : student.rank === 2
                              ? "bg-gray-200 text-gray-700 border border-gray-300"
                              : student.rank === 3
                                ? "bg-orange-100 text-orange-800 border border-orange-200"
                                : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {student.rank}
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                          student.isMe
                            ? "bg-purple-600"
                            : "bg-purple-200 text-purple-800"
                        }`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {student.name}
                          {student.isMe && (
                            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {student.points.toLocaleString()} puntos
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
              <h3 className="text-lg font-bold text-orange-900 mb-3">
                🎯 Desafío de clase
              </h3>
              <p className="text-orange-800/80 mb-4 text-sm font-medium leading-relaxed">
                La clase con más mapas creados esta semana gana una insignia especial.
              </p>
              <div className="text-sm font-medium text-orange-800 mb-1">
                Tu clase: <span className="font-bold text-orange-900">23 mapas</span>
              </div>
              <div className="text-sm font-medium text-orange-800">
                Líder: <span className="font-bold text-orange-900">4to B (31 mapas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
