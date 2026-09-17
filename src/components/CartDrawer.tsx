import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, ArrowRight, Globe, Server, Palette } from "lucide-react";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "@/lib/router-compat";
import { formatPrice, formatAmount } from "@/lib/formatPrice";

const itemIcon = (type: CartItem["type"]) => {
  switch (type) {
    case "hosting": return Server;
    case "theme": return Palette;
    default: return Globe;
  }
};

const itemLabel = (item: CartItem, bn: boolean) => {
  switch (item.type) {
    case "domain": return bn ? "ডোমেইন রেজিস্ট্রেশন • ১ বছর" : "Domain Registration • 1 Year";
    case "hosting": return item.description || (bn ? "হোস্টিং প্ল্যান" : "Hosting Plan");
    case "theme": return item.description || (bn ? "ওয়েবসাইট থিম" : "Website Theme");
  }
};

const CartDrawer = () => {
  const { items, removeItem, isCartOpen, setCartOpen, itemCount } = useCart();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const navigate = useNavigate();

  const parseBdtPrice = (price: string): number => {
    const ascii = price.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
    return parseInt(ascii.replace(/[^\d]/g, ""), 10) || 0;
  };
  const totalBdt = items.reduce((sum, item) => sum + parseBdtPrice(item.price_bdt), 0);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60]"
            onClick={() => setCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  {bn ? "আপনার কার্ট" : "Your Cart"}
                </h2>
                {itemCount > 0 && (
                  <span className="text-xs font-bold gradient-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {bn ? "আপনার কার্ট খালি" : "Your cart is empty"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {bn ? "ডোমেইন, হোস্টিং বা থিম যোগ করুন" : "Add domains, hosting or themes"}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const Icon = itemIcon(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: 50 }}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl glass-card"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">{itemLabel(item, bn)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-foreground">৳{formatPrice(item.price_bdt, lang)}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{bn ? "মোট" : "Total"}</span>
                  <span className="text-xl font-bold text-foreground">৳{formatAmount(totalBdt, lang)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {bn ? "চেকআউট করুন" : "Proceed to Checkout"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
