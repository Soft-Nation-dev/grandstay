import { authorizedRequest } from "@/services/backend-auth";
import type { Account } from "@/types/auth";
import type { ConciergeMessage } from "@/types/experience";

export type ConversationSummary = {
  guestId: string;
  guestName: string;
  sender: "guest" | "staff";
  lastText: string;
  updatedAt: string;
  waiting: boolean;
};

type Page<T> = { items: T[]; total: number; page: number; limit: number };
type State = {
  messages: ConciergeMessage[];
  conversations: ConversationSummary[];
  selectedGuestId: string;
  messageTotal: number;
  messagePage: number;
  conversationTotal: number;
  conversationPage: number;
  loading: boolean;
  error: string;
};

const initial: State = {
  messages: [], conversations: [], selectedGuestId: "",
  messageTotal: 0, messagePage: 1, conversationTotal: 0, conversationPage: 1,
  loading: false, error: "",
};
const event = "guestly:live-concierge";
let state = initial;
let identity = "";
let requestedGuest = "";
let loaded = false;
let revision = 0;
let pending: Promise<void> | null = null;

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(event));
}

function setState(changes: Partial<State>) {
  state = { ...state, ...changes };
  announce();
}

export function conciergeSnapshot() {
  return JSON.stringify(state);
}
export function conciergeServerSnapshot() {
  return JSON.stringify(initial);
}
export function subscribeLiveConcierge(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
export function resetLiveConcierge() {
  revision++;
  identity = "";
  requestedGuest = "";
  loaded = false;
  pending = null;
  state = initial;
  announce();
}

export async function refreshLiveConcierge(account: Pick<Account, "id" | "role">, selectedGuest = "", force = false) {
  if (account.role !== "guest" && account.role !== "staff") return;
  const key = account.role + ":" + account.id;
  if (identity !== key || account.role === "staff" && selectedGuest !== requestedGuest) {
    revision++;
    identity = key;
    requestedGuest = selectedGuest;
    loaded = false;
    pending = null;
    state = initial;
  }
  if (pending) return pending;
  if (loaded && !force) return;
  const current = revision;
  setState({ loading: true, error: "" });
  pending = (async () => {
    try {
      if (account.role === "guest") {
        const result = await authorizedRequest<Page<ConciergeMessage>>("/api/v1/concierge/me?page=1&limit=100");
        if (revision !== current) return;
        loaded = true;
        setState({
          messages: result.items, messageTotal: result.total, messagePage: result.page,
          selectedGuestId: account.id, loading: false, error: "",
        });
      } else {
        const inbox = await authorizedRequest<Page<ConversationSummary>>("/api/v1/concierge/conversations?page=1&limit=100");
        if (revision !== current) return;
        const selected = inbox.items.find(item => item.guestId === selectedGuest)?.guestId || inbox.items[0]?.guestId || "";
        const messages = selected
          ? await authorizedRequest<Page<ConciergeMessage>>("/api/v1/concierge/" + encodeURIComponent(selected) + "?page=1&limit=100")
          : { items: [], total: 0, page: 1, limit: 100 };
        if (revision !== current) return;
        loaded = true;
        setState({
          conversations: inbox.items, conversationTotal: inbox.total, conversationPage: inbox.page,
          selectedGuestId: selected, messages: messages.items,
          messageTotal: messages.total, messagePage: messages.page,
          loading: false, error: "",
        });
      }
    } catch (cause) {
      if (revision !== current) return;
      setState({ loading: false, error: cause instanceof Error ? cause.message : "Unable to retrieve the concierge conversation." });
      throw cause;
    } finally {
      if (revision === current) pending = null;
    }
  })();
  return pending;
}

export async function sendLiveMessage(account: Pick<Account, "id" | "role">, text: string, guestId?: string) {
  const target = account.role === "guest" ? account.id : guestId;
  if (!target || !["guest", "staff"].includes(account.role) || !text.trim()) throw new Error("Choose a conversation and enter your message.");
  const result = await authorizedRequest<ConciergeMessage>(
    account.role === "guest" ? "/api/v1/concierge/me" : "/api/v1/concierge/" + encodeURIComponent(target),
    { method: "POST", body: { text: text.trim() } },
  );
  if (result.sender !== "guest" && result.sender !== "staff") throw new Error("Unexpected concierge sender.");
  const sender: "guest" | "staff" = result.sender;
  if (identity === account.role + ":" + account.id && (state.selectedGuestId === target || account.role === "guest")) {
    setState({
      messages: [...state.messages, result],
      messageTotal: state.messageTotal + 1,
      conversations: state.conversations.map(item => item.guestId === target ? {
        ...item, sender, lastText: result.text,
        updatedAt: result.createdAt, waiting: sender === "guest",
      } : item),
    });
  }
  return result;
}

export async function loadEarlierMessages(account: Pick<Account, "id" | "role">) {
  if (state.loading || state.messages.length >= state.messageTotal || identity !== account.role + ":" + account.id) return;
  const guestId = state.selectedGuestId;
  const nextPage = state.messagePage + 1;
  const path = account.role === "guest" ? "/api/v1/concierge/me" : "/api/v1/concierge/" + encodeURIComponent(guestId);
  const scoped = revision;
  setState({ loading: true, error: "" });
  try {
    const result = await authorizedRequest<Page<ConciergeMessage>>(path + "?page=" + nextPage + "&limit=100");
    if (scoped !== revision) return;
    const known = new Set(state.messages.map(item => item.id));
    setState({
      messages: [...result.items.filter(item => !known.has(item.id)), ...state.messages],
      messagePage: result.page, messageTotal: result.total, loading: false,
    });
  } catch (cause) {
    if (scoped === revision) setState({ loading: false, error: cause instanceof Error ? cause.message : "Unable to load earlier messages." });
  }
}

export async function loadMoreConversations(account: Pick<Account, "id" | "role">) {
  if (account.role !== "staff" || state.loading || identity !== "staff:" + account.id || state.conversations.length >= state.conversationTotal) return;
  const scoped = revision;
  const nextPage = state.conversationPage + 1;
  setState({ loading: true, error: "" });
  try {
    const result = await authorizedRequest<Page<ConversationSummary>>("/api/v1/concierge/conversations?page=" + nextPage + "&limit=100");
    if (scoped !== revision) return;
    const known = new Set(state.conversations.map(item => item.guestId));
    setState({ conversations: [...state.conversations, ...result.items.filter(item => !known.has(item.guestId))], conversationPage: result.page, conversationTotal: result.total, loading: false });
  } catch (cause) {
    if (scoped === revision) setState({ loading: false, error: cause instanceof Error ? cause.message : "Unable to load more conversations." });
  }
}
