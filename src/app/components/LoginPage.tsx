import { useState } from "react";
import { useNavigate } from "react-router";
import { Brain, GraduationCap, User } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "student") {
      navigate("/dashboard/student");
    } else {
      navigate("/dashboard/teacher");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Brain className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Bienvenido" : "Crear cuenta"}
          </h1>
          <p className="text-gray-400">
            {isLogin
              ? "Inicia sesión para continuar"
              : "Regístrate y comienza a aprender"}
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-3">
                  Selecciona tu rol
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === "student"
                        ? "border-cyan-500 bg-cyan-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                    <div className="text-white">Estudiante</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      role === "teacher"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <User className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <div className="text-white">Docente</div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all shadow-lg"
            >
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
