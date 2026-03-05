'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Send, CornerDownRight } from 'lucide-react';
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
  likes: number;
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

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?article_id=${encodeURIComponent(articleId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setComments(data);
      }
    } catch {}
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, content: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        await fetchComments();
      }
    } catch {}
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !user || submitting) return;

    setSubmitting(true);
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
      }
    } catch {}
    setSubmitting(false);
  };

  // Organize: top-level + replies
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);
  const getReplies = (parentId: string) => replies.filter((r) => r.parent_comment_id === parentId);

  return (
    <div className="bg-white border border-black/[0.06] rounded-xl overflow-hidden">
      <div className="px-7 py-5 border-b border-black/[0.04]">
        <h3 className="text-[17px] font-semibold">Discussion ({comments.length})</h3>
      </div>

      <div className="p-7">
        {isSignedIn ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Partagez votre avis..."
              className="w-full border border-black/[0.06] rounded-lg p-4 focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 bg-[#fafaf9] resize-none text-[14px] transition-all"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="bg-[#111] text-white px-5 py-2 rounded-lg hover:bg-[#333] transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center gap-2 text-[13px]"
              >
                <Send className="w-4 h-4" />
                Publier
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-[#fafaf9] rounded-lg text-center border border-black/[0.03]">
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
          <div className="text-center py-8 text-gray-400 text-[14px]">Chargement des commentaires...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-[14px]">Aucun commentaire pour le moment. Soyez le premier !</div>
        ) : (
          <div className="space-y-6">
            {topLevel.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  isSignedIn={isSignedIn}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                />
                {/* Reply form */}
                {replyTo === comment.id && isSignedIn && (
                  <div className="ml-11 mt-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Écrire une réponse..."
                      className="w-full border border-black/[0.06] rounded-lg p-3 focus:outline-none focus:border-black/15 bg-[#fafaf9] resize-none text-[13px]"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="text-[12px] text-gray-400 hover:text-gray-600">Annuler</button>
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
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="ml-11 mt-4 pl-4 border-l-2 border-black/[0.04]">
                    <CommentItem comment={reply} isSignedIn={isSignedIn} replyTo={null} setReplyTo={() => {}} isReply />
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
  replyTo,
  setReplyTo,
  isReply = false,
}: {
  comment: CommentData;
  isSignedIn: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  isReply?: boolean;
}) {
  return (
    <div className="border-b border-black/[0.04] pb-6 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[#f0efe9] rounded-full flex items-center justify-center flex-shrink-0">
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
          {!isReply && isSignedIn && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Répondre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
