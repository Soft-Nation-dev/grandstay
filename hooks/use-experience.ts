"use client";

import { useSyncExternalStore } from "react";
import { apiConfigured } from "@/services/api-client";
import { useCheckIns } from "@/hooks/use-checkins";
import { initialExperienceStore } from "@/data/mock";
import { readExperienceStore, subscribeExperience } from "@/services/experience-store";
import type { ExperienceStore } from "@/types/experience";

const snapshot = () => JSON.stringify(readExperienceStore());
const initial = () => JSON.stringify(initialExperienceStore);

export function useExperience(): ExperienceStore {
  const live = useCheckIns();
  const demo = JSON.parse(useSyncExternalStore(subscribeExperience, snapshot, initial)) as ExperienceStore;
  return apiConfigured() ? { ...demo, checkIns: live.checkIns } : demo;
}
