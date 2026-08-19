import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Search, Send, CheckCheck, Clock, 
  User, RefreshCw, Filter, Sparkles, ShieldCheck, Mail
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { apiClient } from '../../api/apiClient';

interface Conversation {
  topicId: string;
  topicType: 'Booking' | 'Enquiry' | 'General';
  topicTitle?: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastSenderType: 'User' | 'Admin';
  lastTimestamp: string;
  unreadCount: number;
}

interface ChatMessageItem {
  _id?: string;
  topicId: string;
  senderType: 'User' | 'Admin';
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

export const AdminMessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Booking' | 'Enquiry' | 'Unread'>('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      let res;
      try {
        res = await apiClient.get('/admin/chat/conversations');
      } catch (_) {
        res = await apiClient.get('/chat/conversations');
      }

      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setConversations(res.data.data);
      } else {
        const fallbackRes = await apiClient.get('/chat/conversations');
        if (fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
          setConversations(fallbackRes.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load admin conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessagesForTopic = async (topicId: string) => {
    try {
      setLoadingMsgs(true);
      const res = await apiClient.get(`/chat/messages/${encodeURIComponent(topicId)}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
      // Mark as read by admin
      await apiClient.patch(`/chat/read/${encodeURIComponent(topicId)}`, { readerType: 'Admin' });
    } catch (err) {
      console.error('Failed to fetch topic messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      fetchMessagesForTopic(selectedTopicId);
      const interval = setInterval(() => {
        fetchMessagesForTopic(selectedTopicId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTopicId || sending) return;

    const activeConv = conversations.find(c => c.topicId === selectedTopicId);
    const text = replyText.trim();
    setReplyText('');
    setSending(true);

    const tempMsg: ChatMessageItem = {
      topicId: selectedTopicId,
      senderType: 'Admin',
      senderName: 'HolidayCity Support',
      senderEmail: 'admin@holidaycity.com',
      message: text,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await apiClient.post('/chat/messages', {
        topicId: selectedTopicId,
        topicType: activeConv?.topicType || 'General',
        topicTitle: activeConv?.topicTitle || '',
        senderType: 'Admin',
        senderName: 'HolidayCity Support',
        senderEmail: activeConv?.customerEmail || 'customer@gmail.com',
        message: text
      });

      if (res.data?.success) {
        fetchMessagesForTopic(selectedTopicId);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send admin reply:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      c.topicId.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'Unread') return c.unreadCount > 0;
    if (filterType === 'Booking') return c.topicType === 'Booking';
    if (filterType === 'Enquiry') return c.topicType === 'Enquiry';
    return true;
  });

  const activeConv = conversations.find(c => c.topicId === selectedTopicId);

  return (
    <AdminLayout title="Messages & Live Support | Admin Panel">
      <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        
        {/* 2-Pane Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Conversations Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 flex flex-col bg-slate-50/50 shrink-0">
            
            {/* Inbox Search & Filter Header */}
            <div className="p-4 border-b border-slate-200/80 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#0A6FB5]" /> Customer Support Messages
                </h2>
                <button
                  onClick={fetchConversations}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Refresh Conversations"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Ref ID, customer or message..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-800 outline-none border border-slate-200 focus:bg-white focus:border-[#0A6FB5] transition-all"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(['All', 'Unread', 'Booking', 'Enquiry'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      filterType === f
                        ? 'bg-[#0A6FB5] text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingConv ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0A6FB5] border-t-transparent rounded-full animate-spin"></div>
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No chat conversations found.
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = selectedTopicId === conv.topicId;
                  return (
                    <div
                      key={conv.topicId}
                      onClick={() => {
                        setSelectedTopicId(conv.topicId);
                      }}
                      className={`p-3.5 transition-colors cursor-pointer text-left border-l-4 ${
                        isSelected
                          ? 'bg-white border-[#0A6FB5] shadow-sm'
                          : conv.unreadCount > 0
                          ? 'bg-sky-50/70 border-sky-400 hover:bg-sky-50'
                          : 'bg-slate-50/40 border-transparent hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-[#0A6FB5]">{conv.topicId}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {conv.lastTimestamp ? new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                          {conv.customerName || conv.customerEmail}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-slate-200 text-slate-700">
                          {conv.topicType}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-500 line-clamp-1 font-medium">
                        {conv.lastSenderType === 'Admin' ? 'You: ' : ''}{conv.lastMessage}
                      </p>

                      {conv.unreadCount > 0 && (
                        <div className="mt-1.5 flex justify-end">
                          <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                            {conv.unreadCount} Unread
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Active Chat Thread */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {!selectedTopicId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                <div className="w-16 h-16 rounded-3xl bg-cyan-50 text-[#0A6FB5] flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base mb-1">Select a Conversation Thread</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click on any customer booking or enquiry reference thread from the left panel to view message history and send direct replies.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0A6FB5] to-[#57D0C9] text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {activeConv?.customerName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900">{activeConv?.customerName || 'Customer'}</h3>
                        <span className="bg-sky-100 text-[#0A6FB5] font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                          Ref: {selectedTopicId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {activeConv?.customerEmail}
                        {activeConv?.topicTitle ? ` • ${activeConv.topicTitle}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => fetchMessagesForTopic(selectedTopicId)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {/* Message Thread Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#0A6FB5] border-t-transparent rounded-full animate-spin"></div>
                      Loading message history...
                    </div>
                  ) : messages.map((msg, index) => {
                    const isAdmin = msg.senderType === 'Admin';
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[80%] ${
                          isAdmin ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {isAdmin ? 'HolidayCity Support' : msg.senderName} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Reply Composer */}
                <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-100/90 rounded-2xl p-2 border border-slate-200 focus-within:border-[#0A6FB5] focus-within:bg-white transition-all">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeConv?.customerName || 'customer'} regarding ${selectedTopicId}...`}
                      className="flex-1 bg-transparent px-3 text-xs font-semibold text-slate-800 outline-none py-1 placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        replyText.trim() && !sending
                          ? 'bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white shadow-md hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
