export type CheckInStatus = "pending" | "approved" | "rejected";
export type DocumentKind = "Passport" | "National ID" | "Driver's licence";
export type CheckInInput = { bookingId: string; arrivalTime: string; documentKind: DocumentKind; sampleSelected: boolean };
export type CheckIn = Omit<CheckInInput, "sampleSelected"> & {
  guestId: string;
  status: CheckInStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  accessCode?: string;
};
export type RequestStatus = "received" | "in-progress" | "done";
export type ServiceRequest = {
  id: string;
  bookingId: string;
  guestId: string;
  category: string;
  details: string;
  status: RequestStatus;
  history: { status: RequestStatus; at: string }[];
};
export type ConciergeMessage = {
  id: string;
  guestId: string;
  sender: "guest" | "staff" | "assistant";
  senderName: string;
  text: string;
  createdAt: string;
};
export type ExperienceStore = { checkIns: CheckIn[]; requests: ServiceRequest[]; messages: ConciergeMessage[] };
