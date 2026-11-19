"use client";

import { useSyncExternalStore } from "react";
import { initialExperienceStore } from "@/data/mock";
import { readExperienceStore, subscribeExperience } from "@/services/experience-store";
import type { ExperienceStore } from "@/types/experience";

const snapshot = () => JSON.stringify(readExperienceStore());
const initial = () => JSON.stringify(initialExperienceStore);

export function useExperience(): ExperienceStore {
  return JSON.parse(useSyncExternalStore(subscribeExperience, snapshot, initial));
}
