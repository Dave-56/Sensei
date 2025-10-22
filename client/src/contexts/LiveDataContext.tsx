import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const LiveDataContext = createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = "liveDataEnabled";

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) setEnabled(raw === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled]);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveDataFlag() {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error("useLiveDataFlag must be used within LiveDataProvider");
  return ctx;
}

