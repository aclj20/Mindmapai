import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Users,
  Plus,
  LogIn,
  GraduationCap,
  X,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { getToken } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Group {
  id: number;
  public_id: string;
  name: string;
  join_code: string;
  teacher: string;
  teacher_id: number;
  students: number;
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const token = getToken();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchGroups = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/groups/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => toast.error("Error al cargar grupos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !token) return;
    setJoinLoading(true);
    fetch(`${API_URL}/groups/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ join_code: joinCode.trim() }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Error al unirse");
        return data;
      })
      .then((data) => {
        toast.success(`¡Te uniste a ${data.group.name}!`);
        setShowJoinModal(false);
        setJoinCode("");
        fetchGroups();
        navigate(`/groups/${data.group.public_id}`);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setJoinLoading(false));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !token) return;
    setCreateLoading(true);
    fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: groupName.trim() }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Error al crear grupo");
        return data;
      })
      .then((data) => {
        toast.success(`Grupo "${data.name}" creado con código ${data.join_code}`);
        setShowCreateModal(false);
        setGroupName("");
        fetchGroups();
        navigate(`/groups/${data.public_id}`);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setCreateLoading(false));
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans text-foreground">
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
          <h1 className="text-xl font-bold">Mis Grupos</h1>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Grupos activos</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="cursor-pointer px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors flex items-center gap-2 font-semibold text-sm"
            >
              <LogIn className="w-4 h-4" />
              Unirse
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground transition-colors flex items-center gap-2 font-semibold text-sm shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              Crear grupo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-semibold">
            Cargando grupos...
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/10">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              No perteneces a ningún grupo aún
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowJoinModal(true)}
                className="cursor-pointer px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                Unirme con un código
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Crear un grupo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={`/groups/${group.public_id}`}
                  className="block p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-1 truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {group.teacher}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      {group.students} {group.students === 1 ? "miembro" : "miembros"}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-subtle border border-primary/15 px-2 py-1 rounded-lg">
                      {group.join_code}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Unirme a otro grupo
            </button>
          </div>
        )}
      </div>

      {/* MODAL UNIRSE */}
      <Dialog.Root open={showJoinModal} onOpenChange={setShowJoinModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold tracking-tight flex items-center gap-2">
                <LogIn className="w-5 h-5 text-primary" />
                Unirse a un grupo
              </Dialog.Title>
              <Dialog.Close className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Código de clase
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ej. AB12CD"
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold tracking-widest uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={joinLoading || !joinCode.trim()}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-sm shadow-md shadow-primary/10"
              >
                {joinLoading ? "Uniéndose..." : "Unirse"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL CREAR GRUPO (SOLO DOCENTE) */}
      <Dialog.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl z-50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Crear grupo
              </Dialog.Title>
              <Dialog.Close className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej. 4to A - Ciencias Naturales"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold"
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Se generará automáticamente un código único para que los estudiantes puedan unirse.
              </p>
              <button
                type="submit"
                disabled={createLoading || !groupName.trim()}
                className="cursor-pointer w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-colors disabled:opacity-50 text-sm shadow-md shadow-primary/10"
              >
                {createLoading ? "Creando..." : "Crear grupo"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
