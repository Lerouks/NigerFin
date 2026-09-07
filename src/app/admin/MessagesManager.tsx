'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Mail, MailOpen, CheckCircle, Trash2, ExternalLink,
  ChevronDown, ChevronUp, Download, AlertTriangle,
} from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  ip_address: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  unread: { label: 'Non lu', icon: Mail, color: 'bg-red-100 text-red-700' },
  read: { label: 'Lu', icon: MailOpen, color: 'bg-amber-100 text-amber-700' },
  replied: { label: 'Répondu', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
};

export function MessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    setHorsLigne(false);

    const params = statusFilter ? `?status=${statusFilter}` : '';
    const resultat = await appelAdmin<ContactMessage[]>(`/api/admin/messages${params}`);

    if (!resultat.ok) {
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
      setLoading(false);
      return;
    }

    if (!Array.isArray(resultat.donnees)) {
      setErreur("Le serveur n'a pas renvoyé la liste des messages. Réessayez dans un instant.");
      setLoading(false);
      return;
    }

    setMessages(resultat.donnees);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    setErreurAction(null);

    const resultat = await envoiAdmin('/api/admin/messages', 'PUT', { id, status });

    if (!resultat.ok) {
      setErreurAction(resultat.message);
      setProcessingId(null);
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: status as ContactMessage['status'] } : m))
    );
    setProcessingId(null);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    setProcessingId(id);
    setErreurAction(null);

    const resultat = await envoiAdmin(`/api/admin/messages?id=${id}`, 'DELETE');

    if (!resultat.ok) {
      setErreurAction(resultat.message);
      setProcessingId(null);
      return;
    }

    setMessages((prev) => prev.filter((m) => m.id !== id));
    setProcessingId(null);
  };

  const handleExpand = async (msg: ContactMessage) => {
    const isOpen = expandedId === msg.id;
    setExpandedId(isOpen ? null : msg.id);
    // Auto-mark as read when expanding an unread message
    if (!isOpen && msg.status === 'unread') {
      await updateStatus(msg.id, 'read');
    }
  };

  const handleReply = (msg: ContactMessage) => {
    const subject = `Re: ${msg.subject}`;
    const body = `\n\n---\nMessage original de ${msg.full_name} (${new Date(msg.created_at).toLocaleString('fr-FR')}):\n${msg.message}`;
    window.open(`mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    updateStatus(msg.id, 'replied');
  };

  const handleExport = () => {
    window.open('/api/admin/export?type=messages', '_blank');
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const readCount = messages.filter((m) => m.status === 'read').length;
  const repliedCount = messages.filter((m) => m.status === 'replied').length;

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { value: '', label: `Tous (${messages.length})` },
            { value: 'unread', label: `Non lus (${unreadCount})` },
            { value: 'read', label: `Lus (${readCount})` },
            { value: 'replied', label: `Répondus (${repliedCount})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-[13px] transition-all ${
                statusFilter === f.value
                  ? 'bg-[#111] text-white'
                  : 'bg-white border border-black/6 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-white border border-black/6 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Excel
        </button>
      </div>

      {/* Échec d'une action (changement de statut, suppression) */}
      {erreurAction && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{erreurAction}</span>
        </div>
      )}

      {/* Chargement, échec de chargement, ou boîte vraiment vide */}
      <EtatListe
        chargement={loading}
        erreur={erreur}
        horsLigne={horsLigne}
        vide={messages.length === 0}
        texteVide="Aucun message"
        onReessayer={fetchMessages}
      />

      {!loading && !erreur && messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isOpen = expandedId === msg.id;
            const config = STATUS_CONFIG[msg.status] || STATUS_CONFIG.unread!;
            const StatusIcon = config.icon;
            const isProcessing = processingId === msg.id;

            return (
              <div key={msg.id} className="bg-white rounded-xl border border-black/6 overflow-hidden">
                {/* Header row */}
                <div
                  onClick={() => handleExpand(msg)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                    msg.status === 'unread' ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <StatusIcon className={`w-4 h-4 shrink-0 ${
                      msg.status === 'unread' ? 'text-red-500' :
                      msg.status === 'read' ? 'text-amber-500' : 'text-emerald-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] ${msg.status === 'unread' ? 'font-bold' : 'font-medium'}`}>
                          {msg.full_name}
                        </span>
                        <span className="text-[12px] text-gray-500">&lt;{msg.email}&gt;</span>
                      </div>
                      <p className="text-[13px] text-gray-600 truncate">{msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-black/6 px-5 py-4">
                    <div className="text-[13px] text-gray-500 mb-3 flex items-center gap-4">
                      <span>IP: {msg.ip_address}</span>
                      <span>Reçu le {new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="bg-background rounded-lg p-4 mb-4 text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'read')}
                          disabled={isProcessing}
                          className="text-[12px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-sm hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                          Marquer comme lu
                        </button>
                      )}
                      {msg.status !== 'replied' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'replied')}
                          disabled={isProcessing}
                          className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-sm hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marquer comme répondu
                        </button>
                      )}
                      <button
                        onClick={() => handleReply(msg)}
                        className="text-[12px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-sm hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Répondre par email
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={isProcessing}
                        className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
