import { Link, useParams, useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronUp, MessageCircle, Brain, Link2, Trash2, CornerDownRight, Send, FileText, Download, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MobileNav from "./MobileNav";
import { getToken, getAuthUser, getAvatarInitials } from "../hooks/useAuth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Post {
  id: number; public_id: string; title: string; content: string | null;
  post_type: string; link_url: string | null;
  attachment_url: string | null; attachment_name: string | null; attachment_size: number | null;
  upvote_count: number; comment_count: number; created_at: string;
  author_id: number; author_name: string; author_avatar: string | null;
  map_title: string | null; map_public_id: string | null; map_node_count: number | null;
  community_slug: string; community_name: string; community_icon: string | null;
  my_vote: number;
}
interface Comment {
  id: number; content: string; parent_id: number | null; created_at: string;
  author_id: number; author_name: string; author_avatar: string | null;
  replies?: Comment[];
}

function timeAgo(iso: string) {
  const utc = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z';
  const diff = Date.now() - new Date(utc).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : new Date(utc).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function Avatar({ url, name, size = "sm" }: { url?: string | null; name: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  if (url) return <img src={url} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${dim} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0`}>
      {getAvatarInitials(name)}
    </div>
  );
}

function CommentItem({ comment, onDelete, onReply, canDelete }: {
  comment: Comment; onDelete: (id: number, postId?: number) => void;
  onReply: (id: number, name: string) => void; canDelete: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Avatar url={comment.author_avatar} name={comment.author_name} />
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          <button onClick={() => onReply(comment.id, comment.author_name)}
            className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" /> Responder
          </button>
          {canDelete && (
            <button onClick={() => onDelete(comment.id)}
              className="text-[11px] font-bold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Eliminar
            </button>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-border">
            {comment.replies.map(r => (
              <CommentItem key={r.id} comment={r} onDelete={onDelete} onReply={onReply} canDelete={canDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const { slug, postId } = useParams<{ slug: string; postId: string }>();
  const navigate = useNavigate();
  const token = getToken();
  const authUser = getAuthUser();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(() => {
    if (!postId || !token) return;
    Promise.all([
      fetch(`${API_URL}/communities/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/communities/posts/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([p, c]) => {
      if (p.message) { navigate(`/c/${slug}`); return; }
      setPost(p);
      const flat: Comment[] = Array.isArray(c) ? c : [];
      const roots: Comment[] = [];
      const map = new Map<number, Comment>();
      flat.forEach(x => { map.set(x.id, { ...x, replies: [] }); });
      map.forEach(x => {
        if (x.parent_id && map.has(x.parent_id)) map.get(x.parent_id)!.replies!.push(x);
        else roots.push(x);
      });
      setComments(roots);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [postId, token, slug, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async () => {
    if (!post) return;
    const r = await fetch(`${API_URL}/communities/posts/${post.public_id}/vote`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (r.ok) setPost(prev => prev ? { ...prev, my_vote: data.voted ? 1 : 0, upvote_count: data.upvote_count } : prev);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    setSubmittingComment(true);
    try {
      const r = await fetch(`${API_URL}/communities/posts/${post.public_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText, parent_id: replyTo?.id || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      const newComment: Comment = { ...data, replies: [] };
      if (replyTo) {
        const addReply = (list: Comment[]): Comment[] => list.map(c =>
          c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), newComment] }
          : { ...c, replies: addReply(c.replies || []) }
        );
        setComments(addReply);
      } else {
        setComments(prev => [...prev, newComment]);
      }
      setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev);
      setCommentText(""); setReplyTo(null);
    } catch (e: any) { toast.error(e.message); } finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("¿Eliminar comentario?")) return;
    const r = await fetch(`${API_URL}/communities/comments/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const remove = (list: Comment[]): Comment[] =>
        list.filter(c => c.id !== commentId).map(c => ({ ...c, replies: remove(c.replies || []) }));
      setComments(remove);
      setPost(prev => prev ? { ...prev, comment_count: Math.max(0, prev.comment_count - 1) } : prev);
      toast.success("Comentario eliminado");
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>;
  if (!post) return null;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans text-foreground overflow-x-hidden">
      <nav className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to={`/c/${slug}`} className="flex items-center gap-2 min-w-0">
            {post.community_icon
              ? <img src={post.community_icon} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              : <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">{post.community_name[0]}</div>
            }
            <span className="text-sm font-bold text-foreground truncate">{post.community_name}</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-5 space-y-5">
        {/* Post */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Avatar url={post.author_avatar} name={post.author_name} size="md" />
            <div>
              <p className="text-sm font-bold text-foreground">{post.author_name}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
            </div>
            <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              post.post_type === "map" ? "bg-primary/10 text-primary"
              : post.post_type === "resource" ? "bg-amber-100 text-amber-700"
              : "bg-muted text-muted-foreground"}`}>
              {post.post_type === "map" ? "Mapa" : post.post_type === "resource" ? "Recurso" : "Discusión"}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-foreground leading-snug mb-3">{post.title}</h1>

          {post.content && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>}

          {post.post_type === "map" && post.map_public_id && (
            <Link to={`/map/${post.map_public_id}`}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm mb-3 transition-colors">
              <Brain className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{post.map_title}</span>
              <span className="text-xs text-primary/60 shrink-0">{post.map_node_count} nodos</span>
            </Link>
          )}

          {post.post_type === "resource" && post.link_url && (
            <a href={post.link_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-100 mb-3 transition-colors">
              <Link2 className="w-4 h-4 shrink-0" /> <span className="truncate">{post.link_url}</span>
            </a>
          )}

          {post.attachment_url && (
            <a href={post.attachment_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/50 hover:bg-muted text-sm font-bold text-foreground transition-colors mb-3">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <span className="flex-1 truncate">{post.attachment_name || "Documento adjunto"}</span>
              {post.attachment_size && <span className="text-xs text-muted-foreground shrink-0">{(post.attachment_size / 1024).toFixed(0)} KB</span>}
              <Download className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <button onClick={handleVote}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${post.my_vote ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
              <ChevronUp className="w-4 h-4" /> {post.upvote_count}
            </button>
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-muted text-muted-foreground">
              <MessageCircle className="w-4 h-4" /> {post.comment_count}
            </span>
            <button onClick={() => {
              const url = window.location.href;
              if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { import("sonner").then(({ toast }) => toast.success("Enlace copiado")); });
            }} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          </div>
        </div>

        {/* Caja de comentario */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4">
          {authUser && <div className="flex items-center gap-2 mb-3">
            <Avatar url={null} name={authUser.name || "Tú"} />
            <span className="text-xs font-bold text-muted-foreground">
              {replyTo ? `Respondiendo a ${replyTo.name}` : "Escribe un comentario..."}
            </span>
            {replyTo && <button onClick={() => setReplyTo(null)} className="ml-auto text-xs text-muted-foreground hover:text-red-500"><ArrowLeft className="w-3 h-3" /></button>}
          </div>}
          <form onSubmit={handleComment} className="flex gap-2">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder={replyTo ? `Responder a ${replyTo.name}...` : "Añade un comentario..."}
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <button type="submit" disabled={submittingComment || !commentText.trim()}
              className="px-4 bg-primary text-primary-foreground rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center self-stretch">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Comentarios */}
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Sin comentarios aún. ¡Sé el primero!</p>
        ) : (
          <div className="space-y-4">
            {comments.map(c => (
              <CommentItem key={c.id} comment={c}
                onDelete={handleDeleteComment}
                onReply={(id, name) => { setReplyTo({ id, name }); }}
                canDelete={c.author_id === authUser?.id} />
            ))}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
