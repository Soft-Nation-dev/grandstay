"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiConfigured } from "@/services/api-client";
import {
  subscribeManagerReport, managerReportSnapshot, managerReportServerSnapshot,
  refreshManagerReport, resetManagerReport, type ManagementReport,
} from "@/services/backend-reporting";

export function useManagerReport() {
  const account = useAuth();
  const id = account?.id;
  const role = account?.role;
  useEffect(() => {
    if (!apiConfigured()) return;
    if (id && role === "manager") {
      void refreshManagerReport(id).catch(() => {});
    } else if (account === null || role !== undefined && role !== "manager") {
      resetManagerReport();
    }
  }, [id, role, account === null]);
  const snapshot = useSyncExternalStore(subscribeManagerReport, managerReportSnapshot, managerReportServerSnapshot);
  return JSON.parse(snapshot) as { report: ManagementReport | null; loaded: boolean; loading: boolean; error: string };
}
