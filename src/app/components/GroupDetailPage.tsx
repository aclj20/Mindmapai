import { Link, useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  Brain,
  Plus,
  Trophy,
  Calendar,
  Check,
  ClipboardList,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { getAuthUser, getToken } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api";

interface Member {
  id: number;
  name: string;
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
  due_date: string;
  created_at: string;
  submitted: number;
  total: number;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const authUser = getAuthUser();
  const token = getToken();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"maps" | "ranking" | "assignments">("maps");

  // Estados de tareas (assignments)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    if (activeTab === "assignments") {
      fetchAssignments();
    }
  }, [activeTab, fetchAssignments]);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !id || !token) return;

    setActionLoading(true);
    fetch(`${API_URL}/groups/${id}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: assignmentTitle,
        due_date: assignmentDueDate || null,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Error al crear tarea");
        return data;
      })
      .then(() => {
        toast.success("Tarea creada con éxito");
        setShowCreateAssignmentModal(false);
        setAssignmentTitle("");
        setAssignmentDueDate("");
        fetchAssignments();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setActionLoading(false));
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

  const isTeacher = group.myRole === "teacher";

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
            { id: "maps", label: "Mapas Conceptuales", icon: Brain },
            { id: "ranking", label: "Clasificación", icon: Trophy },
            { id: "assignments", label: "Tareas", icon: ClipboardList },
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
                  <h3 className="text-lg font-bold tracking-tight">Lienzos de la clase</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Cualquier miembro del grupo puede ver y editar estos mapas</p>
                </div>
                <Link
                  to={`/map/create?group_id=${group.id}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-all font-semibold text-xs shadow-md shadow-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Mapa en esta Clase
                </Link>
              </div>

              {group.maps.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
                  <Brain className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No hay mapas conceptuales en este grupo</p>
                  <Link to={`/map/create?group_id=${group.id}`} className="text-xs text-primary font-bold mt-1 inline-block hover:underline">
                    ¡Crea el primer mapa grupal!
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {group.maps.map((map) => (
                    <Link
                      key={map.id}
                      to={`/map/${map.public_id}`}
                      className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 hover:bg-muted/10 transition-all shadow-sm flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                          {map.title}
                        </h4>
                        <div className="space-y-1 text-xs text-muted-foreground font-semibold">
                          <p>Creado por: {map.owner_id === authUser?.id ? "Tú" : map.owner_name}</p>
                          <p>{map.node_count} conceptos</p>
                          <p>Fecha: {new Date(map.created_at + "Z").toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "ranking" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Ranking de Aprendizaje</h3>
                <p className="text-xs text-muted-foreground font-semibold">La clasificación se ordena en base a la suma de los mejores puntajes de quizzes grupales</p>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {group.members.map((member, idx) => {
                    const isMe = member.id === authUser?.id;
                    const initials = member.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          isMe ? "bg-primary-subtle/50" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                              idx === 0
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : idx === 1
                                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                                  : idx === 2
                                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              {member.name}
                              {member.role === "teacher" && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  Docente
                                </span>
                              )}
                              {isMe && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Nivel {member.level} • Racha {member.streak} días</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-primary">{member.points.toLocaleString()} pts</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Aprendizaje</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Tareas de la clase</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Cumple con las entregas asignadas por el docente</p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-all font-semibold text-xs shadow-md shadow-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Tarea
                  </button>
                )}
              </div>

              {assignmentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-6">Cargando tareas...</p>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No hay tareas creadas para esta clase</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-base text-foreground leading-tight mb-2">
                          {assignment.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Vence: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "Sin fecha"}
                          </span>
                          {isTeacher && (
                            <span>Entregas: {assignment.submitted} / {assignment.total}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTeacher ? (
                          <div className="text-xs font-semibold bg-primary-subtle text-primary border border-primary/15 px-3 py-1.5 rounded-lg">
                            Modo Docente
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              toast.info("Para entregar, ve al mapa mental y entrégalo desde la barra del mapa.");
                            }}
                            className="cursor-pointer px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold shadow-sm transition-all"
                          >
                            Entregar Mapa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR TAREA (SOLO DOCENTE) */}
      <Dialog.Root open={showCreateAssignmentModal} onOpenChange={setShowCreateAssignmentModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Crear nueva tarea
              </Dialog.Title>
              <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="Ej. Mapa mental del Aparato Respiratorio"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fecha de Vencimiento (Opcional)</label>
                <input
                  type="date"
                  value={assignmentDueDate}
                  onChange={(e) => setAssignmentDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading || !assignmentTitle.trim()}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-sm shadow-md shadow-primary/10"
              >
                {actionLoading ? "Creando..." : "Crear Tarea"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
