import type { Account } from "@/types/auth";
import type { Room, RoomReservation } from "@/types/hotel";

export const hotel = {
  name: "GrandStay",
  tagline: "Your comfort, our priority.",
  description: "A more thoughtful stay, from the moment you book to the moment you leave.",
  location: "Lagos, Nigeria",
  currency: "NGN",
  heroImage: "/images/deluxe-executive-suite.jpg",
  experiences: [
    { title: "A room for every stay", description: "Explore comfortable rooms and suites, find availability and choose your perfect space.", icon: "bed" },
    { title: "Pre-arrival check-in", description: "Submit your details before arriving and spend less time at the front desk.", icon: "key" },
    { title: "Personal concierge", description: "Get hotel assistance and request services during your stay.", icon: "chat" },
    { title: "Track your requests", description: "Follow the progress of your service requests from received to done.", icon: "list" },
  ],
  facilities: [
    { title: "Dining at GrandStay", image: "/images/restaurant.jpg", description: "Enjoy a relaxed dining experience in welcoming surroundings." },
    { title: "Executive lounge", image: "/images/executive-lounge.jpg", description: "A comfortable space to unwind between plans." },
    { title: "Lagoon terrace pool", image: "/images/lagoon-terrace-pool.jpg", description: "Make time for a moment of relaxation." },
  ],
} as const;

export const rooms: Room[] = [
  { id: "standard-cozy-haven", name: "Standard Cozy Haven", category: "Standard", image: "/images/standard-cozy-haven.jpg", nightlyRate: 55000, capacity: 2, size: 34, bed: "Queen bed", view: "City view", amenities: ["Wi-Fi", "Rainfall shower", "Breakfast included"], description: "A warm, thoughtfully furnished retreat for a relaxed city stay.", inventory: 4, featured: true },
  { id: "deluxe-executive-suite", name: "Deluxe Executive Suite", category: "Executive", image: "/images/deluxe-executive-suite.jpg", nightlyRate: 85000, capacity: 2, size: 62, bed: "King bed", view: "City view", amenities: ["High-speed Wi-Fi", "Soaking bathtub", "Lounge area"], description: "Spacious interiors and refined comforts make this suite a peaceful escape.", inventory: 3, featured: true },
  { id: "garden-view-room", name: "Deluxe Garden Suite", category: "Deluxe", image: "/images/garden-view-room.jpg", nightlyRate: 75000, capacity: 2, size: 38, bed: "King bed", view: "Garden view", amenities: ["Wi-Fi", "Private balcony", "Breakfast included"], description: "Take in a calming garden view from this light-filled, comfortable suite.", inventory: 3, featured: true },
  { id: "ocean-panorama-suite", name: "Executive Ocean View Suite", category: "Executive", image: "/images/ocean-panorama-suite.jpg", nightlyRate: 120000, capacity: 3, size: 54, bed: "Super king bed", view: "Ocean view", amenities: ["Lounge access", "Jacuzzi", "Wi-Fi"], description: "Enjoy panoramic views and generous space for a memorable stay.", inventory: 2 },
  { id: "city-view-room", name: "Standard King Room", category: "Standard", image: "/images/city-view-room.jpg", nightlyRate: 52000, capacity: 2, size: 26, bed: "Queen bed", view: "City view", amenities: ["Fast Wi-Fi", "Work desk", "Daily housekeeping"], description: "A practical and inviting room for business or leisure.", inventory: 4 },
  { id: "executive-suite", name: "Executive Suite", category: "Executive", image: "/images/executive-suite.jpg", nightlyRate: 95000, capacity: 3, size: 50, bed: "King bed", view: "Hotel grounds", amenities: ["Wi-Fi", "Sitting area", "Private bathroom"], description: "An elegant suite with extra room to settle in and recharge.", inventory: 2 },
];

export const reservations: RoomReservation[] = [];

export const demoPassword = "GrandStay123!";

export const demoAccounts: Account[] = [
  { id: "demo-guest", name: "Alex Morgan", email: "guest@grandstay.example", role: "guest" },
  { id: "demo-staff", name: "Amina Bello", email: "staff@grandstay.example", role: "staff" },
  { id: "demo-manager", name: "Tunde Adeyemi", email: "manager@grandstay.example", role: "manager" },
  { id: "demo-admin", name: "GrandStay Admin", email: "admin@grandstay.example", role: "admin" },
];
