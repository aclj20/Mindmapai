import { useState, useRef, useEffect, useCallback } from "react";
import { getToken } from "../hooks/useAuth";
import { jsPDF } from "jspdf";

const API_URL = "http://localhost:3001/api";
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
  Volume2,
  VolumeX,
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
  const [likeCount, setLikeCount] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<{ id: number; user: string; text: string; time: string }[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"resumen" | "notas">("resumen");
  const [personalNotes, setPersonalNotes] = useState("");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [mapTitle, setMapTitle] = useState("Cargando...");
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/maps/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (r.status === 403) { setIsPrivate(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setMapTitle(data.title ?? "Mapa");
        setIsPublic(!!data.is_public);
        setLiked(!!data.liked);
        setLikeCount(data.like_count ?? 0);

        // Construir mapa de nodos con conexiones vacías
        const nodeMap = new Map<number, Node>(
          (data.nodes ?? []).map((n: { id: number; x: number; y: number; label: string; category: string; description?: string; tags?: string[]; stats?: Record<string,string>; is_sticky?: boolean; color?: string }) => [
            n.id,
            {
              id: String(n.id),
              x: n.x,
              y: n.y,
              label: n.label,
              category: n.category,
              description: n.description,
              tags: n.tags ?? [],
              stats: n.stats ?? {},
              isSticky: n.is_sticky,
              color: n.color,
              connections: [],
            },
          ])
        );

        // Poblar conexiones
        for (const c of (data.connections ?? [])) {
          const from = nodeMap.get(c.from_node_id);
          if (from) from.connections.push(String(c.to_node_id));
        }

        setNodes(Array.from(nodeMap.values()));
      })
      .catch(() => setMapTitle("Error al cargar"))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchComments = useCallback(() => {
    if (!id) return;
    fetch(`${API_URL}/maps/${id}/comments`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) =>
        setComments(
          data.map((c: { id: number; user: string; text: string; created_at: string }) => ({
            id: c.id,
            user: c.user,
            text: c.text,
            time: c.created_at,
          }))
        )
      )
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments, fetchComments]);

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
    fetch(`${API_URL}/maps/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked);
        setLikeCount(data.like_count);
        if (data.liked) toast.success("¡Te gustó este mapa!");
      })
      .catch(() => {});
  };

  const handleExport = (format: string) => {
    const normalized = format.toLowerCase();
    setShowExportModal(false);
    if (normalized === "png") {
      exportAsPng().catch((err) => {
        console.error("Error exportando PNG:", err);
        toast.error("No se pudo exportar el mapa");
      });
      return;
    }
    if (normalized === "pdf") {
      exportAsPdf().catch((err) => {
        console.error("Error exportando PDF:", err);
        toast.error("No se pudo exportar el mapa");
      });
      return;
    }
    if (normalized === "json") {
      exportAsJson();
      return;
    }
    toast.error("Formato de exportacion no soportado");
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
    const text = newComment.trim();
    setNewComment("");
    fetch(`${API_URL}/maps/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ text }),
    })
      .then(() => fetchComments())
      .catch(() => {});
  };

  const handleReadAloud = () => {
    if (!window.speechSynthesis) {
      toast.error("Tu navegador no soporta texto a voz");
      return;
    }
    window.speechSynthesis.cancel();
    setIsReading(true);

    const parts: string[] = [
      `Mapa conceptual: ${mapTitle}. Este mapa tiene ${nodes.length} conceptos.`,
    ];

    nodes.forEach((node, i) => {
      parts.push(`Concepto ${i + 1}: ${node.label}.`);
      if (node.description) parts.push(node.description);
      const connLabels = node.connections
        .map((cid) => nodes.find((n) => n.id === cid)?.label)
        .filter(Boolean);
      if (connLabels.length > 0)
        parts.push(`Se relaciona con: ${connLabels.join(", ")}.`);
    });

    const utterance = new SpeechSynthesisUtterance(parts.join(" "));
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopReading = () => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
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

  const getThemeValue = (token: string, fallback: string) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return raw || fallback;
  };

  const getExportPalette = () => ({
    primary: getThemeValue("--primary", "#4f46e5"),
    primaryHover: getThemeValue("--primary-hover", "#4338ca"),
    primaryForeground: getThemeValue("--primary-foreground", "#ffffff"),
    primarySubtle: getThemeValue("--primary-subtle", "#e0e7ff"),
    card: getThemeValue("--card", "#ffffff"),
    border: getThemeValue("--border", "#e5e7eb"),
    foreground: getThemeValue("--foreground", "#111827"),
    mutedForeground: getThemeValue("--muted-foreground", "#6b7280"),
  });

  const getNodeExportColors = (category: string, palette: ReturnType<typeof getExportPalette>) => {
    if (category === "main") {
      return {
        fill: palette.primary,
        stroke: palette.primaryHover,
        text: palette.primaryForeground,
      };
    }
    return {
      fill: palette.card,
      stroke: palette.border,
      text: palette.foreground,
    };
  };

  const getNodeSize = (node: Node) => {
    if (node.isSticky) {
      return { width: 160, height: 160 };
    }
    return {
      width: getNodeWidth(node.label, node.category),
      height: getNodeHeight(node.category),
    };
  };

  const getMapBounds = () => {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }
    const bounds = nodes.map((node) => {
      const { width, height } = getNodeSize(node);
      return {
        minX: node.x - width / 2,
        minY: node.y - height / 2,
        maxX: node.x + width / 2,
        maxY: node.y + height / 2,
      };
    });

    const minX = Math.min(...bounds.map((b) => b.minX));
    const minY = Math.min(...bounds.map((b) => b.minY));
    const maxX = Math.max(...bounds.map((b) => b.maxX));
    const maxY = Math.max(...bounds.map((b) => b.maxY));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const wrapText = (text: string, maxChars: number, maxLines: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);

    if (lines.length > maxLines) {
      const trimmed = lines.slice(0, maxLines);
      trimmed[maxLines - 1] = `${trimmed[maxLines - 1].replace(/\.{3}$/, "").trim()}...`;
      return trimmed;
    }
    return lines;
  };

  const buildExportSvg = () => {
    const bounds = getMapBounds();
    const padding = 40;
    const exportWidth = Math.max(bounds.width + padding * 2, 800);
    const exportHeight = Math.max(bounds.height + padding * 2, 600);
    const viewBoxX = bounds.x - padding;
    const viewBoxY = bounds.y - padding;

    const palette = getExportPalette();
    const rawFontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
    const fontFamily = rawFontFamily.split(",")[0].replace(/"/g, "").trim() || "Arial";

    const connectionPaths = nodes.flatMap((node) =>
      node.connections.map((connId) => {
        const child = nodes.find((n) => n.id === connId);
        if (!child) return "";
        const dx = child.x - node.x;
        const dy = child.y - node.y;
        const path = `M ${node.x} ${node.y} C ${node.x} ${node.y + dy / 2}, ${child.x} ${child.y - dy / 2}, ${child.x} ${child.y}`;
        return `<path d=\"${path}\" fill=\"none\" stroke=\"${palette.primary}\" stroke-width=\"2\" stroke-opacity=\"0.2\" />`;
      })
    );

    const nodeMarks = nodes.map((node) => {
      const { width, height } = getNodeSize(node);
      if (node.isSticky) {
        const labelLines = wrapText(node.label, 18, 2);
        const descriptionLines = node.description ? wrapText(node.description, 24, 6) : [];
        const textLines = [...labelLines, ...descriptionLines];
        const baseY = node.y - height / 2 + 26;
        const lineHeight = 14;
        const text = textLines
          .map((line, idx) => {
            const y = baseY + idx * lineHeight;
            const weight = idx < labelLines.length ? "700" : "500";
            const color = idx < labelLines.length ? palette.foreground : palette.mutedForeground;
            return `<tspan x=\"${node.x - width / 2 + 14}\" y=\"${y}\" font-weight=\"${weight}\" fill=\"${color}\">${escapeXml(line)}</tspan>`;
          })
          .join("");
        return `
          <g>
            <rect x=\"${node.x - width / 2}\" y=\"${node.y - height / 2}\" width=\"${width}\" height=\"${height}\" fill=\"${node.color || "#ffffff"}\" stroke=\"rgba(0,0,0,0.1)\" stroke-width=\"1\" rx=\"10\" />
            <text font-family=\"${fontFamily}\" font-size=\"12\">${text}</text>
          </g>`;
      }

      const colors = getNodeExportColors(node.category, palette);
      const radius = node.category === "main" ? 16 : 12;
      return `
        <g>
          <rect x=\"${node.x - width / 2}\" y=\"${node.y - height / 2}\" width=\"${width}\" height=\"${height}\" rx=\"${radius}\" fill=\"${colors.fill}\" stroke=\"${colors.stroke}\" stroke-width=\"2\" />
          <text x=\"${node.x}\" y=\"${node.y}\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"${fontFamily}\" font-size=\"${node.category === "main" ? 14 : 12}\" font-weight=\"700\" fill=\"${colors.text}\">${escapeXml(node.label)}</text>
        </g>`;
    });

    const svgText = `
      <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${exportWidth}\" height=\"${exportHeight}\" viewBox=\"${viewBoxX} ${viewBoxY} ${exportWidth} ${exportHeight}\">
        <rect x=\"${viewBoxX}\" y=\"${viewBoxY}\" width=\"${exportWidth}\" height=\"${exportHeight}\" fill=\"#ffffff\" />
        ${connectionPaths.join("")}
        ${nodeMarks.join("")}
      </svg>
    `;

    return { svgText, width: exportWidth, height: exportHeight };
  };

  const svgToImage = (svgText: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error("No se pudo cargar la imagen"));
      };
      img.src = encoded;
    });

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPng = async () => {
    const data = buildExportSvg();
    if (!data) return;

    const img = await svgToImage(data.svgText);
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(data.width * scale);
    canvas.height = Math.round(data.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) return;
    downloadBlob(blob, `${mapTitle || "mapa"}.png`);
    toast.success("Mapa exportado en PNG");
  };

  const exportAsPdf = async () => {
    const data = buildExportSvg();
    if (!data) return;
    const img = await svgToImage(data.svgText);
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(data.width * scale);
    canvas.height = Math.round(data.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0);

    const pngDataUrl = canvas.toDataURL("image/png");
    const orientation = data.width > data.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [data.width, data.height],
    });
    pdf.addImage(pngDataUrl, "PNG", 0, 0, data.width, data.height);
    pdf.save(`${mapTitle || "mapa"}.pdf`);
    toast.success("Mapa exportado en PDF");
  };

  const exportAsJson = () => {
    const payload = {
      title: mapTitle,
      nodes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(blob, `${mapTitle || "mapa"}.json`);
    toast.success("Mapa exportado en JSON");
  };

  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        Cargando mapa...
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6 p-10 rounded-2xl bg-card border border-border shadow-xl"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Este mapa es privado</h2>
            <p className="text-sm text-muted-foreground">
              Solo el dueño puede ver este mapa. Puedes solicitar acceso y el dueño recibirá tu petición.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => toast.success("Solicitud enviada al dueño del mapa")}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
            >
              Solicitar acceso
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors"
            >
              Volver
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-background flex flex-col font-sans overflow-hidden text-foreground">
      <nav className="px-6 py-4 bg-background border-b border-border flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard/student"
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="bg-muted px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                <span className="text-sm font-bold">{mapTitle}</span>
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
                const next = !isPublic;
                fetch(`${API_URL}/maps/${id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                  },
                  body: JSON.stringify({ is_public: next }),
                })
                  .then((r) => {
                    if (r.ok) {
                      setIsPublic(next);
                      toast.success(next ? "Mapa ahora es público" : "Mapa ahora es privado");
                    }
                  })
                  .catch(() => toast.error("No se pudo cambiar la visibilidad"));
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
              <div className="w-px h-4 bg-border" />
              <button
                onClick={isReading ? handleStopReading : handleReadAloud}
                aria-label={isReading ? "Detener lectura" : "Leer mapa en voz alta"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isReading
                    ? "text-primary bg-primary-subtle hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {isReading ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isReading ? "Detener" : "Leer mapa"}
              </button>
           </div>
        </div>

        {/* Contenido accesible para screen readers — visualmente oculto */}
        <section className="sr-only" aria-label={`Mapa conceptual: ${mapTitle}`}>
          <h1>{mapTitle}</h1>
          <p>{nodes.length} conceptos en este mapa.</p>
          <ul>
            {nodes.map((node) => {
              const connLabels = node.connections
                .map((cid) => nodes.find((n) => n.id === cid)?.label)
                .filter(Boolean);
              const incomingLabels = nodes
                .filter((n) => n.connections.includes(node.id))
                .map((n) => n.label);
              return (
                <li key={node.id}>
                  <h2>{node.label}</h2>
                  {node.description && <p>{node.description}</p>}
                  {connLabels.length > 0 && <p>Conecta con: {connLabels.join(", ")}.</p>}
                  {incomingLabels.length > 0 && <p>Referenciado por: {incomingLabels.join(", ")}.</p>}
                </li>
              );
            })}
          </ul>
        </section>

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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedNode(node.id);
                      }
                    }}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={
                      node.description
                        ? `${node.label}: ${node.description}`
                        : node.label
                    }
                    aria-pressed={selectedNode === node.id}
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

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === "resumen" ? (
                  <>
                    {/* Descripción */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Descripción</h4>
                      {selectedNodeData.description ? (
                        <p className="text-sm text-foreground leading-relaxed">
                          {selectedNodeData.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Sin descripción disponible.</p>
                      )}
                    </div>

                    {/* Relaciones salientes */}
                    {selectedNodeData.connections.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conecta con</h4>
                        <div className="flex flex-col gap-2">
                          {selectedNodeData.connections.map((connId) => {
                            const connNode = nodes.find(n => n.id === connId);
                            if (!connNode) return null;
                            return (
                              <button
                                key={connId}
                                onClick={() => setSelectedNode(connId)}
                                className="flex items-start gap-3 p-3 bg-muted border border-border rounded-xl hover:border-primary/40 hover:bg-primary-subtle transition-colors text-left group"
                              >
                                <div className="w-2 h-2 rounded-full bg-primary/50 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
                                <div>
                                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{connNode.label}</p>
                                  {connNode.description && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{connNode.description}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Relaciones entrantes */}
                    {(() => {
                      const incoming = nodes.filter(n => n.connections.includes(selectedNodeData.id));
                      if (incoming.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Referenciado por</h4>
                          <div className="flex flex-col gap-2">
                            {incoming.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => setSelectedNode(n.id)}
                                className="flex items-start gap-3 p-3 bg-muted border border-border rounded-xl hover:border-primary/40 hover:bg-primary-subtle transition-colors text-left group"
                              >
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0 group-hover:bg-primary/60 transition-colors" />
                                <div>
                                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{n.label}</p>
                                  {n.description && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {selectedNodeData.stats && Object.keys(selectedNodeData.stats).length > 0 && (
                       <div className="space-y-2">
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
{/*               {[
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
              ))} */}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
