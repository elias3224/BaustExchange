'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { timeAgo } from '@/lib/utils';
import { Send } from 'lucide-react';

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
  messages,
}: {
  currentUserId: string;
  initialPartner: string;
  messages: Msg[];
}) {
  const router = useRouter();
  const [partner, setPartner] = useState(initialPartner);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Group messages by conversation partner.
  const conversations = useMemo(() => {
    const map = new Map<string, { partner: { id: string; name: string | null; image: string | null }; last: Msg; unread: number }>();
    for (const m of messages) {
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

    // If initialPartner is provided and not already in list, add temporary entry
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
  }, [messages, currentUserId, initialPartner]);

  const thread = useMemo(
    () => messages.filter((m) => (m.senderId === partner && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === partner)),
    [messages, partner, currentUserId]
  );

  const activePartner = partner || (conversations.length > 0 ? conversations[0].partner.id : '');
  const partnerInfo = conversations.find((c) => c.partner.id === activePartner)?.partner;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipientId = activePartner;
    if (!draft.trim() || !recipientId) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: recipientId, message: draft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      setDraft('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const hasAnyConversations = conversations.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Messages</h1>

      {!hasAnyConversations ? (
        <EmptyState
          title="No messages yet"
          description="Message a seller from any item page or wanted list to start a conversation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[28rem]">
          {/* Conversation list */}
          <div className="md:col-span-1 border border-gray-200 rounded-md bg-white divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.partner.id}
                onClick={() => setPartner(c.partner.id)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3.5 hover:bg-gray-50 transition-colors ${
                  activePartner === c.partner.id ? 'bg-brand-50/80 border-l-4 border-brand-500' : ''
                }`}
              >
                {c.partner.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.partner.image} alt={c.partner.name ?? ''} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate flex items-center justify-between">
                    <span>{c.partner.name || 'User'}</span>
                    {c.unread > 0 && (
                      <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 ml-1">{c.unread}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{c.last.message}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className="md:col-span-2 border border-gray-200 rounded-md bg-white flex flex-col max-h-[32rem] justify-between">
            {activePartner ? (
              <>
                <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-800 flex items-center gap-2 bg-gray-50/50">
                  {partnerInfo?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={partnerInfo.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300" />
                  )}
                  <span>{partnerInfo?.name ?? 'User'}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[16rem]">
                  {thread.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 my-8">
                      No message history with this user. Type a message below to start the conversation!
                    </p>
                  ) : (
                    thread.map((m) => {
                      const mine = m.senderId === currentUserId;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg px-3.5 py-2 text-sm shadow-xs ${mine ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            <div>{m.message}</div>
                            <div className={`text-[10px] mt-1 text-right ${mine ? 'text-brand-100' : 'text-gray-400'}`}>
                              {timeAgo(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={send} className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50/50">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8">
                Select a conversation from the left to start messaging
              </div>
            )}
          </div>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}
    </div>
  );
}