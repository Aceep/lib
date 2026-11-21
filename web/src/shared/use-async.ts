import { type DependencyList, useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading"; data: T | null }
  | { status: "success"; data: T }
  | { status: "error"; data: T | null; error: Error };

/**
 * Runs `load` whenever `dependencies` change, aborting the previous request so a slow answer
 * for an old search can never overwrite the results of a newer one.
 * The previous data stays available while reloading, which avoids the list flashing empty.
 */
export function useAsync<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading", data: null });
  const [reloadCount, setReloadCount] = useState(0);
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ status: "loading", data: previous.data }));
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", data });
        }
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState((previous) => ({
          status: "error",
          data: previous.data,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      },
    );
    return () => controller.abort();
    // `load` is deliberately left out: callers pass an inline function and list what it depends on.
  }, [...dependencies, reloadCount]);

  return { ...state, reload };
}
