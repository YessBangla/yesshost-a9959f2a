import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/contexts/LanguageContext";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          {bn ? "আপনি অফলাইনে আছেন। ইন্টারনেট সংযোগ চেক করুন।" : "You are offline. Please check your internet connection."}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
