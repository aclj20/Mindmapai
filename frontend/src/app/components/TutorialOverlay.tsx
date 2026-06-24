import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { X, ArrowRight, ArrowLeft, Sparkles, Brain } from "lucide-react";
import { getToken } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

interface StepDef {
  id: string;
  routeMatch: string;
  targetSelector?: string;
  title: string;
  description: string;
  navigateToOnNext?: string;
  genTutorialMap?: boolean;
}

const STEPS: StepDef[] = [
  {
    id: "dash-welcome",
    routeMatch: "/dashboard",
    title: "Bienvenido a MindMap AI",
    description: "Tu asistente inteligente para crear mapas conceptuales. En este tutorial te guiaremos por las funciones principales.",
  },
  {
    id: "dash-create-btn",
    routeMatch: "/dashboard",
    targetSelector: '[data-tutorial="btn-crear-mapa"]',
    title: "Crea tu primer mapa",
    description: "Este botón te lleva a la pantalla de creación. Puedes generar un mapa con IA desde texto, archivos o audio.",
  },
  {
    id: "dash-nav",
    routeMatch: "/dashboard",
    targetSelector: '[data-tutorial="nav-links"]',
    title: "Navegación principal",
    description: "Accede a Comunidades, Ranking y tu Perfil desde aquí.",
    navigateToOnNext: "/map/create",
  },
  {
    id: "create-tabs",
    routeMatch: "/map/create",
    targetSelector: '[data-tutorial="create-tabs"]',
    title: "Elige tu método",
    description: "Pega texto, sube un archivo PDF/DOCX o graba audio. La IA convertirá tu contenido en un mapa conceptual.",
  },
  {
    id: "create-generate",
    routeMatch: "/map/create",
    targetSelector: '[data-tutorial="btn-generate"]',
    title: "Genera con IA",
    description: "Escribe un tema en el área de texto y presiona este botón. En segundos tendrás tu mapa listo.",
    genTutorialMap: true,
  },
  {
    id: "view-toolbar",
    routeMatch: "/map/:id",
    targetSelector: '[data-tutorial="left-toolbar"]',
    title: "Herramientas de edición",
    description: "Selecciona, crea conceptos, ve detalles del mapa o borra elementos. ¡Pruébalos!",
  },
  {
    id: "view-features",
    routeMatch: "/map/:id",
    targetSelector: '[data-tutorial="top-features"]',
    title: "Funciones inteligentes",
    description: "Tutor IA, Quiz automático, Comentarios y Compartir. Las herramientas clave para aprender y colaborar.",
  },
  {
    id: "view-controls",
    routeMatch: "/map/:id",
    targetSelector: '[data-tutorial="bottom-controls"]',
    title: "Control de vista",
    description: "Ajusta el zoom, centra el mapa o expórtalo como imagen o PDF.",
  },
  {
    id: "view-complete",
    routeMatch: "/map/:id",
    title: "¡Tutorial completado!",
    description: "Ahora conoces las funciones principales de MindMap AI. ¡Empieza a crear y aprender!",
  },
];

function matchRoute(pattern: string, path: string): boolean {
  if (pattern.includes(":")) {
    return path.startsWith(pattern.split("/:")[0]);
  }
  return path === pattern;
}

function markDone() {
  localStorage.removeItem("tutorial_should_start");
  localStorage.setItem("tutorial_done", "1");
  fetch(`${API_URL}/users/me/tutorial-done`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).catch(() => {});
}

