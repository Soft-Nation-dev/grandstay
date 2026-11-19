import Image, { type ImageProps } from "next/image";

export default function HotelImage({ src, ...props }: ImageProps) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <Image {...props} src={typeof src === "string" && src.startsWith("/images/") ? `${base}${src}` : src} />;
}
