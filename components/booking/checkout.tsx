"use client";

import Image from "@/components/ui/hotel-image";
import Link from "@/components/navigation/app-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { useManagement } from "@/hooks/use-management";
import { useBookingStore } from "@/hooks/use-bookings";
import { bookingQuery, readStay } from "@/lib/booking-query";
import { formatMoney } from "@/lib/format";
import { completeDemoPayment, quoteBooking } from "@/services/bookings";
import { apiConfigured } from "@/services/api-client";
import { LiveCheckout } from "@/components/booking/live-checkout";
import type { BookingInput, PaymentOutcome } from "@/types/booking";

function BookingSummary({ input, quote }: { input: BookingInput; quote: ReturnType<typeof quoteBooking> }) {
  return <aside className="panel checkout-summary">
    <div className="summary-photo"><Image src={quote.room.image} alt={quote.room.name} fill sizes="(max-width: 760px) 100vw, 400px" unoptimized={quote.room.image.startsWith("data:")} /></div>
    <h2>{quote.room.name}</h2>
    <dl className="summary-lines">
      <div><dt>Check-in</dt><dd>{input.checkIn}</dd></div>
      <div><dt>Check-out</dt><dd>{input.checkOut}</dd></div>
      <div><dt>Guests</dt><dd>{input.guests}</dd></div>
      <div><dt>{quote.nights} {quote.nights === 1 ? "night" : "nights"} × {formatMoney(quote.room.nightlyRate)}</dt><dd>{formatMoney(quote.amount)}</dd></div>
    </dl>
    <div className="booking-total"><span>Total (NGN)</span><strong>{formatMoney(quote.amount)}</strong></div>
  </aside>;
}

export function Checkout() {
  const params = useSearchParams();
  const router = useRouter();
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { rooms } = useManagement();
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const stay = readStay(params);
  const roomId = params.get("room");
  const input = stay && roomId ? { ...stay, roomId } : null;
  let quote: ReturnType<typeof quoteBooking> | null = null;
  if (input) {
    try { quote = quoteBooking(input, bookings, rooms); } catch {}
  }
  async function pay(outcome: PaymentOutcome) {
    if (!input || !reference || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const booking = completeDemoPayment(input, reference, outcome);
      if (booking) {
        router.replace(`/guest/bookings?confirmed=${encodeURIComponent(booking.id)}`, { scroll: false });
        return;
      }
      setReference("");
      setError(outcome === "failed" ? "Payment failed. Your room has not been booked. You can try again." : "Payment cancelled. No reservation was created.");
    } catch (error) {
      setReference("");
      setError(error instanceof Error ? error.message : "Unable to complete the payment.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  if (apiConfigured()) return <LiveCheckout />;
  if (!quote || !input) return <div className="panel empty-state"><Icon name="bed" /><h1>Room unavailable</h1><p>Review your dates and choose an available room.</p><Link className="button button-primary" href="/rooms">Explore rooms</Link></div>;
  const returnPath = `/checkout?${bookingQuery(input)}`;
  const loginQuery = new URLSearchParams({ next: returnPath });
  return <>
    <Link className="text-link" href={`/rooms?${bookingQuery(input)}`}><Icon name="back" /> Back to room</Link>
    <div className="page-heading"><span className="eyebrow">Your Guestly reservation</span><h1>Complete your booking</h1><p>Review your stay and complete your payment.</p></div>
    <div className="checkout-grid">
      <section className="panel checkout-panel">
        <h2>Guest details</h2>
        {account === undefined ? <p role="status">Loading account…</p> : !account ? <div className="auth-form-stack"><p>Sign in or create a guest account. Your room selection will be saved in the link.</p><Link className="button button-primary" href={`/login?${loginQuery}`}>Sign in to book</Link><Link className="button button-soft" href={`/register?${loginQuery}`}>Create guest account</Link></div> : account.role !== "guest" ? <div className="auth-form-stack"><p className="auth-error">Reservations can only be created from a guest account.</p><Link className="button button-soft" href={`/login?${loginQuery}`}>Switch account</Link></div> : <>
          <div className="auth-notice"><Icon name="user" /><div><strong>{account.name}</strong><p>{account.email}</p></div></div>
          <div className="payment-heading"><h2>Payment</h2></div>
          <div className="payment-provider"><span className="paystack-mark" aria-hidden="true"><i/><i/><i/></span><div><strong>Paystack</strong><p className="muted">Test checkout · NGN</p></div><Icon name="shield" /></div>
          {error && <p role="alert" className="auth-error">{error}</p>}
          {reference ? <div className="demo-payment"><h3>Simulate a payment result</h3><button disabled={busy} onClick={() => void pay("success")} className="button button-primary">Simulate successful payment</button><button disabled={busy} onClick={() => void pay("failed")} className="button button-soft">Simulate failed payment</button><button disabled={busy} onClick={() => void pay("cancelled")} className="text-link">Cancel payment</button></div> : <button disabled={busy} onClick={() => { setError(""); setReference(`demo-${crypto.randomUUID()}`); }} className="button button-primary">Test payment · {formatMoney(quote.amount)} <Icon name="arrow" /></button>}
        </>}
      </section>
      <BookingSummary input={input} quote={quote} />
    </div>
  </>;
}
