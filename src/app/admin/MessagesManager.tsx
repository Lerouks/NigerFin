'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Mail, MailOpen, CheckCircle, Trash2, ExternalLink,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/messages${params}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: status as ContactMessage['status'] } : m))
        );
      }
    } catch { /* ignore */ }
    setProcessingId(null);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch { /* ignore */ }
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
                  : 'bg-white border border-black/[0.06] text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] bg-white border border-black/[0.06] hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-black/[0.06]">
          <Mail className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Aucun message</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isOpen = expandedId === msg.id;
            const config = STATUS_CONFIG[msg.status] || STATUS_CONFIG.unread;
            const StatusIcon = config.icon;
            const isProcessing = processingId === msg.id;

            return (
              <div key={msg.id} className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                {/* Header row */}
                <div
                  onClick={() => handleExpand(msg)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                    msg.status === 'unread' ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <StatusIcon className={`w-4 h-4 flex-shrink-0 ${
                      msg.status === 'unread' ? 'text-red-500' :
                      msg.status === 'read' ? 'text-amber-500' : 'text-emerald-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] ${msg.status === 'unread' ? 'font-bold' : 'font-medium'}`}>
                          {msg.full_name}
                        </span>
                        <span className="text-[12px] text-gray-400">&lt;{msg.email}&gt;</span>
                      </div>
                      <p className="text-[13px] text-gray-600 truncate">{msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-black/[0.06] px-5 py-4">
                    <div className="text-[13px] text-gray-400 mb-3 flex items-center gap-4">
                      <span>IP: {msg.ip_address}</span>
                      <span>Reçu le {new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="bg-[#fafaf9] rounded-lg p-4 mb-4 text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'read')}
                          disabled={isProcessing}
                          className="text-[12px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                          Marquer comme lu
                        </button>
                      )}
                      {msg.status !== 'replied' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'replied')}
                          disabled={isProcessing}
                          className="text-[12px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marquer comme répondu
                        </button>
                      )}
                      <button
                        onClick={() => handleReply(msg)}
                        className="text-[12px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Répondre par email
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={isProcessing}
                        className="text-[12px] bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                      {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
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
