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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-subtle flex items-center justify-center mx-auto mb-4 border border-primary/10">
             <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {isLogin ? "Bienvenido" : "Crea tu cuenta"}
          </h1>
          <p className="text-muted-foreground font-medium">
            {isLogin
              ? "Inicia sesión para continuar"
              : "Regístrate y comienza a mapear"}
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-[10px]">
                  SELECCIONA TU ROL
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                      role === "student"
                        ? "border-primary bg-primary-subtle shadow-sm ring-4 ring-primary/5"
                        : "border-border bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <GraduationCap className={`w-6 h-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`text-sm font-bold ${role === "student" ? "text-primary" : "text-muted-foreground"}`}>Estudiante</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                      role === "teacher"
                        ? "border-primary bg-primary-subtle shadow-sm ring-4 ring-primary/5"
                        : "border-border bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <User className={`w-6 h-6 ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`text-sm font-bold ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`}>Docente</div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Tu nombre completo"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-sm"
            >
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
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
