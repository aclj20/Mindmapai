import { Link, useLocation } from "react-router";
import { Home, Users, PlusCircle, Trophy, User } from "lucide-react";
import { motion } from "motion/react";

export default function MobileNav() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Inicio" },
    { path: "/communities", icon: Users, label: "Comunidades" },
    { path: "/map/create", icon: PlusCircle, label: "Crear", highlight: true },
    { path: "/leaderboard", icon: Trophy, label: "Ranking" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-subtle rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10">
                {item.highlight ? (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center -mt-8 shadow-xl shadow-primary/20 border border-primary/50 ring-4 ring-background">
                    <item.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                ) : (
                  <item.icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                )}
              </div>
              {!item.highlight && (
                <span
                  className={`relative z-10 text-[10px] font-bold transition-colors uppercase tracking-tight ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
