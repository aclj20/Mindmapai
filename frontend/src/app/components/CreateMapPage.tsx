import { useState, useRef, useEffect, DragEvent } from "react";
import { useNavigate, Link } from "react-router";
import {
  FileText,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  Square,
} from "lucide-react";
import { motion } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import MobileNav from "./MobileNav";
import { getToken } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL as string;

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

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Grabación
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current); }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioFile(new File([blob], `grabacion-${Date.now()}.webm`, { type: "audio/webm" }));
        setIsRecording(false);
        timerRef.current && clearInterval(timerRef.current);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      setError("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    timerRef.current && clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const searchParams = new URLSearchParams(window.location.search);
  const groupId = searchParams.get("group_id");
  const groupPublicId = searchParams.get("group_public_id");
  const groupName = searchParams.get("group_name");

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
    setTimeout(() => {
      if (groupPublicId) {
        navigate(`/groups/${groupPublicId}`);
      } else {
        navigate(`/map/${publicId}`);
      }
    }, 800);
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

  const AUDIO_ACCEPT = ".mp3,.mp4,.wav,.webm,.ogg,.flac,.m4a";
  const handleAudioSelect = (file: File) => {
    if (file.size > 25 * 1024 * 1024) { setError("El audio supera el límite de 25 MB."); return; }
    setError("");
    setAudioFile(file);
  };

  const handleGenerateAudio = async () => {
    if (!audioFile) return;
    setIsGenerating(true);
    setError("");
    setProgress(5);
    setCurrentStep("Transcribiendo audio con IA...");

    try {
      const form = new FormData();
      form.append("audio", audioFile);
      const r1 = await fetch(`${API_URL}/maps/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!r1.ok) { const e = await r1.json(); throw new Error(e.message); }
      const { text: transcribed } = await r1.json();

      setProgress(20);
      setCurrentStep(STEPS[1].label);
      const timers = startProgressAnimation();

      const searchParams = new URLSearchParams(window.location.search);
      const group_id = searchParams.get("group_id");
      const r2 = await fetch(`${API_URL}/maps/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: transcribed, group_id: group_id ? parseInt(group_id) : null }),
      });
      timers.forEach(clearTimeout);
      if (!r2.ok) { const e = await r2.json(); throw new Error(e.message); }
      const data = await r2.json();
      finishGeneration([], data.public_id);
    } catch (err: unknown) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 overflow-x-hidden">
      <nav className="p-3 md:p-4 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to={groupPublicId ? `/groups/${groupPublicId}` : "/dashboard"}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">MindMap AI</h1>
          {groupId && groupName && (
            <span className="ml-2 text-xs font-bold bg-primary-subtle text-primary border border-primary/20 px-2.5 py-1 rounded-full truncate max-w-[140px] sm:max-w-none">
              Publicando en: {decodeURIComponent(groupName)}
            </span>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        {!isGenerating ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-6 sm:mb-10">
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
              <Tabs.List data-tutorial="create-tabs" className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-card border border-border shadow-sm">
                <Tabs.Trigger
                  value="text"
                  className="hover:cursor-pointer px-2 sm:px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 sm:gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Texto
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="file"
                  className="hover:cursor-pointer px-2 sm:px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 sm:gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Archivo
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="audio"
                  className="hover:cursor-pointer px-2 sm:px-6 py-2.5 rounded-md text-muted-foreground font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 sm:gap-2 text-sm"
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
                    data-tutorial="btn-generate"
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
                    className={`p-6 sm:p-10 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 ${
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
                <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
                  {!audioFile ? (
                    <div className="p-6">
                      {/* Grabación */}
                      <div className="flex flex-col items-center gap-4 py-6 border-b border-border mb-6">
                        {!isRecording ? (
                          <>
                            <button onClick={startRecording}
                              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95">
                              <Mic className="w-9 h-9" />
                            </button>
                            <p className="text-sm font-semibold text-foreground">Grabar desde el micrófono</p>
                            <p className="text-xs text-muted-foreground -mt-2">Haz clic para empezar a grabar</p>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <button onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all">
                                <Square className="w-8 h-8 fill-white" />
                              </button>
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 animate-ping" />
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500" />
                            </div>
                            <p className="text-2xl font-mono font-bold text-red-500">{formatTime(recordSeconds)}</p>
                            <p className="text-xs text-muted-foreground">Grabando… haz clic en el botón para detener</p>
                          </>
                        )}
                      </div>

                      {/* Subir archivo */}
                      <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Subir archivo de audio</p>
                          <p className="text-xs text-muted-foreground">MP3, WAV, M4A, WEBM, OGG, FLAC · máx. 25 MB</p>
                        </div>
                        <input ref={audioInputRef} type="file" accept={AUDIO_ACCEPT} className="hidden"
                          onChange={e => e.target.files?.[0] && handleAudioSelect(e.target.files[0])} />
                      </label>

                      {error && <p className="mt-3 text-sm text-destructive font-medium">{error}</p>}
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                        <Mic className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{audioFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button type="button" onClick={() => setAudioFile(null)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 text-center">El audio será transcrito automáticamente y luego se generará el mapa.</p>
                      {error && <p className="mb-3 text-sm text-destructive font-medium">{error}</p>}
                      <button onClick={handleGenerateAudio}
                        className="w-full py-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" /> Transcribir y generar mapa
                      </button>
                    </div>
                  )}
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
