import { Link, useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Users, Brain, Plus, Trophy, Calendar, ClipboardList,
  ChevronRight, X, Star, Zap, Medal, Trash2, CheckCircle2,
  Clock, AlertCircle, Send, FileText, Pencil, Megaphone, Paperclip, Download, Image, Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { getAuthUser, getToken } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Member {
  id: number;
  name: string;
  avatar_url?: string | null;
  level: number;
  streak: number;
  role: "teacher" | "student";
  points: number;
  badges: number;
}

interface ClassMap {
  id: number;
  public_id: string;
  title: string;
  node_count: number;
  created_at: string;
  owner_name: string;
  owner_id: number;
  my_best_score: number; // -1 = no quiz done, 0-100 = best score
}

interface GroupDetail {
  id: number;
  name: string;
  join_code: string;
  teacher: string;
  teacher_id: number;
  myRole: "teacher" | "student";
  members: Member[];
  maps: ClassMap[];
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  created_at: string;
  submitted: number;
  total: number;
  my_submission?: { status: string; submitted_at: string; map_title?: string; map_public_id?: string } | null;
}

interface MyMap {
  id: number;
  public_id: string;
  title: string;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const authUser = getAuthUser();
  const token = getToken();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"maps" | "ranking" | "assignments" | "board" | "members">("board");

  // Estados de tareas (assignments)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de entrega (estudiante)
  const [submitModal, setSubmitModal] = useState<Assignment | null>(null);
  const [myMaps, setMyMaps] = useState<MyMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal de entregas (docente)
  interface Submission { student_id: number; student_name: string; status: string | null; submitted_at: string | null; map_title: string | null; map_public_id: string | null; }
  const [submissionsModal, setSubmissionsModal] = useState<{ assignment: Assignment; list: Submission[] } | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Modal de edición (docente)
  const [editModal, setEditModal] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Tablón de anuncios
  interface Attachment { file_url: string; file_name: string; file_type: string | null; file_size: number | null; }
  interface AnnouncementMap { map_id: number; map_title: string; map_public_id: string; }
  interface Announcement { id: number; content: string; created_at: string; author_id: number; author_name: string; author_avatar: string | null; attachments: Attachment[]; maps: AnnouncementMap[]; }
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postAttachments, setPostAttachments] = useState<Attachment[]>([]);
  const [postMaps, setPostMaps] = useState<AnnouncementMap[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [teacherMaps, setTeacherMaps] = useState<MyMap[]>([]);
  const [loadingTeacherMaps, setLoadingTeacherMaps] = useState(false);

  const fetchGroupDetail = useCallback(() => {
    if (!id || !token) return;
    setLoading(true);
    fetch(`${API_URL}/groups/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar detalles de la clase");
        return r.json();
      })
      .then(setGroup)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const fetchAssignments = useCallback(() => {
    if (!id || !token) return;
    setAssignmentsLoading(true);
    fetch(`${API_URL}/groups/${id}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setAssignments)
      .catch(() => toast.error("Error al cargar tareas"))
      .finally(() => setAssignmentsLoading(false));
  }, [id, token]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  const fetchAnnouncements = useCallback(() => {
    if (!id || !token) return;
    setBoardLoading(true);
    fetch(`${API_URL}/groups/${id}/announcements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setBoardLoading(false));
  }, [id, token]);

  useEffect(() => {
    if (activeTab === "assignments") fetchAssignments();
    if (activeTab === "board") fetchAnnouncements();
  }, [activeTab, fetchAssignments, fetchAnnouncements]);

  useEffect(() => {
    if (activeTab === "board") fetchAnnouncements();
  }, []);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !id || !token) return;
    setActionLoading(true);
    fetch(`${API_URL}/groups/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: assignmentTitle, description: assignmentDescription || null, due_date: assignmentDueDate || null }),
    })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message); return d; })
      .then(() => {
        toast.success("Tarea creada con éxito");
        setShowCreateAssignmentModal(false);
        setAssignmentTitle(""); setAssignmentDescription(""); setAssignmentDueDate("");
        fetchAssignments();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setActionLoading(false));
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    if (!confirm("¿Eliminar esta tarea? Se borrarán también las entregas.")) return;
    fetch(`${API_URL}/groups/${id}/assignments/${assignmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message); })
      .then(() => { toast.success("Tarea eliminada"); fetchAssignments(); })
      .catch((err) => toast.error(err.message));
  };

  const handleUploadAttachment = async (file: File) => {
    setUploadingFile(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await fetch(`${API_URL}/upload/attachment`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Error al subir');
      setPostAttachments(prev => [...prev, data]);
    } catch (e: any) {
      toast.error(e.message || 'Error al subir el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const r = await fetch(`${API_URL}/groups/${id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: postContent, attachments: postAttachments, maps: postMaps }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setAnnouncements(prev => [data, ...prev]);
      setPostContent('');
      setPostAttachments([]);
      setPostMaps([]);
      toast.success('Anuncio publicado');
    } catch (e: any) {
      toast.error(e.message || 'Error al publicar');
    } finally {
      setPosting(false);
    }
  };

  const openMapPicker = () => {
    setShowMapPicker(true);
    if (teacherMaps.length > 0) return;
    setLoadingTeacherMaps(true);
    fetch(`${API_URL}/maps/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setTeacherMaps)
      .catch(() => {})
      .finally(() => setLoadingTeacherMaps(false));
  };

  const togglePostMap = (m: MyMap) => {
    setPostMaps(prev => {
      const exists = prev.find(p => p.map_id === m.id);
      if (exists) return prev.filter(p => p.map_id !== m.id);
      return [...prev, { map_id: m.id, map_title: m.title, map_public_id: m.public_id }];
    });
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    const r = await fetch(`${API_URL}/groups/${id}/announcements/${announcementId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      toast.success('Anuncio eliminado');
    }
  };

  const openEditModal = (a: Assignment) => {
    setEditModal(a);
    setEditTitle(a.title);
    setEditDescription(a.description ?? '');
    setEditDueDate(a.due_date ? a.due_date.slice(0, 10) : '');
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setActionLoading(true);
    try {
      const r = await fetch(`${API_URL}/groups/${id}/assignments/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, description: editDescription, due_date: editDueDate || null }),
      });
      if (!r.ok) throw new Error('Error al actualizar');
      toast.success('Tarea actualizada');
      setEditModal(null);
      fetchAssignments();
    } catch {
      toast.error('No se pudo actualizar la tarea');
    } finally {
      setActionLoading(false);
    }
  };

  const openSubmissionsModal = (assignment: Assignment) => {
    setSubmissionsLoading(true);
    setSubmissionsModal({ assignment, list: [] });
    fetch(`${API_URL}/groups/assignments/${assignment.id}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((list) => setSubmissionsModal({ assignment, list }))
      .catch(() => toast.error("Error al cargar entregas"))
      .finally(() => setSubmissionsLoading(false));
  };

  const openSubmitModal = (assignment: Assignment) => {
    setSubmitModal(assignment);
    setSelectedMapId(null);
    fetch(`${API_URL}/maps/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: MyMap[]) => setMyMaps(data))
      .catch(() => {});
  };

  const handleSubmitAssignment = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/groups/assignments/${submitModal.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ map_id: selectedMapId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      toast.success("¡Tarea entregada con éxito!");
      setSubmitModal(null);
      fetchAssignments();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        Cargando detalles de la clase...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background px-4">
        <p className="text-muted-foreground font-semibold">Clase no encontrada o sin acceso.</p>
        <Link to="/dashboard" className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const isTeacher = group.myRole === "admin" || group.myRole === "teacher";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans text-foreground">
      {/* Barra de navegación */}
      <nav className="p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            to="/dashboard"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-foreground leading-tight">{group.name}</h1>
            <p className="text-xs text-muted-foreground font-semibold">Profesor: {isTeacher ? "Tú" : group.teacher}</p>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
        {/* Cabecera / Info del Grupo */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{group.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 font-semibold">
              Comparte mapas mentales, responde quizzes y monitorea tu progreso.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-primary-subtle border border-primary/10 flex items-center gap-4 w-full md:w-auto">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Código de Clase</p>
              <p className="text-lg font-extrabold text-primary tracking-widest mt-0.5">{group.join_code}</p>
            </div>
            <div className="w-px h-10 bg-primary/20" />
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Tu Rol</p>
              <p className="text-sm font-bold text-primary mt-0.5 capitalize">{isTeacher ? "Docente" : "Estudiante"}</p>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-border/85">
          {[
            { id: "board", label: "Tablón", icon: Megaphone },
            { id: "members", label: "Participantes", icon: Users },
            { id: "assignments", label: "Tareas", icon: ClipboardList },
            { id: "maps", label: "Mapas", icon: Brain },
            { id: "ranking", label: "Ranking", icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all relative outline-none ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="activeGroupTab"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido de Pestañas */}
        <div className="min-h-[300px]">
          {activeTab === "maps" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Mapas del grupo</h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {isTeacher ? "Crea mapas y genera quizzes para tus estudiantes" : "Estudia los mapas y completa los quizzes para ganar puntos"}
                  </p>
                </div>
                {isTeacher && (
                  <Link
                    to={`/map/create?group_id=${group.id}&group_public_id=${group.public_id}&group_name=${encodeURIComponent(group.name)}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-all font-semibold text-xs shadow-md shadow-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo Mapa
                  </Link>
                )}
              </div>

              {group.maps.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
                  <Brain className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No hay mapas conceptuales en este grupo</p>
                  <Link to={`/map/create?group_id=${group.id}&group_public_id=${group.public_id}&group_name=${encodeURIComponent(group.name)}`} className="text-xs text-primary font-bold mt-1 inline-block hover:underline">
                    ¡Crea el primer mapa grupal!
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {group.maps.map((map) => {
                    const scored = map.my_best_score >= 0;
                    const scoreColor = map.my_best_score >= 80
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                      : map.my_best_score >= 50
                        ? "text-amber-600 bg-amber-50 border-amber-200"
                        : "text-red-500 bg-red-50 border-red-200";
                    return (
                      <Link
                        key={map.id}
                        to={`/map/${map.public_id}`}
                        className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 hover:bg-muted/10 transition-all shadow-sm flex justify-between items-start group"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                            {map.title}
                          </h4>
                          <div className="space-y-1 text-xs text-muted-foreground font-semibold">
                            <p>Por: {map.owner_id === authUser?.id ? "Tú" : map.owner_name}</p>
                            <p>{map.node_count} conceptos</p>
                          </div>
                          {!scored && (
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-primary">
                              <Zap className="w-3 h-3" />
                              Hacer quiz · Gana puntos
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {scored ? (
                            <div className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1.5 rounded-lg border ${scoreColor}`}>
                              <Star className="w-3 h-3" />
                              {map.my_best_score}/100
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-1 rounded-lg uppercase tracking-wider">
                              Sin quiz
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "ranking" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Ranking de Aprendizaje</h3>
                <p className="text-xs text-muted-foreground font-semibold">Puntos acumulados de los mejores quizzes por mapa</p>
              </div>

              {/* Podio top 3 */}
              {group.members.length >= 3 && (
                <div className="flex items-end justify-center gap-3 pt-4 pb-2">
                  {/* 2do lugar */}
                  {group.members[1] && (() => {
                    const m = group.members[1];
                    const initials = m.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    const isMe = m.id === authUser?.id;
                    return (
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 ${isMe ? "border-primary bg-primary text-primary-foreground" : "border-gray-300 bg-gray-100 text-gray-700"}`}>{initials}</div>
                        <div className="text-xs font-bold text-center text-muted-foreground max-w-[64px] truncate">{isMe ? "Tú" : m.name.split(" ")[0]}</div>
                        <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-t-lg flex flex-col items-center justify-center">
                          <Medal className="w-4 h-4 text-gray-400 mb-0.5" />
                          <span className="text-[10px] font-extrabold text-gray-500">{m.points} pts</span>
                        </div>
                      </div>
                    );
                  })()}
                  {/* 1er lugar */}
                  {group.members[0] && (() => {
                    const m = group.members[0];
                    const initials = m.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    const isMe = m.id === authUser?.id;
                    return (
                      <div className="flex flex-col items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base border-2 ${isMe ? "border-primary bg-primary text-primary-foreground" : "border-amber-400 bg-amber-50 text-amber-700"}`}>{initials}</div>
                        <div className="text-xs font-bold text-center text-foreground max-w-[72px] truncate">{isMe ? "Tú" : m.name.split(" ")[0]}</div>
                        <div className="w-16 h-24 bg-amber-50 border border-amber-200 rounded-t-lg flex flex-col items-center justify-center">
                          <span className="text-lg font-extrabold text-amber-600">1</span>
                          <span className="text-[10px] font-extrabold text-amber-500">{m.points} pts</span>
                        </div>
                      </div>
                    );
                  })()}
                  {/* 3er lugar */}
                  {group.members[2] && (() => {
                    const m = group.members[2];
                    const initials = m.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    const isMe = m.id === authUser?.id;
                    return (
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 ${isMe ? "border-primary bg-primary text-primary-foreground" : "border-orange-300 bg-orange-50 text-orange-700"}`}>{initials}</div>
                        <div className="text-xs font-bold text-center text-muted-foreground max-w-[64px] truncate">{isMe ? "Tú" : m.name.split(" ")[0]}</div>
                        <div className="w-16 h-12 bg-orange-50 border border-orange-200 rounded-t-lg flex flex-col items-center justify-center">
                          <Medal className="w-4 h-4 text-orange-400 mb-0.5" />
                          <span className="text-[10px] font-extrabold text-orange-500">{m.points} pts</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Lista completa */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {group.members.map((member, idx) => {
                    const isMe = member.id === authUser?.id;
                    const initials = member.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    const maxPoints = group.members[0]?.points || 1;
                    const pct = maxPoints > 0 ? Math.round((member.points / maxPoints) * 100) : 0;
                    const isAdmin = member.role === "admin" || member.role === "teacher";
                    return (
                      <div
                        key={member.id}
                        className={`p-4 transition-colors ${isMe ? "bg-primary-subtle/50" : "hover:bg-muted/30"}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                            idx === 0 ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : idx === 1 ? "bg-gray-100 text-gray-700 border border-gray-200"
                            : idx === 2 ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="w-9 h-9 rounded-full bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                              {member.name}
                              {isAdmin && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                              {isMe && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold">Nv. {member.level} · {member.streak} días racha</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-extrabold text-primary">{member.points.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">pts</div>
                          </div>
                        </div>
                        {/* Barra de progreso relativa al líder */}
                        <div className="ml-[52px] h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                            className={`h-full rounded-full ${idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-400" : "bg-primary/60"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "board" && (
            <div className="space-y-5 max-w-2xl mx-auto">
              {/* Caja de composición — solo docente */}
              {isTeacher && (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4">
                    <textarea
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      placeholder="Escribe un anuncio para tu clase..."
                      rows={postContent ? 4 : 2}
                      className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none leading-relaxed"
                    />
                    {/* Adjuntos y mapas pendientes */}
                    {(postAttachments.length > 0 || postMaps.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                        {postAttachments.map((att, i) => (
                          <div key={`f-${i}`} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground max-w-[180px]">
                            <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{att.file_name}</span>
                            <button onClick={() => setPostAttachments(prev => prev.filter((_, j) => j !== i))}
                              className="ml-1 text-muted-foreground hover:text-red-500 shrink-0"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        {postMaps.map((m) => (
                          <div key={`m-${m.map_id}`} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary max-w-[180px]">
                            <Brain className="w-3 h-3 shrink-0" />
                            <span className="truncate">{m.map_title}</span>
                            <button onClick={() => setPostMaps(prev => prev.filter(p => p.map_id !== m.map_id))}
                              className="ml-1 text-primary/60 hover:text-red-500 shrink-0"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Picker de mapas */}
                    {showMapPicker && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seleccionar mapa</span>
                          <button onClick={() => setShowMapPicker(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        {loadingTeacherMaps ? (
                          <p className="text-xs text-muted-foreground">Cargando mapas...</p>
                        ) : teacherMaps.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No tienes mapas creados.</p>
                        ) : (
                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                            {teacherMaps.map(m => {
                              const selected = postMaps.some(p => p.map_id === m.id);
                              return (
                                <button key={m.id} onClick={() => togglePostMap(m)}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${selected ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-foreground'}`}>
                                  <Brain className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{m.title}</span>
                                  {selected && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <label className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${uploadingFile ? 'text-muted-foreground' : 'text-muted-foreground hover:text-primary'}`}>
                        <input type="file" className="hidden" multiple disabled={uploadingFile}
                          onChange={e => { Array.from(e.target.files || []).forEach(handleUploadAttachment); e.target.value = ''; }} />
                        <Paperclip className="w-3.5 h-3.5" />
                        {uploadingFile ? 'Subiendo...' : 'Archivo'}
                      </label>
                      <button onClick={openMapPicker}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showMapPicker ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                        <Brain className="w-3.5 h-3.5" /> Mapa
                      </button>
                    </div>
                    <button onClick={handlePostAnnouncement}
                      disabled={posting || !postContent.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-colors hover:bg-primary/90 disabled:opacity-50">
                      <Send className="w-3.5 h-3.5" />
                      {posting ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Feed de anuncios */}
              {boardLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Cargando anuncios...</div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-border rounded-2xl bg-muted/10">
                  <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No hay anuncios todavía</p>
                  {isTeacher && <p className="text-xs text-muted-foreground/70 mt-1">Usa la caja de arriba para escribir algo a tu clase</p>}
                </div>
              ) : (
                announcements.map(ann => {
                  const initials = ann.author_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                  const timeAgo = (() => {
                    const utc = ann.created_at.includes('T') ? ann.created_at : ann.created_at.replace(' ', 'T') + 'Z';
                    const diff = Date.now() - new Date(utc).getTime();
                    const m = Math.floor(diff / 60000);
                    if (m < 1) return 'Ahora mismo';
                    if (m < 60) return `Hace ${m} min`;
                    const h = Math.floor(m / 60);
                    if (h < 24) return `Hace ${h}h`;
                    return new Date(utc).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                  })();
                  return (
                    <motion.div key={ann.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                      {/* Cabecera */}
                      <div className="flex items-center gap-3 px-5 py-4">
                        {ann.author_avatar ? (
                          <img src={ann.author_avatar} alt={ann.author_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{ann.author_name}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                        {isTeacher && (
                          <button onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Contenido */}
                      <div className="px-5 pb-4">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      </div>
                      {/* Adjuntos (archivos + mapas) */}
                      {(ann.attachments.length > 0 || ann.maps?.length > 0) && (
                        <div className="px-5 pb-4 flex flex-wrap gap-2">
                          {ann.attachments.map((att, i) => {
                            const isImage = att.file_type?.startsWith('image/');
                            const sizeLabel = att.file_size ? att.file_size > 1024 * 1024
                              ? `${(att.file_size / 1024 / 1024).toFixed(1)} MB`
                              : `${Math.round(att.file_size / 1024)} KB` : '';
                            return (
                              <a key={`f-${i}`} href={att.file_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors text-xs font-semibold text-foreground max-w-[220px] group">
                                {isImage ? <Image className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-primary shrink-0" />}
                                <span className="truncate flex-1">{att.file_name}</span>
                                {sizeLabel && <span className="text-muted-foreground shrink-0">{sizeLabel}</span>}
                                <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </a>
                            );
                          })}
                          {ann.maps?.map((m) => (
                            <Link key={`m-${m.map_id}`} to={`/map/${m.map_public_id}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/25 bg-primary/8 hover:bg-primary/15 transition-colors text-xs font-bold text-primary max-w-[220px]">
                              <Brain className="w-4 h-4 shrink-0" />
                              <span className="truncate">{m.map_title}</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Participantes</h3>
                <p className="text-xs text-muted-foreground font-semibold">{group?.members.length ?? 0} personas en esta clase</p>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
                {[
                  ...( group?.members.filter(m => m.role === 'teacher' || m.role === 'admin') ?? []),
                  ...( group?.members.filter(m => m.role === 'student') ?? []),
                ].map(m => {
                  const initials = m.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                  const isTeacherMember = m.role === 'teacher' || m.role === 'admin';
                  return (
                    <Link to={`/profile/${m.id}`} key={m.id}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors group">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-border" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${isTeacherMember ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{m.name}</p>
                          {isTeacherMember && (
                            <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Docente</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-semibold">
                          <span>Nv. {m.level}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>{m.badges} logros</span>
                          {!isTeacherMember && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-orange-400" />{m.streak}d
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Tareas de la clase</h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {isTeacher ? "Crea y gestiona tareas para tus estudiantes" : "Entrega tus tareas seleccionando un mapa conceptual"}
                  </p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-all font-semibold text-xs shadow-md shadow-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nueva Tarea
                  </button>
                )}
              </div>

              {assignmentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-6">Cargando tareas...</p>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No hay tareas creadas para esta clase</p>
                  {isTeacher && (
                    <button onClick={() => setShowCreateAssignmentModal(true)}
                      className="mt-3 text-xs text-primary font-bold hover:underline">
                      Crear primera tarea →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => {
                    // Estado para estudiante
                    const studentSubmitted = !!a.my_submission;
                    const studentOverdue = !isTeacher && a.due_date && new Date(a.due_date) < new Date() && !studentSubmitted;
                    // Estado para docente
                    const allSubmitted = isTeacher && a.total > 0 && a.submitted >= a.total;
                    const someSubmitted = isTeacher && a.submitted > 0 && a.submitted < a.total;
                    const teacherOverdue = isTeacher && a.due_date && new Date(a.due_date) < new Date() && !allSubmitted;

                    const cardBg = isTeacher
                      ? allSubmitted ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : teacherOverdue ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        : "bg-card border-border"
                      : studentSubmitted ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : studentOverdue ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        : "bg-card border-border";

                    return (
                      <motion.div key={a.id} layout
                        className={`p-5 rounded-2xl border shadow-sm transition-colors ${cardBg}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Título + estado */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-bold text-base text-foreground leading-tight">{a.title}</h4>
                              {/* Badges docente */}
                              {isTeacher && allSubmitted && (
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Completada
                                </span>
                              )}
                              {isTeacher && someSubmitted && !teacherOverdue && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" /> En progreso
                                </span>
                              )}
                              {isTeacher && teacherOverdue && (
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Vencida
                                </span>
                              )}
                              {isTeacher && !allSubmitted && !someSubmitted && !teacherOverdue && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" /> Sin entregas
                                </span>
                              )}
                              {/* Badges estudiante */}
                              {!isTeacher && studentSubmitted && (
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Entregada
                                </span>
                              )}
                              {!isTeacher && studentOverdue && (
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Vencida
                                </span>
                              )}
                              {!isTeacher && !studentSubmitted && !studentOverdue && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" /> Pendiente
                                </span>
                              )}
                            </div>

                            {/* Descripción */}
                            {a.description && (
                              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{a.description}</p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {a.due_date ? `Vence: ${new Date(a.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}` : "Sin fecha límite"}
                              </span>
                              {isTeacher && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  {a.submitted} / {a.total} entregas
                                </span>
                              )}
                              {studentSubmitted && a.my_submission?.map_title && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <FileText className="w-3.5 h-3.5" />
                                  {a.my_submission.map_title}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isTeacher ? (
                              <>
                                <button onClick={() => openSubmissionsModal(a)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors">
                                  <Users className="w-3.5 h-3.5" />
                                  {a.submitted}/{a.total}
                                </button>
                                <button onClick={() => openEditModal(a)}
                                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteAssignment(a.id)}
                                  className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => openSubmitModal(a)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                  submitted
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                }`}
                              >
                                <Send className="w-3.5 h-3.5" />
                                {submitted ? "Ver entrega" : "Entregar"}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR TAREA (DOCENTE) */}
      <Dialog.Root open={showCreateAssignmentModal} onOpenChange={setShowCreateAssignmentModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-5">
              <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Crear nueva tarea
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Título *</label>
                <input type="text" required value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="Ej. Mapa mental del Aparato Respiratorio"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                <textarea value={assignmentDescription} onChange={(e) => setAssignmentDescription(e.target.value)}
                  placeholder="Instrucciones o detalles de la tarea..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Fecha de vencimiento (opcional)</label>
                <input type="date" value={assignmentDueDate} onChange={(e) => setAssignmentDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
              </div>
              <button type="submit" disabled={actionLoading || !assignmentTitle.trim()}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold transition-colors disabled:opacity-50 text-sm">
                {actionLoading ? "Creando..." : "Crear Tarea"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL EDITAR TAREA (DOCENTE) */}
      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" /> Editar tarea
                </h2>
                <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditAssignment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Título *</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Fecha de vencimiento</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditModal(null)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={actionLoading || !editTitle.trim()}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                    {actionLoading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VER ENTREGAS (DOCENTE) */}
      <AnimatePresence>
        {submissionsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-bold text-foreground">{submissionsModal.assignment.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {submissionsModal.list.filter(s => s.status === 'submitted').length} de {submissionsModal.list.length} estudiantes entregaron
                  </p>
                </div>
                <button onClick={() => setSubmissionsModal(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {submissionsLoading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : submissionsModal.list.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">No hay estudiantes en el grupo</div>
                ) : (
                  submissionsModal.list.map((s) => (
                    <div key={s.student_id} className="flex items-center gap-4 px-6 py-4">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {s.student_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{s.student_name}</p>
                        {s.status === 'submitted' ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Entregado {new Date(s.submitted_at!.includes('T') ? s.submitted_at! : s.submitted_at!.replace(' ', 'T') + 'Z').toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">Sin entregar</p>
                        )}
                      </div>

                      {/* Estado + link mapa */}
                      <div className="flex items-center gap-2 shrink-0">
                        {s.status === 'submitted' ? (
                          <>
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Entregada
                            </span>
                            {s.map_public_id && (
                              <a href={`/map/${s.map_public_id}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors border border-primary/20">
                                <FileText className="w-3 h-3" /> {s.map_title ?? "Ver mapa"}
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-4 border-t border-border">
                <button onClick={() => setSubmissionsModal(null)}
                  className="w-full py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL ENTREGAR TAREA (ESTUDIANTE) */}
      <AnimatePresence>
        {submitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Entregar tarea
                </h2>
                <button onClick={() => setSubmitModal(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="font-bold text-sm text-foreground">{submitModal.title}</p>
                  {submitModal.description && <p className="text-xs text-muted-foreground mt-1">{submitModal.description}</p>}
                  {submitModal.due_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vence: {new Date(submitModal.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                {submitModal.my_submission ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-700">Ya entregaste esta tarea</p>
                    {submitModal.my_submission.map_title && (
                      <p className="text-xs text-emerald-600 mt-1">Mapa: {submitModal.my_submission.map_title}</p>
                    )}
                    <p className="text-xs text-emerald-500 mt-1">
                      {new Date(submitModal.my_submission.submitted_at.includes('T') ? submitModal.my_submission.submitted_at : submitModal.my_submission.submitted_at.replace(' ', 'T') + 'Z').toLocaleString("es-ES")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">Puedes volver a entregar seleccionando otro mapa.</p>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Selecciona un mapa para entregar
                  </label>
                  {myMaps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tienes mapas creados aún.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {myMaps.map((m) => (
                        <button key={m.id} onClick={() => setSelectedMapId(m.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            selectedMapId === m.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                          }`}>
                          <FileText className="w-3.5 h-3.5 inline mr-2 opacity-60" />
                          {m.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setSubmitModal(null)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSubmitAssignment} disabled={submitting || !selectedMapId}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entregando...</>
                    : <><Send className="w-4 h-4" /> Entregar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
