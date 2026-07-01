import { useState } from "react";
import { useNavigate } from "react-router";
import { X, Brain, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "register";

export default function LoginModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm";

  function resetState() {
    setStep(1); setError(""); setName(""); setEmail(""); setCode(""); setPassword("");
  }

  function saveAndSucceed(data: { token: string; user: object }) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    onSuccess();
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      saveAndSucceed(data);
    } catch { setError("No se pudo conectar al servidor."); }
    finally { setLoading(false); }
  };

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-verification`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      setStep(2);
    } catch { setError("No se pudo conectar al servidor."); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Código inválido"); return; }
      setStep(3);
    } catch { setError("No se pudo conectar al servidor."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Ocurrió un error"); return; }
      saveAndSucceed(data);
    } catch { setError("No se pudo conectar al servidor."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">MindMap AI</span>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); resetState(); }}
                className={`cursor-pointer flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Barra de progreso registro */}
          {mode === "register" && (
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${s <= step ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* LOGIN */}
            {mode === "login" && (
              <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Contraseña</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                  <button type="button"
                    onClick={() => { onClose(); navigate("/login"); }}
                    className="cursor-pointer mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading}
                  className="cursor-pointer w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Cargando..." : "Iniciar sesión"}
                </button>
              </motion.form>
            )}

            {/* REGISTRO paso 1 */}
            {mode === "register" && step === 1 && (
              <motion.form key="reg1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSendCode} className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Paso 1 de 3 · Datos básicos</p>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre completo</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading}
                  className="cursor-pointer w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Enviando..." : "Enviar código de verificación"}
                </button>
              </motion.form>
            )}

            {/* REGISTRO paso 2 */}
            {mode === "register" && step === 2 && (
              <motion.form key="reg2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Paso 2 de 3 · Verificar correo</p>
                <div className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3 border border-border">
                  Enviamos un código a <span className="font-semibold text-foreground">{email}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Código</label>
                  <input type="text" required value={code} maxLength={6}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} tracking-[0.5em] text-center text-xl font-bold`}
                    placeholder="123456" />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading || code.length !== 6}
                  className="cursor-pointer w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
                <button type="button" onClick={() => { setStep(1); setError(""); setCode(""); }}
                  className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </motion.form>
            )}

            {/* REGISTRO paso 3 */}
            {mode === "register" && step === 3 && (
              <motion.form key="reg3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleRegister} className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Paso 3 de 3 · Contraseña</p>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Elige una contraseña</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className={inputClass} placeholder="••••••••" minLength={6} />
                </div>
                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading}
                  className="cursor-pointer w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors shadow-sm">
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
                <button type="button" onClick={() => { setStep(2); setError(""); }}
                  className="cursor-pointer w-full py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
