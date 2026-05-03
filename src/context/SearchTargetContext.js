import React, { createContext, useContext, useMemo } from 'react';

/** App focuses on outdoor statues; collection/radar use this single mode. */
export const SEARCH_MODES = ['statues'];

const SearchTargetContext = createContext(null);

export function SearchTargetProvider({ children }) {
  const value = useMemo(
    () => ({
      searchMode: 'statues',
      setSearchMode: () => {},
      ready: true,
    }),
    []
  );

  return (
    <SearchTargetContext.Provider value={value}>{children}</SearchTargetContext.Provider>
  );
}

export function useSearchTarget() {
  const ctx = useContext(SearchTargetContext);
  if (!ctx) {
    throw new Error('useSearchTarget must be used within SearchTargetProvider');
  }
  return ctx;
}
