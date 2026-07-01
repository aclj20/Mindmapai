import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Brain, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API_URL = "http://localhost:3001/api";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("next") || "/dashboard";

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm";

  function resetState() {
    setStep(1);
    setError("");
    setName("");
    setEmail("");
    setCode("");
    setPassword("");
    setResetDone(false);
  }

  function goTo(m: Mode) {
    resetState();
    setMode(m);
  }

  // ── Login ────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(redirectTo, { replace: true });
    } catch {
      setError("No se pudo conectar al servidor. ¿Está el backend corriendo?");
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ─────────────────────────────────────────────────────────────

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      setStep(2);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Código inválido"); return; }
      setStep(3);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(redirectTo, { replace: true });
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación de contraseña ────────────────────────────────────────────

  const handleForgotSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      setStep(2);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      setResetDone(true);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ── Títulos ───────────────────────────────────────────────────────────────

  const title = mode === "login" ? "Bienvenido" : mode === "register" ? "Crea tu cuenta" : "Recuperar contraseña";
  const subtitle =
    mode === "login"
      ? "Inicia sesión para continuar"
      : mode === "register"
      ? "Regístrate y comienza a mapear"
      : "Te enviaremos un código para restablecer tu contraseña";

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
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">{title}</h1>
          <p className="text-muted-foreground font-medium">{subtitle}</p>
        </div>

        {mode === "register" && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${s <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        )}

        {mode === "forgot" && !resetDone && (
          <div className="flex gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${s <= step ? "bg-violet-500" : "bg-border"}`}
              />
            ))}
          </div>
        )}

        <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
          <AnimatePresence mode="wait">

            {/* ── LOGIN ── */}
            {mode === "login" && (
              <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                  <button type="button" onClick={() => goTo("forgot")} className="cursor-pointer mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Cargando..." : "Iniciar sesión"}
                </button>
              </motion.form>
            )}

            {/* ── REGISTRO paso 1 ── */}
            {mode === "register" && step === 1 && (
              <motion.form key="reg1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSendCode} className="space-y-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mt-2">Paso 1 de 3 · Datos básicos</p>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre completo</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Enviando..." : "Enviar código de verificación"}
                </button>
              </motion.form>
            )}

            {/* ── REGISTRO paso 2 ── */}
            {mode === "register" && step === 2 && (
              <motion.form key="reg2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleVerifyCode} className="space-y-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mt-2">Paso 2 de 3 · Verificar correo</p>
                <div className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3 border border-border">
                  Enviamos un código a <span className="font-semibold text-foreground">{email}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Código de verificación</label>
                  <input type="text" required value={code} maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${inputClass} tracking-[0.5em] text-center text-xl font-bold`} placeholder="123456" />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading || code.length !== 6} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
                <button type="button" onClick={() => { setStep(1); setError(""); setCode(""); }} className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver y cambiar email
                </button>
              </motion.form>
            )}

            {/* ── REGISTRO paso 3 ── */}
            {mode === "register" && step === 3 && (
              <motion.form key="reg3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleRegister} className="space-y-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mt-2">Paso 3 de 3 · Contraseña</p>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Elige una contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" minLength={6} />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
                <button type="button" onClick={() => { setStep(2); setError(""); }} className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </motion.form>
            )}

            {/* ── RECUPERAR paso 1 ── */}
            {mode === "forgot" && !resetDone && step === 1 && (
              <motion.form key="forgot1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleForgotSend} className="space-y-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mt-2">Paso 1 de 2 · Ingresa tu correo</p>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email de tu cuenta</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Enviando..." : "Enviar código de recuperación"}
                </button>
                <button type="button" onClick={() => goTo("login")} className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                </button>
              </motion.form>
            )}

            {/* ── RECUPERAR paso 2 ── */}
            {mode === "forgot" && !resetDone && step === 2 && (
              <motion.form key="forgot2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} className="space-y-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -mt-2">Paso 2 de 2 · Nueva contraseña</p>
                <div className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3 border border-border">
                  Enviamos un código a <span className="font-semibold text-foreground">{email}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Código de recuperación</label>
                  <input type="text" required value={code} maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${inputClass} tracking-[0.5em] text-center text-xl font-bold`} placeholder="123456" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nueva contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" minLength={6} />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading || code.length !== 6} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Actualizando..." : "Restablecer contraseña"}
                </button>
                <button type="button" onClick={() => { setStep(1); setError(""); setCode(""); setPassword(""); }} className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </motion.form>
            )}

            {/* ── RECUPERAR éxito ── */}
            {mode === "forgot" && resetDone && (
              <motion.div key="forgot-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">¡Contraseña actualizada!</h3>
                <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button onClick={() => goTo("login")} className="cursor-pointer w-full py-2.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-sm">
                  Ir al inicio de sesión
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Switch login/register ── */}
          {mode !== "forgot" && (
            <div className="mt-6 text-center">
              <button onClick={() => goTo(mode === "login" ? "register" : "login")} className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
