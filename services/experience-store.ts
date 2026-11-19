import { initialExperienceStore } from "@/data/mock";
import type { ExperienceStore } from "@/types/experience";

const key = "grandstay.demo.experience.v1";
const event = "grandstay:experience";

export function readExperienceStore(): ExperienceStore {
  if (typeof window === "undefined") return initialExperienceStore;
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? "null") as ExperienceStore | null;
    return data && Array.isArray(data.checkIns) && Array.isArray(data.requests) && Array.isArray(data.messages) ? data : initialExperienceStore;
  } catch {
    return initialExperienceStore;
  }
}

export function writeExperienceStore(store: ExperienceStore) {
  localStorage.setItem(key, JSON.stringify(store));
  window.dispatchEvent(new Event(event));
}

export function subscribeExperience(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}
