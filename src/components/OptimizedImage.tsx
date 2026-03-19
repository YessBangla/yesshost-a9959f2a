import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Use priority for above-the-fold / LCP images */
  priority?: boolean;
  /** Optional blur-up placeholder color */
  placeholderColor?: string;
}

/**
 * Performance-optimized image component:
 * - Intersection Observer lazy loading (native + fallback)
 * - Fade-in on load to eliminate flash
 * - Priority flag to eagerly load hero/LCP images
 * - Proper width/height to prevent CLS
 */
const OptimizedImage = ({
  src,
  alt = "",
  className,
  priority = false,
  placeholderColor = "hsl(var(--muted))",
  style,
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <img
      ref={imgRef}
      src={inView ? src : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        backgroundColor: loaded ? undefined : placeholderColor,
        ...style,
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
