'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { timeAgo } from '@/lib/utils';
import { ProAvatar } from '@/components/ui/ProAvatar';
import { CallModal } from './CallModal';
import {
  Send,
  ChevronLeft,
  Phone,
  Video,
  MapPin,
  ExternalLink,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  PhoneIncoming,
} from 'lucide-react';

type Msg = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  isRead: boolean;
  createdAt: string | Date;
  listing?: { id: string; title: string } | null;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    subscriptionPlan?: string | null;
    isVerifiedSeller?: boolean;
  };
  receiver: {
    id: string;
    name: string | null;
    image: string | null;
    subscriptionPlan?: string | null;
    isVerifiedSeller?: boolean;
  };
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
  const [locationSharing, setLocationSharing] = useState(false);
  const [error, setError] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Message Request State
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // WebRTC Call State
  const [activeCallSession, setActiveCallSession] = useState<{
    callId: string;
    isCaller: boolean;
    callType: 'audio' | 'video';
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');

  // Mobile single-pane switcher
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(initialPartner ? 'chat' : 'list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial messages if prop changes
  useEffect(() => {
    setAllMessages(initialMessages);
  }, [initialMessages]);

  // Group messages by conversation partner
  const conversations = useMemo(() => {
    const map = new Map<
      string,
      {
        partner: {
          id: string;
          name: string | null;
          image: string | null;
          subscriptionPlan?: string | null;
          isVerifiedSeller?: boolean;
        };
        last: Msg;
        unread: number;
      }
    >();

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
    () =>
      allMessages.filter(
        (m) =>
          (m.senderId === activePartner && m.receiverId === currentUserId) ||
          (m.senderId === currentUserId && m.receiverId === activePartner)
      ),
    [allMessages, activePartner, currentUserId]
  );

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.length, isPartnerTyping, activePartner]);

  // Real-time message polling
  useEffect(() => {
    const fetchLatestMessages = async () => {
      try {
        const res = await fetch('/api/messages', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setAllMessages(data.messages);

            const unreadTotal = data.messages.filter(
              (m: Msg) => m.receiverId === currentUserId && !m.isRead
            ).length;
            window.dispatchEvent(
              new CustomEvent('baust:unread-messages-count', {
                detail: { count: unreadTotal },
              })
            );
          }
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    const interval = setInterval(fetchLatestMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Check Message Request status for activePartner
  useEffect(() => {
    if (!activePartner) return;
    async function checkReq() {
      try {
        const res = await fetch(`/api/messages/requests?with=${activePartner}`);
        if (res.ok) {
          const data = await res.json();
          setActiveRequest(data.request || null);
        }
      } catch {}
    }
    checkReq();
  }, [activePartner]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!activePartner) return;

    const hasUnread = allMessages.some(
      (m) => m.senderId === activePartner && m.receiverId === currentUserId && !m.isRead
    );

    if (hasUnread) {
      setAllMessages((prev) =>
        prev.map((m) =>
          m.senderId === activePartner && m.receiverId === currentUserId
            ? { ...m, isRead: true }
            : m
        )
      );

      fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activePartner }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.unreadCount === 'number') {
            window.dispatchEvent(
              new CustomEvent('baust:unread-messages-count', {
                detail: { count: data.unreadCount },
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [activePartner, allMessages, currentUserId]);

  // Typing status polling
  useEffect(() => {
    if (!activePartner) return;

    const checkTypingStatus = async () => {
      try {
        const res = await fetch(`/api/messages/typing?with=${activePartner}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIsPartnerTyping(Boolean(data.isTyping));
        }
      } catch {}
    };

    checkTypingStatus();
    const interval = setInterval(checkTypingStatus, 2000);
    return () => clearInterval(interval);
  }, [activePartner]);

  // Poll for incoming calls
  useEffect(() => {
    const pollIncomingCalls = async () => {
      if (activeCallSession) return;
      try {
        const res = await fetch('/api/calls/poll?incoming=true');
        if (res.ok) {
          const data = await res.json();
          if (data.incomingCall) {
            setIncomingCall(data.incomingCall);
          } else {
            setIncomingCall(null);
          }
        }
      } catch {}
    };

    const interval = setInterval(pollIncomingCalls, 2500);
    return () => clearInterval(interval);
  }, [activeCallSession]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    if (!activePartner) return;

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: activePartner, isTyping: true }),
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, isTyping: false }),
      }).catch(() => {});
    }, 2500);
  };

  // Accept / Reject Message Request
  async function handleUpdateRequest(status: 'accepted' | 'rejected') {
    if (!activeRequest) return;
    setRequestLoading(true);
    try {
      const res = await fetch(`/api/messages/requests/${activeRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');
      setActiveRequest(data.request);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequestLoading(false);
    }
  }

  // Handle Call Initiation
  async function initiateCall(type: 'audio' | 'video') {
    setError('');
    if (!activePartner) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activePartner,
          type,
          offer,
        }),
      });

      const data = await res.json();
      stream.getTracks().forEach((track) => track.stop());
      pc.close();

      if (!res.ok) {
        if (data.isProRequired) {
          setProFeatureName(type === 'video' ? 'Video Calling' : 'Voice Calling');
          setProModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Could not initiate call');
      }

      setActiveCallSession({
        callId: data.callSession.id,
        isCaller: true,
        callType: type,
      });
    } catch (err: any) {
      setError(err.message || 'Call failed to start');
    }
  }

  // Answer Incoming Call
  const handleAnswerCall = (call: any) => {
    setActiveCallSession({
      callId: call.id,
      isCaller: false,
      callType: call.type as 'audio' | 'video',
    });
    setIncomingCall(null);
  };

  // Reject Incoming Call
  const handleDeclineCall = async (callId: string) => {
    try {
      await fetch('/api/calls/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, status: 'rejected' }),
      });
    } catch {}
    setIncomingCall(null);
  };

  // Send Message
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipientId = activePartner;
    if (!draft.trim() || !recipientId) return;

    const messageText = draft.trim();
    setDraft('');
    setSending(true);
    setError('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: recipientId, isTyping: false }),
    }).catch(() => {});

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
      setAllMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }

  // Send Live GPS Location
  async function handleShareLocation() {
    setError('');
    if (!navigator.geolocation) {
      return setError('Geolocation is not supported by your browser.');
    }

    setLocationSharing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: activePartner,
              message: '📍 Shared current GPS location for item meetup.',
              latitude: lat,
              longitude: lng,
              locationName: 'BAUST Campus Location',
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            if (data.error && data.error.includes('PRO')) {
              setProFeatureName('GPS Location Sharing');
              setProModalOpen(true);
              return;
            }
            throw new Error(data.error || 'Location sharing failed');
          }

          router.refresh();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLocationSharing(false);
        }
      },
      (err) => {
        setError(`Location access denied: ${err.message}`);
        setLocationSharing(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  const hasAnyConversations = conversations.length > 0;
  const isIncomingPending = activeRequest?.status === 'pending' && activeRequest?.receiverId === currentUserId;
  const isOutgoingPending = activeRequest?.status === 'pending' && activeRequest?.senderId === currentUserId;
  const isRejected = activeRequest?.status === 'rejected';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Messages & Calls</h1>
          <p className="text-xs text-gray-500">Real-time messaging, WebRTC calling & meetup location sharing</p>
        </div>
      </div>

      {!hasAnyConversations ? (
        <EmptyState
          title="No messages yet"
          description="Message a seller from any item page or wanted list to start a conversation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:min-h-[30rem]">
          {/* Conversation List */}
          <div
            className={`md:col-span-1 border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 max-h-[34rem] overflow-y-auto shadow-xs ${
              mobilePane === 'chat' ? 'hidden md:block' : 'block'
            }`}
          >
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
                <ProAvatar
                  src={c.partner.image}
                  name={c.partner.name}
                  isPro={c.partner.subscriptionPlan === 'pro' || c.partner.isVerifiedSeller}
                  size="md"
                />
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

          {/* Chat Thread */}
          <div
            className={`md:col-span-2 border border-gray-200 rounded-xl bg-white flex-col shadow-xs overflow-hidden h-[calc(100dvh-14rem)] min-h-[24rem] md:h-auto md:min-h-[30rem] md:max-h-[34rem] ${
              mobilePane === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activePartner ? (
              <>
                {/* Active Chat Header */}
                <div className="px-3 sm:px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between gap-2 bg-gray-50/70 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setMobilePane('list')}
                      className="md:hidden -ml-1 p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <ProAvatar
                      src={partnerInfo?.image}
                      name={partnerInfo?.name}
                      isPro={partnerInfo?.subscriptionPlan === 'pro' || partnerInfo?.isVerifiedSeller}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 truncate block text-sm">
                        {partnerInfo?.name ?? 'User'}
                      </span>
                      {isPartnerTyping && (
                        <span className="text-[11px] text-brand-600 font-medium animate-pulse flex items-center gap-1">
                          typing...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pro Call Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => initiateCall('audio')}
                      className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all border border-emerald-200"
                      title="Campus PRO Voice Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => initiateCall('video')}
                      className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold flex items-center gap-1.5 transition-all border border-cyan-200"
                      title="Campus PRO Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Video</span>
                    </button>
                  </div>
                </div>

                {/* Message Request Warning / Action Banner */}
                {isIncomingPending && (
                  <div className="bg-amber-50 border-b border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Message Request:</strong> {partnerInfo?.name || 'This user'} wants to message you. Accept to allow replies.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateRequest('accepted')}
                        disabled={requestLoading}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRequest('rejected')}
                        disabled={requestLoading}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold flex items-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                )}

                {isOutgoingPending && (
                  <div className="bg-blue-50 border-b border-blue-200 p-2.5 text-xs text-blue-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Your message request is pending. You can chat once {partnerInfo?.name || 'the recipient'} accepts.</span>
                  </div>
                )}

                {isRejected && (
                  <div className="bg-red-50 border-b border-red-200 p-2.5 text-xs text-red-800 flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600 shrink-0" />
                    <span>This conversation request has been declined.</span>
                  </div>
                )}

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
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                              mine
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200/80'
                            }`}
                          >
                            <div className="break-words leading-relaxed">{m.message}</div>

                            {/* GPS Location Card */}
                            {m.latitude != null && m.longitude != null && (
                              <div className="mt-2 p-2 bg-white/95 text-gray-800 rounded-xl border border-gray-200 text-xs space-y-1.5 shadow-xs">
                                <div className="font-semibold flex items-center gap-1 text-emerald-700">
                                  <MapPin className="w-3.5 h-3.5" /> {m.locationName || 'Meetup GPS Location'}
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono">
                                  Coordinates: {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
                                </div>
                                <a
                                  href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                                >
                                  View on Google Maps <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}

                            <div
                              className={`text-[10px] mt-1 text-right font-medium ${
                                mine ? 'text-brand-100' : 'text-gray-400'
                              }`}
                            >
                              {timeAgo(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {isPartnerTyping && (
                    <div className="flex justify-start animate-in fade-in duration-200">
                      <div className="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-2 shadow-2xs border border-gray-200">
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
                <form onSubmit={send} className="p-3 border-t border-gray-200 flex items-center gap-2 bg-gray-50/70 shrink-0">
                  {/* Share Location Button */}
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    disabled={locationSharing || isRejected}
                    title="Share Live GPS Location for Campus Meetup"
                    className="p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={draft}
                    disabled={isRejected}
                    onChange={handleInputChange}
                    placeholder={
                      isRejected
                        ? 'Request was declined'
                        : `Message ${partnerInfo?.name || 'User'}...`
                    }
                    className="flex-1 min-w-0 px-4 py-2 min-h-[44px] text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white disabled:bg-gray-100"
                  />

                  <button
                    type="submit"
                    disabled={sending || !draft.trim() || isRejected}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] text-sm font-semibold text-white bg-brand-600 rounded-full hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
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

      {/* Incoming Call Popup */}
      {incomingCall && !activeCallSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-sm w-full p-6 text-white text-center shadow-2xl space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
              {incomingCall.caller?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={incomingCall.caller.image}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover relative ring-4 ring-emerald-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-2xl relative">
                  {incomingCall.caller?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg">{incomingCall.caller?.name || 'Campus Student'}</h3>
              <p className="text-xs text-emerald-400 font-medium">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAnswerCall(incomingCall)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4" /> Accept
              </button>

              <button
                type="button"
                onClick={() => handleDeclineCall(incomingCall.id)}
                className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <X className="w-4 h-4" /> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active WebRTC Call Session Modal */}
      {activeCallSession && (
        <CallModal
          callId={activeCallSession.callId}
          isCaller={activeCallSession.isCaller}
          callType={activeCallSession.callType}
          partnerName={partnerInfo?.name || 'User'}
          partnerImage={partnerInfo?.image}
          onClose={() => setActiveCallSession(null)}
        />
      )}

      {/* Pro Upsell Modal */}
      {proModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Unlock {proFeatureName}</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Direct calling and live GPS location sharing are exclusive to <strong>Campus PRO</strong> members. Boost your trust and connect instantly with campus buyers!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/upgrade"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Upgrade (৳49)
              </Link>
              <button
                type="button"
                onClick={() => setProModalOpen(false)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}
    </div>
  );
}
