'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react';

interface CallModalProps {
  callId: string;
  isCaller: boolean;
  callType: 'audio' | 'video';
  partnerName: string;
  partnerImage?: string | null;
  onClose: () => void;
}

export function CallModal({
  callId,
  isCaller,
  callType,
  partnerName,
  partnerImage,
  onClose,
}: CallModalProps) {
  const [callStatus, setCallStatus] = useState<string>(isCaller ? 'Calling...' : 'Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());

  // Cleanup on unmount
  const terminateMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleEndCall = async () => {
    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
    } catch {}
    terminateMedia();
    onClose();
  };

  useEffect(() => {
    let isMounted = true;

    async function initWebRTC() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle remote stream
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            if (callType === 'video' && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            } else if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
            }
          }
        };

        // Handle local ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            fetch('/api/calls/candidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callId, candidate: event.candidate }),
            }).catch(() => {});
          }
        };

        // If receiver, fetch the offer, set remote, create answer
        if (!isCaller) {
          const res = await fetch(`/api/calls/poll?callId=${callId}`);
          const data = await res.json();
          if (data.callSession?.offer) {
            const offer = JSON.parse(data.callSession.offer);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch('/api/calls/respond', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callId, status: 'accepted', answer }),
            });
            setCallStatus('Connected');
            startCallTimer();
          }
        }

        // Poll signaling state (status, answer, candidates)
        pollIntervalRef.current = setInterval(async () => {
          try {
            const res = await fetch(`/api/calls/poll?callId=${callId}`);
            if (!res.ok) return;
            const data = await res.json();
            const session = data.callSession;
            if (!session) return;

            if (session.status === 'ended' || session.status === 'rejected') {
              setCallStatus(session.status === 'rejected' ? 'Call Rejected' : 'Call Ended');
              setTimeout(() => {
                terminateMedia();
                onClose();
              }, 1200);
              return;
            }

            // Caller handles incoming answer
            if (isCaller && session.status === 'accepted' && session.answer && pc.signalingState !== 'stable') {
              const answer = JSON.parse(session.answer);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              setCallStatus('Connected');
              startCallTimer();
            }

            // Apply new remote ICE candidates
            if (Array.isArray(session.candidates) && pc.remoteDescription) {
              for (const cand of session.candidates) {
                const candKey = JSON.stringify(cand);
                if (!processedCandidatesRef.current.has(candKey)) {
                  processedCandidatesRef.current.add(candKey);
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch {}
                }
              }
            }
          } catch {}
        }, 1500);
      } catch (err: any) {
        setCallStatus(`Permission denied or media error`);
        console.error('Call media error:', err);
      }
    }

    initWebRTC();

    return () => {
      isMounted = false;
      terminateMedia();
    };
  }, [callId, isCaller, callType]);

  const startCallTimer = () => {
    if (timerIntervalRef.current) return;
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoDisabled((prev) => !prev);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            {partnerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partnerImage} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                {partnerName.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                {partnerName}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  {callType}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {callStatus === 'Connected' ? formatDuration(callDuration) : callStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Media Window */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local PiP Video */}
              <div className="absolute bottom-3 right-3 w-28 sm:w-36 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              </div>
            </>
          ) : (
            /* Audio Only Avatar Visualization */
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
                  <Volume2 className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-300">
                {callStatus === 'Connected' ? 'Voice Call Active' : callStatus}
              </div>
              <audio ref={remoteAudioRef} autoPlay />
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="p-6 bg-gray-950 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {callType === 'video' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoDisabled ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoDisabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
