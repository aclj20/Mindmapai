import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  ArrowLeft,
  Maximize,
  Heart,
  MessageCircle,
  MoreHorizontal,
  FileDown,
  Copy,
  Twitter,
  Facebook,
  Edit2,
  Trash2,
  Send,
  MousePointer2,
  Square,
  Type,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  MousePointer,
  RotateCcw,
  Plus,
  Minus,
  Settings,
  Bell,
  Search,
  LayoutGrid,
  Globe,
  Lock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  category: string;
  connections: string[];
  description?: string;
  tags?: string[];
  icon?: string;
  image?: string;
  stats?: Record<string, string>;
  isSticky?: boolean;
  color?: string;
}

export default function ConceptMapView() {
  const { id } = useParams();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(34);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "María López", text: "Excelente estructura, muy clara.", time: "hace 2h" },
    { id: 2, user: "Diego Ramírez", text: "Me ayudó mucho para estudiar.", time: "hace 1h" }
  ]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [activeTab, setActiveTab] = useState<"resumen" | "notas">("resumen");
  const [personalNotes, setPersonalNotes] = useState("");
  
  const nodes: Node[] = [
    {
      id: "1", x: 400, y: 300, label: "Sistema Solar", category: "main", connections: ["2", "3", "4", "11", "12"],
      description: "Es el sistema planetario en el que se encuentran la Tierra y otros objetos astronómicos que giran en órbitas elípticas alrededor de una única estrella, el Sol.",
      tags: ["universo", "ciencia"]
    },
    {
      id: "2", x: 220, y: 400, label: "Planetas Interiores", category: "category", connections: ["5", "6", "7"],
      description: "Planetas rocosos cercanos al Sol."
    },
    {
      id: "3", x: 580, y: 400, label: "Planetas Exteriores", category: "category", connections: ["8", "9", "10"],
      description: "Gigantes gaseosos y helados."
    },
    {
      id: "4", x: 400, y: 150, label: "Sol", category: "concept", connections: [],
      description: "Nuestra estrella, fuente de luz y energía.",
      stats: { "Tipo": "Estrella G2V", "Diámetro": "1.39M km", "Temperatura": "5,500 °C" }
    },
    {
      id: "7", x: 340, y: 520, label: "Tierra", category: "concept", connections: [],
      description: "La Tierra es el tercer planeta desde el Sol y el único lugar conocido que alberga vida.",
      image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=800",
      stats: { "Tipo": "Terrestre", "Diámetro": "12,742 km", "Lunas": "1", "Temp. Media": "15 °C" },
      tags: ["vida", "hogar"]
    },
    {
      id: "11", x: 200, y: 700, label: "Características del Sistema Solar", category: "concept", connections: [],
      description: "8 planetas, 1 estrella, unido por gravedad.", isSticky: true, color: "#f0fdf4"
    },
    {
      id: "12", x: 500, y: 700, label: "Datos Curiosos", category: "concept", connections: [],
      description: "Un día en Venus es más largo que su año.", isSticky: true, color: "#fffbeb"
    },
    { id: "5", x: 100, y: 520, label: "Mercurio", category: "concept", connections: [] },
    { id: "6", x: 220, y: 540, label: "Venus", category: "concept", connections: [] },
    { id: "8", x: 460, y: 540, label: "Júpiter", category: "concept", connections: [] },
    { id: "9", x: 580, y: 520, label: "Saturno", category: "concept", connections: [] },
    { id: "10", x: 700, y: 540, label: "Urano", category: "concept", connections: [] },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    if (!liked) {
      toast.success("¡Te gustó este mapa!");
    }
  };

  const handleExport = (format: string) => {
    toast.success(`Exportando mapa como ${format.toUpperCase()}...`);
    setShowExportModal(false);
  };

  const handleShare = (platform: string) => {
    toast.success(`Compartiendo en ${platform}...`);
    setShowShareModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("¡Enlace copiado!");
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      { id: Date.now(), user: "Tú", text: newComment, time: "ahora" }
    ]);
    setNewComment("");
  };

  const getNodeWidth = (label: string, category: string) => {
    const baseWidth = label.length * 8 + 40;
    return category === "main" ? Math.max(baseWidth, 140) : Math.max(baseWidth, 100);
  };
  
  const getNodeHeight = (category: string) => {
    return category === "main" ? 56 : 40;
  };

  const getNodeColors = (category: string, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) {
      return { fill: "var(--primary-subtle)", stroke: "var(--primary)", text: "var(--primary)" };
    }
    if (isHovered) {
      return { fill: "var(--primary-subtle)", stroke: "var(--border)", text: "var(--primary)" };
    }
    if (category === "main") {
      return { fill: "var(--primary)", stroke: "var(--primary-hover)", text: "var(--primary-foreground)" };
    }
    return { fill: "var(--card)", stroke: "var(--border)", text: "var(--foreground)" };
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
  ];

  return (
    <>
      <div className="h-screen bg-background flex flex-col font-sans overflow-hidden text-foreground">
      <nav className="px-6 py-4 bg-background border-b border-border flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="bg-muted px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                <span className="text-sm font-bold">Sistema Solar</span>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
             </div>
             <div className="flex bg-muted p-1 rounded-lg border border-border">
                <button className="p-1.5 text-muted-foreground hover:text-foreground"><Undo2 className="w-4 h-4" /></button>
                <button className="p-1.5 text-muted-foreground hover:text-foreground"><Redo2 className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-border mx-1 mt-1.5" />
                <button className="p-1.5 text-muted-foreground hover:text-foreground"><LayoutGrid className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {avatars.map((av, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted">
                <img src={av} alt="Collaborator" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-background bg-primary-subtle text-primary text-[10px] font-bold flex items-center justify-center">
              +4
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => {
                setIsPublic(!isPublic);
                toast.success(isPublic ? "Mapa ahora es privado" : "Mapa ahora es público");
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                isPublic ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card"
              }`}
            >
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button onClick={handleLike} className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-card">
              <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : ""}`} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-card relative">
              <MessageCircle className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-background"></span>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-all shadow-md shadow-primary/20">
               <Share2 className="w-3.5 h-3.5" /> Compartir
            </button>
          </div>
          <div className="flex items-center gap-2">
             <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"><Search className="w-5 h-5" /></button>
             <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"><Bell className="w-5 h-5" /></button>
             <button className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Camila" alt="User" />
             </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative overflow-hidden flex bg-[#f8f9fb]" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-2 bg-card border border-border rounded-2xl shadow-xl">
           <button className="p-3 rounded-xl bg-primary-subtle text-primary"><MousePointer2 className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><LayoutGrid className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><Type className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><Square className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><StickyNote className="w-5 h-5" /></button>
           <div className="h-px bg-border mx-2" />
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><Eraser className="w-5 h-5" /></button>
           <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted"><MoreHorizontal className="w-5 h-5" /></button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20 flex items-center gap-4">
           <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-xl shadow-lg">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 rounded-lg text-muted-foreground hover:bg-muted"><Minus className="w-4 h-4" /></button>
              <span className="text-xs font-bold w-12 text-center text-foreground">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg text-muted-foreground hover:bg-muted"><Plus className="w-4 h-4" /></button>
           </div>
           <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-xl shadow-lg">
              <button onClick={() => setPan({x: 0, y: 0})} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted">
                 <Maximize className="w-3.5 h-3.5" /> Centrar mapa
              </button>
              <div className="w-px h-4 bg-border" />
              <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted">
                 <Download className="w-3.5 h-3.5" /> Exportar
              </button>
           </div>
        </div>

        <div className="flex-1 relative">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
               if ((e.target as HTMLElement).tagName === "svg") {
                  setSelectedNode(null);
               }
            }}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {nodes.map((node) =>
                node.connections.map((connId) => {
                  const parent = node;
                  const child = nodes.find((n) => n.id === connId);
                  if (!child) return null;
                  
                  const dx = child.x - parent.x;
                  const dy = child.y - parent.y;
                  const path = `M ${parent.x} ${parent.y} C ${parent.x} ${parent.y + dy/2}, ${child.x} ${child.y - dy/2}, ${child.x} ${child.y}`;
                  
                  return (
                    <motion.path
                      key={`${parent.id}-${child.id}`}
                      d={path}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeOpacity="0.2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                    />
                  );
                })
              )}
            </g>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNode === node.id;
                const colors = getNodeColors(node.category, isHovered, isSelected);
                const width = node.isSticky ? 160 : getNodeWidth(node.label, node.category);
                const height = node.isSticky ? 160 : getNodeHeight(node.category);

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer"
                  >
                    {node.isSticky ? (
                      <g style={{ filter: "drop-shadow(3px 6px 12px rgba(0,0,0,0.1))" }}>
                        <rect
                          x={node.x - width / 2}
                          y={node.y - height / 2}
                          width={width}
                          height={height}
                          fill={node.color || "#fff"}
                          stroke="#000"
                          strokeWidth="1"
                          strokeOpacity="0.05"
                          transform={`rotate(${(parseInt(node.id) % 2 === 0 ? 1 : -1) * 2}, ${node.x}, ${node.y})`}
                        />
                        <foreignObject 
                          x={node.x - width / 2 + 15} 
                          y={node.y - height / 2 + 20} 
                          width={width - 30} 
                          height={height - 40}
                          transform={`rotate(${(parseInt(node.id) % 2 === 0 ? 1 : -1) * 2}, ${node.x}, ${node.y})`}
                        >
                          <div className="flex flex-col h-full pointer-events-none">
                            <h4 className="text-xs font-bold text-foreground mb-2 leading-tight">
                              {node.label}
                            </h4>
                            {node.description && (
                              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                {node.description}
                              </p>
                            )}
                          </div>
                        </foreignObject>
                      </g>
                    ) : (
                      <>
                        <rect
                          x={node.x - width / 2}
                          y={node.y - height / 2}
                          width={width}
                          height={height}
                          rx={node.category === "main" ? "16" : "12"}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth={isSelected ? "3" : "2"}
                          className="transition-all"
                        />
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={`font-bold select-none ${
                            node.category === "main" ? "text-sm" : "text-xs"
                          }`}
                          fill={colors.text}
                          style={{ fontFamily: "inherit" }}
                        >
                          {node.label}
                        </text>
                      </>
                    )}
                  </motion.g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Enhanced Node Details Sidebar */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-2xl z-40 flex flex-col"
            >
              <div className="flex items-center justify-between p-6">
                 <div className="flex items-center gap-3">
                    <div>
                       <h2 className="text-lg font-bold text-foreground leading-tight">{selectedNodeData.label}</h2>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {selectedNodeData.category === "main" ? "Sistema" : "Concepto"}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedNode(null)} className="p-2 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="px-6 pb-2">
                 <div className="flex border-b border-border">
                    <button 
                      onClick={() => setActiveTab("resumen")}
                      className={`px-4 py-2 text-xs font-bold transition-all relative ${
                        activeTab === "resumen" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                       Resumen
                       {activeTab === "resumen" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                    </button>
                    <button 
                      onClick={() => setActiveTab("notas")}
                      className={`px-4 py-2 text-xs font-bold transition-all relative ${
                        activeTab === "notas" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                       Notas
                       {activeTab === "notas" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {activeTab === "resumen" ? (
                  <>
                    {selectedNodeData.image && (
                      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                        <img src={selectedNodeData.image} alt={selectedNodeData.label} className="w-full h-48 object-cover" />
                      </div>
                    )}

                    <div className="space-y-4">
                       <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                          {selectedNodeData.description}
                       </p>
                    </div>

                    {selectedNodeData.stats && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Características</h4>
                          <div className="grid grid-cols-2 gap-3">
                             {Object.entries(selectedNodeData.stats).map(([key, val]) => (
                               <div key={key} className="p-3 bg-muted rounded-xl border border-border">
                                  <div className="text-[10px] text-muted-foreground font-bold mb-1 uppercase tracking-tighter">{key}</div>
                                  <div className="text-xs font-bold text-foreground">{val}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    <div>
                       <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Conexiones</h4>
                       <div className="flex flex-wrap gap-2">
                          {selectedNodeData.connections.map((connId) => {
                             const connNode = nodes.find(n => n.id === connId);
                             return (
                                <div key={connId} className="px-3 py-1.5 bg-muted border border-border rounded-xl text-[10px] font-bold text-foreground flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                   {connNode?.label}
                                </div>
                             );
                          })}
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 h-full flex flex-col">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nota Personal</h4>
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                     </div>
                     <textarea 
                        value={personalNotes}
                        onChange={(e) => setPersonalNotes(e.target.value)}
                        placeholder="Escribe tus notas aquí..."
                        className="flex-1 w-full p-4 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                     />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                 <button className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20">
                    Exportar concepto
                 </button>
                 <button className="p-3 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                    <Share2 className="w-4 h-4" />
                 </button>
                 <button className="p-3 rounded-xl border border-border text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* Comments Sidebar */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 h-full w-80 bg-card border-l border-border shadow-2xl z-40 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                 <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Comentarios
                 </h2>
                 <button 
                    onClick={() => setShowComments(false)}
                    className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{comment.user}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{comment.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted p-3 rounded-xl border border-border">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-border bg-muted/50">
                 <form onSubmit={handleAddComment} className="relative">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                    >
                       <Send className="w-4 h-4" />
                    </button>
                 </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-foreground tracking-tight">
                Exportar mapa
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <div className="space-y-3">
              {["PNG", "PDF", "JSON"].map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full p-4 rounded-lg bg-card border border-border hover:border-primary/20 hover:bg-muted transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-card border border-border group-hover:border-primary/20 transition-colors">
                       <FileDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="text-foreground font-semibold mb-0.5 group-hover:text-primary transition-colors">
                        Exportar como {format}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground group-hover:text-primary/70 transition-colors">
                        {format === "PNG" && "Imagen de alta resolución"}
                        {format === "PDF" && "Documento listo para imprimir"}
                        {format === "JSON" && "Datos estructurados para devs"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showShareModal} onOpenChange={setShowShareModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-foreground tracking-tight">
                Compartir mapa
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full p-4 rounded-lg bg-card border border-border hover:border-primary/20 hover:bg-muted transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-card border border-border group-hover:border-primary/20 transition-colors">
                     <Copy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-foreground font-semibold group-hover:text-primary transition-colors">Copiar enlace</div>
                </div>
              </button>
              {[
                { name: "Twitter", icon: Twitter },
                { name: "Facebook", icon: Facebook },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name)}
                  className="w-full p-4 rounded-lg bg-card border border-border hover:border-primary/20 hover:bg-muted transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-card border border-border group-hover:border-primary/20 transition-colors">
                       <platform.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-foreground font-semibold group-hover:text-primary transition-colors">
                      Compartir en {platform.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
