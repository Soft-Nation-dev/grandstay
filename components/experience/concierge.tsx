"use client";

import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { apiConfigured } from "@/services/api-client";
import { LiveGuestConcierge, LiveStaffConcierge } from "@/components/experience/live-concierge";
import { latestConversations } from "@/lib/staff-operations";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth, useAccounts } from "@/hooks/use-auth";
import { useExperience } from "@/hooks/use-experience";
import { sendMessage } from "@/services/experience";
import { Icon } from "@/components/ui/icon";
import { EmptyExperience, ExperienceHeading, formatMoment } from "@/components/experience/shared";
import type { ConciergeMessage } from "@/types/experience";

function Conversation({ guestId, title, messages, staff }: { guestId: string; title: string; messages: ConciergeMessage[]; staff: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const ownRole = staff ? "staff" : "guest";
  useEffect(() => { const container = list.current; if (container) container.scrollTop = container.scrollHeight; }, [messages.length]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try { sendMessage(guestId, text); setText(""); } catch (error) { setError(error instanceof Error ? error.message : "Unable to send message."); }
  }
  return <section className="panel concierge-panel"><div className="conversation-header"><span className="feature-icon"><Icon name={staff ? "user" : "chat"} /></span><div><h3>{title}</h3><p className="muted">{staff ? "Guest conversation" : "Human concierge"}</p></div></div><div ref={list} className="message-list" role="log" aria-label="Conversation messages">{!messages.length && <div className="message-empty"><Icon name="chat" width={30} height={30} /><p>Start a conversation with the Guestly team.</p></div>}{messages.map(message => <article key={message.id} className={`message ${message.sender === ownRole ? "message-own" : ""}`}><small>{message.senderName}</small><p>{message.text}</p><small>{formatMoment(message.createdAt)}</small></article>)}</div><form className="message-form" onSubmit={submit}><label className="auth-field"><span>Message</span><textarea rows={2} value={text} maxLength={1000} placeholder="Type your message…" onChange={event => setText(event.target.value)} required /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={!text.trim()}>Send message <Icon name="arrow" /></button></form></section>;
}

function DemoGuestConcierge() {
  const account = useAuth();
  const { messages } = useExperience();
  return <section className="workspace-section"><ExperienceHeading role="guest" title="Concierge" description="Ask a question or contact the hotel team directly." />{account && <Conversation guestId={account.id} title="Guestly concierge" messages={messages.filter(item => item.guestId === account.id)} staff={false} />}</section>;
}

function DemoStaffConcierge() {
  const { messages } = useExperience();
  const accounts = useAccounts();
  const params = useSearchParams();
  const selected = params.get("guest") ?? "";
  const waiting = params.get("view") === "waiting";
  const latest = latestConversations(messages);
  const guestIds = latest.filter(message => !waiting || message.sender === "guest").map(message => message.guestId);
  const guestId = guestIds.includes(selected) ? selected : guestIds[0];
  return <section className="workspace-section"><ExperienceHeading role="staff" title="Concierge inbox" description="Respond to enquiries from hotel guests." /><div className="filter-tabs"><Link className={!waiting ? "filter-active" : ""} aria-current={!waiting ? "true" : undefined} href="/staff/concierge">All conversations</Link><Link className={waiting ? "filter-active" : ""} aria-current={waiting ? "true" : undefined} href="/staff/concierge?view=waiting">Awaiting reply</Link></div>{guestId ? <div className="concierge-grid"><aside className="panel conversation-list"><h3>Conversations</h3>{guestIds.map(id => <Link className={id === guestId ? "conversation-active" : ""} key={id} href={`/staff/concierge?${new URLSearchParams({ guest: id, ...(waiting ? { view: "waiting" } : {}) })}`} aria-current={id === guestId ? "true" : undefined}><Icon name="user" /><span>{accounts.find(account => account.id === id)?.name ?? "Guest"}</span></Link>)}</aside><Conversation key={guestId} guestId={guestId} title={accounts.find(account => account.id === guestId)?.name ?? "Guest"} messages={messages.filter(message => message.guestId === guestId)} staff /></div> : <EmptyExperience title="No conversations yet" description="New guest enquiries will appear here." />}</section>;
}


export function GuestConcierge() {
  return apiConfigured() ? <LiveGuestConcierge /> : <DemoGuestConcierge />;
}

export function StaffConcierge() {
  return apiConfigured() ? <LiveStaffConcierge /> : <DemoStaffConcierge />;
}
