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
    if (rank === 1) return <Crown className="w-6 h-6 text-amber-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-gray-500 font-semibold text-lg">#{rank}</span>;
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
          <Trophy className="w-6 h-6 text-amber-500" />
          <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-5xl">
        <Tabs.Root defaultValue="weekly" className="space-y-6">
          <Tabs.List className="flex gap-2 p-1 rounded-md bg-white border border-gray-200 shadow-sm w-fit mx-auto md:mx-0">
            <Tabs.Trigger
              value="weekly"
              className="px-6 py-2 rounded text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              Semanal
            </Tabs.Trigger>
            <Tabs.Trigger
              value="monthly"
              className="px-6 py-2 rounded text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              Mensual
            </Tabs.Trigger>
            <Tabs.Trigger
              value="alltime"
              className="px-6 py-2 rounded text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              Todo el tiempo
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="weekly" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6 pt-4">
              {topPlayers.slice(0, 3).map((player, i) => (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-xl border relative shadow-sm ${
                    player.rank === 1
                      ? "bg-amber-50 border-amber-200 shadow-amber-100 md:-translate-y-4"
                      : player.rank === 2
                        ? "bg-gray-100 border-gray-200"
                        : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="inline-flex mb-4 p-2 bg-white rounded-full shadow-sm">
                      {getRankIcon(player.rank)}
                    </div>
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-sm ${
                        player.rank === 1
                          ? "bg-amber-500"
                          : player.rank === 2
                            ? "bg-gray-400"
                            : "bg-orange-500"
                      }`}
                    >
                      {player.avatar}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {player.name}
                    </h3>
                    <div className="text-3xl font-bold text-purple-600 mb-4 tracking-tight">
                      {player.points.toLocaleString()}
                    </div>
                    <div className="flex justify-center gap-4 text-sm text-gray-600 font-medium">
                      <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">Nivel {player.level}</div>
                      <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {player.streak}
                      </div>
                    </div>
                  </div>
                  {player.rank === 1 && <div className="absolute -top-3 -right-3 text-2xl">🏆</div>}
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {topPlayers.slice(3).map((player, i) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + 3) * 0.05 }}
                    className={`p-4 transition-all hover:bg-gray-50 ${
                      player.isCurrentUser
                        ? "bg-purple-50/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center text-gray-500 font-bold">
                        {getRankIcon(player.rank)}
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          player.isCurrentUser
                            ? "bg-purple-600"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {player.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">
                          {player.name}
                          {player.isCurrentUser && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              Tú
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          Nivel {player.level} • {player.badges} insignias
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {player.points.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600 flex items-center gap-1 font-medium justify-end">
                          <TrendingUp className="w-3 h-3" />
                          {player.growth}
                        </div>
                      </div>
                      <div className="w-16 flex items-center justify-end gap-1 text-orange-500 font-bold">
                        <Flame className="w-4 h-4" />
                        {player.streak}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="monthly">
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              Ranking mensual próximamente...
            </div>
          </Tabs.Content>

          <Tabs.Content value="alltime">
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              Ranking histórico próximamente...
            </div>
          </Tabs.Content>
        </Tabs.Root>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-blue-500 mb-3" />
            <div className="text-3xl font-bold text-blue-900 mb-1">127</div>
            <div className="text-sm text-blue-600 font-medium">Participantes activos</div>
          </div>
          <div className="p-6 rounded-xl bg-purple-50 border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold text-purple-900 mb-1">+23%</div>
            <div className="text-sm text-purple-600 font-medium">
              Crecimiento esta semana
            </div>
          </div>
          <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center">
            <Flame className="w-8 h-8 text-orange-500 mb-3" />
            <div className="text-3xl font-bold text-orange-900 mb-1">456</div>
            <div className="text-sm text-orange-600 font-medium">Mapas creados</div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
