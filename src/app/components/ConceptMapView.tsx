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
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes: Node[] = [
    {
      id: "1",
      x: 400,
      y: 300,
      label: "Sistema Solar",
      category: "main",
      connections: ["2", "3", "4"],
    },
    {
      id: "2",
      x: 220,
      y: 400,
      label: "Planetas Interiores",
      category: "category",
      connections: ["5", "6", "7"],
    },
    {
      id: "3",
      x: 580,
      y: 400,
      label: "Planetas Exteriores",
      category: "category",
      connections: ["8", "9", "10"],
    },
    {
      id: "4",
      x: 400,
      y: 180,
      label: "Sol",
      category: "concept",
      connections: [],
    },
    {
      id: "5",
      x: 100,
      y: 520,
      label: "Mercurio",
      category: "concept",
      connections: [],
    },
    {
      id: "6",
      x: 220,
      y: 540,
      label: "Venus",
      category: "concept",
      connections: [],
    },
    {
      id: "7",
      x: 340,
      y: 520,
      label: "Tierra",
      category: "concept",
      connections: [],
    },
    {
      id: "8",
      x: 460,
      y: 540,
      label: "Júpiter",
      category: "concept",
      connections: [],
    },
    {
      id: "9",
      x: 580,
      y: 520,
      label: "Saturno",
      category: "concept",
      connections: [],
    },
    {
      id: "10",
      x: 700,
      y: 540,
      label: "Urano",
      category: "concept",
      connections: [],
    },
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

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col">
      <nav className="p-4 backdrop-blur-sm bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/student"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">Sistema Solar</h1>
            <p className="text-xs text-gray-500">24 conceptos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`p-2 rounded-lg border transition-all ${
              liked
                ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
          </button>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Exportar</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
            className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="nodeGradientMain">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="nodeGradientCategory">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="nodeGradientConcept">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {nodes.map((node) =>
              node.connections.map((connId) => {
                const targetNode = nodes.find((n) => n.id === connId);
                if (!targetNode) return null;
                const isConnectedToHovered =
                  hoveredNode === node.id || hoveredNode === connId;
                return (
                  <motion.line
                    key={`${node.id}-${connId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isConnectedToHovered ? "#06b6d4" : "#374151"}
                    strokeWidth={isConnectedToHovered ? 1.5 : 1}
                    strokeOpacity={isConnectedToHovered ? 0.8 : 0.3}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                );
              })
            )}

            {nodes.map((node, i) => {
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const radius = node.category === "main" ? 50 : 35;
              const scale = isHovered ? 1.15 : isSelected ? 1.1 : 1;

              return (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={
                      node.category === "main"
                        ? "url(#nodeGradientMain)"
                        : node.category === "category"
                          ? "url(#nodeGradientCategory)"
                          : "url(#nodeGradientConcept)"
                    }
                    filter={isHovered || isSelected ? "url(#glow)" : "none"}
                    onClick={() => setSelectedNode(node.id)}
                    className="cursor-pointer"
                    animate={{ scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    strokeWidth={isSelected ? 2 : 0}
                    stroke="#06b6d4"
                  />
                  {(isHovered || node.category !== "concept") && (
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={node.category === "main" ? "14" : "12"}
                      fontWeight="500"
                      className="pointer-events-none select-none"
                      opacity={isHovered ? 1 : 0.9}
                    >
                      {node.label}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </g>
        </svg>

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white max-w-sm"
            >
              <h3 className="font-semibold mb-2">
                {nodes.find((n) => n.id === selectedNode)?.label}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Conexiones:{" "}
                {nodes.find((n) => n.id === selectedNode)?.connections.length}
              </p>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 md:p-4 backdrop-blur-sm bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />8
            </span>
            <span className="hidden md:inline">127 vistas</span>
          </div>
          <div className="text-xs">Hace 2 horas</div>
        </div>
      </div>

      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a24] rounded-2xl p-6 w-full max-w-md border border-white/10 z-50">
            <Dialog.Title className="text-xl font-semibold text-white mb-4">
              Exportar mapa
            </Dialog.Title>
            <div className="space-y-3">
              {["PNG", "PDF", "JSON"].map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-white font-medium">
                        Exportar como {format}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format === "PNG" && "Imagen de alta calidad"}
                        {format === "PDF" && "Documento imprimible"}
                        {format === "JSON" && "Datos estructurados"}
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
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a24] rounded-2xl p-6 w-full max-w-md border border-white/10 z-50">
            <Dialog.Title className="text-xl font-semibold text-white mb-4">
              Compartir mapa
            </Dialog.Title>
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-5 h-5 text-cyan-400" />
                  <div className="text-white font-medium">Copiar enlace</div>
                </div>
              </button>
              {[
                { name: "Twitter", icon: Twitter },
                { name: "Facebook", icon: Facebook },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name)}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <platform.icon className="w-5 h-5 text-cyan-400" />
                    <div className="text-white font-medium">
                      Compartir en {platform.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
