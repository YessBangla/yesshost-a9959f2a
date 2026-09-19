import { useState, useEffect, forwardRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionButton = motion.create(
  forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  )
);

const ScrollArrows = () => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      setShowUp(y > 300);
      setShowDown(y < maxY - 100);
    };
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const scrollTo = (dir: "up" | "down") => {
    window.scrollBy({ top: dir === "up" ? -window.innerHeight : window.innerHeight, behavior: "smooth" });
  };

  return (
    <div className="fixed left-3 z-40 flex flex-col gap-2 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:left-4 md:bottom-6">
      <AnimatePresence>
        {showUp && (
          <MotionButton
            key="scroll-up"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollTo("up")}
            className="flex w-10 h-10 rounded-full glass-card border border-border/50 items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shadow-lg"
            aria-label="Scroll up"
          >
            <ChevronUp className="w-5 h-5" />
          </MotionButton>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDown && (
          <MotionButton
            key="scroll-down"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollTo("down")}
            className="hidden md:flex w-10 h-10 rounded-full glass-card border border-border/50 items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shadow-lg"
            aria-label="Scroll down"
          >
            <ChevronDown className="w-5 h-5" />
          </MotionButton>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrollArrows;
