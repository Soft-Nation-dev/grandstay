'use client';

import Image from '@/components/ui/hotel-image';
import { Icon } from '@/components/ui/icon';
import { useHotelProfile } from '@/hooks/use-management';

export function HotelHero() {
  const { hotel } = useHotelProfile();
  return <section className="hero">
    <div className="hero-copy">
      <span className="hero-label"><Icon name="hotel" /> Welcome to Guestly</span>
      <h1>{hotel.tagline}</h1>
      <p>{hotel.description} Discover thoughtfully designed rooms, easier check-in and a concierge ready to assist.</p>
      <span className="hero-location"><Icon name="location" /> {hotel.location}</span>
    </div>
    <div className="hero-image"><Image src={hotel.heroImage} alt="Warmly furnished Guestly executive suite" fill sizes="(max-width: 760px) 100vw, 55vw" priority /></div>
  </section>;
}
