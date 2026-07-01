import { Link } from "react-router";
import { Heart, MessageCircle, Eye, Brain, TrendingUp, Star, Filter, Search } from "lucide-react";
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
      color: "bg-primary-subtle text-primary border-primary/10",
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
      color: "bg-muted text-muted-foreground border-border",
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
      color: "bg-muted text-muted-foreground border-border",
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
      color: "bg-muted text-muted-foreground border-border",
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
      color: "bg-muted text-muted-foreground border-border",
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
      color: "bg-muted text-muted-foreground border-border",
      nodes: 36,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans text-foreground overflow-x-hidden">
      <nav className="sticky top-0 z-40 p-4 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              Comunidad
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar mapas, temas o autores..." 
                className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard/student"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/map/create"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all shadow-sm"
            >
              Crear mapa
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        <Tabs.Root defaultValue="trending" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs.List className="flex gap-1 sm:gap-2 p-1 rounded-xl bg-card border border-border shadow-sm w-full sm:w-auto overflow-x-auto">
              <Tabs.Trigger
                value="trending"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary-subtle data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Tendencias
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="popular"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary-subtle data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Populares
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="recent"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary-subtle data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Recientes
                </div>
              </Tabs.Trigger>
            </Tabs.List>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-foreground font-semibold hover:bg-muted transition-all shadow-sm">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Filtros</span>
            </button>
          </div>

          <Tabs.Content value="trending" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityMaps.map((map, i) => (
                <motion.div
                  key={map.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden flex flex-col"
                >
                  <Link to={`/map/${map.id}`} className="block flex-1">
                    <div className={`aspect-[16/9] w-full ${map.color} flex items-center justify-center relative border-b border-border`}>
                       <Brain className="w-12 h-12 opacity-30" />
                       <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <span className="px-4 py-2 bg-card rounded-lg text-sm font-semibold text-foreground shadow-sm border border-border">Ver mapa</span>
                       </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap mb-2">
                        {map.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
                        {map.title}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                          {map.avatar}
                        </div>
                        <span className="text-sm text-muted-foreground font-semibold">
                          {map.author}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="px-4 py-3 border-t border-border bg-muted flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleLike(map.id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors font-bold ${
                          likedMaps.has(map.id)
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${likedMaps.has(map.id) ? "fill-current" : ""}`}
                        />
                        <span>
                          {map.likes + (likedMaps.has(map.id) ? 1 : 0)}
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{map.comments}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground font-bold">
                         <Eye className="w-3 h-3" />
                         {map.views}
                      </div>
                      <div className="font-bold text-muted-foreground/60">
                        {map.nodes} nodos
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="popular">
            <div className="text-center py-24 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              Mapas populares próximamente...
            </div>
          </Tabs.Content>

          <Tabs.Content value="recent">
            <div className="text-center py-24 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              Mapas recientes próximamente...
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
      <MobileNav />
    </div>
  );
}
