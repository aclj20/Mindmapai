import { Link, useLocation } from "react-router";
import { Home, Compass, PlusCircle, Trophy, User } from "lucide-react";
import { motion } from "motion/react";

export default function MobileNav() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard/student", icon: Home, label: "Inicio" },
    { path: "/community", icon: Compass, label: "Explorar" },
    { path: "/map/create", icon: PlusCircle, label: "Crear", highlight: true },
    { path: "/leaderboard", icon: Trophy, label: "Ranking" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-white/10">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                {item.highlight ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center -mt-6 shadow-lg shadow-purple-500/50">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <item.icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-cyan-400" : "text-gray-500"
                    }`}
                  />
                )}
              </div>
              {!item.highlight && (
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-cyan-400" : "text-gray-500"
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
