import { useState, useRef, useEffect, useCallback } from "react";
import { getToken, logout, getAvatarInitials, getAuthUser } from "../hooks/useAuth";
import { jsPDF } from "jspdf";

const API_URL = "http://localhost:3001/api";
import { Link, useParams, useNavigate } from "react-router";
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
  Sparkles,
  Trophy,
  HelpCircle,
  Award,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
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
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const handleFetchResponse = useCallback(async (r: Response) => {
    if (r.status === 401) {
      logout();
      navigate("/login");
      throw new Error("Sesión vencida. Inicia sesión de nuevo.");
    }
    const data = await r.json();
    if (!r.ok) {
      throw new Error(data.message || "Error al realizar la petición");
    }
    return data;
  }, [navigate]);

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
  const [ownerName, setOwnerName] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // Estados de barra de herramientas y edición
  const [activeTool, setActiveTool] = useState<"select" | "concept" | "text" | "shape" | "eraser">("select");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
  const [newNodeCoords, setNewNodeCoords] = useState({ x: 0, y: 0 });
  const [newNodeType, setNewNodeType] = useState<"concept" | "text" | "shape">("concept");
  const [newNodeLabel, setNewNodeLabel] = useState("");

  // Colaboración y Permisos
  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer" | null>(null);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [mapGroupId, setMapGroupId] = useState<number | null>(null);
  const [groupPublicId, setGroupPublicId] = useState<string | null>(null);
  const [sharingInfo, setSharingInfo] = useState<{
    is_public: boolean;
    invite_code: string | null;
    collaborators: { user_id: number; role: "editor" | "viewer"; name: string; email: string }[];
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [sharingLoading, setSharingLoading] = useState(false);

  // Estados del Tutor IA
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<{ sender: "user" | "ai"; text: string; suggestions?: { label: string; description: string }[] }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Estados para quiz
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<{ id: number; question: string; options: string[]; answerIndex: number; explanation: string }[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const saveMapState = useCallback((currentNodes: Node[]) => {
    const postConnections: { from_node_id: number; to_node_id: number }[] = [];
    currentNodes.forEach((n) => {
      (n.connections || []).forEach((cid) => {
        postConnections.push({
          from_node_id: parseInt(n.id),
          to_node_id: parseInt(cid),
        });
      });
    });

    return fetch(`${API_URL}/maps/${id}/nodes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        nodes: currentNodes.map(n => ({
          id: parseInt(n.id),
          x: Math.round(n.x),
          y: Math.round(n.y),
          label: n.label,
          category: n.category || 'concept',
          description: n.description || '',
          tags: n.tags || [],
          stats: n.stats || {},
          is_sticky: n.isSticky ? 1 : 0,
          color: n.color || null
        })),
        connections: postConnections
      })
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al persistir el estado del mapa");
        return r.json();
      })
      .catch((err) => {
        console.error(err);
        toast.error("No se pudo guardar el estado del mapa en el servidor.");
      });
  }, [id]);

  const handleConsultAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim() || aiLoading) return;

    const queryText = aiChatQuery.trim();
    setAiChatQuery("");
    setAiChatHistory((prev) => [...prev, { sender: "user", text: queryText }]);
    setAiLoading(true);

    fetch(`${API_URL}/maps/${id}/consult-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ query: queryText }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error en la consulta con la IA");
        return r.json();
      })
      .then((data) => {
        setAiChatHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.explanation,
            suggestions: data.suggested_nodes || [],
          },
        ]);
      })
      .catch(() => {
        toast.error("El tutor IA no pudo responder en este momento.");
        setAiChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: "Lo siento, tuve un problema al procesar tu consulta. Por favor intenta de nuevo." },
        ]);
      })
      .finally(() => setAiLoading(false));
  };

  const handleInsertSuggestions = (suggestions: { label: string; description: string }[], suggestedConnections: { from: string; to: string }[]) => {
    if (!suggestions || suggestions.length === 0) return;

    const mainNode = nodes.find(n => n.category === 'main') || nodes[0];
    const refX = mainNode ? mainNode.x : 500;
    const refY = mainNode ? mainNode.y : 350;

    const maxExistingId = nodes.reduce((max, n) => Math.max(max, isNaN(Number(n.id)) ? 0 : Number(n.id)), 0);
    let nextId = maxExistingId + 1;

    const addedNodes: Node[] = [];
    const updatedNodes = nodes.map(n => ({ ...n, connections: [...n.connections] }));

    suggestions.forEach((s, idx) => {
      const angle = (idx * 2 * Math.PI) / suggestions.length;
      const x = Math.round(refX + 220 * Math.cos(angle));
      const y = Math.round(refY + 220 * Math.sin(angle));
      const newIdStr = String(nextId++);

      const newNode: Node = {
        id: newIdStr,
        x,
        y,
        label: s.label,
        category: 'concept',
        description: s.description,
        tags: [],
        stats: {},
        isSticky: false,
        connections: []
      };
      addedNodes.push(newNode);
      updatedNodes.push(newNode);
    });

    const labelToIdMap = new Map<string, string>();
    updatedNodes.forEach(n => labelToIdMap.set(n.label.toLowerCase().trim(), n.id));

    if (suggestedConnections && suggestedConnections.length > 0) {
      suggestedConnections.forEach((conn) => {
        const fromId = labelToIdMap.get(conn.from.toLowerCase().trim());
        const toId = labelToIdMap.get(conn.to.toLowerCase().trim());
        if (fromId && toId) {
          const fromNode = updatedNodes.find(n => n.id === fromId);
          if (fromNode && !fromNode.connections.includes(toId)) {
            fromNode.connections.push(toId);
          }
        }
      });
    } else {
      if (mainNode) {
        addedNodes.forEach((n) => {
          const mainNodeInList = updatedNodes.find(un => un.id === mainNode.id);
          if (mainNodeInList && !mainNodeInList.connections.includes(n.id)) {
            mainNodeInList.connections.push(n.id);
          }
        });
      }
    }

    saveMapState(updatedNodes)
      .then(() => {
        setNodes(updatedNodes);
        toast.success("¡Conceptos sugeridos agregados al mapa conceptual!");
      });
  };

  const handleStartQuiz = () => {
    setShowQuizModal(true);
    setQuizLoading(true);
    setQuizStarted(false);
    setQuizCompleted(false);

    fetch(`${API_URL}/maps/${id}/quiz/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          if (r.status === 403 && mapGroupId && !isGroupAdmin) {
            throw new Error("El administrador del grupo aún no ha publicado el quiz para este mapa.");
          }
          throw new Error(err.message || "No se pudo generar el quiz");
        }
        return r.json();
      })
      .then((data) => {
        setQuizQuestions(data.questions || []);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswerIndex(null);
        setQuizScore(0);
        setCorrectCount(0);
        setShowExplanation(false);
      })
      .catch((err: Error) => {
        toast.error(err.message || "No se pudo cargar el quiz. Asegúrate de tener al menos 2 conceptos creados.");
        setShowQuizModal(false);
      })
      .finally(() => setQuizLoading(false));
  };

  const handleSelectOption = (index: number) => {
    if (selectedAnswerIndex !== null) return;
    setSelectedAnswerIndex(index);
    const isCorrect = index === quizQuestions[currentQuestionIndex].answerIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setQuizScore((s) => s + 25);
      toast.success("¡Respuesta correcta!");
    } else {
      toast.error("Respuesta incorrecta.");
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setSelectedAnswerIndex(null);
    setShowExplanation(false);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSubmitQuiz = () => {
    setActionLoading(true);
    fetch(`${API_URL}/maps/${id}/quiz/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        score: quizScore,
        total_questions: quizQuestions.length,
        correct_answers: correctCount,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al guardar el quiz");
        return r.json();
      })
      .then((data) => {
        toast.success(`Cuestionario guardado con éxito. Obtuviste ${data.score} puntos y ganaste ${data.xpReward} XP.`);
        setShowQuizModal(false);
      })
      .catch((err) => {
        toast.error(err.message || "Error al registrar el puntaje.");
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const fetchSharingInfo = useCallback(() => {
    if (!id || userRole !== 'owner') return;
    setSharingLoading(true);
    fetch(`${API_URL}/maps/${id}/sharing`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(handleFetchResponse)
      .then(setSharingInfo)
      .catch(() => {})
      .finally(() => setSharingLoading(false));
  }, [id, userRole, handleFetchResponse]);

  useEffect(() => {
    if (showShareModal && userRole === 'owner') {
      fetchSharingInfo();
    }
  }, [showShareModal, userRole, fetchSharingInfo]);

  const handleGenerateInviteCode = () => {
    fetch(`${API_URL}/maps/${id}/sharing/invite-code`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(() => {
        toast.success("Código de invitación generado");
        fetchSharingInfo();
      })
      .catch(() => toast.error("Error al generar el código"));
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    fetch(`${API_URL}/maps/${id}/collaborators`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Error al invitar");
        return data;
      })
      .then(() => {
        toast.success("Colaborador agregado");
        setInviteEmail("");
        fetchSharingInfo();
      })
      .catch((err) => toast.error(err.message));
  };

  const handleChangeRole = (userId: number, role: "editor" | "viewer") => {
    fetch(`${API_URL}/maps/${id}/collaborators/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ role }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al cambiar rol");
        toast.success("Rol actualizado");
        fetchSharingInfo();
      })
      .catch((err) => toast.error(err.message));
  };

  const handleRemoveCollaborator = (userId: number) => {
    fetch(`${API_URL}/maps/${id}/collaborators/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al remover colaborador");
        toast.success("Colaborador removido");
        fetchSharingInfo();
      })
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/maps/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (r.status === 403) { setIsPrivate(true); setLoading(false); return null; }
        return handleFetchResponse(r);
      })
      .then((data) => {
        if (!data) return;
        setMapTitle(data.title ?? "Mapa");
        setIsPublic(!!data.is_public);
        setLiked(!!data.liked);
        setLikeCount(data.like_count ?? 0);
        setUserRole(data.userRole || null);
        setIsGroupAdmin(!!data.is_group_admin);
        setMapGroupId(data.group_id || null);
        setGroupPublicId(data.group_public_id || null);
        setOwnerName(data.owner_name ?? "Propietario");
        setCreatedAt(data.created_at || "");
        setSharingInfo({
          is_public: !!data.is_public,
          invite_code: data.invite_code || null,
          collaborators: data.collaborators || [],
        });

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
  }, [id, handleFetchResponse]);

  const fetchComments = useCallback(() => {
    if (!id) return;
    fetch(`${API_URL}/maps/${id}/comments`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(handleFetchResponse)
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
  }, [id, handleFetchResponse]);

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
    if (draggedNodeId && userRole !== "viewer") {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === draggedNodeId) {
            return { ...n, x: n.x + dx, y: n.y + dy };
          }
          return n;
        })
      );
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeId) {
      setDraggedNodeId(null);
      setNodes((currentNodes) => {
        saveMapState(currentNodes);
        return currentNodes;
      });
    }
    setIsDragging(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (userRole === "viewer") return;

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode?.category === "main") {
      toast.error("El concepto principal no puede ser eliminado");
      return;
    }

    const updatedNodes = nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        connections: n.connections.filter(cid => cid !== nodeId)
      }));

    setNodes(updatedNodes);
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    saveMapState(updatedNodes);
    toast.success("Concepto eliminado");
  };

  const handleDeleteConnection = (fromId: string, toId: string) => {
    if (userRole === "viewer") return;
    
    const updatedNodes = nodes.map(node => {
      if (node.id === fromId) {
        return {
          ...node,
          connections: node.connections.filter(cid => cid !== toId)
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    saveMapState(updatedNodes);
    toast.success("Conexión eliminada");
  };

  const handleCreateNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const newId = String(Date.now());
    
    const newNode: Node = {
      id: newId,
      x: newNodeCoords.x,
      y: newNodeCoords.y,
      label: newNodeLabel.trim(),
      category: "concept",
      description: "",
      tags: [],
      stats: {},
      isSticky: false,
      color: undefined,
      connections: [],
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setShowCreateNodeModal(false);
    saveMapState(updatedNodes);
    setActiveTool("select");
    toast.success("Concepto creado exitosamente");
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

  const getNodeColors = (node: Node, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) {
      return { fill: node.color ? `${node.color}cc` : "var(--primary-subtle)", stroke: "var(--primary)", text: "var(--primary)" };
    }
    if (isHovered) {
      return { fill: node.color ? `${node.color}99` : "var(--primary-subtle)", stroke: "var(--border)", text: "var(--primary)" };
    }
    if (node.category === "main") {
      return { fill: "var(--primary)", stroke: "var(--primary-hover)", text: "var(--primary-foreground)" };
    }
    return { fill: node.color || "var(--card)", stroke: "var(--border)", text: "var(--foreground)" };
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

  const wrapText = (text: string, maxWidth: number, maxLines: number, font: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return [text];
    ctx.font = font;

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      const nextWidth = ctx.measureText(next).width;
      if (nextWidth > maxWidth && current) {
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
    const viewBoxX = bounds.x - padding;
    const viewBoxY = bounds.y - padding;

    const palette = getExportPalette();
    const rawFontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
    const fontFamily = rawFontFamily.split(",")[0].replace(/"/g, "").trim() || "Arial";

    const descriptionItems = nodes
      .filter((node) => node.description && node.description.trim())
      .map((node) => ({
        label: node.label.trim(),
        description: node.description?.trim() ?? "",
      }));

    const descriptionTitle = descriptionItems.length > 0 ? "Descripciones" : "";
    const descriptionBlockWidth = exportWidth - padding * 2;
    const descriptionX = viewBoxX + padding;
    const descriptionStartY = bounds.y + bounds.height + padding * 2;
    const descriptionLineHeight = 16;
    const descriptionPaddingY = 16;
    const descriptionGap = 8;
    const descriptionTextWidth = descriptionBlockWidth;

    let descriptionContentY = descriptionStartY + descriptionLineHeight;
    const descriptionTextElements: string[] = [];

    descriptionItems.forEach((item, index) => {
      const labelLines = wrapText(item.label, descriptionTextWidth, 2, `700 13px ${fontFamily}`);
      const descriptionLines = wrapText(item.description, descriptionTextWidth, 10, `500 12px ${fontFamily}`);

      labelLines.forEach((line) => {
        descriptionTextElements.push(
          `<text x=\"${descriptionX}\" y=\"${descriptionContentY}\" font-family=\"${fontFamily}\" font-size=\"13\" font-weight=\"700\" fill=\"${palette.foreground}\">${escapeXml(line)}</text>`
        );
        descriptionContentY += descriptionLineHeight;
      });

      descriptionLines.forEach((line) => {
        descriptionTextElements.push(
          `<text x=\"${descriptionX}\" y=\"${descriptionContentY}\" font-family=\"${fontFamily}\" font-size=\"12\" font-weight=\"500\" fill=\"${palette.mutedForeground}\">${escapeXml(line)}</text>`
        );
        descriptionContentY += descriptionLineHeight;
      });

      if (index < descriptionItems.length - 1) {
        descriptionContentY += descriptionGap;
      }
    });

    const descriptionContentBottom = descriptionTextElements.length > 0
      ? descriptionContentY
      : descriptionStartY + descriptionLineHeight;
    const descriptionHeight = descriptionItems.length > 0
      ? (descriptionContentBottom - descriptionStartY) + descriptionPaddingY * 2
      : 0;

    const exportHeight = Math.max(bounds.height + padding * 2 + descriptionHeight, 600 + descriptionHeight);

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
        const labelLines = wrapText(node.label, width - 28, 2, `700 12px ${fontFamily}`);
        const descriptionLines = node.description
          ? wrapText(node.description, width - 28, 6, `500 11px ${fontFamily}`)
          : [];
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

    const descriptionSection = descriptionItems.length > 0
      ? `
        <g>
          <rect x=\"${descriptionX - 12}\" y=\"${descriptionStartY - descriptionPaddingY}\" width=\"${descriptionBlockWidth + 24}\" height=\"${descriptionHeight}\" fill=\"${palette.card}\" stroke=\"${palette.border}\" stroke-width=\"1\" rx=\"14\" />
          <text x=\"${descriptionX}\" y=\"${descriptionStartY}\" font-family=\"${fontFamily}\" font-size=\"14\" font-weight=\"700\" fill=\"${palette.foreground}\">${escapeXml(descriptionTitle)}</text>
          ${descriptionTextElements.join("")}
        </g>`
      : "";

    const svgText = `
      <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${exportWidth}\" height=\"${exportHeight}\" viewBox=\"${viewBoxX} ${viewBoxY} ${exportWidth} ${exportHeight}\">
        <rect x=\"${viewBoxX}\" y=\"${viewBoxY}\" width=\"${exportWidth}\" height=\"${exportHeight}\" fill=\"#ffffff\" />
        ${connectionPaths.join("")}
        ${nodeMarks.join("")}
        ${descriptionSection}
      </svg>
    `;

    return { svgText, width: exportWidth, height: exportHeight };
  };

  const handleCenterMap = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || nodes.length === 0) return;
    const mainNode = nodes.find((node) => node.category === "main") ?? nodes[0];
    if (!mainNode) return;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setPan({
      x: centerX - mainNode.x * zoom,
      y: centerY - mainNode.y * zoom,
    });
  }, [nodes, zoom]);

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
            to={groupPublicId ? `/groups/${groupPublicId}` : "/dashboard"}
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={groupPublicId ? "Volver al grupo" : "Volver al dashboard"}
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
          {(() => {
            const allMembers = [
              { name: ownerName || "Propietario", role: "owner" },
              ...(sharingInfo?.collaborators || []).map((c) => ({
                name: c.name,
                role: c.role,
              })),
            ];
            return (
              <div className="flex -space-x-2">
                {allMembers.slice(0, 3).map((m, i) => {
                  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}&mouth=smile,default&eyes=default,happy,wink`;
                  return (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center shadow-sm"
                      title={`${m.name} (${m.role === 'owner' ? 'Propietario' : m.role === 'editor' ? 'Editor' : 'Lector'})`}
                    >
                      <img src={avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                  );
                })}
                {allMembers.length > 3 && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-background bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center"
                    title={`${allMembers.length - 3} colaboradores más`}
                  >
                    +{allMembers.length - 3}
                  </div>
                )}
              </div>
            );
          })()}
          
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
            <button
              onClick={() => {
                setShowAIChat(!showAIChat);
                setShowComments(false);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                showAIChat ? "bg-primary-subtle text-primary" : "text-muted-foreground hover:bg-card"
              }`}
              title="Consultar Tutor IA"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
            </button>
            <button
              onClick={handleStartQuiz}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-card"
              title={mapGroupId ? (isGroupAdmin ? "Generar Quiz" : "Tomar Quiz") : "Realizar Quiz"}
            >
              <Trophy className="w-4 h-4 text-emerald-600" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-all shadow-md shadow-primary/20">
               <Share2 className="w-3.5 h-3.5" /> Compartir
            </button>
          </div>
          <div className="flex items-center gap-2">
             {/* <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"><Search className="w-5 h-5" /></button> */}
             {/* <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"><Bell className="w-5 h-5" /></button> */}
              <button className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden" title={authUser?.name || "Usuario"}>
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser?.name || "Usuario")}&mouth=smile,default&eyes=default,happy,wink`} alt="User" />
              </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative overflow-hidden flex bg-[#f8f9fb]" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        {userRole === "viewer" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 shadow-sm flex items-center gap-1.5 animate-pulse">
            <Lock className="w-3.5 h-3.5" /> Modo de sólo lectura
          </div>
        )}

        {userRole !== "viewer" && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-2 bg-card border border-border rounded-2xl shadow-xl">
             <button
               onClick={() => setActiveTool("select")}
               className={`p-3 rounded-xl transition-all ${
                 activeTool === "select"
                   ? "bg-primary-subtle text-primary"
                   : "text-muted-foreground hover:bg-muted"
               }`}
               title="Seleccionar y Mover"
             >
               <MousePointer2 className="w-5 h-5" />
             </button>
             <button
               onClick={() => setActiveTool("concept")}
               className={`p-3 rounded-xl transition-all ${
                 activeTool === "concept"
                   ? "bg-primary-subtle text-primary"
                   : "text-muted-foreground hover:bg-muted"
               }`}
               title="Crear Concepto"
             >
               <Square className="w-5 h-5" />
             </button>
             <button
               onClick={() => setShowDetailsModal(true)}
               className="p-3 rounded-xl text-muted-foreground hover:bg-muted transition-all"
               title="Detalles del Mapa"
             >
               <StickyNote className="w-5 h-5" />
             </button>
             <div className="h-px bg-border mx-2" />
             <button
               onClick={() => setActiveTool("eraser")}
               className={`p-3 rounded-xl transition-all ${
                 activeTool === "eraser"
                   ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                   : "text-muted-foreground hover:bg-muted"
               }`}
               title="Borrador"
             >
               <Eraser className="w-5 h-5" />
             </button>
             <DropdownMenu.Root>
               <DropdownMenu.Trigger asChild>
                 <button className="p-3 rounded-xl text-muted-foreground hover:bg-muted transition-all" title="Más Opciones">
                   <MoreHorizontal className="w-5 h-5" />
                 </button>
               </DropdownMenu.Trigger>
               <DropdownMenu.Portal>
                 <DropdownMenu.Content
                   className="z-50 min-w-[160px] bg-card border border-border rounded-xl p-1.5 shadow-xl animate-in fade-in-50 slide-in-from-top-2 focus:outline-none"
                   align="start"
                   side="right"
                   sideOffset={8}
                 >
                   <DropdownMenu.Item
                     onClick={() => setShowShareModal(true)}
                     className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none transition-colors"
                   >
                     <Share2 className="w-4 h-4 text-primary" />
                     Compartir
                   </DropdownMenu.Item>
                   <DropdownMenu.Item
                     onClick={() => {
                       setShowAIChat(!showAIChat);
                       setShowComments(false);
                     }}
                     className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none transition-colors"
                   >
                     <Sparkles className="w-4 h-4 text-purple-600" />
                     Tutor IA
                   </DropdownMenu.Item>
                   <DropdownMenu.Item
                     onClick={handleStartQuiz}
                     className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none transition-colors"
                   >
                     <Trophy className="w-4 h-4 text-emerald-600" />
                     {mapGroupId ? (isGroupAdmin ? "Generar Quiz" : "Tomar Quiz") : "Realizar Quiz"}
                   </DropdownMenu.Item>
                   <DropdownMenu.Item
                     onClick={() => setShowExportModal(true)}
                     className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none transition-colors"
                   >
                     <Download className="w-4 h-4 text-blue-600" />
                     Exportar
                   </DropdownMenu.Item>
                 </DropdownMenu.Content>
               </DropdownMenu.Portal>
             </DropdownMenu.Root>
          </div>
        )}

        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20 flex items-center gap-4">
           <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-xl shadow-lg">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 rounded-lg text-muted-foreground hover:bg-muted"><Minus className="w-4 h-4" /></button>
              <span className="text-xs font-bold w-12 text-center text-foreground">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg text-muted-foreground hover:bg-muted"><Plus className="w-4 h-4" /></button>
           </div>
           <div className="flex items-center gap-2 p-1.5 bg-card border border-border rounded-xl shadow-lg">
                <button onClick={handleCenterMap} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted">
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
            className={`w-full h-full outline-none ${activeTool === "eraser" ? "" : "cursor-grab active:cursor-grabbing"}`}
            style={activeTool === "eraser" ? { cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 20H7L3 16l8-8 8 8-3 3M17 17l-3-3'/></svg>") 4 16, pointer` } : {}}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName === "svg") {
                setSelectedNode(null);
                
                if (userRole !== "viewer" && activeTool === "concept") {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    const clickX = (e.clientX - rect.left - pan.x) / zoom;
                    const clickY = (e.clientY - rect.top - pan.y) / zoom;
                    setNewNodeCoords({ x: clickX, y: clickY });
                    setNewNodeType("concept");
                    setNewNodeLabel("");
                    setShowCreateNodeModal(true);
                  }
                }
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
                    <g key={`${parent.id}-${child.id}`}>
                      {/* Invisible wide path for easier clicking when using the eraser tool */}
                      <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="12"
                        style={{ pointerEvents: activeTool === "eraser" ? "auto" : "none" }}
                        className=""
                        onClick={(e) => {
                          if (userRole !== "viewer" && activeTool === "eraser") {
                            e.stopPropagation();
                            handleDeleteConnection(parent.id, child.id);
                          }
                        }}
                      />
                      <motion.path
                        d={path}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeOpacity="0.2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        style={{ pointerEvents: activeTool === "eraser" ? "auto" : "none" }}
                        className={activeTool === "eraser" ? "hover:stroke-red-500 transition-colors" : ""}
                        onClick={(e) => {
                          if (userRole !== "viewer" && activeTool === "eraser") {
                            e.stopPropagation();
                            handleDeleteConnection(parent.id, child.id);
                          }
                        }}
                      />
                    </g>
                  );
                })
              )}
            </g>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNode === node.id;
                const colors = getNodeColors(node, isHovered, isSelected);
                const width = node.isSticky ? 160 : getNodeWidth(node.label, node.category);
                const height = node.isSticky ? 160 : getNodeHeight(node.category);

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onMouseDown={(e) => {
                      if (userRole !== "viewer" && activeTool === "select") {
                        e.stopPropagation();
                        setDraggedNodeId(node.id);
                        setDragStart({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userRole !== "viewer" && activeTool === "eraser") {
                        handleDeleteNode(node.id);
                      } else {
                        setSelectedNode(node.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (userRole !== "viewer" && activeTool === "eraser") {
                          handleDeleteNode(node.id);
                        } else {
                          setSelectedNode(node.id);
                        }
                      }
                    }}
                    className={activeTool === "eraser" ? "" : "cursor-pointer"}
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
                    {/* <button 
                      onClick={() => setActiveTab("notas")}
                      className={`px-4 py-2 text-xs font-bold transition-all relative ${
                        activeTab === "notas" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                       Notas
                       {activeTab === "notas" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                    </button> */}
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
                              <div
                                key={connId}
                                className="flex items-center gap-2 group/conn"
                              >
                                <button
                                  onClick={() => setSelectedNode(connId)}
                                  className="flex-1 flex items-start gap-3 p-3 bg-muted border border-border rounded-xl hover:border-primary/40 hover:bg-primary-subtle transition-colors text-left group"
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary/50 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
                                  <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{connNode.label}</p>
                                    {connNode.description && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{connNode.description}</p>
                                    )}
                                  </div>
                                </button>
                                {userRole !== "viewer" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConnection(selectedNodeData.id, connId);
                                    }}
                                    className="p-3 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 rounded-xl transition-all shrink-0"
                                    title="Eliminar conexión"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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

                    {/* Editar concepto */}
                    {userRole !== "viewer" && selectedNodeData.category !== "main" && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Editar Concepto</h4>
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-muted-foreground">Etiqueta</label>
                          <input
                            type="text"
                            value={selectedNodeData.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setNodes(prev => prev.map(n => n.id === selectedNodeData.id ? { ...n, label: newLabel } : n));
                            }}
                            onBlur={() => saveMapState(nodes)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-muted-foreground">Descripción</label>
                          <textarea
                            value={selectedNodeData.description || ""}
                            onChange={(e) => {
                              const newDesc = e.target.value;
                              setNodes(prev => prev.map(n => n.id === selectedNodeData.id ? { ...n, description: newDesc } : n));
                            }}
                            onBlur={() => saveMapState(nodes)}
                            rows={3}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground"
                            placeholder="Añade una descripción..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Conectar con otro concepto */}
                    {userRole !== "viewer" && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nueva Conexión</h4>
                        <div className="flex gap-2">
                          <select
                            id="connect-node-select"
                            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs font-semibold focus:outline-none text-foreground"
                            defaultValue=""
                          >
                            <option value="" disabled>Seleccionar concepto...</option>
                            {nodes
                              .filter(n => n.id !== selectedNodeData.id && !selectedNodeData.connections.includes(n.id))
                              .map(n => (
                                <option key={n.id} value={n.id}>{n.label}</option>
                              ))
                            }
                          </select>
                          <button
                            onClick={() => {
                              const selectEl = document.getElementById("connect-node-select") as HTMLSelectElement;
                              const targetId = selectEl?.value;
                              if (targetId) {
                                const updatedNodes = nodes.map(n => {
                                  if (n.id === selectedNodeData.id) {
                                    return {
                                      ...n,
                                      connections: [...(n.connections || []), targetId]
                                    };
                                  }
                                  return n;
                                });
                                setNodes(updatedNodes);
                                saveMapState(updatedNodes);
                                selectEl.value = "";
                                toast.success("Conexión creada");
                              }
                            }}
                            className="px-3 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors shrink-0"
                          >
                            Conectar
                          </button>
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

              {/* <div className="p-6 border-t border-border flex gap-3">
                 <button className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20">
                    Exportar concepto
                 </button>
                 <button className="p-3 rounded-xl border border-border text-muted-foreground hover:bg-muted">
                    <Share2 className="w-4 h-4" />
                 </button>
                 <button className="p-3 rounded-xl border border-border text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div> */}
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

        {/* Tutor IA Sidebar */}
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-2xl z-40 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                 <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Tutor IA Didáctico
                 </h2>
                 <button 
                    onClick={() => setShowAIChat(false)}
                    className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {aiChatHistory.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-xs font-semibold">
                    <Sparkles className="w-8 h-8 text-primary/55 mx-auto mb-2" />
                    ¡Hola! Soy tu tutor IA. Pregúntame sobre el tema del mapa conceptual para expandir tus conocimientos y sugerir nuevos nodos.
                  </div>
                )}
                {aiChatHistory.map((msg, i) => (
                  <div key={i} className={`space-y-1.5 ${msg.sender === "user" ? "text-right" : ""}`}>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {msg.sender === "user" ? "Tú" : "Tutor IA"}
                    </div>
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-primary text-primary-foreground border-primary ml-8 text-left" 
                        : "bg-muted border-border mr-8 text-left"
                    }`}>
                      {msg.text}

                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
                          <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-primary" />
                            Conceptos sugeridos:
                          </p>
                          <div className="space-y-2">
                            {msg.suggestions.map((s, idx) => (
                              <div key={idx} className="p-3 bg-card border border-border rounded-xl text-xs">
                                <span className="font-bold text-foreground">{s.label}</span>
                                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                              </div>
                            ))}
                          </div>
                          {userRole !== "viewer" && (
                            <button
                              onClick={() => {
                                const mainNode = nodes.find(un => un.category === "main") || nodes[0];
                                handleInsertSuggestions(msg.suggestions || [], msg.suggestions?.map(s => ({ from: mainNode?.label || '', to: s.label })) || []);
                              }}
                              className="cursor-pointer mt-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-colors font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Insertar en el Mapa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tutor IA</div>
                    <div className="bg-muted border border-border p-4 rounded-2xl mr-8 text-xs italic text-muted-foreground">
                      Pensando una explicación didáctica...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-muted/50">
                 <form onSubmit={handleConsultAI} className="relative">
                    <input 
                      type="text" 
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      placeholder="Ej. ¿Cómo se conecta X con Y?"
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm font-semibold"
                    />
                    <button 
                      type="submit"
                      disabled={aiLoading || !aiChatQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                       <Send className="w-4 h-4" />
                    </button>
                 </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Quiz Modal */}
      <Dialog.Root open={showQuizModal} onOpenChange={setShowQuizModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl z-50 border border-border max-h-[85vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
              <Dialog.Title className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600 animate-bounce" />
                Cuestionario de Aprendizaje
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {quizLoading && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary-subtle border border-primary/20 flex items-center justify-center mx-auto text-primary text-lg font-extrabold animate-spin">
                  🧠
                </div>
                <p className="text-xs font-semibold text-muted-foreground">Generando preguntas didácticas sobre este mapa...</p>
              </div>
            )}

            {quizStarted && !quizCompleted && quizQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Pregunta {currentQuestionIndex + 1} de {quizQuestions.length}</span>
                  <span>Puntaje: {quizScore} pts</span>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                  <h4 className="font-bold text-sm text-foreground leading-snug">
                    {quizQuestions[currentQuestionIndex].question}
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedAnswerIndex === idx;
                    const isCorrectOption = idx === quizQuestions[currentQuestionIndex].answerIndex;
                    const hasAnswered = selectedAnswerIndex !== null;

                    let buttonClass = "border-border bg-card hover:bg-muted/50";
                    if (hasAnswered) {
                      if (isCorrectOption) {
                        buttonClass = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm shadow-emerald-500/5";
                      } else if (isSelected) {
                        buttonClass = "border-red-500 bg-red-50 text-red-700 font-bold shadow-sm shadow-red-500/5";
                      } else {
                        buttonClass = "opacity-60 border-border bg-card";
                      }
                    } else {
                      buttonClass = "hover:border-primary/20 border-border bg-card cursor-pointer";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-4 rounded-xl border transition-all text-left text-xs font-semibold flex items-center justify-between ${buttonClass}`}
                      >
                        <span>{option}</span>
                        {hasAnswered && isCorrectOption && (
                          <span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-wide">✓ Correcto</span>
                        )}
                        {hasAnswered && isSelected && !isCorrectOption && (
                          <span className="text-red-600 font-extrabold text-[10px] uppercase tracking-wide">✗ Incorrecto</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary-subtle border border-primary/10 rounded-xl space-y-1.5 text-[11px] text-primary leading-relaxed"
                  >
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[10px]">
                      <GraduationCap className="w-3.5 h-3.5" /> Explicación del Tutor IA:
                    </span>
                    <p className="font-medium">{quizQuestions[currentQuestionIndex].explanation}</p>
                  </motion.div>
                )}

                {selectedAnswerIndex !== null && (
                  <button
                    onClick={handleNextQuestion}
                    className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors text-xs shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                  >
                    {currentQuestionIndex + 1 === quizQuestions.length ? "Ver Resultados" : "Siguiente Pregunta"}
                  </button>
                )}
              </div>
            )}

            {quizCompleted && (
              <div className="text-center py-4 space-y-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 font-extrabold text-xl animate-bounce">
                  🎉
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">¡Cuestionario Completado!</h3>
                  <p className="text-xs text-muted-foreground mt-1">Has demostrado tus conocimientos sobre el tema.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 rounded-xl bg-muted border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Respuestas</span>
                    <p className="text-base font-extrabold text-foreground">{correctCount} de {quizQuestions.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Puntaje</span>
                    <p className="text-base font-extrabold text-primary">{quizScore} pts</p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={actionLoading}
                  className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-xs shadow-md shadow-primary/15"
                >
                  {actionLoading ? "Guardando..." : "Guardar y Finalizar"}
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
              {["PNG", "PDF"].map((format) => (
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 w-full max-w-md shadow-2xl z-50 border border-border max-h-[85vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
              <Dialog.Title className="text-xl font-bold text-foreground tracking-tight">
                Compartir mapa
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            <div className="space-y-6">
              {/* Copiar Enlace siempre disponible */}
              <div>
                <button
                  onClick={handleCopyLink}
                  className="w-full p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/20 hover:bg-muted transition-all text-left group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Copiar enlace del mapa</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {userRole === "owner" && (
                <>
                  <div className="w-full h-px bg-border" />
                  
                  {/* Código de Invitación */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Código de Invitación</h4>
                    {sharingInfo?.invite_code ? (
                      <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-xl">
                        <span className="text-lg font-extrabold tracking-widest text-primary flex-1 text-center font-mono">
                          {sharingInfo.invite_code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sharingInfo.invite_code || "");
                            toast.success("¡Código copiado!");
                          }}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInviteCode}
                        className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary/30 text-xs font-bold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Generar código de invitación
                      </button>
                    )}
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Invitar por correo */}
                  <form onSubmit={handleAddCollaborator} className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agregar Colaborador</h4>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="px-2 py-2 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Lector</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </form>

                  <div className="w-full h-px bg-border" />

                  {/* Lista de Colaboradores */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Colaboradores</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                        <div>
                          <p className="font-bold text-foreground">Propietario (Tú)</p>
                          <p className="text-[10px] text-muted-foreground">Dueño del mapa</p>
                        </div>
                        <span className="px-2 py-1 bg-primary-subtle text-primary border border-primary/10 rounded font-bold text-[10px] uppercase">Owner</span>
                      </div>
                      
                      {sharingInfo?.collaborators?.map((c) => (
                        <div key={c.user_id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 text-xs hover:bg-muted/10 transition-all">
                          <div>
                            <p className="font-bold text-foreground">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">{c.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={c.role}
                              onChange={(e) => handleChangeRole(c.user_id, e.target.value as any)}
                              className="px-1.5 py-1 bg-muted border border-border rounded text-[10px] text-foreground focus:outline-none"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Lector</option>
                            </select>
                            <button
                              onClick={() => handleRemoveCollaborator(c.user_id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              title="Remover colaborador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal para crear un nuevo elemento en el lienzo */}
      <Dialog.Root open={showCreateNodeModal} onOpenChange={setShowCreateNodeModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 w-full max-w-sm shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight">
                Crear Concepto
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreateNodeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Etiqueta del elemento
                </label>
                <input
                  type="text"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder="Ej. Neurona"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de detalles del mapa */}
      <Dialog.Root open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-foreground tracking-tight">
                Detalles del mapa
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl border border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-1">{mapTitle}</h3>
                <p className="text-xs text-muted-foreground">Nombre del mapa mental</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Autor</span>
                  <span className="text-xs font-bold text-foreground">{ownerName}</span>
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Creado el</span>
                  <span className="text-xs font-bold text-foreground">
                    {createdAt ? new Date(createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "N/A"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Conceptos</span>
                  <span className="text-xs font-bold text-foreground">{nodes.length} nodos</span>
                </div>
                <div className="p-4 bg-muted rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Visibilidad</span>
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    {isPublic ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-primary" /> Público
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Privado
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Dialog.Close asChild>
                <button className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-md">
                  Cerrar
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
