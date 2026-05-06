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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Users className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Mis Grupos</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Grupos activos</h2>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 transition-all flex items-center gap-2">
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
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {group.name}
                    </h3>
                    <p className="text-gray-400">{group.teacher}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Tu posición</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      #{group.myRank}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Estudiantes</span>
                    </div>
                    <div className="font-bold text-white">{group.students}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Actividad</span>
                    </div>
                    <div className="font-bold text-emerald-400">
                      {group.activity}%
                    </div>
                  </div>
                  <div>
                    <Link
                      to={`/leaderboard?group=${group.id}`}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 transition-all text-sm inline-block"
                    >
                      Ver ranking
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Top de mi clase
              </h3>
              <div className="space-y-3">
                {classmates.map((student, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      student.isMe
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          student.rank === 1
                            ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                            : student.rank === 2
                              ? "bg-gradient-to-br from-gray-400 to-slate-500"
                              : student.rank === 3
                                ? "bg-gradient-to-br from-orange-600 to-orange-700"
                                : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                      >
                        {student.rank}
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          student.isMe
                            ? "bg-gradient-to-br from-cyan-500 to-purple-500"
                            : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {student.name}
                          {student.isMe && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.points} puntos
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/20">
              <h3 className="text-xl font-bold text-white mb-3">
                🎯 Desafío de clase
              </h3>
              <p className="text-gray-300 mb-4">
                La clase con más mapas creados esta semana gana una insignia especial
              </p>
              <div className="text-sm text-gray-400">
                Tu clase: <span className="text-white font-bold">23 mapas</span>
              </div>
              <div className="text-sm text-gray-400">
                Líder: <span className="text-amber-400 font-bold">4to B (31 mapas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
