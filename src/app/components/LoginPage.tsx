import { useState } from "react";
import { useNavigate } from "react-router";
import { Brain, GraduationCap, User } from "lucide-react";
import { motion } from "motion/react";

const API_URL = "http://localhost:3001/api";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ocurrió un error");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "student") {
        navigate("/dashboard/student");
      } else {
        navigate("/dashboard/teacher");
      }
    } catch {
      setError("No se pudo conectar al servidor. ¿Está el backend corriendo?");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
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
                    <GraduationCap
                      className={`w-6 h-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div
                      className={`text-sm font-bold ${role === "student" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      Estudiante
                    </div>
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
                    <User
                      className={`w-6 h-6 ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div
                      className={`text-sm font-bold ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      Docente
                    </div>
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                  placeholder="Tu nombre completo"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm"
            >
              {loading
                ? "Cargando..."
                : isLogin
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
