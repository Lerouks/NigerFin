'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, Loader2, ChevronLeft, ChevronRight, Reply, User, Calendar, FileText } from 'lucide-react';

interface AdminComment {
  id: string;
  article_id: string;
  article_title: string;
  user_id: string;
  user_name: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
}

interface CommentsResponse {
  data: AdminComment[];
  total: number;
  page: number;
  totalPages: number;
}

export function CommentsManager() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?page=${page}&limit=20`);
      if (res.ok) {
        const data: CommentsResponse = await res.json();
        setComments(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        await fetchComments();
      }
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Commentaires</h2>
            <p className="text-[13px] text-gray-500">
              {total} commentaire{total !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="text-center py-16 bg-white border border-black/[0.06] rounded-xl">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">Aucun commentaire</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white border border-black/[0.06] rounded-xl p-5 transition-all ${
                comment.parent_comment_id ? 'ml-8 border-l-2 border-l-gray-200' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      {comment.user_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(comment.created_at)}
                    </span>
                    {comment.parent_comment_id && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Reply className="w-3 h-3" />
                        Réponse
                      </span>
                    )}
                  </div>

                  {/* Article link */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 truncate">
                      {comment.article_title}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>

                {/* Delete action */}
                <div className="flex-shrink-0">
                  {deleteConfirm === comment.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleting === comment.id}
                        className="px-2.5 py-1 bg-red-500 text-white rounded text-[11px] font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Supprimer'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded text-[11px] hover:bg-gray-50"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(comment.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer ce commentaire"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-[#f5f5f0] disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-gray-500">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-[#f5f5f0] disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
