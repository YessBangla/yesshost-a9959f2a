import { type LucideIcon } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card rounded-xl p-10 sm:p-14 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-5">
      <Icon className="w-8 h-8 text-muted-foreground/40" />
    </div>
    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
      >
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && !actionTo && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
      >
        {actionLabel}
      </button>
    )}
  </motion.div>
);

export default EmptyState;
