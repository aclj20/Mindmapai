import { Link, useNavigate } from "react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Users, BookOpen, Lock, Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MobileNav from "./MobileNav";
import { getToken, getAvatarInitials, logout } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api";

interface Community {
  id: number; name: string; slug: string; description: string | null;
  icon_url: string | null; banner_url: string | null;
  member_count: number; post_count: number; is_member: number; my_role: string | null;
  creator_name: string;
}

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const token = getToken();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const fetch_ = useCallback((q = "") => {
    setLoading(true);
    fetch(`${API_URL}/communities${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (r.status === 401) { logout(); navigate("/login"); } return r.json(); })
      .then(setCommunities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch_(value), 300);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetch_(query); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${API_URL}/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createName, description: createDesc }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      toast.success("¡Comunidad creada!");
      setShowCreate(false);
      setCreateName(""); setCreateDesc("");
      navigate(`/c/${data.slug}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const handleJoin = async (c: Community) => {
    setJoiningId(c.id);
    const method = c.is_member ? "DELETE" : "POST";
    const endpoint = c.is_member ? "leave" : "join";
    try {
      const r = await fetch(`${API_URL}/communities/${c.slug}/${endpoint}`, {
        method, headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok && r.status !== 409) throw new Error(data.message);
      setCommunities(prev => prev.map(x => x.id === c.id
        ? { ...x, is_member: c.is_member ? 0 : 1, member_count: c.member_count + (c.is_member ? -1 : 1) }
        : x));
      toast.success(data.message);
    } catch (e: any) { toast.error(e.message); }
    finally { setJoiningId(null); }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans text-foreground">
      <nav className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-lg font-extrabold tracking-tight whitespace-nowrap">Comunidades</h1>
          <form onSubmit={handleSearch} className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={e => handleQueryChange(e.target.value)}
              placeholder="Buscar comunidades..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </form>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Crear
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-5 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-muted-foreground">No hay comunidades aún</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-primary font-bold hover:underline">Sé el primero en crear una →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                {/* Banner — overflow-hidden solo aquí */}
                <div className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden rounded-t-2xl">
                  {c.banner_url && <img src={c.banner_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="px-4 pb-4">
                  {/* Ícono con -mt-6 libre porque el card no tiene overflow-hidden */}
                  <div className="-mt-6 mb-2">
                    <div className="w-12 h-12 rounded-xl border-4 border-card bg-primary/10 text-primary flex items-center justify-center text-base font-extrabold shadow-md overflow-hidden">
                      {c.icon_url ? <img src={c.icon_url} alt={c.name} className="w-full h-full object-cover" /> : c.name[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link to={`/c/${c.slug}`} className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors leading-tight block truncate">
                        {c.name}
                      </Link>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.member_count.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.post_count}</span>
                      </div>
                    </div>
                    <button onClick={() => handleJoin(c)} disabled={joiningId === c.id}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${c.is_member ? 'border border-border text-muted-foreground hover:border-red-300 hover:text-red-500' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-50`}>
                      {joiningId === c.id ? '...' : c.is_member ? 'Unido' : 'Unirse'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear comunidad */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-bold">Crear comunidad</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input type="text" required value={createName} onChange={e => setCreateName(e.target.value)}
                    placeholder="Ej. Biología Avanzada"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</label>
                  <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} rows={3}
                    placeholder="¿De qué trata esta comunidad?"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted">Cancelar</button>
                  <button type="submit" disabled={creating || !createName.trim()}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50">
                    {creating ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
