"use client";

import Image, { type ImageProps } from "next/image";
import { useImageViewer } from "@/components/ui/image-viewer";

export default function HotelImage({ src, alt, ...props }: ImageProps) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const open = useImageViewer();
  const resolved = typeof src === "string" && src.startsWith("/images/") ? `${base}${src}` : src;
  const title = alt || "Hotel photograph";
  return <><Image {...props} src={resolved} alt={alt} />{open && <button type="button" className="image-viewer-trigger" aria-label={`Enlarge ${title}`} aria-haspopup="dialog" onClick={event => open({ src: resolved, alt: title }, event.currentTarget)}><span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg></span></button>}</>;
}
