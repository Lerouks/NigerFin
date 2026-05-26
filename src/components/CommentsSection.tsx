'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, CornerDownRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface CommentData {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
}

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const { isSignedIn, user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?article_id=${encodeURIComponent(articleId)}`);
      if (res.ok) {
        const json = await res.json();
        // Support both paginated envelope and plain array
        const data = Array.isArray(json) ? json : json.data;
        if (Array.isArray(data)) setComments(data);
      }
    } catch {
      setError('Impossible de charger les commentaires.');
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, content: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        await fetchComments();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de la publication du commentaire.');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !user || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, content: replyText, parent_comment_id: parentId }),
      });
      if (res.ok) {
        setReplyText('');
        setReplyTo(null);
        await fetchComments();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de la publication de la réponse.');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchComments();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de la suppression.');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    }
  };

  // Organize: top-level + replies grouped by parent
  const { topLevel, repliesByParent } = useMemo(() => {
    const top: CommentData[] = [];
    const byParent = new Map<string, CommentData[]>();
    for (const c of comments) {
      if (!c.parent_comment_id) {
        top.push(c);
      } else {
        const list = byParent.get(c.parent_comment_id);
        if (list) list.push(c);
        else byParent.set(c.parent_comment_id, [c]);
      }
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [comments]);

  return (
    <div className="bg-white border border-black/6 rounded-xl overflow-hidden">
      <div className="px-7 py-5 border-b border-black/4">
        <h3 className="text-[17px] font-semibold">Discussion ({comments.length})</h3>
      </div>

      <div className="p-7">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px]">
            {error}
          </div>
        )}

        {isSignedIn ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Partagez votre avis..."
              className="w-full border border-black/6 rounded-lg p-4 focus:outline-hidden focus:border-black/15 focus:ring-1 focus:ring-black/5 bg-background resize-none text-[14px] transition-all"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="bg-[#111] text-white px-5 py-2 rounded-lg hover:bg-[#333] transition-all duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center gap-2 text-[13px] active:scale-[0.97]"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-background rounded-lg text-center border border-black/3">
            <p className="text-gray-500 text-[14px] mb-4">
              Connectez-vous pour participer à la discussion
            </p>
            <Link
              href="/connexion"
              className="inline-block bg-[#111] text-white px-6 py-2.5 rounded-lg hover:bg-[#333] transition-colors text-[13px]"
            >
              Se connecter
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500 text-[14px]">Chargement des commentaires...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-[14px]">Aucun commentaire pour le moment. Soyez le premier !</div>
        ) : (
          <div className="space-y-6">
            {topLevel.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  isSignedIn={isSignedIn}
                  currentUserId={user?.id}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  onDelete={handleDelete}
                />
                {/* Reply form */}
                {replyTo === comment.id && isSignedIn && (
                  <div className="ml-11 mt-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Ecrire une réponse..."
                      className="w-full border border-black/6 rounded-lg p-3 focus:outline-hidden focus:border-black/15 bg-background resize-none text-[13px]"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="text-[12px] text-gray-500 hover:text-gray-600">Annuler</button>
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim() || submitting}
                        className="bg-[#111] text-white px-4 py-1.5 rounded-lg text-[12px] hover:bg-[#333] disabled:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        Répondre
                      </button>
                    </div>
                  </div>
                )}
                {/* Replies */}
                {(repliesByParent.get(comment.id) || []).map((reply) => (
                  <div key={reply.id} className="ml-11 mt-4 pl-4 border-l-2 border-black/4">
                    <CommentItem
                      comment={reply}
                      isSignedIn={isSignedIn}
                      currentUserId={user?.id}
                      replyTo={null}
                      setReplyTo={() => {}}
                      onDelete={handleDelete}
                      isReply
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  isSignedIn,
  currentUserId,
  replyTo,
  setReplyTo,
  onDelete,
  isReply = false,
}: {
  comment: CommentData;
  isSignedIn: boolean;
  currentUserId?: string;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const isOwner = currentUserId === comment.user_id;

  return (
    <div className="border-b border-black/4 pb-6 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
          <span className="text-[12px]">{comment.user_name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">{comment.user_name}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
          <div className="flex items-center gap-3">
            {!isReply && isSignedIn && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Répondre
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
