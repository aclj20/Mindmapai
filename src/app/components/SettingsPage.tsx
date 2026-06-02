import { Link } from "react-router";
import { ArrowLeft, Moon, Volume2, Eye, Type, Contrast } from "lucide-react";
import { motion } from "motion/react";
import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  fontSize: 16,
  highContrast: false,
  soundEnabled: true,
  darkMode: false,
  screenReader: false,
};

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState(DEFAULT_SETTINGS.fontSize);
  const [highContrast, setHighContrast] = useState(DEFAULT_SETTINGS.highContrast);
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SETTINGS.soundEnabled);
  const [darkMode, setDarkMode] = useState(DEFAULT_SETTINGS.darkMode); // In an ideal SaaS, defaults to false
  const [screenReader, setScreenReader] = useState(DEFAULT_SETTINGS.screenReader);

  useEffect(() => {
    const saved = localStorage.getItem("settings.accessibility");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<typeof DEFAULT_SETTINGS>;
      setFontSize(parsed.fontSize ?? DEFAULT_SETTINGS.fontSize);
      setHighContrast(parsed.highContrast ?? DEFAULT_SETTINGS.highContrast);
      setSoundEnabled(parsed.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled);
      setDarkMode(parsed.darkMode ?? DEFAULT_SETTINGS.darkMode);
      setScreenReader(parsed.screenReader ?? DEFAULT_SETTINGS.screenReader);
    } catch {
      localStorage.removeItem("settings.accessibility");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-size", `${fontSize}px`);
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("dark", darkMode);
    root.classList.toggle("screen-reader", screenReader);

    localStorage.setItem(
      "settings.accessibility",
      JSON.stringify({ fontSize, highContrast, soundEnabled, darkMode, screenReader })
    );
  }, [fontSize, highContrast, soundEnabled, darkMode, screenReader]);

  const handleSave = () => {
    localStorage.setItem(
      "settings.accessibility",
      JSON.stringify({ fontSize, highContrast, soundEnabled, darkMode, screenReader })
    );
    toast.success("Preferencias guardadas");
  };

  const handleReset = () => {
    setFontSize(DEFAULT_SETTINGS.fontSize);
    setHighContrast(DEFAULT_SETTINGS.highContrast);
    setSoundEnabled(DEFAULT_SETTINGS.soundEnabled);
    setDarkMode(DEFAULT_SETTINGS.darkMode);
    setScreenReader(DEFAULT_SETTINGS.screenReader);
    localStorage.removeItem("settings.accessibility");
    toast.success("Preferencias restauradas");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans text-foreground">
      <nav className="p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Configuracion</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
              <Eye className="w-5 h-5 text-primary" />
              Accesibilidad
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold mb-1">
                    Alto contraste
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Mejora la legibilidad con mayor contraste de colores
                  </p>
                </div>
                <Switch.Root
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-card rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold mb-1">
                    Compatibilidad con lector de pantalla
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Optimiza la navegación para lectores de pantalla
                  </p>
                </div>
                <Switch.Root
                  checked={screenReader}
                  onCheckedChange={setScreenReader}
                  className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-card rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold mb-1 flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary" />
                      Tamaño de texto
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ajusta el tamaño del texto a tu preferencia
                    </p>
                  </div>
                  <span className="text-foreground font-bold bg-muted px-3 py-1 rounded-md text-sm">{fontSize}px</span>
                </div>
                <Slider.Root
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={1}
                  className="relative flex items-center w-full h-5"
                >
                  <Slider.Track className="bg-muted relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-primary rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-card border border-border shadow-sm rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-grab active:cursor-grabbing" />
                </Slider.Root>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                  <span>Pequeño</span>
                  <span>Grande</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
              <Contrast className="w-5 h-5 text-primary" />
              Apariencia
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold mb-1 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-primary" />
                    Modo oscuro
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reduce la fatiga visual en entornos con poca luz
                  </p>
                </div>
                <Switch.Root
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-card rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
              <Volume2 className="w-5 h-5 text-primary" />
              Audio
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold mb-1">
                    Efectos de sonido
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reproduce sonidos al completar logros y acciones
                  </p>
                </div>
                <Switch.Root
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-card rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-primary-subtle border border-border shadow-sm">
            <h3 className="font-semibold text-foreground mb-2">
              💡 Accesibilidad mejorada
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta plataforma está diseñada siguiendo las pautas WCAG 2.1 para
              garantizar una experiencia accesible para todos los usuarios.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium transition-colors shadow-sm"
            >
              Guardar cambios
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-md bg-card border border-border text-foreground hover:bg-muted transition-colors font-medium shadow-sm"
            >
              Restaurar valores
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
