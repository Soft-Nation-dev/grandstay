"use client";

import Image, { type ImageProps } from "next/image";
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Photo = { src: ImageProps["src"]; alt: string };
type OpenPhoto = (photo: Photo, trigger: HTMLButtonElement) => void;

const ImageViewerContext = createContext<OpenPhoto | null>(null);

export function useImageViewer() {
  return useContext(ImageViewerContext);
}

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const open = useCallback<OpenPhoto>((image, button) => {
    trigger.current = button;
    setPhoto(image);
  }, []);

  const close = useCallback(() => {
    setPhoto(null);
  }, []);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!photo || !element) return;
    const previous = document.documentElement.style.overflow;
    const previousBody = document.body.style.overflow;
    element.showModal();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.documentElement.style.overflow = previous;
      document.body.style.overflow = previousBody;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [photo]);

  return <ImageViewerContext.Provider value={open}>{children}<dialog ref={dialog} className="image-viewer" aria-label="Enlarged photo" onCancel={event => { event.preventDefault(); close(); }}>
    {photo && <><button type="button" className="image-viewer-dismiss" aria-label="Dismiss photo" tabIndex={-1} onClick={close} /><button ref={closeButton} type="button" className="image-viewer-close" aria-label="Close photo" onClick={close}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button><figure className="image-viewer-figure"><Image src={photo.src} alt={photo.alt} width={1600} height={1000} unoptimized className="image-viewer-photo" /><figcaption>{photo.alt}</figcaption></figure></>}
  </dialog></ImageViewerContext.Provider>;
}
