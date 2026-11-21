"use client";

import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLiveConcierge } from "@/hooks/use-concierge";
import {
  loadEarlierMessages, loadMoreConversations, refreshLiveConcierge, sendLiveMessage,
} from "@/services/backend-concierge";
import { Icon } from "@/components/ui/icon";
import { EmptyExperience, ExperienceHeading, formatMoment } from "@/components/experience/shared";
import type { ConciergeMessage } from "@/types/experience";

function LiveConversation({ guestId, title, messages, staff, selected = '' }: {
  guestId: string; title: string; messages: ConciergeMessage[]; staff: boolean; selected?: string;
}) {
  const account = useAuth();
  const { messageTotal, loading } = useLiveConcierge(selected);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1]?.id;
  const role = account?.role;
  const accountId = account?.id;
  useEffect(() => {
    const node = list.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lastMessage, guestId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || (account.role !== "guest" && account.role !== "staff") || busy) return;
    setBusy(true);
    setError("");
    try {
      await sendLiveMessage(account, text, guestId);
      setText("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send the concierge message.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel concierge-panel">
    <div className="conversation-header"><span className="feature-icon"><Icon name={staff ? "user" : "chat"} /></span>
      <div><h3>{title}</h3><p className="muted">{staff ? "Guest conversation" : "Human concierge · Messages are answered by hotel staff"}</p></div>
    </div>
    {accountId && (role === "guest" || role === "staff") && messageTotal > messages.length &&
      <button type="button" className="button button-soft" disabled={loading} onClick={() => void loadEarlierMessages({ id: accountId, role })}>{loading ? "Loading…" : "Load earlier messages"}</button>}
    <div ref={list} className="message-list" role="log" aria-label="Conversation messages">
      {!messages.length && <div className="message-empty"><Icon name="chat" width={30} height={30} /><p>Start a conversation with the Guestly team.</p></div>}
      {messages.map(item => <article key={item.id} className={"message " + (item.sender === (staff ? "staff" : "guest") ? "message-own" : "")}>
        <small>{item.senderName}</small><p>{item.text}</p><small>{formatMoment(item.createdAt)}</small>
      </article>)}
    </div>
    <form className="message-form" onSubmit={event => void submit(event)} aria-busy={busy}>
      <label className="auth-field"><span>Message</span><textarea rows={2} value={text} maxLength={1000} placeholder="Type your message…" onChange={event => setText(event.target.value)} required /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={!text.trim() || busy}>
        {busy ? "Sending…" : "Send message"} <Icon name="arrow" />
      </button>
    </form>
  </section>;
}

export function LiveGuestConcierge() {
  const account = useAuth();
  const { messages, loading, error } = useLiveConcierge();
  const id = account?.id;
  const role = account?.role;
  useEffect(() => {
    if (!id || role !== "guest") return;
    const interval = window.setInterval(() => void refreshLiveConcierge({ id, role }, "", true).catch(() => {}), 30000);
    return () => window.clearInterval(interval);
  }, [id, role]);
  return <section className="workspace-section">
    <ExperienceHeading role="guest" title="Concierge" description="Contact the hotel team directly, with no automated or AI-generated replies." />
    {loading && <p role="status">Loading your conversation…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {id && role === "guest" && <LiveConversation guestId={id} title="Guestly concierge" messages={messages} staff={false} />}
    {id && role === "guest" && <button className="button button-soft" type="button" disabled={loading} onClick={() => void refreshLiveConcierge({ id, role }, "", true)}>Refresh messages</button>}
  </section>;
}

export function LiveStaffConcierge() {
  const account = useAuth();
  const params = useSearchParams();
  const selected = params.get("guest") || "";
  const waitingOnly = params.get("view") === "waiting";
  const { messages, conversations, selectedGuestId, conversationTotal, loading, error } = useLiveConcierge(selected);
  const guest = conversations.find(item => item.guestId === selectedGuestId);
  const shown = conversations.filter(item => !waitingOnly || item.waiting);
  const id = account?.id;
  const role = account?.role;

  useEffect(() => {
    if (!id || role !== "staff") return;
    const interval = window.setInterval(() => void refreshLiveConcierge({ id, role }, selected, true).catch(() => {}), 30000);
    return () => window.clearInterval(interval);
  }, [id, role, selected]);

  return <section className="workspace-section">
    <ExperienceHeading role="staff" title="Concierge inbox" description="Respond personally to guest messages and follow up on unanswered enquiries." />
    <div className="filter-tabs">
      <Link className={!waitingOnly ? "filter-active" : ""} aria-current={!waitingOnly ? "true" : undefined} href="/staff/concierge">All conversations</Link>
      <Link className={waitingOnly ? "filter-active" : ""} aria-current={waitingOnly ? "true" : undefined} href="/staff/concierge?view=waiting">Awaiting reply</Link>
    </div>
    {loading && <p role="status">Loading concierge messages…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {conversations.length ? <div className="concierge-grid">
      <aside className="panel conversation-list"><h3>Conversations</h3>
        {shown.map(item => <Link key={item.guestId} className={item.guestId === selectedGuestId ? "conversation-active" : ""}
          aria-current={item.guestId === selectedGuestId ? "true" : undefined}
          href={"/staff/concierge?" + new URLSearchParams({ guest: item.guestId, ...(waitingOnly ? { view: "waiting" } : {}) })}>
          <Icon name="user" /><span>{item.guestName}{item.waiting ? " · Awaiting reply" : ""}</span>
        </Link>)}
        {waitingOnly && !shown.length && <p className="muted">All conversations have a staff reply.</p>}
        {id && role === "staff" && conversations.length < conversationTotal && <button type="button" className="button button-soft" disabled={loading} onClick={() => void loadMoreConversations({ id, role })}>Load more conversations</button>}
      </aside>
      {selectedGuestId && <LiveConversation key={selectedGuestId} guestId={selectedGuestId} title={guest?.guestName || "Guest"} messages={messages.filter(item => item.guestId === selectedGuestId)} staff selected={selected} />}
    </div> : <EmptyExperience title="No conversations yet" description="New guest messages will appear in this inbox." />}
    {id && role === "staff" && <button className="button button-soft" type="button" disabled={loading} onClick={() => void refreshLiveConcierge({ id, role }, selected, true)}>Refresh inbox</button>}
  </section>;
}
