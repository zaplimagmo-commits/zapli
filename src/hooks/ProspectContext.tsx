import { createContext, useContext, type ReactNode } from 'react';
import { useProspects } from '@/hooks/useProspects';

type ProspectContextType = ReturnType<typeof useProspects>;

const ProspectContext = createContext<ProspectContextType | null>(null);

export function ProspectProvider({ children }: { children: ReactNode }) {
  const value = useProspects();
  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
}

export function useProspectContext() {
  const ctx = useContext(ProspectContext);
  if (!ctx) throw new Error('useProspectContext must be used inside ProspectProvider');
  return ctx;
}
