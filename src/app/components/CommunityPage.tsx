import { Link } from "react-router";
import { Heart, MessageCircle, Eye, Brain, TrendingUp, Star, Filter } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";

export default function CommunityPage() {
  const [likedMaps, setLikedMaps] = useState<Set<string>>(new Set());

  const toggleLike = (mapId: string) => {
    setLikedMaps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mapId)) {
        newSet.delete(mapId);
      } else {
        newSet.add(mapId);
      }
      return newSet;
    });
  };

  const communityMaps = [
    {
      id: "1",
      title: "Sistema Solar Completo",
      author: "María González",
      avatar: "MG",
      likes: 342,
      comments: 28,
      views: 1240,
      tags: ["Ciencia", "Astronomía"],
      preview: "from-blue-500 via-cyan-500 to-purple-500",
      nodes: 24,
    },
    {
      id: "2",
      title: "Revolución Francesa",
      author: "Carlos Ruiz",
      avatar: "CR",
      likes: 289,
      comments: 45,
      views: 980,
      tags: ["Historia", "Europa"],
      preview: "from-red-500 via-orange-500 to-yellow-500",
      nodes: 31,
    },
    {
      id: "3",
      title: "Fotosíntesis",
      author: "Laura Sánchez",
      avatar: "LS",
      likes: 234,
      comments: 19,
      views: 756,
      tags: ["Biología", "Plantas"],
      preview: "from-green-500 via-emerald-500 to-teal-500",
      nodes: 18,
    },
    {
      id: "4",
      title: "Estructura del ADN",
      author: "Diego Martínez",
      avatar: "DM",
      likes: 412,
      comments: 52,
      views: 1580,
      tags: ["Biología", "Genética"],
      preview: "from-purple-500 via-pink-500 to-red-500",
      nodes: 27,
    },
    {
      id: "5",
      title: "Guerra Mundial II",
      author: "Ana Belén",
      avatar: "AB",
      likes: 198,
      comments: 34,
      views: 892,
      tags: ["Historia", "Conflictos"],
      preview: "from-gray-600 via-gray-500 to-gray-700",
      nodes: 42,
    },
    {
      id: "6",
      title: "Tabla Periódica",
      author: "Miguel Ángel",
      avatar: "MA",
      likes: 367,
      comments: 41,
      views: 1120,
      tags: ["Química", "Elementos"],
      preview: "from-indigo-500 via-violet-500 to-purple-500",
      nodes: 36,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 md:pb-0">
      <nav className="sticky top-0 z-40 p-3 md:p-4 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-7 h-7 text-cyan-400" />
            <span className="text-xl font-semibold text-white">
              Community Maps
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard/student"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/map/create"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Crear mapa
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs.Root defaultValue="trending" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs.List className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
              <Tabs.Trigger
                value="trending"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="popular"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Popular
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="recent"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Recientes
              </Tabs.Trigger>
            </Tabs.List>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtros</span>
            </button>
          </div>

          <Tabs.Content value="trending" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityMaps.map((map, i) => (
                <motion.div
                  key={map.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <Link to={`/map/${map.id}`} className="block">
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/20 transition-all mb-4">
                      <div
                        className={`aspect-[4/3] bg-gradient-to-br ${map.preview} opacity-20 relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"
                              style={{
                                left: `${20 + Math.random() * 60}%`,
                                top: `${20 + Math.random() * 60}%`,
                              }}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                          {[...Array(12)].map((_, i) => (
                            <svg
                              key={i}
                              className="absolute w-full h-full"
                              style={{
                                left: `${Math.random() * 20 - 10}%`,
                                top: `${Math.random() * 20 - 10}%`,
                              }}
                            >
                              <line
                                x1={`${20 + Math.random() * 30}%`}
                                y1={`${20 + Math.random() * 30}%`}
                                x2={`${50 + Math.random() * 30}%`}
                                y2={`${50 + Math.random() * 30}%`}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                              />
                            </svg>
                          ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          {map.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm text-xs text-white border border-white/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/map/${map.id}`}
                          className="text-white font-semibold hover:text-cyan-400 transition-colors line-clamp-1"
                        >
                          {map.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {map.avatar}
                          </div>
                          <span className="text-sm text-gray-400">
                            {map.author}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleLike(map.id);
                          }}
                          className={`flex items-center gap-1 transition-colors ${
                            likedMaps.has(map.id)
                              ? "text-pink-400"
                              : "text-gray-500 hover:text-gray-400"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${likedMaps.has(map.id) ? "fill-current" : ""}`}
                          />
                          <span>
                            {map.likes + (likedMaps.has(map.id) ? 1 : 0)}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageCircle className="w-4 h-4" />
                          <span>{map.comments}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span>{map.views}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {map.nodes} nodos
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="popular">
            <div className="text-center py-20 text-gray-500">
              Mapas populares próximamente...
            </div>
          </Tabs.Content>

          <Tabs.Content value="recent">
            <div className="text-center py-20 text-gray-500">
              Mapas recientes próximamente...
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
      <MobileNav />
    </div>
  );
}
