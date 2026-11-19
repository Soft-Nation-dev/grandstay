export type RoomCategory = "Standard" | "Deluxe" | "Executive";

export type Room = {
  id: string;
  name: string;
  category: RoomCategory;
  image: string;
  nightlyRate: number;
  capacity: number;
  size: number;
  bed: string;
  view: string;
  amenities: string[];
  description: string;
  inventory: number;
  featured?: boolean;
};

export type StaySearch = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type RoomReservation = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  quantity: number;
};
