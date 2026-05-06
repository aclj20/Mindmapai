import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  FileText,
  Upload,
  Mic,
  Sparkles,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";

export default function CreateMapPage() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep("Analizando contenido...");

    setTimeout(() => {
      setProgress(33);
      setCurrentStep("Identificando conceptos clave...");
    }, 1000);

    setTimeout(() => {
      setProgress(66);
      setCurrentStep("Generando relaciones...");
    }, 2000);

    setTimeout(() => {
      setProgress(100);
      setCurrentStep("¡Mapa creado!");
    }, 3000);

    setTimeout(() => {
      navigate("/map/1");
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 pb-20 md:pb-0">
      <nav className="p-3 md:p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Crear Mapa Conceptual</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        {!isGenerating ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                ¿Cómo quieres crear tu mapa?
              </h2>
              <p className="text-gray-300">
                Elige el método que prefieras para generar tu mapa conceptual
              </p>
            </div>

            <Tabs.Root defaultValue="text" className="space-y-6">
              <Tabs.List className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                <Tabs.Trigger
                  value="text"
                  className="px-6 py-3 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Texto
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="file"
                  className="px-6 py-3 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Archivo
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="audio"
                  className="px-6 py-3 rounded-lg text-white transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Audio
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="text">
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                  <label className="block text-white font-semibold mb-3">
                    Pega tu texto aquí
                  </label>
                  <textarea
                    className="w-full h-64 p-4 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="Escribe o pega el texto que quieres convertir en mapa conceptual..."
                    defaultValue="El Sistema Solar es el sistema planetario que orbita alrededor del Sol. Está compuesto por ocho planetas principales: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno. Los cuatro planetas interiores (Mercurio, Venus, Tierra y Marte) son rocosos y más pequeños, mientras que los cuatro exteriores (Júpiter, Saturno, Urano y Neptuno) son gigantes gaseosos. El Sol es una estrella de tipo G que contiene el 99.86% de la masa del sistema solar."
                  />
                  <button
                    onClick={handleGenerate}
                    className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generar mapa con IA
                  </button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="file">
                <div className="p-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 border-dashed">
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Arrastra un archivo o haz clic para seleccionar
                    </h3>
                    <p className="text-gray-400 mb-6">
                      PDF, DOCX, TXT (máx. 10MB)
                    </p>
                    <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all">
                      Seleccionar archivo
                    </button>
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="audio">
                <div className="p-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                      <Mic className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Grabar audio
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Haz clic para comenzar a grabar tu explicación
                    </p>
                    <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold transition-all">
                      🎙️ Iniciar grabación
                    </button>
                  </div>
                </div>
              </Tabs.Content>
            </Tabs.Root>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                ¿Cómo funciona la IA?
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Identifica conceptos clave automáticamente</li>
                <li>✓ Establece relaciones jerárquicas</li>
                <li>✓ Crea visualización interactiva</li>
                <li>✓ Puedes editar y personalizar después</li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-8 relative">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              Generando tu mapa...
            </h2>
            <p className="text-xl text-cyan-400 mb-8">{currentStep}</p>

            <div className="max-w-md mx-auto">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">{progress}% completado</p>
            </div>

            <div className="mt-12 flex justify-center gap-8">
              {[
                "Analizando",
                "Conceptos",
                "Relaciones",
              ].map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 ${
                    i * 33 < progress ? "text-cyan-400" : "text-gray-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      i * 33 < progress ? "bg-cyan-400" : "bg-gray-600"
                    }`}
                  />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