export default function TutorialOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSide, setTooltipSide] = useState<"top" | "bottom" | "left" | "right" | "center">("bottom");
  const [genLoading, setGenLoading] = useState(false);
  const prevPathRef = useRef("");

  // On mount: check if tutorial should start
  useEffect(() => {
    // Fast path: flag already set by Dashboard
    if (localStorage.getItem("tutorial_should_start") === "true") {
      setActive(true);
      setStepIdx(0);
      return;
    }
    // Reliable path: check backend directly (handles race with Dashboard fetch)
    const d = localStorage.getItem("tutorial_done");
    if (d) return;
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.has_seen_tutorial) {
          localStorage.setItem("tutorial_should_start", "true");
          setActive(true);
          setStepIdx(0);
        }
      })
      .catch(() => {});
  }, []);

  // On route change: reset steps or reactivate tutorial
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    if (active) {
      setStepIdx(0);
    } else if (localStorage.getItem("tutorial_should_start") === "true") {
      setActive(true);
      setStepIdx(0);
    }
  }, [location.pathname, active]);

  const filteredSteps = STEPS.filter((s) => matchRoute(s.routeMatch, location.pathname));
  const step = filteredSteps[stepIdx] || filteredSteps[0];

  const updateRect = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      setTooltipSide("center");
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect(r);
      const midY = window.innerHeight / 2;
      const midX = window.innerWidth / 2;
      if (r.top > midY) setTooltipSide("top");
      else if (r.bottom < midY) setTooltipSide("bottom");
      else if (r.left > midX) setTooltipSide("left");
      else setTooltipSide("right");
    } else {
      setTargetRect(null);
      setTooltipSide("center");
    }
  }, [step?.targetSelector, step?.id]);

  useEffect(() => {
    if (!active) return;
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    const obs = new MutationObserver(updateRect);
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
      obs.disconnect();
    };
  }, [active, updateRect]);

  if (!active || !step) return null;

  const isLast = stepIdx >= filteredSteps.length - 1;
  const isFirst = stepIdx === 0;
  const hasTarget = !!step.targetSelector && !!targetRect;

  const handleSkip = () => {
    markDone();
    setActive(false);
  };

  const handleNext = async () => {
    if (step.genTutorialMap && !genLoading) {
      setGenLoading(true);
      try {
        const res = await fetch(`${API_URL}/maps/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            text: "La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química. La clorofila en las hojas absorbe la luz. El dióxido de carbono y el agua se convierten en glucosa y oxígeno. Este proceso ocurre en los cloroplastos.",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          markDone();
          localStorage.setItem("tutorial_should_start", "true");
          setGenLoading(false);
          setStepIdx(0);
          navigate(`/map/${data.public_id}`, { replace: true });
          return;
        }
      } catch {}
      setGenLoading(false);
      return;
    }

    if (step.navigateToOnNext) {
      navigate(step.navigateToOnNext, { replace: true });
      setStepIdx(0);
      return;
    }

    if (isLast) {
      markDone();
      setActive(false);
    } else {
      setStepIdx((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setStepIdx((s) => s - 1);
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget || !targetRect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const gap = 16;
    const cardW = 340;
    const cardH = 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    switch (tooltipSide) {
      case "top":
        return {
          position: "fixed",
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - cardW / 2, vw - cardW - 16)),
          top: Math.max(16, targetRect.top - cardH - gap),
        };
      case "bottom":
        return {
          position: "fixed",
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - cardW / 2, vw - cardW - 16)),
          top: Math.min(vh - cardH - 16, targetRect.bottom + gap),
        };
      case "left":
        return {
          position: "fixed",
          left: Math.max(16, targetRect.left - cardW - gap),
          top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - cardH / 2, vh - cardH - 16)),
        };
      case "right":
        return {
          position: "fixed",
          left: Math.min(vw - cardW - 16, targetRect.right + gap),
          top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - cardH / 2, vh - cardH - 16)),
        };
    }
    return {};
  };

  const renderSpotlight = () => {
    if (!hasTarget || !targetRect) return null;
    const { top, left, width, height } = targetRect;
    return (
      <>
        <div
          className="fixed z-[9999] rounded-2xl pointer-events-none"
          style={{
            top: top - 6,
            left: left - 6,
            width: width + 12,
            height: height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
        <div
          className="fixed z-[10000] rounded-2xl border-2 border-primary shadow-[0_0_0_4px_rgba(99,102,241,0.3)] pointer-events-none"
          style={{ top: top - 6, left: left - 6, width: width + 12, height: height + 12 }}
        />
      </>
    );
  };

  const cardWidth = tooltipSide === "center" ? "min(440px, calc(100vw - 32px))" : "min(360px, calc(100vw - 32px))";

  return (
    <>
      {genLoading && (
        <div className="fixed inset-0 z-[10001] bg-black/60 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-lg font-bold text-foreground">Generando mapa de ejemplo...</p>
            <p className="text-sm text-muted-foreground mt-1">La IA está creando tu mapa conceptual.</p>
          </div>
        </div>
      )}

      {!genLoading && (
        <>
          <div className="fixed inset-0 z-[9998] pointer-events-none">
            {hasTarget ? renderSpotlight() : <div className="fixed inset-0 bg-black/50" />}
          </div>

          <div className="fixed inset-0 z-[10001] pointer-events-none flex items-center justify-center">
            {tooltipSide === "center" ? (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl shadow-2xl border-l-4 border-l-primary pointer-events-auto"
                style={{ width: cardWidth }}
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">{step.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  <div className="mt-6 flex items-center gap-3 justify-center">
                    <button
                      onClick={handleSkip}
                      className="cursor-pointer px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Saltar tutorial
                    </button>
                    <button
                      onClick={handleNext}
                      className="cursor-pointer px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5"
                    >
                      {isLast ? "Finalizar" : "Siguiente"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border rounded-2xl shadow-2xl border-l-4 border-l-primary pointer-events-auto"
                style={{
                  ...getTooltipStyle(),
                  width: cardWidth,
                  position: "fixed",
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-foreground tracking-tight leading-tight">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {stepIdx + 1} / {filteredSteps.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSkip}
                        className="cursor-pointer px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Saltar
                      </button>
                      {!isFirst && (
                        <button
                          onClick={handlePrev}
                          className="cursor-pointer px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" /> Atrás
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="cursor-pointer px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary-hover transition-colors flex items-center gap-1"
                      >
                        {isLast ? "Finalizar" : "Siguiente"}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </>
  );
}
