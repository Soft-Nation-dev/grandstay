"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiRequestState<T> = {
  status: "idle" | "loading" | "success" | "error";
  data: T | null;
  error: string | null;
};

export function useApiRequest<T, Args extends unknown[]>(action: (signal: AbortSignal, ...args: Args) => Promise<T>) {
  const [state, setState] = useState<ApiRequestState<T>>({ status: "idle", data: null, error: null });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = useCallback(async (...args: Args) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState(previous => ({ status: "loading", data: previous.data, error: null }));
    try {
      const data = await action(current.signal, ...args);
      if (!current.signal.aborted) setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      if (!current.signal.aborted) {
        setState(previous => ({
          status: "error",
          data: previous.data,
          error: error instanceof Error ? error.message : "The request could not be completed.",
        }));
      }
      return null;
    }
  }, [action]);

  const reset = useCallback(() => {
    controller.current?.abort();
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, run, reset };
}
