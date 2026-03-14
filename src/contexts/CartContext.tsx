import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItemType = "domain" | "hosting" | "theme";

export interface CartItem {
  id: string; // unique key (domain name, plan slug, theme slug)
  type: CartItemType;
  name: string;
  description?: string;
  price_bdt: string;
  price_usd?: string;
  // domain specific
  domain?: string;
  ext?: string;
  // hosting specific
  plan_id?: string;
  billing_cycle?: string;
  category?: string;
  // theme specific
  theme_id?: string;
  theme_slug?: string;
  include_hosting?: boolean;
  thumbnail_url?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  itemCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "yesshost_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const isInCart = (id: string) => items.some((i) => i.id === id);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        itemCount: items.length,
        isCartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
