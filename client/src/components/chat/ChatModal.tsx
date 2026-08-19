import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, ShieldCheck, Clock, CheckCheck, User, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

interface ChatMessageItem {
  _id?: string;
  topicId: string;
  senderType: 'User' | 'Admin';
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string; // e.g. BK-2026-1004 or HC-2026-1001
  topicType: 'Booking' | 'Enquiry' | 'General';
  topicTitle?: string;
  customerName: string;
  customerEmail: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  topicId,
  topicType,
  topicTitle,
  customerName,
  customerEmail
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/chat/messages/${encodeURIComponent(topicId)}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async () => {
    try {
      await apiClient.patch(`/chat/read/${encodeURIComponent(topicId)}`, { readerType: 'User' });
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen && topicId) {
      fetchMessages();
      markRead();

      // Poll for new messages every 4 seconds while modal is open
      const interval = setInterval(() => {
        fetchMessages();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isOpen, topicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic UI update
    const tempMsg: ChatMessageItem = {
      topicId,
      senderType: 'User',
      senderName: customerName || 'Traveler',
      senderEmail: customerEmail || 'user@holidaycity.com',
      message: text,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await apiClient.post('/chat/messages', {
        topicId,
        topicType,
        topicTitle: topicTitle || '',
        senderType: 'User',
        senderName: customerName || 'Traveler',
        senderEmail: customerEmail || 'user@holidaycity.com',
        message: text
      });

      if (res.data?.success) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const quickQuestions = [
    'Can I get an update on this?',
    'What is the payment procedure?',
    'Can you call me regarding this?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight truncate">Direct Admin Support</h3>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-white/30 uppercase tracking-wider">
                  {topicType}
                </span>
              </div>
              <p className="text-xs text-white/90 truncate font-medium">
                Ref: <span className="font-extrabold text-white">{topicId}</span> {topicTitle ? `• ${topicTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Support Guarantee Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-500 shrink-0">
          <span className="flex items-center gap-1 text-[#0A6FB5]">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Support Team
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <Clock className="w-3.5 h-3.5" /> Fast Response Guaranteed
          </span>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold gap-2">
              <div className="w-4 h-4 border-2 border-[#0A6FB5] border-t-transparent rounded-full animate-spin"></div>
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0A6FB5] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">Start Direct Conversation</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Ask any question regarding your trip reference <span className="font-bold text-slate-700">{topicId}</span>. Our team replies promptly!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickQuestions.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setNewMessage(q);
                    }}
                    className="text-[11px] font-bold bg-white text-[#0A6FB5] border border-sky-200 hover:bg-sky-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.senderType === 'User';

              return (
                <div
                  key={msg._id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                    {msg.senderName} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100/80 rounded-full px-4 py-1.5 border border-slate-200/80 focus-within:border-[#0A6FB5] focus-within:bg-white transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Type message regarding ${topicId}...`}
              className="flex-1 bg-transparent text-xs font-semibold text-slate-800 outline-none py-1.5 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                newMessage.trim() && !sending
                  ? 'bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white shadow-md hover:scale-105'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
