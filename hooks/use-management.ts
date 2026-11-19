"use client";

import { useSyncExternalStore } from "react";
import { initialManagementStore } from "@/data/mock";
import { readManagementStore, subscribeManagement } from "@/services/management-store";
import type { ManagementStore } from "@/types/management";

const snapshot = () => JSON.stringify(readManagementStore());
const initial = () => JSON.stringify(initialManagementStore);

export function useManagement(): ManagementStore {
  return JSON.parse(useSyncExternalStore(subscribeManagement, snapshot, initial));
}
