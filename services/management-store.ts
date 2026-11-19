import { initialManagementStore } from "@/data/mock";
import type { ManagementStore } from "@/types/management";

const key = "grandstay.demo.management.v1";
const event = "grandstay:management";

export function readManagementStore(): ManagementStore {
  if (typeof window === "undefined") return initialManagementStore;
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null") as ManagementStore | null;
    if (!value || !Array.isArray(value.rooms) || !Array.isArray(value.services) || !Array.isArray(value.loyaltyRules)) return initialManagementStore;
    if (value.catalogueSeedVersion === initialManagementStore.catalogueSeedVersion) return value;
    const names = new Set(value.services.map(service => service.name.toLowerCase()));
    return { ...value, catalogueSeedVersion: initialManagementStore.catalogueSeedVersion, services: [...value.services, ...initialManagementStore.services.filter(service => !names.has(service.name.toLowerCase()))] };
  } catch {
    return initialManagementStore;
  }
}

export function writeManagementStore(store: ManagementStore) {
  localStorage.setItem(key, JSON.stringify(store));
  window.dispatchEvent(new Event(event));
}

export function subscribeManagement(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}
