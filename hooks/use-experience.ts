"use client";

import { useSyncExternalStore } from "react";
import { apiConfigured } from "@/services/api-client";
import { useCheckIns } from "@/hooks/use-checkins";
import { useAuth } from "@/hooks/use-auth";
import { useLiveRequests } from "@/hooks/use-services";
import { useLiveConcierge } from "@/hooks/use-concierge";
import { initialExperienceStore } from "@/data/mock";
import { readExperienceStore, subscribeExperience } from "@/services/experience-store";
import type { ExperienceStore } from "@/types/experience";

const snapshot = () => JSON.stringify(readExperienceStore());
const initial = () => JSON.stringify(initialExperienceStore);

export function useExperience(): ExperienceStore {
  const account = useAuth();
  const live = useCheckIns();
  const requests = useLiveRequests();
  const concierge = useLiveConcierge();
  const demo = JSON.parse(useSyncExternalStore(subscribeExperience, snapshot, initial)) as ExperienceStore;
  const messages = account?.role === "staff" ? concierge.conversations.map(item => ({
    id: "latest-" + item.guestId, guestId: item.guestId, guestName: item.guestName,
    sender: item.sender, senderName: item.guestName, text: item.lastText, createdAt: item.updatedAt,
  })) : concierge.messages;
  return apiConfigured() ? { ...demo, checkIns: live.checkIns, requests: requests.requests, messages } : demo;
}
