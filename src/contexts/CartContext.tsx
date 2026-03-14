import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  domain: string;
  ext: string;
  price_bdt: string;
  price_usd: string;
  type: "domain";
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (domain: string) => void;
  clearCart: () => void;
  isInCart: (domain: string) => boolean;
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
      if (prev.some((i) => i.domain === item.domain)) return prev;
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const removeItem = (domain: string) => {
    setItems((prev) => prev.filter((i) => i.domain !== domain));
  };

  const clearCart = () => setItems([]);

  const isInCart = (domain: string) => items.some((i) => i.domain === domain);

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
