import { authorizedRequest } from "@/services/backend-auth";
import type { Room } from "@/types/hotel";

export type RoomRecommendation = {
  room: Room;
  score: number;
  reason: string;
  source: "verified-guest-stays" | "historical-aggregate" | "hotel-catalogue";
  availabilityConfirmed: false;
};

export function fetchVerifiedRecommendations(limit = 3) {
  return authorizedRequest<RoomRecommendation[]>("/api/v1/recommendations/me?limit=" + limit);
}
