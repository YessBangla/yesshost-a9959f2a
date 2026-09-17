import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { startCallRecordFn, updateCallRecordFn } from "@/lib/dashboard.functions";

export type CallStatus = "idle" | "requesting" | "ringing" | "connected" | "ended";

interface UseWebRTCCallProps {
  chatId: string | null;
  role: "visitor" | "admin";
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTCCall({ chatId, role }: UseWebRTCCallProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const callRecordIdRef = useRef<string | null>(null);
  const startRecord = useServerFn(startCallRecordFn);
  const updateRecord = useServerFn(updateCallRecordFn);
  const callStartTimeRef = useRef<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otherRole = role === "visitor" ? "admin" : "visitor";

  // Cleanup helper
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (ringtoneRef.current) clearInterval(ringtoneRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setDuration(0);
    setIsMuted(false);
  }, []);

  // Save call record to database
  const saveCallStart = useCallback(async () => {
    if (!chatId) return;
    callStartTimeRef.current = new Date().toISOString();
    const { id } = await startRecord({
      data: { chatId, callerRole: role, startedAt: callStartTimeRef.current },
    });
    if (id) callRecordIdRef.current = id;
  }, [chatId, role, startRecord]);

  const saveCallEnd = useCallback(async (finalStatus: string, finalDuration: number) => {
    if (!callRecordIdRef.current) return;
    await updateRecord({
      data: {
        id: callRecordIdRef.current,
        status: finalStatus,
        durationSeconds: finalDuration,
        ended: true,
      },
    });
    callRecordIdRef.current = null;
    callStartTimeRef.current = null;
  }, [updateRecord]);

  // Create peer connection
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc",
          payload: { type: "ice-candidate", candidate: e.candidate, from: role },
        });
      }
    };

    pc.ontrack = (e) => {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }
      remoteAudioRef.current.srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setCallStatus("ended");
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [role, cleanup]);

  // Subscribe to signaling channel
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`call-${chatId}`)
      .on("broadcast", { event: "webrtc" }, async ({ payload }) => {
        if (!payload || payload.from === role) return;

        if (payload.type === "call-request" && role === "admin") {
          setCallStatus("ringing");
        }

        if (payload.type === "call-accepted" && role === "visitor") {
          // Visitor receives answer
          if (pcRef.current && payload.answer) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        }

        if (payload.type === "offer" && role === "admin") {
          // Admin receives offer
          const pc = pcRef.current || createPC();
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));

          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channel.send({
            type: "broadcast",
            event: "webrtc",
            payload: { type: "call-accepted", answer, from: role },
          });
        }

        if (payload.type === "ice-candidate" && pcRef.current) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.error("ICE candidate error:", e);
          }
        }

        if (payload.type === "call-end") {
          setCallStatus("ended");
          cleanup();
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, role, createPC, cleanup]);

  // Start call (visitor initiates)
  const startCall = useCallback(async () => {
    if (!chatId || !channelRef.current) return;
    try {
      setCallStatus("requesting");
      await saveCallStart();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send call request with offer
      channelRef.current.send({
        type: "broadcast",
        event: "webrtc",
        payload: { type: "call-request", from: role },
      });

      // Send offer after a brief delay
      setTimeout(() => {
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc",
          payload: { type: "offer", offer, from: role },
        });
      }, 500);

      setCallStatus("ringing");

      // Auto-end after 60s if not connected
      ringtoneRef.current = setTimeout(() => {
        if (callStatus === "ringing" || callStatus === "requesting") {
          endCall();
        }
      }, 60000) as unknown as ReturnType<typeof setInterval>;
    } catch (err) {
      console.error("Call start error:", err);
      setCallStatus("idle");
    }
  }, [chatId, role, createPC, callStatus]);

  // Accept call (admin accepts)
  const acceptCall = useCallback(async () => {
    if (!chatId || !channelRef.current) return;
    createPC();
    setCallStatus("connected");
    // Update record status to connected
    if (callRecordIdRef.current) {
      await updateRecord({ data: { id: callRecordIdRef.current, status: "connected" } });
    }
  }, [chatId, createPC]);

  // End call
  const endCall = useCallback(() => {
    const finalDuration = duration;
    const finalStatus = callStatus === "connected" ? "completed" : "missed";
    channelRef.current?.send({
      type: "broadcast",
      event: "webrtc",
      payload: { type: "call-end", from: role },
    });
    setCallStatus("ended");
    cleanup();
    saveCallEnd(finalStatus, finalDuration);
    setTimeout(() => setCallStatus("idle"), 2000);
  }, [role, cleanup, duration, callStatus, saveCallEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    callStatus,
    duration,
    formattedDuration: formatDuration(duration),
    isMuted,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
  };
}
