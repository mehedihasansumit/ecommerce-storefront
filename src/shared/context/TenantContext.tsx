"use client";

import { createContext, useContext } from "react";
import type { IStore } from "@/features/stores/types";

const TenantContext = createContext<IStore | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: IStore | null;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): IStore | null {
  return useContext(TenantContext);
}
