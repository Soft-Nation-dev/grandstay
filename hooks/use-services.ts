"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiConfigured } from "@/services/api-client";
import {
  catalogueSnapshot, catalogueServerSnapshot, requestsSnapshot, requestsServerSnapshot,
  refreshLiveRequests, refreshServiceCatalogue, resetLiveRequests, subscribeLiveServices,
} from "@/services/backend-services";
import type { ServiceRequest } from "@/types/experience";
import type { ServiceCategory } from "@/types/management";

export function useLiveCatalogue() {
  const account = useAuth();
  const role = account?.role;
  useEffect(() => {
    if (apiConfigured() && account !== undefined) void refreshServiceCatalogue(role || null).catch(() => {});
  }, [account === undefined, role]);
  const snapshot = useSyncExternalStore(subscribeLiveServices, catalogueSnapshot, catalogueServerSnapshot);
  return JSON.parse(snapshot) as { services: ServiceCategory[]; loaded: boolean; loading: boolean; error: string };
}

export function useLiveRequests() {
  const account = useAuth();
  const id = account?.id;
  const role = account?.role;
  const loggedOut = account === null;
  useEffect(() => {
    if (!apiConfigured()) return;
    if (id && role && ["guest", "staff", "manager"].includes(role)) {
      void refreshLiveRequests({ id, role }).catch(() => {});
    } else if (loggedOut || role === "admin") {
      resetLiveRequests();
    }
  }, [id, role, loggedOut]);
  const snapshot = useSyncExternalStore(subscribeLiveServices, requestsSnapshot, requestsServerSnapshot);
  return JSON.parse(snapshot) as { requests: ServiceRequest[]; total: number; page: number; loading: boolean; error: string };
}
