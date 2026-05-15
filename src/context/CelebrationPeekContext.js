import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const CelebrationPeekContext = createContext(null);

/** Temporarily hide unlock celebration while StatueDetail is open; restore on back. */
export function CelebrationPeekProvider({ children }) {
  const [hiddenForDetail, setHiddenForDetail] = useState(false);

  const beginDetailPeek = useCallback(() => {
    setHiddenForDetail(true);
  }, []);

  const endDetailPeek = useCallback(() => {
    setHiddenForDetail(false);
  }, []);

  const value = useMemo(
    () => ({
      celebrationHidden: hiddenForDetail,
      beginDetailPeek,
      endDetailPeek,
    }),
    [hiddenForDetail, beginDetailPeek, endDetailPeek]
  );

  return (
    <CelebrationPeekContext.Provider value={value}>
      {children}
    </CelebrationPeekContext.Provider>
  );
}

export function useCelebrationPeek() {
  const ctx = useContext(CelebrationPeekContext);
  if (!ctx) {
    throw new Error('useCelebrationPeek must be used within CelebrationPeekProvider');
  }
  return ctx;
}

/** Safe on screens that may mount outside the provider (optional). */
export function useCelebrationPeekOptional() {
  return useContext(CelebrationPeekContext);
}
