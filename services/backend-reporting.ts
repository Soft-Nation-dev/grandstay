import { authorizedRequest } from "@/services/backend-auth";

export type HistoricalSource = "bookings" | "guests" | "payments" | "service-requests";
export type HistoricalOutcome = { name: string; count: number };
export type HistoricalReport = {
  imported: boolean;
  source?: "historical-data-analyst";
  counts: { bookings: number; guests: number; payments: number; requests: number };
  distinctGuestIds: number;
  conflictingGuestIds: number;
  completed?: number;
  successfulPayments?: number;
  historicalSuccessfulRevenueNGN?: number;
  verifiedGatewayPayments: number;
  eligibleLoyaltyAwards?: number;
  returningBookings?: number;
  satisfaction?: number;
  response?: number;
  resolution?: number;
  bookingOutcomes?: HistoricalOutcome[];
  paymentOutcomes?: HistoricalOutcome[];
  months?: { month: string; revenue: number; count: number }[];
  rooms?: { name: string; count: number; averageRate: number }[];
  services?: { name: string; count: number; response: number; resolution: number; satisfaction: number }[];
  from?: string;
  to?: string;
};
export type LiveReport = {
  source: "live-verified";
  confirmedBookings: number;
  allBookings: number;
  paymentCount: number;
  verifiedPayments: number;
  verifiedRevenueKobo: number;
  verifiedRevenueNGN: number;
  serviceRequests: number;
  completedServiceRequests: number;
  serviceCompletionPercent: number | null;
  roomInventory: number;
  loyaltyPointsAwarded: number;
};
export type ManagementReport = { historical: HistoricalReport; live: LiveReport };
export type HistoricalPage = {
  source: HistoricalSource;
  items: Record<string, string | number | boolean>[];
  total: number;
  page: number;
  limit: number;
};
type State = { report: ManagementReport | null; loaded: boolean; loading: boolean; error: string };
const initial: State = { report: null, loaded: false, loading: false, error: "" };
const event = "guestly:manager-report";
let state = initial;
let pending: Promise<void> | null = null;
let scope = "";
let revision = 0;

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(event));
}
function update(changes: Partial<State>) {
  state = { ...state, ...changes };
  announce();
}
export function subscribeManagerReport(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
export function managerReportSnapshot() {
  return JSON.stringify(state);
}
export function managerReportServerSnapshot() {
  return JSON.stringify(initial);
}
export function resetManagerReport() {
  revision++;
  scope = "";
  pending = null;
  state = initial;
  announce();
}
export async function refreshManagerReport(accountId: string, force = false) {
  if (scope !== accountId) {
    revision++;
    scope = accountId;
    pending = null;
    state = initial;
  }
  if (pending) return pending;
  if (state.loaded && !force) return;
  const current = revision;
  update({ loading: true, error: "" });
  pending = (async () => {
    try {
      const report = await authorizedRequest<ManagementReport>("/api/v1/reports/overview");
      if (current !== revision) return;
      update({ report, loaded: true, loading: false, error: "" });
    } catch (cause) {
      if (current !== revision) return;
      update({ loading: false, error: cause instanceof Error ? cause.message : "Unable to retrieve management reports." });
      throw cause;
    } finally {
      if (current === revision) pending = null;
    }
  })();
  return pending;
}
export async function fetchHistoricalRecords(
  source: HistoricalSource,
  { page = 1, limit = 10, q = "", status = "" }: { page?: number; limit?: number; q?: string; status?: string } = {},
) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q.trim()) query.set("q", q.trim().slice(0, 40));
  if (status) query.set("status", status);
  return authorizedRequest<HistoricalPage>("/api/v1/reports/historical/" + encodeURIComponent(source) + "?" + query);
}
