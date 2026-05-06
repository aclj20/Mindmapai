import { Link } from "react-router";
import { ArrowLeft, Moon, Volume2, Eye, Type, Contrast } from "lucide-react";
import { motion } from "motion/react";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import { useState } from "react";

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [screenReader, setScreenReader] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6 text-cyan-400" />
              Accesibilidad
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Alto contraste
                  </h3>
                  <p className="text-sm text-gray-400">
                    Mejora la legibilidad con mayor contraste de colores
                  </p>
                </div>
                <Switch.Root
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-cyan-500 transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Compatibilidad con lector de pantalla
                  </h3>
                  <p className="text-sm text-gray-400">
                    Optimiza la navegación para lectores de pantalla
                  </p>
                </div>
                <Switch.Root
                  checked={screenReader}
                  onCheckedChange={setScreenReader}
                  className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-cyan-500 transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                      <Type className="w-5 h-5 text-cyan-400" />
                      Tamaño de texto
                    </h3>
                    <p className="text-sm text-gray-400">
                      Ajusta el tamaño del texto a tu preferencia
                    </p>
                  </div>
                  <span className="text-white font-bold">{fontSize}px</span>
                </div>
                <Slider.Root
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={1}
                  className="relative flex items-center w-full h-5"
                >
                  <Slider.Track className="bg-white/20 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </Slider.Root>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Pequeño</span>
                  <span>Grande</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Contrast className="w-6 h-6 text-purple-400" />
              Apariencia
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Moon className="w-5 h-5 text-purple-400" />
                    Modo oscuro
                  </h3>
                  <p className="text-sm text-gray-400">
                    Reduce la fatiga visual en entornos con poca luz
                  </p>
                </div>
                <Switch.Root
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-purple-500 transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-emerald-400" />
              Audio
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Efectos de sonido
                  </h3>
                  <p className="text-sm text-gray-400">
                    Reproduce sonidos al completar logros y acciones
                  </p>
                </div>
                <Switch.Root
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-emerald-500 transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
            <h3 className="font-semibold text-white mb-2">
              💡 Accesibilidad mejorada
            </h3>
            <p className="text-sm text-gray-300">
              Esta plataforma está diseñada siguiendo las pautas WCAG 2.1 para
              garantizar una experiencia accesible para todos los usuarios.
            </p>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold transition-all">
              Guardar cambios
            </button>
            <button className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
              Restaurar valores predeterminados
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
