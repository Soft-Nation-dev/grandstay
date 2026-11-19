import type { Room } from "@/types/hotel";

export type ServiceCategory = { id: string; name: string; description: string; active: boolean };
export type LoyaltyRule = { pointsPerNight: number; effectiveAt: string };
export type ManagementStore = { rooms: Room[]; services: ServiceCategory[]; loyaltyRules: LoyaltyRule[] };
