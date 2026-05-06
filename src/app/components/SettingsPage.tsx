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
  const [darkMode, setDarkMode] = useState(false); // In an ideal SaaS, defaults to false
  const [screenReader, setScreenReader] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      <nav className="p-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Eye className="w-5 h-5 text-purple-600" />
              Accesibilidad
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold mb-1">
                    Alto contraste
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mejora la legibilidad con mayor contraste de colores
                  </p>
                </div>
                <Switch.Root
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold mb-1">
                    Compatibilidad con lector de pantalla
                  </h3>
                  <p className="text-sm text-gray-500">
                    Optimiza la navegación para lectores de pantalla
                  </p>
                </div>
                <Switch.Root
                  checked={screenReader}
                  onCheckedChange={setScreenReader}
                  className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold mb-1 flex items-center gap-2">
                      <Type className="w-4 h-4 text-purple-600" />
                      Tamaño de texto
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ajusta el tamaño del texto a tu preferencia
                    </p>
                  </div>
                  <span className="text-gray-900 font-bold bg-gray-100 px-3 py-1 rounded-md text-sm">{fontSize}px</span>
                </div>
                <Slider.Root
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={1}
                  className="relative flex items-center w-full h-5"
                >
                  <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-purple-600 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white border border-gray-200 shadow-sm rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-grab active:cursor-grabbing" />
                </Slider.Root>
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                  <span>Pequeño</span>
                  <span>Grande</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Contrast className="w-5 h-5 text-purple-600" />
              Apariencia
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold mb-1 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-purple-600" />
                    Modo oscuro
                  </h3>
                  <p className="text-sm text-gray-500">
                    Reduce la fatiga visual en entornos con poca luz
                  </p>
                </div>
                <Switch.Root
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Volume2 className="w-5 h-5 text-purple-600" />
              Audio
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold mb-1">
                    Efectos de sonido
                  </h3>
                  <p className="text-sm text-gray-500">
                    Reproduce sonidos al completar logros y acciones
                  </p>
                </div>
                <Switch.Root
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-purple-50 border border-purple-100 shadow-sm">
            <h3 className="font-semibold text-purple-900 mb-2">
              💡 Accesibilidad mejorada
            </h3>
            <p className="text-sm text-purple-800/80 leading-relaxed">
              Esta plataforma está diseñada siguiendo las pautas WCAG 2.1 para
              garantizar una experiencia accesible para todos los usuarios.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="flex-1 py-2.5 px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-sm">
              Guardar cambios
            </button>
            <button className="px-6 py-2.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm">
              Restaurar valores
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
