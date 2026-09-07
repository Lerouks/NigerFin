'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, Loader2, ChevronLeft, ChevronRight, Reply, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

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
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    setHorsLigne(false);

    const resultat = await appelAdmin<CommentsResponse>(`/api/admin/comments?page=${page}&limit=20`);

    if (!resultat.ok) {
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
      setLoading(false);
      return;
    }

    const donnees = resultat.donnees;
    if (!donnees || !Array.isArray(donnees.data)) {
      setErreur("Le serveur n'a pas renvoyé la liste des commentaires. Réessayez dans un instant.");
      setLoading(false);
      return;
    }

    setComments(donnees.data);
    setTotal(donnees.total);
    setTotalPages(donnees.totalPages);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setErreurAction(null);

    const resultat = await envoiAdmin(`/api/admin/comments?id=${id}`, 'DELETE');

    if (!resultat.ok) {
      setErreurAction(resultat.message);
      setDeleting(null);
      return;
    }

    setDeleteConfirm(null);
    await fetchComments();
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
            {!erreur && (
              <p className="text-[13px] text-gray-500">
                {total} commentaire{total !== 1 ? 's' : ''} au total
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Échec d'une action (suppression) */}
      {erreurAction && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{erreurAction}</span>
        </div>
      )}

      {/* Chargement, échec de chargement, ou liste vraiment vide */}
      <EtatListe
        chargement={loading}
        erreur={erreur}
        horsLigne={horsLigne}
        vide={comments.length === 0}
        texteVide="Aucun commentaire"
        onReessayer={fetchComments}
      />

      {/* Comments list */}
      {!loading && !erreur && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white border border-black/6 rounded-xl p-5 transition-all ${
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
                    <FileText className="w-3 h-3 text-gray-300 shrink-0" />
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
                <div className="shrink-0">
                  {deleteConfirm === comment.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleting === comment.id}
                        className="px-2.5 py-1 bg-red-500 text-white rounded-sm text-[11px] font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Supprimer'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2.5 py-1 border border-gray-200 text-gray-600 rounded-sm text-[11px] hover:bg-gray-50"
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
      {!erreur && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-secondary disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-gray-500">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-secondary disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
