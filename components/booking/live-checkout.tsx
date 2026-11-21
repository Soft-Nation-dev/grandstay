"use client";

import Image from "@/components/ui/hotel-image";
import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { useManagement, useRoomCatalogue } from "@/hooks/use-management";
import { bookingQuery, readStay } from "@/lib/booking-query";
import { formatMoney, localDate, stayNights } from "@/lib/format";
import {
  createBackendHold, getBackendBooking, initializeBackendPayment, cancelBackendHold,
} from "@/services/backend-bookings";
import type { Booking } from "@/types/booking";

export function LiveCheckout() {
  const params = useSearchParams();
  const account = useAuth();
  const { rooms } = useManagement();
  const catalogue = useRoomCatalogue();
  const [hold, setHold] = useState<Booking | null>(null);
  const [holdError, setHoldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [now, setNow] = useState(0);
  const accountId = account?.id;
  const accountRole = account?.role;
  useEffect(() => {
    const timeout = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, []);
  const requestId = useRef<string | null>(null);
  const requestedBookingId = params.get("bookingId") || "";
  const stay = readStay(params);
  const roomId = params.get("room");
  const input = stay && roomId ? { ...stay, roomId } : null;
  const room = rooms.find(item => item.id === (hold?.roomId || roomId));
  const nights = hold ? stayNights(hold.checkIn, hold.checkOut) : input ? stayNights(input.checkIn, input.checkOut) : 0;
  const amount = hold ? hold.amount : room ? room.nightlyRate * nights : 0;
  const validInput = Boolean(input && input.checkIn >= localDate() && nights >= 1 && nights <= 365 &&
    room && room.inventory > 0 && input.guests <= room.capacity);
  const activeHold = hold?.status === "pending" && Boolean(hold.expiresAt) && Date.parse(hold.expiresAt || "") > now;
  const returnPath = input ? "/checkout?" + bookingQuery(input) : requestedBookingId ? "/checkout?bookingId=" + encodeURIComponent(requestedBookingId) : "/rooms";
  const nextQuery = new URLSearchParams({ next: returnPath });

  useEffect(() => {
    if (!requestedBookingId || !accountId || accountRole !== "guest") return;
    let current = true;
    void getBackendBooking(requestedBookingId).then(value => {
      if (current) setHold(value);
    }).catch(cause => {
      if (current) setHoldError(cause instanceof Error ? cause.message : "Unable to retrieve this reservation.");
    });
    return () => { current = false; };
  }, [requestedBookingId, accountId, accountRole]);

  async function start(at: number) {
    if (locked.current || account?.role !== "guest") return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      let current = hold;
      if (!activeHold) {
        if (!validInput || !input) throw new Error("Choose an available room and valid dates.");
        if (!requestId.current) requestId.current = crypto.randomUUID();
        current = await createBackendHold(input, requestId.current);
        setHold(current);
      }
      if (!current || current.status !== "pending" || !current.expiresAt || Date.parse(current.expiresAt) <= at) {
        throw new Error("Your reservation hold has expired. Please choose your dates again.");
      }
      const payment = await initializeBackendPayment(current.id);
      window.location.assign(payment.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to begin payment.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function cancel() {
    if (!hold || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      setHold(await cancelBackendHold(hold.id));
      requestId.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel the hold.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  if (account === undefined || !catalogue.loaded && !catalogue.error) {
    return <div className="panel empty-state"><Icon name="calendar" /><h1>Complete your booking</h1><p role="status">Loading your reservation…</p></div>;
  }

  if (requestedBookingId && holdError) {
    return <div className="panel empty-state"><Icon name="calendar" /><h1>Reservation unavailable</h1><p role="alert">{holdError}</p><Link className="button button-primary" href="/guest/bookings">My bookings</Link></div>;
  }

  if (!requestedBookingId && !validInput) {
    return <div className="panel empty-state"><Icon name="bed" /><h1>Room unavailable</h1><p>{catalogue.error || "Review your dates and select an available room."}</p><Link className="button button-primary" href="/rooms">Explore rooms</Link></div>;
  }

  if (account === null) {
    return <div className="panel checkout-panel"><h1>Complete your booking</h1><p>Sign in or create a guest account to reserve this room.</p>
      <Link className="button button-primary" href={"/login?" + nextQuery}>Sign in to book</Link>
      <Link className="button button-soft" href={"/register?" + nextQuery}>Create guest account</Link>
    </div>;
  }

  if (account.role !== "guest") {
    return <div className="panel empty-state"><Icon name="user" /><h1>Guest account required</h1><p>Only guest accounts can reserve hotel rooms.</p>
      <Link href={"/login?" + nextQuery} className="button button-soft">Switch account</Link></div>;
  }

  if (requestedBookingId && !hold) {
    return <div className="panel empty-state"><Icon name="calendar" /><p role="status">Loading your reservation…</p></div>;
  }

  if (hold && !activeHold) {
    return <div className="panel empty-state"><Icon name="calendar" /><h1>Reservation hold ended</h1><p>The reservation is {hold.status === "pending" ? "expired" : hold.status}. It cannot be paid from this screen.</p><Link className="button button-primary" href="/rooms">Search available rooms</Link></div>;
  }

  return <div className="detail-page">
    <Link className="text-link" href={input ? "/rooms?" + bookingQuery(input) : "/guest/bookings"}><Icon name="back" /> Back to rooms</Link>
    <div className="page-heading"><span className="eyebrow">Secure reservation</span><h1>Complete your booking</h1><p>We&apos;ll reserve your room for 15 minutes, then send you to Paystack for payment.</p></div>
    <div className="checkout-grid">
      <section className="panel checkout-panel">
        <h2>Guest details</h2>
        <div className="auth-notice"><Icon name="user" /><div><strong>{account.name}</strong><p>{account.email}</p></div></div>
        <div className="payment-heading"><h2>Pay securely</h2></div>
        <div className="payment-provider"><span className="paystack-mark" aria-hidden="true"><i/><i/><i/></span><div><strong>Paystack</strong><p className="muted">Secure online checkout · NGN</p></div><Icon name="shield" /></div>
        {hold && <p className="auth-notice" role="status">Reservation held until {new Date(hold.expiresAt || "").toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} WAT.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="button" className="button button-primary" disabled={busy} onClick={() => void start(Date.now())}>
          {busy ? "Preparing payment…" : hold ? "Continue to Paystack" : "Reserve and continue to Paystack"} <Icon name="arrow" />
        </button>
        {hold && <button type="button" className="button button-soft" disabled={busy} onClick={() => void cancel()}>Cancel reservation hold</button>}
        <p className="muted">Your booking will only be confirmed after Paystack verifies the payment. Starting checkout does not mean you have paid.</p>
      </section>
      <aside className="panel checkout-summary">
        {room && <div className="summary-photo"><Image src={room.image} alt={room.name} fill sizes="(max-width: 760px) 100vw, 400px" /></div>}
        <h2>{hold?.roomName || room?.name || "Selected room"}</h2>
        <dl className="summary-lines">
          <div><dt>Check-in</dt><dd>{hold?.checkIn || input?.checkIn}</dd></div>
          <div><dt>Check-out</dt><dd>{hold?.checkOut || input?.checkOut}</dd></div>
          <div><dt>Guests</dt><dd>{hold?.guests || input?.guests}</dd></div>
          <div><dt>{nights} nights × {formatMoney(hold?.nightlyRate || room?.nightlyRate || 0)}</dt><dd>{formatMoney(amount)}</dd></div>
        </dl>
        <div className="booking-total"><span>{hold ? "Held total" : "Estimated total"} (NGN)</span><strong>{formatMoney(amount)}</strong></div>
        {!hold && <p className="muted">The server confirms the final price before Paystack checkout.</p>}
      </aside>
    </div>
  </div>;
}
