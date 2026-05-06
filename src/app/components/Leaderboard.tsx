import { Link } from "react-router";
import { Trophy, Medal, Crown, TrendingUp, Flame, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";

export default function Leaderboard() {
  const topPlayers = [
    {
      rank: 1,
      name: "María González",
      avatar: "MG",
      points: 28540,
      level: 24,
      streak: 21,
      badges: 45,
      growth: "+2.4k",
    },
    {
      rank: 2,
      name: "Carlos Ruiz",
      avatar: "CR",
      points: 25120,
      level: 22,
      streak: 15,
      badges: 38,
      growth: "+1.8k",
    },
    {
      rank: 3,
      name: "Alex García",
      avatar: "AG",
      points: 15240,
      level: 12,
      streak: 7,
      badges: 21,
      growth: "+890",
      isCurrentUser: true,
    },
    {
      rank: 4,
      name: "Laura Sánchez",
      avatar: "LS",
      points: 14890,
      level: 15,
      streak: 12,
      badges: 28,
      growth: "+1.2k",
    },
    {
      rank: 5,
      name: "Diego Martínez",
      avatar: "DM",
      points: 13650,
      level: 14,
      streak: 9,
      badges: 24,
      growth: "+750",
    },
    {
      rank: 6,
      name: "Sofia Torres",
      avatar: "ST",
      points: 12340,
      level: 13,
      streak: 6,
      badges: 19,
      growth: "+620",
    },
    {
      rank: 7,
      name: "Miguel Ángel",
      avatar: "MA",
      points: 11890,
      level: 12,
      streak: 8,
      badges: 22,
      growth: "+580",
    },
    {
      rank: 8,
      name: "Ana Belén",
      avatar: "AB",
      points: 10450,
      level: 11,
      streak: 5,
      badges: 17,
      growth: "+490",
    },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-gray-400 font-semibold">#{rank}</span>;
  };

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
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <Tabs.Root defaultValue="weekly" className="space-y-6">
          <Tabs.List className="flex gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 w-fit">
            <Tabs.Trigger
              value="weekly"
              className="px-6 py-2 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500"
            >
              Semanal
            </Tabs.Trigger>
            <Tabs.Trigger
              value="monthly"
              className="px-6 py-2 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500"
            >
              Mensual
            </Tabs.Trigger>
            <Tabs.Trigger
              value="alltime"
              className="px-6 py-2 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500"
            >
              Todo el tiempo
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="weekly" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {topPlayers.slice(0, 3).map((player, i) => (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-2xl backdrop-blur-md border ${
                    player.rank === 1
                      ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/30"
                      : player.rank === 2
                        ? "bg-gradient-to-br from-gray-400/20 to-slate-500/20 border-gray-400/30"
                        : "bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-600/30"
                  }`}
                >
                  <div className="text-center">
                    <div className="inline-flex mb-4">{getRankIcon(player.rank)}</div>
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                        player.rank === 1
                          ? "from-amber-500 to-yellow-500"
                          : player.rank === 2
                            ? "from-gray-400 to-slate-500"
                            : "from-orange-600 to-orange-700"
                      } flex items-center justify-center text-white text-xl font-bold mx-auto mb-4`}
                    >
                      {player.avatar}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {player.name}
                    </h3>
                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
                      {player.points.toLocaleString()}
                    </div>
                    <div className="flex justify-center gap-4 text-sm text-gray-300">
                      <div>Nivel {player.level}</div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        {player.streak}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="space-y-3">
                {topPlayers.slice(3).map((player, i) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + 3) * 0.05 }}
                    className={`p-4 rounded-xl transition-all ${
                      player.isCurrentUser
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        {getRankIcon(player.rank)}
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          player.isCurrentUser
                            ? "bg-gradient-to-br from-cyan-500 to-purple-500"
                            : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                      >
                        {player.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">
                          {player.name}
                          {player.isCurrentUser && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                              Tú
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Nivel {player.level} • {player.badges} badges
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {player.points.toLocaleString()}
                        </div>
                        <div className="text-sm text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {player.growth}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame className="w-4 h-4" />
                        <span className="font-semibold">{player.streak}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="monthly">
            <div className="p-12 text-center text-gray-400">
              Ranking mensual próximamente...
            </div>
          </Tabs.Content>

          <Tabs.Content value="alltime">
            <div className="p-12 text-center text-gray-400">
              Ranking histórico próximamente...
            </div>
          </Tabs.Content>
        </Tabs.Root>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-cyan-500/20">
            <Trophy className="w-8 h-8 text-cyan-400 mb-3" />
            <div className="text-2xl font-bold text-white mb-1">127</div>
            <div className="text-sm text-gray-300">Participantes activos</div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/20">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
            <div className="text-2xl font-bold text-white mb-1">+23%</div>
            <div className="text-sm text-gray-300">
              Crecimiento esta semana
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/20">
            <Flame className="w-8 h-8 text-orange-400 mb-3" />
            <div className="text-2xl font-bold text-white mb-1">456</div>
            <div className="text-sm text-gray-300">Mapas creados</div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
