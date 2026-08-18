import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cartItemCount, shopCart } from './shop-api';
import type { Cart } from './shop-types';

type CartCtx = {
  cart: Cart | null;
  count: number;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CartCtx>({
  cart: null,
  count: 0,
  refresh: async () => undefined,
});

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await shopCart());
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ cart, count: cartItemCount(cart), refresh }),
    [cart, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShopCart() {
  return useContext(Ctx);
}
