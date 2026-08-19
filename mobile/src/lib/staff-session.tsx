import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getShopToken, getToken, isOpsRole, restoreOpsSession } from './api';
import { shopMe } from './shop-api';

type StaffSessionValue = {
  showStaff: boolean;
  refreshStaff: () => Promise<void>;
};

const StaffSessionContext = createContext<StaffSessionValue>({
  showStaff: false,
  refreshStaff: async () => undefined,
});

export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [showStaff, setShowStaff] = useState(false);

  const refreshStaff = useCallback(async () => {
    const ops = await restoreOpsSession();
    if (ops) {
      setShowStaff(true);
      return;
    }
    const shopToken = await getShopToken();
    const opsToken = await getToken();
    if (!shopToken && !opsToken) {
      setShowStaff(false);
      return;
    }
    try {
      const me = await shopMe();
      setShowStaff(isOpsRole(me.role));
    } catch {
      setShowStaff(false);
    }
  }, []);

  useEffect(() => {
    void refreshStaff();
  }, [refreshStaff]);

  const value = useMemo(
    () => ({ showStaff, refreshStaff }),
    [showStaff, refreshStaff],
  );

  return (
    <StaffSessionContext.Provider value={value}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  return useContext(StaffSessionContext);
}
