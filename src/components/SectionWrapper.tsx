import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

type SectionVariant = "default" | "alt" | "accent" | "gradient";

interface SectionWrapperProps {
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
  divider?: "wave" | "curve" | "none";
  id?: string;
}

const variantStyles: Record<SectionVariant, string> = {
  default: "bg-background",
  alt: "bg-muted/40",
  accent: "section-accent-bg",
  gradient: "section-gradient-bg",
};

const SectionWrapper = ({
  children,
  variant = "default",
  className = "",
  divider = "none",
  id,
}: SectionWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} id={id} className={`relative ${variantStyles[variant]} ${className}`}>
      {/* Top divider */}
      {divider === "wave" && (
        <div className="absolute top-0 left-0 right-0 -translate-y-[1px] overflow-hidden leading-[0] z-10">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className="w-full h-6 md:h-10"
          >
            <path
              d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,0 L0,0 Z"
              className={
                variant === "alt" || variant === "accent"
                  ? "fill-background"
                  : "fill-muted/40"
              }
            />
          </svg>
        </div>
      )}
      {divider === "curve" && (
        <div className="absolute top-0 left-0 right-0 -translate-y-[1px] overflow-hidden leading-[0] z-10">
          <svg
            viewBox="0 0 1440 40"
            preserveAspectRatio="none"
            className="w-full h-5 md:h-8"
          >
            <path
              d="M0,40 Q720,0 1440,40 L1440,0 L0,0 Z"
              className={
                variant === "alt" || variant === "accent"
                  ? "fill-background"
                  : "fill-muted/40"
              }
            />
          </svg>
        </div>
      )}

      {/* Content with reveal animation */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SectionWrapper;
