import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const r = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json();

      if (!r.ok) throw new Error(data.message || "Credenciales inválidas");

      // Verificar que el usuario tiene rol de admin o teacher
      if (data.user.role !== "admin" && data.user.role !== "teacher") {
        throw new Error("No tienes permisos de administrador para acceder a este panel.");
      }

      // Guardar sesión
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      {/* Fondo con patrón sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Badge de acceso restringido */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Acceso Restringido — Solo Administradores
          </div>
        </div>

        {/* Card del login */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Panel Administrativo</h1>
                <p className="text-sm text-slate-500 font-medium mt-0.5">MindMap AI</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ingresa con tu cuenta de administrador para gestionar logros, retos semanales y configuración de la plataforma.
            </p>
          </div>

          {/* Formulario */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-800/50 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-medium leading-snug">{error}</p>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mindmapai.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando acceso...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Acceder al Panel
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-medium"
            >
              ← Volver al inicio de sesión de estudiantes
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          MindMap AI · Panel de Administración · Acceso exclusivo
        </p>
      </motion.div>
    </div>
  );
}
