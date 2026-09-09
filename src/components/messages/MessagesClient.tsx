'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { timeAgo } from '@/lib/utils';
import { Send, ChevronLeft } from 'lucide-react';

type Msg = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  listing?: { id: string; title: string } | null;
  sender: { id: string; name: string | null; image: string | null };
  receiver: { id: string; name: string | null; image: string | null };
};

export function MessagesClient({
  currentUserId,
  initialPartner,
  messages: initialMessages,
}: {
  currentUserId: string;
  initialPartner: string;
  messages: Msg[];
}) {
  const router = useRouter();
  const [allMessages, setAllMessages] = useState<Msg[]>(initialMessages);
  const [partner, setPartner] = useState(initialPartner);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Mobile single-pane switcher: 'list' = conversation list, 'chat' = active thread.
  // Deep links (?with=<id>) open the chat pane directly on phones; md+ shows both panes.
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(initialPartner ? 'chat' : 'list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial messages if prop changes
  useEffect(() => {
    setAllMessages(initialMessages);
  }, [initialMessages]);

  // Group messages by conversation partner
  const conversations = useMemo(() => {
    const map = new Map<string, { partner: { id: string; name: string | null; image: string | null }; last: Msg; unread: number }>();
    for (const m of allMessages) {
      const pid = m.senderId === currentUserId ? m.receiverId : m.senderId;
      const p = m.senderId === currentUserId ? m.receiver : m.sender;
      const entry = map.get(pid) || { partner: p, last: m, unread: 0 };
      entry.last = m;
      if (m.receiverId === currentUserId && !m.isRead) entry.unread += 1;
      map.set(pid, entry);
    }
    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime()
    );

    if (initialPartner && !map.has(initialPartner)) {
      list.unshift({
        partner: { id: initialPartner, name: 'User', image: null },
        last: {
          id: 'temp',
          senderId: currentUserId,
          receiverId: initialPartner,
          message: 'Start a new conversation',
          isRead: true,
          createdAt: new Date(),
          sender: { id: currentUserId, name: 'You', image: null },
          receiver: { id: initialPartner, name: 'User', image: null },
        },
        unread: 0,
      });
    }

    return list;
  }, [allMessages, currentUserId, initialPartner]);

  const activePartner = partner || (conversations.length > 0 ? conversations[0].partner.id : '');
  const partnerInfo = conversations.find((c) => c.partner.id === activePartner)?.partner;

  const thread = useMemo(
    () => allMessages.filter((m) => (m.senderId === activePartner && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === activePartner)),
    [allMessages, activePartner, currentUserId]
  );

  // Auto-scroll to bottom on thread update or when partner starts typing
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.length, isPartnerTyping, activePartner]);

  // Real-time message polling every 3 seconds
  useEffect(() => {
    const fetchLatestMessages = async () => {
      try {
        const res = await fetch('/api/messages', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setAllMessages(data.messages);
          }
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    const interval = setInterval(fetchLatestMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll typing status of active partner every 2 seconds
  useEffect(() => {
    if (!activePartner) return;

    const checkTypingStatus = async () => {
      try {
        const res = await fetch(`/api/messages/typing?with=${activePartner}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIsPartnerTyping(Boolean(data.isTyping));
        }
      } catch (err) {
        console.error('Error checking typing status:', err);
      }
    };

    checkTypingStatus();
    const interval = setInterval(checkTypingStatus, 2000);
    return () => clearInterval(interval);
  }, [activePartner]);

  // Send typing ping when typing in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    if (!activePartner) return;

    // Send typing status = true
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: activePartner, isTyping: true }),
    }).catch(() => {});

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing status after 2.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, isTyping: false }),
      }).catch(() => {});
    }, 2500);
  };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipientId = activePartner;
    if (!draft.trim() || !recipientId) return;

    const messageText = draft.trim();
    setDraft('');
    setSending(true);
    setError('');

    // Clear typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: recipientId, isTyping: false }),
    }).catch(() => {});

    // Optimistic message insertion
    const optimisticMsg: Msg = {
      id: 'opt-' + Date.now(),
      senderId: currentUserId,
      receiverId: recipientId,
      message: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: 'You', image: null },
      receiver: { id: recipientId, name: partnerInfo?.name || 'User', image: partnerInfo?.image || null },
    };

    setAllMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: recipientId, message: messageText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      // Remove optimistic message on error
      setAllMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }

  const hasAnyConversations = conversations.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Messages</h1>
          <p className="text-xs text-gray-500">Real-time messaging with buyers and sellers</p>
        </div>
      </div>

      {!hasAnyConversations ? (
        <EmptyState
          title="No messages yet"
          description="Message a seller from any item page or wanted list to start a conversation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:min-h-[30rem]">
          {/* Conversation list (hidden on phones while a thread is open) */}
          <div className={`md:col-span-1 border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 max-h-[34rem] overflow-y-auto shadow-xs ${mobilePane === 'chat' ? 'hidden md:block' : 'block'}`}>
            {conversations.map((c) => (
              <button
                key={c.partner.id}
                onClick={() => {
                  setPartner(c.partner.id);
                  setMobilePane('chat');
                }}
                className={`w-full text-left px-3.5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  activePartner === c.partner.id ? 'bg-brand-50/80 border-l-4 border-brand-500' : ''
                }`}
              >
                {c.partner.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.partner.image} alt={c.partner.name ?? ''} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                    {c.partner.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate flex items-center justify-between">
                    <span>{c.partner.name || 'User'}</span>
                    {c.unread > 0 && (
                      <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5 ml-1 animate-pulse">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{c.last.message}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Thread (near full-height sheet on phones, side pane on md+) */}
          <div
            className={`md:col-span-2 border border-gray-200 rounded-lg bg-white flex-col shadow-xs overflow-hidden h-[calc(100dvh-14rem)] min-h-[24rem] md:h-auto md:min-h-[30rem] md:max-h-[34rem] ${
              mobilePane === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activePartner ? (
              <>
                <div className="px-3 sm:px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between gap-2 bg-gray-50/70 shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <button
                      onClick={() => setMobilePane('list')}
                      className="md:hidden -ml-1 p-1.5 rounded-md text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors shrink-0"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {partnerInfo?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partnerInfo.image} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {partnerInfo?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 truncate">{partnerInfo?.name ?? 'User'}</span>
                  </div>

                  {isPartnerTyping && (
                    <span className="text-xs text-brand-600 font-medium animate-pulse flex items-center gap-1">
                      typing...
                    </span>
                  )}
                </div>

                {/* Messages Container */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 md:min-h-[18rem] overscroll-contain">
                  {thread.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 my-12">
                      No message history with this user. Type a message below to start the conversation!
                    </p>
                  ) : (
                    thread.map((m) => {
                      const mine = m.senderId === currentUserId;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${mine ? 'bg-brand-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200/80'}`}>
                            <div className="break-words leading-relaxed">{m.message}</div>
                            <div className={`text-[10px] mt-1 text-right font-medium ${mine ? 'text-brand-100' : 'text-gray-400'}`}>
                              {timeAgo(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator Bubble */}
                  {isPartnerTyping && (
                    <div className="flex justify-start animate-in fade-in duration-200">
                      <div className="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2 shadow-2xs border border-gray-200">
                        <span className="font-medium text-gray-600">{partnerInfo?.name || 'User'} is typing</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={send} className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50/70 shrink-0">
                  <input
                    type="text"
                    value={draft}
                    onChange={handleInputChange}
                    placeholder={`Message ${partnerInfo?.name || 'User'}...`}
                    className="flex-1 min-w-0 px-4 py-2 min-h-[44px] text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] text-sm font-semibold text-white bg-brand-600 rounded-full hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8 text-center">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}
    </div>
  );
}