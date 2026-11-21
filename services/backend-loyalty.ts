import { authorizedRequest } from "@/services/backend-auth";
import type { Account } from "@/types/auth";
import type { LoyaltyRule } from "@/types/management";

export type LoyaltyAward = {
  id: string;
  bookingId: string;
  guestId: string;
  roomName: string;
  checkoutDate: string;
  nights: number;
  points: number;
  pointsPerNight: number;
  awardedAt: string;
  revokedAt: string | null;
};
export type LoyaltySummary = {
  source: "live-verified-stays";
  points: number;
  total: number;
  page: number;
  limit: number;
  rules: LoyaltyRule[];
  awards: LoyaltyAward[];
};
type State = { summary: LoyaltySummary | null; rules: LoyaltyRule[]; loading: boolean; error: string; loaded: boolean };
const initial: State = { summary: null, rules: [], loading: false, error: "", loaded: false };
const event = "guestly:live-loyalty";
let state = initial;
let scope = "";
let revision = 0;
let pending: Promise<void> | null = null;

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(event));
}
function update(changes: Partial<State>) {
  state = { ...state, ...changes };
  announce();
}
export function subscribeLiveLoyalty(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
export function liveLoyaltySnapshot() {
  return JSON.stringify(state);
}
export function liveLoyaltyServerSnapshot() {
  return JSON.stringify(initial);
}
export function resetLiveLoyalty() {
  revision++;
  scope = "";
  pending = null;
  state = initial;
  announce();
}

export async function refreshLiveLoyalty(account: Pick<Account, "id" | "role">, force = false) {
  if (!["guest", "manager"].includes(account.role)) return;
  const key = account.role + ":" + account.id;
  if (scope !== key) {
    revision++;
    scope = key;
    pending = null;
    state = initial;
  }
  if (pending) return pending;
  if (state.loaded && !force) return;
  const current = revision;
  update({ loading: true, error: "" });
  pending = (async () => {
    try {
      const [summary, rules] = await Promise.all([
        authorizedRequest<LoyaltySummary>((account.role === "manager" ? "/api/v1/loyalty/manager" : "/api/v1/loyalty/me") + "?page=1&limit=100"),
        account.role === "manager" ? authorizedRequest<LoyaltyRule[]>("/api/v1/loyalty/rules") : Promise.resolve(null),
      ]);
      if (current !== revision) return;
      update({ summary, rules: rules || summary.rules, loading: false, loaded: true, error: "" });
    } catch (cause) {
      if (current !== revision) return;
      update({ loading: false, error: cause instanceof Error ? cause.message : "Unable to retrieve verified loyalty awards." });
      throw cause;
    } finally {
      if (current === revision) pending = null;
    }
  })();
  return pending;
}

export async function loadMoreLoyalty(account: Pick<Account, "id" | "role">) {
  if (!state.summary || state.loading || state.summary.awards.length >= state.summary.total || scope !== account.role + ":" + account.id) return;
  const current = revision;
  const page = state.summary.page + 1;
  update({ loading: true, error: "" });
  try {
    const result = await authorizedRequest<LoyaltySummary>(
      (account.role === "manager" ? "/api/v1/loyalty/manager" : "/api/v1/loyalty/me") + "?page=" + page + "&limit=100",
    );
    if (current !== revision) return;
    const known = new Set(state.summary.awards.map(item => item.id));
    update({ summary: { ...result, awards: [...state.summary.awards, ...result.awards.filter(item => !known.has(item.id))] }, loading: false });
  } catch (cause) {
    if (current === revision) update({ loading: false, error: cause instanceof Error ? cause.message : "Unable to load older awards." });
  }
}

export async function saveLiveLoyaltyRule(account: Pick<Account, "id" | "role">, pointsPerNight: number) {
  if (account.role !== "manager" || !Number.isInteger(pointsPerNight) || pointsPerNight < 0 || pointsPerNight > 10000) {
    throw new Error("Only managers can set a whole number of points per night between 0 and 10,000.");
  }
  await authorizedRequest<LoyaltyRule>("/api/v1/loyalty/rules", { method: "POST", body: { pointsPerNight } });
  await refreshLiveLoyalty(account, true);
}

export async function reconcileLiveLoyalty(account: Pick<Account, "id" | "role">) {
  if (account.role !== "manager") throw new Error("Manager access required.");
  const outcome = await authorizedRequest<{ created: number; revoked: number; guestsChecked: number }>("/api/v1/loyalty/reconcile", { method: "POST" });
  await refreshLiveLoyalty(account, true);
  return outcome;
}
