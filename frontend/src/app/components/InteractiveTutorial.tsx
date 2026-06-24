import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain, Plus, MousePointer2, Trophy, Award, ArrowRight, X, Check, Sparkles, BookOpen, Users
} from "lucide-react";
import { getToken } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

interface TutorialStep {
  id: number;
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  highlight: string;
  tip: string;
  color: string;
  bgColor: string;
}

const STEPS: TutorialStep[] = [
  {
    id: 1,
    icon: <Brain className="w-8 h-8" />,
    emoji: "🧠",
    title: "Bienvenido a MindMap AI",
    description: "Crea mapas conceptuales inteligentes con inteligencia artificial. Aprende de forma visual y efectiva.",
    highlight: "Convierte cualquier tema en un mapa conceptual en segundos.",
    tip: "El aprendizaje visual mejora la retención hasta un 65% más que el texto plano.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 2,
    icon: <Plus className="w-8 h-8" />,
    emoji: "✨",
    title: "Crea tu primer mapa",
    description: "Haz clic en el botón 'Nuevo mapa' desde el dashboard. Puedes escribir un tema o subir un archivo PDF/DOCX.",
    highlight: "La IA generará automáticamente los conceptos y sus conexiones.",
    tip: "Prueba con temas como 'Fotosíntesis', 'Revolución Industrial' o cualquier materia de estudio.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: 3,
    icon: <MousePointer2 className="w-8 h-8" />,
    emoji: "🗺️",
    title: "Explora e interactúa",
    description: "Haz clic en cualquier nodo para ver su descripción, conexiones y comentarios. Puedes arrastrar nodos para reorganizar el mapa.",
    highlight: "Cada nodo tiene su propia sección de comentarios para colaborar.",
    tip: "Usa el tutor IA (botón ✨) para profundizar en cualquier concepto del mapa.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: 4,
    icon: <Trophy className="w-8 h-8" />,
    emoji: "🏆",
    title: "Pon a prueba tu conocimiento",
    description: "Dentro de cada mapa, puedes generar un quiz automático. La IA crea preguntas basadas en los conceptos del mapa.",
    highlight: "Cada quiz completado suma puntos al Leaderboard Global.",
    tip: "Un 75% o más de aciertos en el quiz desbloquea XP de bonificación.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: 5,
    icon: <Award className="w-8 h-8" />,
    emoji: "🌟",
    title: "Gana logros y sube de nivel",
    description: "Crea mapas, estudia, completa quizzes y colabora para desbloquear logros y subir de nivel.",
    highlight: "Los retos semanales te dan XP extra por metas específicas.",
    tip: "Mantén una racha de estudio diaria para desbloquear logros especiales.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: 6,
    icon: <Users className="w-8 h-8" />,
    emoji: "🎓",
    title: "Colabora en grupos",
    description: "Únete a grupos de tu profesor/a o crea el tuyo propio. Comparte mapas, entrega tareas y ve el progreso de todos.",
    highlight: "Los profesores pueden publicar quizzes y asignar tareas con mapas.",
    tip: "¡Estás listo para empezar! Regresa al tutorial cuando quieras desde Configuración.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
];

interface Props {
  onComplete: () => void;
}

export default function InteractiveTutorial({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const markDone = () => {
    localStorage.setItem("tutorial_done", "1");
    fetch(`${API_URL}/users/me/tutorial-done`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {});
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    setClosing(true);
    markDone();
    setTimeout(onComplete, 400);
  };

  const handleSkip = () => {
    setClosing(true);
    markDone();
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header con progreso */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tutorial</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                >
                  Saltar <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Paso {step + 1} de {STEPS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    initial={{ width: `${(step / STEPS.length) * 100}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`flex-1 h-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido del paso */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Ícono + emoji */}
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${current.bgColor} flex items-center justify-center shrink-0 ${current.color}`}>
                      <span className="text-3xl">{current.emoji}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">
                        {current.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {current.description}
                      </p>
                    </div>
                  </div>

                  {/* Highlight */}
                  <div className={`p-4 rounded-xl ${current.bgColor} border border-current/10`}>
                    <div className={`flex items-start gap-2 ${current.color}`}>
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm font-semibold leading-relaxed">{current.highlight}</p>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="p-3.5 rounded-xl bg-muted border border-border flex gap-2.5">
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{current.tip}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLast
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/25 hover:shadow-primary/40"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/20"
                }`}
              >
                {isLast ? (
                  <><Sparkles className="w-4 h-4" /> ¡Empezar ahora!</>
                ) : (
                  <>Siguiente <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
