'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { initialManagementStore } from '@/data/mock';
import { apiConfigured } from '@/services/api-client';
import { useLiveCatalogue } from '@/hooks/use-services';
import { readManagementStore, subscribeManagement } from '@/services/management-store';
import {
  subscribeLiveRooms, roomCatalogueSnapshot, roomCatalogueServerSnapshot,
  hotelSnapshot, hotelServerSnapshot, refreshHotel, refreshRooms,
  type HotelProfile,
} from '@/services/backend-rooms';
import type { ManagementStore } from '@/types/management';
import type { Room } from '@/types/hotel';

const managementSnapshot = () => JSON.stringify(readManagementStore());
const managementServerSnapshot = () => JSON.stringify(initialManagementStore);
const liveMode = () => apiConfigured();

function useRoomData() {
  useEffect(() => {
    if (liveMode()) void refreshRooms().catch(() => {});
  }, []);
  const snapshot = useSyncExternalStore(subscribeLiveRooms, roomCatalogueSnapshot, roomCatalogueServerSnapshot);
  return JSON.parse(snapshot) as { rooms: Room[]; loading: boolean; loaded: boolean; error: string };
}

export function useRoomCatalogue() {
  return useRoomData();
}

export function useHotelProfile(): { hotel: HotelProfile; error: string } {
  useEffect(() => {
    if (liveMode()) void refreshHotel().catch(() => {});
  }, []);
  const snapshot = useSyncExternalStore(subscribeLiveRooms, hotelSnapshot, hotelServerSnapshot);
  return JSON.parse(snapshot);
}

export function useManagement(): ManagementStore {
  const live = useRoomData();
  const catalogue = useLiveCatalogue();
  const snapshot = useSyncExternalStore(subscribeManagement, managementSnapshot, managementServerSnapshot);
  const management = JSON.parse(snapshot) as ManagementStore;
  return liveMode() ? { ...management, rooms: live.rooms, services: catalogue.services } : management;
}
