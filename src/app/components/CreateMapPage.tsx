import { useState, useRef, DragEvent } from "react";
import { useNavigate, Link } from "react-router";
import {
  FileText,
  Upload,
  Mic,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";
import { getToken } from "../hooks/useAuth";

const API_URL = "http://localhost:3001/api";

const STEPS = [
  { at: 10, label: "Iniciando motor de IA..." },
  { at: 30, label: "Analizando texto y extrayendo entidades..." },
  { at: 55, label: "Identificando conceptos clave y jerarquías..." },
  { at: 80, label: "Estableciendo relaciones semánticas entre nodos..." },
];

const ACCEPTED_TYPES = [".txt", ".pdf", ".docx"];
const ACCEPTED_MIME = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function CreateMapPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startProgressAnimation = () => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((s, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => {
        setProgress(s.at);
        setCurrentStep(s.label);
      }, i * 1200));
    });
    return timers;
  };

  const finishGeneration = (timers: ReturnType<typeof setTimeout>[], publicId: string) => {
    timers.forEach(clearTimeout);
    setProgress(100);
    setCurrentStep("¡Mapa conceptual generado con éxito!");
    setTimeout(() => navigate(`/map/${publicId}`), 800);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError("");
    setProgress(0);
    setCurrentStep(STEPS[0].label);

    const timers = startProgressAnimation();

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const group_id = searchParams.get("group_id");

      const res = await fetch(`${API_URL}/maps/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ text, group_id: group_id ? parseInt(group_id) : null }),
      });

      timers.forEach(clearTimeout);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al generar el mapa");
      }

      const data = await res.json();
      finishGeneration([], data.public_id);
    } catch (err: unknown) {
      timers.forEach(clearTimeout);
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleFileSelect = (file: File) => {
    const isValid =
      ACCEPTED_MIME.includes(file.type) ||
      ACCEPTED_TYPES.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      setError("Formato no soportado. Usa TXT, PDF o DOCX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el límite de 10 MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleGenerateFile = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError("");
    setProgress(0);
    setCurrentStep(STEPS[0].label);

    const timers = startProgressAnimation();

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const group_id = searchParams.get("group_id");

      const formData = new FormData();
      formData.append("file", selectedFile);
      if (group_id) formData.append("group_id", group_id);

      const res = await fetch(`${API_URL}/maps/generate/file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      timers.forEach(clearTimeout);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al generar el mapa");
      }

      const data = await res.json();
      finishGeneration([], data.public_id);
    } catch (err: unknown) {
      timers.forEach(clearTimeout);
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <nav className="p-3 md:p-4 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">MindMap AI</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        {!isGenerating ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-primary-subtle flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
                ¿Cómo quieres crear tu mapa?
              </h2>
              <p className="text-muted-foreground">
                Elige el método que prefieras para generar tu mapa conceptual
              </p>
            </div>

            <Tabs.Root defaultValue="text" className="space-y-6">
              <Tabs.List className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-card border border-border shadow-sm">
                <Tabs.Trigger
                  value="text"
                  className="px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Texto
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="file"
                  className="px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Archivo
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="audio"
                  className="px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Audio
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="text">
                <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                  <label className="block text-foreground font-medium mb-2">
                    Pega tus apuntes aquí
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-64 p-4 rounded-md bg-input-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Escribe o pega el texto que quieres convertir en mapa conceptual..."
                  />
                  {error && (
                    <p className="mt-2 text-sm text-destructive font-medium">{error}</p>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!text.trim()}
                    className="mt-4 w-full py-3 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generar mapa con IA
                  </button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="file">
                <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-10 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 ${
                      isDragging ? "border-primary bg-primary-subtle" : "border-border hover:border-primary"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                    {selectedFile ? (
                      <>
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                        <p className="font-medium text-foreground text-center">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(0)} KB
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" /> Cambiar archivo
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground" />
                        <p className="font-medium text-foreground">Haz clic o arrastra un archivo</p>
                        <p className="text-sm text-muted-foreground">TXT, PDF, DOCX — máx. 10 MB</p>
                      </>
                    )}
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-destructive font-medium">{error}</p>
                  )}
                  <button
                    onClick={handleGenerateFile}
                    disabled={!selectedFile}
                    className="mt-4 w-full py-3 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generar mapa con IA
                  </button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="audio">
                <div className="p-12 rounded-xl bg-card border border-border shadow-sm">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 border border-border">
                      <Mic className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      Grabar explicación
                    </h3>
                    <p className="text-muted-foreground mb-6 text-sm">
                      Habla sobre el tema y nosotros extraeremos los conceptos
                    </p>
                    <p className="text-sm text-muted-foreground">Próximamente</p>
                  </div>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-full bg-primary-subtle flex items-center justify-center mx-auto mb-8 border border-primary/10">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
              Generando tu mapa...
            </h2>
            <p className="text-lg text-muted-foreground mb-8">{currentStep}</p>

            <div className="max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3 font-medium">{progress}% completado</p>
            </div>

            <div className="mt-12 flex justify-center gap-8">
              {["Analizando", "Conceptos", "Relaciones"].map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 ${
                    i * 33 < progress ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      i * 33 < progress ? "bg-primary" : "bg-border"
                    }`}
                  />
                  <span className="text-sm font-medium">{step}</span>
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
