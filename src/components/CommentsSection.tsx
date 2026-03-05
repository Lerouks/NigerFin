'use client';

import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { Comment } from '@/types';

interface CommentsSectionProps {
  articleId: string;
  initialComments: Comment[];
}

export function CommentsSection({ articleId, initialComments }: CommentsSectionProps) {
  const { isSignedIn, user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(initialComments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      article_id: articleId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
      content: commentText,
      created_at: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setLocalComments([newComment, ...localComments]);
    setCommentText('');
  };

  const handleLike = (commentId: string) => {
    setLocalComments(
      localComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked,
            }
          : comment
      )
    );
  };

  return (
    <div className="bg-white border border-black/[0.06] rounded-xl overflow-hidden">
      <div className="px-7 py-5 border-b border-black/[0.04]">
        <h3 className="text-[17px] font-semibold">Discussion ({localComments.length})</h3>
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
                disabled={!commentText.trim()}
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

        <div className="space-y-6">
          {localComments.map((comment) => (
            <div key={comment.id} className="border-b border-black/[0.04] pb-6 last:border-0 last:pb-0">
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
                  <button
                    onClick={() => handleLike(comment.id)}
                    disabled={!isSignedIn}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      comment.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                    } disabled:cursor-not-allowed`}
                  >
                    <Heart className="w-4 h-4" fill={comment.isLiked ? 'currentColor' : 'none'} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
