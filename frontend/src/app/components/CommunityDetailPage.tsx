import { Link, useParams, useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Users, BookOpen, ChevronUp, MessageCircle, Plus, X,
  Brain, Link2, Trash2, Settings, Camera, TrendingUp, Clock,
  Shield, Crown, CalendarDays, PenLine, Paperclip, FileText, Download,
  Share2, Copy, Ban, UserMinus, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MobileNav from "./MobileNav";
import { getToken, getAuthUser, getAvatarInitials } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

interface CommunityInfo {
  id: number; name: string; slug: string; description: string | null;
  icon_url: string | null; banner_url: string | null;
  member_count: number; post_count: number; creator_id: number;
  is_member: number; my_role: string | null; creator_name: string;
  created_at: string;
}
interface Post {
  id: number; public_id: string; title: string; content: string | null;
  post_type: string; link_url: string | null;
  attachment_url: string | null; attachment_name: string | null; attachment_size: number | null;
  upvote_count: number; comment_count: number; created_at: string;
  author_id: number; author_name: string; author_avatar: string | null;
  map_title: string | null; map_public_id: string | null; map_node_count: number | null;
  my_vote: number;
}
interface Member { id: number; name: string; avatar_url: string | null; level: number; role: string; is_blocked: number; }
interface MyMap { id: number; title: string; public_id: string; }

function timeAgo(iso: string) {
  // SQLite devuelve "YYYY-MM-DD HH:MM:SS" sin indicador de zona (es UTC).
  // Forzamos UTC añadiendo T y Z para que el browser no lo interprete como hora local.
  const utc = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(utc).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(utc).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function Avatar({ url, name, size = "sm" }: { url?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14 text-xl" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  if (url) return <img src={url} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  return <div className={`${dim} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0`}>{getAvatarInitials(name)}</div>;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full"><Crown className="w-2.5 h-2.5" />Admin</span>;
  if (role === "mod") return <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"><Shield className="w-2.5 h-2.5" />Mod</span>;
  return null;
}

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const token = getToken();
  const authUser = getAuthUser();

  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [joining, setJoining] = useState(false);

  // Crear post
  const [showPost, setShowPost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");
  const [postMapId, setPostMapId] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [postAttachment, setPostAttachment] = useState<{ url: string; name: string; size: number } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [myMaps, setMyMaps] = useState<MyMap[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Panel configuración
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "members">("general");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const canManage = community?.my_role === "admin" || community?.my_role === "mod";

  const loadAll = useCallback(() => {
    if (!slug || !token) return;
    Promise.all([
      fetch(`${API_URL}/communities/${slug}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/communities/${slug}/posts?sort=new`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/communities/${slug}/members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([c, p, m]) => {
      if (c.message) { navigate("/communities"); return; }
      setCommunity(c);
      setPosts(Array.isArray(p) ? p : []);
      setMembers(Array.isArray(m) ? m : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug, token, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadPosts = useCallback((s: "new" | "top") => {
    if (!slug || !token) return;
    fetch(`${API_URL}/communities/${slug}/posts?sort=${s}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(p => setPosts(Array.isArray(p) ? p : []));
  }, [slug, token]);

  const handleSort = (s: "new" | "top") => { setSort(s); loadPosts(s); };

  const handleJoin = async () => {
    if (!community) return;
    setJoining(true);
    const method = community.is_member ? "DELETE" : "POST";
    const endpoint = community.is_member ? "leave" : "join";
    try {
      const r = await fetch(`${API_URL}/communities/${slug}/${endpoint}`, { method, headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setCommunity(prev => prev ? { ...prev, is_member: prev.is_member ? 0 : 1, member_count: prev.member_count + (prev.is_member ? -1 : 1) } : prev);
      if (!community.is_member) {
        const me: Member = { id: authUser!.id, name: authUser!.name, avatar_url: null, level: 1, role: "member" };
        setMembers(prev => [...prev, me]);
      } else {
        setMembers(prev => prev.filter(m => m.id !== authUser?.id));
      }
      toast.success(data.message);
    } catch (e: any) { toast.error(e.message); } finally { setJoining(false); }
  };

  const handleVote = async (post: Post) => {
    const r = await fetch(`${API_URL}/communities/posts/${post.public_id}/vote`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (r.ok) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, my_vote: data.voted ? 1 : 0, upvote_count: data.upvote_count } : p));
  };

  const openCreatePost = () => {
    setShowPost(true);
    if (myMaps.length === 0)
      fetch(`${API_URL}/maps/my`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setMyMaps).catch(() => {});
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    const form = new FormData(); form.append("file", file);
    try {
      const r = await fetch(`${API_URL}/upload/attachment`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setPostAttachment({ url: data.file_url, name: data.file_name || file.name, size: data.file_size || file.size });
    } catch (e: any) { toast.error(e.message); } finally { setUploadingFile(false); }
  };

  const resetPostForm = () => {
    setPostTitle(""); setPostContent(""); setPostLink(""); setPostMapId(null);
    setShowMapPicker(false); setShowLinkInput(false); setPostAttachment(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    setSubmitting(true);
    try {
      const postType = postMapId ? "map" : (showLinkInput && postLink.trim()) ? "resource" : "discussion";
      const body: any = { title: postTitle, post_type: postType, content: postContent || null };
      if (postMapId) body.map_id = postMapId;
      if (showLinkInput && postLink.trim()) body.link_url = postLink.trim();
      if (postAttachment) { body.attachment_url = postAttachment.url; body.attachment_name = postAttachment.name; body.attachment_size = postAttachment.size; }
      const r = await fetch(`${API_URL}/communities/${slug}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setPosts(prev => [data, ...prev]);
      setCommunity(prev => prev ? { ...prev, post_count: prev.post_count + 1 } : prev);
      setShowPost(false);
      resetPostForm();
      toast.success("Post publicado");
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm("¿Eliminar este post?")) return;
    const r = await fetch(`${API_URL}/communities/posts/${post.public_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setCommunity(prev => prev ? { ...prev, post_count: Math.max(0, prev.post_count - 1) } : prev);
      toast.success("Post eliminado");
    }
  };

  const uploadCommunityImage = async (file: File, type: "icon" | "banner") => {
    setUploadingImg(true);
    const form = new FormData(); form.append("file", file);
    try {
      const r = await fetch(`${API_URL}/upload/community-image?type=${type}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      if (type === "icon") setEditIcon(data.url); else setEditBanner(data.url);
    } catch (e: any) { toast.error(e.message); } finally { setUploadingImg(false); }
  };

  const openSettings = (tab: "general" | "members" = "general") => {
    if (!community) return;
    setEditName(community.name); setEditDesc(community.description ?? "");
    setEditIcon(community.icon_url); setEditBanner(community.banner_url);
    setSettingsTab(tab);
    setShowSettings(true);
    if (tab === "members") loadAllMembers();
  };

  const loadAllMembers = () => {
    if (!slug || !token) return;
    setLoadingAllMembers(true);
    fetch(`${API_URL}/communities/${slug}/members?all=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setAllMembers).catch(() => {}).finally(() => setLoadingAllMembers(false));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/communities/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, description: editDesc, icon_url: editIcon, banner_url: editBanner }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setCommunity(prev => prev ? { ...prev, ...data } : prev);
      setShowSettings(false); toast.success("Comunidad actualizada");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    const r = await fetch(`${API_URL}/communities/${slug}/members/${userId}/role`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await r.json();
    if (r.ok) { setAllMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m)); toast.success("Rol actualizado"); }
    else toast.error(data.message);
  };

  const handleBlock = async (userId: number) => {
    const r = await fetch(`${API_URL}/communities/${slug}/members/${userId}/block`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (r.ok) { setAllMembers(prev => prev.map(m => m.id === userId ? { ...m, is_blocked: data.blocked ? 1 : 0 } : m)); toast.success(data.message); }
    else toast.error(data.message);
  };

  const handleKick = async (userId: number, name: string) => {
    if (!confirm(`¿Expulsar a ${name} de la comunidad?`)) return;
    const r = await fetch(`${API_URL}/communities/${slug}/members/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (r.ok) {
      setAllMembers(prev => prev.filter(m => m.id !== userId));
      setMembers(prev => prev.filter(m => m.id !== userId));
      setCommunity(prev => prev ? { ...prev, member_count: Math.max(1, prev.member_count - 1) } : prev);
      toast.success(data.message);
    } else toast.error(data.message);
  };

  const handleShare = (post: Post) => {
    const url = `${window.location.origin}/c/${slug}/post/${post.public_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado al portapapeles"));
    } else {
      const el = document.createElement("input"); el.value = url;
      document.body.appendChild(el); el.select(); document.execCommand("copy");
      document.body.removeChild(el); toast.success("Enlace copiado");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
  if (!community) return null;

  const isMember = !!community.is_member;
  const initials = community.name[0]?.toUpperCase();
  const _utc = (s: string) => s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
  const createdDate = community.created_at
    ? new Date(_utc(community.created_at)).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-muted/30 pb-24 md:pb-8 font-sans text-foreground">

      {/* ── BANNER ───────────────────────────────────────── */}
      <div className="relative h-44 md:h-52 overflow-hidden bg-gradient-to-br from-primary/30 to-primary/5">
        {community.banner_url && <img src={community.banner_url} alt="" className="w-full h-full object-cover" />}
        {/* botones */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/35 backdrop-blur text-white hover:bg-black/55 flex items-center justify-center transition-colors z-10">
          <ArrowLeft className="w-4 h-4" />
        </button>
        {canManage && (
          <button onClick={() => openSettings("general")}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur text-white text-xs font-bold hover:bg-black/55 transition-colors z-10">
            <Settings className="w-3.5 h-3.5" /> Configuración
          </button>
        )}
      </div>

      {/* ── IDENTITY BAR (solid, below banner) ───────────── */}
      <div className="bg-background border-b border-border shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="flex items-center gap-4 pb-4 relative">
            {/* Ícono: único elemento que sube y solapa el banner */}
            <div className="w-20 h-20 rounded-2xl border-4 border-background bg-primary/10 text-primary flex items-center justify-center text-3xl font-extrabold shadow-xl overflow-hidden shrink-0 -mt-10 ring-2 ring-border/30">
              {community.icon_url
                ? <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
                : initials}
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-between gap-3 pt-2">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight truncate">{community.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{community.member_count.toLocaleString()} miembros</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{community.post_count} posts</span>
                  {createdDate && <span className="hidden sm:flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Desde {createdDate}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isMember && (
                  <button onClick={openCreatePost}
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4" /> Nuevo post
                  </button>
                )}
                <button onClick={handleJoin} disabled={joining}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${isMember ? 'border-2 border-border text-muted-foreground hover:border-red-300 hover:text-red-500' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-50`}>
                  {joining ? "..." : isMember ? "Unido ✓" : "Unirse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 md:px-6 py-5">
        <div className="flex gap-6 items-start">

          {/* LEFT: Posts feed */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center gap-2 mb-4 bg-background border border-border rounded-xl p-1.5 shadow-sm">
              <button onClick={() => handleSort("new")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-1 justify-center ${sort === "new" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Clock className="w-3.5 h-3.5" /> Nuevo
              </button>
              <button onClick={() => handleSort("top")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-1 justify-center ${sort === "top" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <TrendingUp className="w-3.5 h-3.5" /> Popular
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16 bg-background border border-dashed border-border rounded-2xl">
                <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-muted-foreground">Aún no hay posts</p>
                <p className="text-xs text-muted-foreground/70 mt-1">¡Sé el primero en publicar algo!</p>
                {isMember && (
                  <button onClick={openCreatePost} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors">
                    Crear post
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <motion.div key={post.id} layout
                    className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group">
                    <div className="p-4">
                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar url={post.author_avatar} name={post.author_name} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-foreground">{post.author_name}</span>
                          <span className="text-xs text-muted-foreground ml-1">· {timeAgo(post.created_at)}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          post.post_type === "map" ? "bg-primary/10 text-primary"
                          : post.post_type === "resource" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"}`}>
                          {post.post_type === "map" ? "Mapa" : post.post_type === "resource" ? "Recurso" : "Discusión"}
                        </span>
                        {(post.author_id === authUser?.id || canManage) && (
                          <button onClick={() => handleDeletePost(post)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <Link to={`/c/${slug}/post/${post.public_id}`}>
                        <h3 className="font-bold text-base text-foreground hover:text-primary transition-colors leading-snug mb-2">{post.title}</h3>
                      </Link>

                      {post.content && <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">{post.content}</p>}

                      {post.post_type === "map" && post.map_public_id && (
                        <Link to={`/map/${post.map_public_id}`}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-sm font-bold text-primary mb-3">
                          <Brain className="w-4 h-4 shrink-0" />
                          <span className="truncate">{post.map_title}</span>
                          <span className="text-xs text-primary/60 ml-auto shrink-0">{post.map_node_count} nodos</span>
                        </Link>
                      )}

                      {post.post_type === "resource" && post.link_url && (
                        <a href={post.link_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors mb-3">
                          <Link2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{post.link_url}</span>
                        </a>
                      )}

                      {post.attachment_url && (
                        <a href={post.attachment_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-xs font-bold text-foreground transition-colors mb-3">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate flex-1">{post.attachment_name || "Documento adjunto"}</span>
                          {post.attachment_size && <span className="text-muted-foreground shrink-0">{(post.attachment_size / 1024).toFixed(0)} KB</span>}
                          <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </a>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <button onClick={() => handleVote(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${post.my_vote ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                          <ChevronUp className="w-4 h-4" /> {post.upvote_count}
                        </button>
                        <Link to={`/c/${slug}/post/${post.public_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> {post.comment_count} comentarios
                        </Link>
                        <button onClick={() => handleShare(post)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                          <Share2 className="w-3.5 h-3.5" /> Compartir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">

            {/* About card */}
            <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Acerca de</h3>
              </div>
              <div className="p-4 space-y-3">
                {community.description
                  ? <p className="text-sm text-foreground leading-relaxed">{community.description}</p>
                  : <p className="text-sm text-muted-foreground italic">Sin descripción.</p>}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-lg font-extrabold text-foreground">{community.member_count}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Miembros</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-lg font-extrabold text-foreground">{community.post_count}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Posts</p>
                  </div>
                </div>
                {createdDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Creada en {createdDate}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Fundada por <span className="font-bold text-foreground">{community.creator_name}</span>
                </p>
              </div>
            </div>

            {/* Members card */}
            {members.length > 0 && (
              <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Integrantes</h3>
                  <span className="text-xs font-bold text-muted-foreground">{community.member_count}</span>
                </div>
                <div className="p-3 space-y-1">
                  {members.map(m => (
                    <Link key={m.id} to={m.id === authUser?.id ? "/profile" : `/profile/${m.id}`}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/60 transition-colors group">
                      <Avatar url={m.avatar_url} name={m.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">Nivel {m.level}</p>
                      </div>
                      <RoleBadge role={m.role} />
                    </Link>
                  ))}
                  {community.member_count > 30 && (
                    <p className="text-center text-[11px] text-muted-foreground pt-1 font-semibold">+{community.member_count - 30} más</p>
                  )}
                </div>
              </div>
            )}

            {/* Join CTA (si no es miembro) */}
            {!isMember && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground mb-1">¡Únete a la comunidad!</p>
                <p className="text-xs text-muted-foreground mb-3">Para publicar y comentar, primero debes unirte.</p>
                <button onClick={handleJoin} disabled={joining}
                  className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {joining ? "..." : "Unirse"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar mobile (miembros) - solo en mobile debajo de los posts */}
      {members.length > 0 && (
        <div className="lg:hidden container mx-auto max-w-5xl px-4 pb-4">
          <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Integrantes</h3>
              <span className="text-xs font-bold text-muted-foreground">{community.member_count}</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {members.slice(0, 8).map(m => (
                <Link key={m.id} to={m.id === authUser?.id ? "/profile" : `/profile/${m.id}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-muted/60 transition-colors">
                  <Avatar url={m.avatar_url} name={m.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                    <RoleBadge role={m.role} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB crear post (mobile) */}
      {isMember && (
        <button onClick={openCreatePost}
          className="fixed bottom-24 md:bottom-6 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 lg:hidden">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ── MODAL CREAR POST ─────────────────────────────── */}
      <AnimatePresence>
        {showPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-bold text-base">Nueva publicación</h2>
                <button onClick={() => { setShowPost(false); resetPostForm(); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreatePost} className="p-5 space-y-4">
                {/* Título */}
                <input type="text" required value={postTitle} onChange={e => setPostTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />

                {/* Contenido */}
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} rows={5}
                  placeholder="¿Qué quieres compartir? (opcional)"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />

                {/* Adjunto: mapa seleccionado */}
                {showMapPicker && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Adjuntar mapa</span>
                      <button type="button" onClick={() => { setShowMapPicker(false); setPostMapId(null); }}
                        className="text-muted-foreground hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="p-2 max-h-44 overflow-y-auto space-y-1">
                      {myMaps.length === 0
                        ? <p className="text-xs text-muted-foreground text-center py-3">No tienes mapas creados.</p>
                        : myMaps.map(m => (
                            <button key={m.id} type="button" onClick={() => setPostMapId(m.id)}
                              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${postMapId === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}>
                              <Brain className="w-3.5 h-3.5 shrink-0 text-primary" />
                              <span className="truncate">{m.title}</span>
                              {postMapId === m.id && <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">✓</span>}
                            </button>
                          ))
                      }
                    </div>
                  </div>
                )}

                {/* Adjunto: enlace */}
                {showLinkInput && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b border-border">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Adjuntar enlace</span>
                      <button type="button" onClick={() => { setShowLinkInput(false); setPostLink(""); }}
                        className="text-muted-foreground hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="p-2">
                      <input type="url" value={postLink} onChange={e => setPostLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                )}

                {/* Preview adjunto de documento */}
                {postAttachment && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/50">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{postAttachment.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(postAttachment.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => setPostAttachment(null)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Barra de adjuntos */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50 flex-wrap">
                  <span className="text-xs text-muted-foreground font-semibold mr-1">Adjuntar:</span>
                  <button type="button"
                    onClick={() => { setShowMapPicker(v => !v); setShowLinkInput(false); setPostLink(""); if (!showMapPicker && myMaps.length === 0) fetch(`${API_URL}/maps/my`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setMyMaps).catch(() => {}); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${showMapPicker ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/30'}`}>
                    <Brain className="w-3.5 h-3.5" /> Mapa
                  </button>
                  <button type="button"
                    onClick={() => { setShowLinkInput(v => !v); setShowMapPicker(false); setPostMapId(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${showLinkInput ? 'bg-amber-50 text-amber-600 border-amber-300' : 'border-border text-muted-foreground hover:text-amber-600 hover:border-amber-300'}`}>
                    <Link2 className="w-3.5 h-3.5" /> Enlace
                  </button>
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${postAttachment ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-muted-foreground hover:text-green-700 hover:border-green-300'} ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Paperclip className="w-3.5 h-3.5" /> {uploadingFile ? "Subiendo..." : "Documento"}
                    <input type="file" className="hidden" disabled={uploadingFile}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  </label>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowPost(false); resetPostForm(); }}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting || !postTitle.trim()}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50">
                    {submitting ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANEL CONFIGURACIÓN ──────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <h2 className="font-bold text-base flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Configuración</h2>
                <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border shrink-0">
                {([["general","General"],["members","Integrantes"]] as [string,string][]).map(([t,l]) => (
                  <button key={t} onClick={() => { setSettingsTab(t as any); if (t === "members") loadAllMembers(); }}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${settingsTab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Tab General */}
              {settingsTab === "general" && (
                <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-5 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Banner</label>
                    <div className="relative h-24 rounded-xl overflow-hidden border border-border bg-muted group">
                      {editBanner ? <img src={editBanner} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                          onChange={e => e.target.files?.[0] && uploadCommunityImage(e.target.files[0], "banner")} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Ícono</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-2xl border border-border bg-primary/10 text-primary flex items-center justify-center text-2xl font-extrabold overflow-hidden group shrink-0">
                        {editIcon ? <img src={editIcon} alt="" className="w-full h-full object-cover" /> : <span>{community.name[0]?.toUpperCase()}</span>}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-5 h-5 text-white" />
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingImg}
                            onChange={e => e.target.files?.[0] && uploadCommunityImage(e.target.files[0], "icon")} />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">{uploadingImg ? "Subiendo..." : "Haz clic para cambiar"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nombre *</label>
                    <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted">Cancelar</button>
                    <button type="submit" disabled={saving || !editName.trim()}
                      className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50">
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab Integrantes */}
              {settingsTab === "members" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border shrink-0">
                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Buscar integrante..."
                      className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="overflow-y-auto flex-1 p-2">
                    {loadingAllMembers ? (
                      <div className="flex items-center justify-center py-8"><div className="w-6 h-6 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
                    ) : (
                      allMembers
                        .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                        .map(m => {
                          const isCreator = m.id === community.creator_id;
                          const isMe = m.id === authUser?.id;
                          const canEdit = community.my_role === "admin" && !isCreator && !isMe;
                          return (
                            <div key={m.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${m.is_blocked ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-muted/50'}`}>
                              <div className="relative shrink-0">
                                <Avatar url={m.avatar_url} name={m.name} size="md" />
                                {!!m.is_blocked && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"><Ban className="w-2.5 h-2.5 text-white" /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${m.is_blocked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <RoleBadge role={m.role} />
                                  {isCreator && <span className="text-[10px] text-muted-foreground font-semibold">Fundador</span>}
                                  {!!m.is_blocked && <span className="text-[10px] text-red-500 font-bold">Bloqueado</span>}
                                </div>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Selector de rol */}
                                  <div className="relative">
                                    <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                                      className="appearance-none text-xs font-bold px-2 py-1.5 pr-6 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                                      <option value="member">Miembro</option>
                                      <option value="mod">Moderador</option>
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                  </div>
                                  {/* Bloquear */}
                                  <button onClick={() => handleBlock(m.id)} title={m.is_blocked ? "Desbloquear" : "Bloquear"}
                                    className={`p-1.5 rounded-lg transition-colors ${m.is_blocked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}>
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Expulsar */}
                                  <button onClick={() => handleKick(m.id, m.name)} title="Expulsar"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}
