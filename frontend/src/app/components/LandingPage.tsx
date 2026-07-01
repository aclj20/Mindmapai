import { Link } from "react-router";
import {
  Brain,
  ArrowRight,
  FileText,
  Sparkles,
  Share2,
  Heart,
  Eye,
  Download,
  User,
  ShieldCheck,
  Globe,
  Plus,
  MoreHorizontal,
  X,
  Target,
  Zap,
  Layout,
  Star,
  MessageCircle,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function LandingPage() {
  const [selectedPreviewNode, setSelectedPreviewNode] = useState<string | null>("energy");

  const featuredMaps = [
    { id: 1, title: "Fotosíntesis", author: "María López", likes: 128, color: "bg-green-50" },
    { id: 2, title: "Inteligencia Artificial", author: "Diego Ramírez", likes: 96, color: "bg-blue-50" },
    { id: 3, title: "Sistema Solar", author: "Valentina P.", likes: 74, color: "bg-purple-50" },
    { id: 4, title: "Aprendizaje Automático", author: "Andrés García", likes: 58, color: "bg-indigo-50" },
  ];

  const steps = [
    {
      icon: FileText,
      title: "Pega tu contenido",
      desc: "Agrega tu texto, apuntes o transcripciones en segundos."
    },
    {
      icon: Sparkles,
      title: "Genera el mapa",
      desc: "La IA organiza tus ideas y crea un mapa conceptual al instante."
    },
    {
      icon: Share2,
      title: "Explora y comparte",
      desc: "Navega, edita y comparte tu mapa con quien quieras."
    },
  ];

  const features = [
    { icon: Download, title: "Exporta tu mapa", desc: "Descarga en PNG, PDF o Markdown." },
    { icon: Share2, title: "Comparte fácilmente", desc: "Envía un enlace y colabora en tiempo real." },
    { icon: Heart, title: "Dale like y guarda", desc: "Guarda tus favoritos y encuentra inspiración." },
    { icon: Eye, title: "Modo invitado", desc: "Explora sin registrarte y crea tu primer mapa." },
    { icon: User, title: "Perfil personal", desc: "Gestiona tus mapas, historial y ajustes." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">MindMap AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/communities" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Comunidad</Link>
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border border-border text-sm font-bold text-foreground hover:bg-muted transition-all shadow-sm"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 md:px-12 py-16 md:py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >


            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
              Convierte tus ideas en <br />
              <span className="text-primary">mapas conceptuales claros</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
              Crea, organiza y explora conocimiento con mapas interactivos generados a partir de texto, apuntes o transcripciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/map/create"
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                Crear mapa <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/communities"
                className="px-8 py-4 rounded-xl bg-card border border-border text-foreground font-bold text-base hover:bg-muted transition-all shadow-sm flex items-center justify-center"
              >
                Explorar comunidad
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Zap className="w-4 h-4 text-primary" /> Fácil de usar
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Globe className="w-4 h-4 text-primary" /> Colabora en tiempo real
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Layout className="w-4 h-4 text-primary" /> Accede desde cualquier lugar
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* App Preview Frame */}
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px] w-full">
              {/* Sidebar */}
              <div className="w-full md:w-16 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-4 flex md:flex-col items-center gap-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="hidden md:flex flex-col gap-6">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Zap className="w-5 h-5" /></div>
                  <div className="p-2 rounded-lg text-muted-foreground"><Plus className="w-5 h-5" /></div>
                  <div className="p-2 rounded-lg text-muted-foreground"><Globe className="w-5 h-5" /></div>
                  <div className="p-2 rounded-lg text-muted-foreground"><FileText className="w-5 h-5" /></div>
                </div>
                <div className="mt-auto hidden md:block">
                  <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" />
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
                {/* Canvas Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-none mb-1 tracking-tight">Energías renovables</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Guardado
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1 text-primary font-bold bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/10">
                             <Globe className="w-2.5 h-2.5" /> Público
                          </span>
                          <span className="flex items-center gap-1 ml-1"><Heart className="w-2.5 h-2.5" /> 24</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> 8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"><Download className="w-4 h-4" /></button>
                    <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Share2 className="w-3.5 h-3.5" /> Compartir
                    </button>
                    <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex-1 p-8 relative flex items-center justify-center bg-[#fafafa]">
                  {/* Obsidian-like Graph Preview */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <path d="M 180 180 Q 250 120 320 180" fill="none" stroke="var(--primary)" strokeWidth="1" />
                    <path d="M 180 180 Q 150 250 200 320" fill="none" stroke="var(--primary)" strokeWidth="1" />
                    <path d="M 180 180 Q 100 180 80 250" fill="none" stroke="var(--primary)" strokeWidth="1" />
                    <path d="M 320 180 Q 350 250 300 320" fill="none" stroke="var(--primary)" strokeWidth="1" />
                    <path d="M 320 180 Q 400 180 420 250" fill="none" stroke="var(--primary)" strokeWidth="1" />
                  </svg>

                  <div className="grid grid-cols-3 gap-x-12 gap-y-16 items-center justify-items-center relative z-10">
                    <div className="w-24 h-10 bg-card border border-border rounded-lg shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/50 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Globe className="w-3 h-3 text-blue-400 mb-0.5" />
                        Eólica
                      </div>
                    </div>
                    <div
                      onClick={() => setSelectedPreviewNode("energy")}
                      className={`w-32 h-14 bg-card border-2 rounded-xl shadow-lg flex items-center justify-center text-xs font-extrabold text-foreground transition-all cursor-pointer ${selectedPreviewNode === "energy" ? "border-primary ring-4 ring-primary/5" : "border-border"}`}
                    >
                      <div className="text-center">
                        Energías<br />renovables
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-card border border-border rounded-lg shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/50 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Zap className="w-3 h-3 text-orange-400 mb-0.5" />
                        Solar
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-card border border-border rounded-lg shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/50 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Star className="w-3 h-3 text-yellow-400 mb-0.5" />
                        Ventajas
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-card border border-border rounded-lg shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/50 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Brain className="w-3 h-3 text-purple-400 mb-0.5" />
                        Biomasa
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-card border border-border rounded-lg shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground transition-all hover:border-primary/50 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <ShieldCheck className="w-3 h-3 text-red-400 mb-0.5" />
                        Desafíos
                      </div>
                    </div>
                  </div>

                  {/* Detail Panel Preview */}
                  <AnimatePresence>
                    {selectedPreviewNode && (
                      <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute right-0 top-0 h-full w-48 bg-card border-l border-border p-4 shadow-xl z-20 flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detalles</h5>
                          <X className="w-3 h-3 text-muted-foreground cursor-pointer" onClick={() => setSelectedPreviewNode(null)} />
                        </div>
                        <h6 className="text-xs font-bold text-foreground mb-2">Energías renovables</h6>
                        <p className="text-[9px] leading-relaxed text-muted-foreground font-medium mb-4">
                          Son fuentes de energía que se obtienen de recursos naturales inagotables o que se renuevan naturalmente.
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="text-[8px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Etiquetas</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[8px] font-bold text-primary">energía</span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[8px] font-bold text-primary">sostenibilidad</span>
                          </div>
                        </div>
                        <div className="mt-auto flex flex-col gap-2">
                          <button className="w-full py-1.5 rounded-md bg-primary text-white text-[9px] font-bold shadow-sm">Ver detalle</button>
                          <button className="w-full py-1.5 rounded-md border border-border text-foreground text-[9px] font-bold flex items-center justify-center gap-1 hover:bg-muted transition-colors"><Download className="w-2.5 h-2.5" /> Exportar</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm text-[10px] font-bold text-muted-foreground">
                    <Plus className="w-3 h-3" />
                    <span>100%</span>
                    <div className="w-px h-3 bg-border mx-1"></div>
                    <X className="w-3 h-3 rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section className="bg-muted/30 py-24 border-y border-border">
          <div className="container mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">Cómo funciona</h2>
              <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-sm group-hover:scale-105 group-hover:shadow-lg group-hover:border-primary/20 transition-all mb-6 relative">
                    <step.icon className="w-7 h-7" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center border-4 border-background">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Maps Section */}
        <section className="py-24 container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Mapas destacados</h2>
              <p className="text-muted-foreground font-medium text-sm">Inspiración creada por nuestra comunidad académica.</p>
            </div>
            <Link to="/communities" className="text-primary font-bold text-sm hover:underline">Ver todos</Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMaps.map((map, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden flex flex-col"
              >
                <div className={`aspect-video w-full ${map.color} flex items-center justify-center relative overflow-hidden`}>
                  <Brain className="w-12 h-12 opacity-20 text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{map.title}</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                      {map.author.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">{map.author}</span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-bold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                        <Heart className="w-3.5 h-3.5" /> {map.likes}
                      </span>
                      <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                        <MessageCircle className="w-3.5 h-3.5" /> {Math.floor(map.likes / 4)}
                      </span>
                      <span className="flex items-center gap-1 text-primary">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <Share2 className="w-3.5 h-3.5 hover:text-primary transition-colors cursor-pointer" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-24 border-y border-border">
          <div className="container mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">Funciones principales</h2>
              <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-sm mb-5 transition-transform hover:-translate-y-1">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-3xl bg-primary p-12 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-primary/20"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>

            <Brain className="w-20 h-20 text-white/10 absolute -bottom-4 -left-4 rotate-12" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">
                Empieza gratis. No necesitas tarjeta.
              </h2>
              <p className="text-primary-foreground/90 text-lg md:text-xl mb-10 font-medium leading-relaxed">
                Crea tu primer mapa y transforma tu forma de aprender hoy mismo.
              </p>
              <Link
                to="/map/create"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-white text-primary font-extrabold text-lg shadow-xl hover:scale-105 transition-transform"
              >
                Crear mi mapa <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-12 border-t border-border text-center text-muted-foreground">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold tracking-tight text-foreground">MindMap AI</span>
          </div>
          <p className="text-xs font-semibold mb-8">© 2026 MindMap AI. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
