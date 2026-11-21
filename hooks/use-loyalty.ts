"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiConfigured } from "@/services/api-client";
import {
  liveLoyaltySnapshot, liveLoyaltyServerSnapshot, subscribeLiveLoyalty,
  refreshLiveLoyalty, resetLiveLoyalty, type LoyaltySummary,
} from "@/services/backend-loyalty";
import type { LoyaltyRule } from "@/types/management";

export function useLiveLoyalty() {
  const account = useAuth();
  const id = account?.id;
  const role = account?.role;
  useEffect(() => {
    if (!apiConfigured()) return;
    if (id && (role === "guest" || role === "manager")) {
      void refreshLiveLoyalty({ id, role }).catch(() => {});
    } else if (account === null || role !== undefined && role !== "guest" && role !== "manager") {
      resetLiveLoyalty();
    }
  }, [id, role, account === null]);
  const snapshot = useSyncExternalStore(subscribeLiveLoyalty, liveLoyaltySnapshot, liveLoyaltyServerSnapshot);
  return JSON.parse(snapshot) as {
    summary: LoyaltySummary | null; rules: LoyaltyRule[]; loaded: boolean; loading: boolean; error: string;
  };
}
