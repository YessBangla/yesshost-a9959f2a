import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, MicOff, Mic } from "lucide-react";
import type { CallStatus } from "@/hooks/useWebRTCCall";

interface LiveChatCallUIProps {
  callStatus: CallStatus;
  formattedDuration: string;
  isMuted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  bn: boolean;
}

const LiveChatCallUI = ({
  callStatus,
  formattedDuration,
  isMuted,
  onStartCall,
  onEndCall,
  onToggleMute,
  bn,
}: LiveChatCallUIProps) => {
  if (callStatus === "idle" || callStatus === "ended") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="border-b border-border overflow-hidden"
      >
        <div className="px-4 py-3 bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Pulsing indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  callStatus === "connected" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  callStatus === "connected" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>

            <div>
              <p className="text-xs font-semibold text-foreground">
                {callStatus === "requesting" && (bn ? "কল করা হচ্ছে..." : "Calling...")}
                {callStatus === "ringing" && (bn ? "রিং হচ্ছে..." : "Ringing...")}
                {callStatus === "connected" && (bn ? "কল চলছে" : "On call")}
              </p>
              {callStatus === "connected" && (
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {formattedDuration}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {callStatus === "connected" && (
              <button
                onClick={onToggleMute}
                className={`p-2 rounded-full transition-colors ${
                  isMuted
                    ? "bg-destructive/15 text-destructive"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                }`}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={onEndCall}
              className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              aria-label="End call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveChatCallUI;
