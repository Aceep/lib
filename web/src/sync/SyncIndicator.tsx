import { useEffect, useRef, useState } from "react";
import { ApiError, fetchSyncStatus, startSync } from "../api/client.js";
import type { SyncRun, SyncStatus } from "../api/types.js";
import { countLabel, dateTimeLabel, relativeTimeLabel } from "../shared/format.js";

const POLL_WHILE_RUNNING_MS = 2000;
// Also catches syncs started by the cron or from the other person's browser.
const POLL_WHILE_IDLE_MS = 60_000;

function runSummary(run: SyncRun): string {
  const when = dateTimeLabel(run.finishedAt ?? run.startedAt);
  if (!run.report) {
    return `Échec le ${when}`;
  }
  const { added, updated, removed } = run.report;
  const changes = `${countLabel(added, "ajouté")}, ${countLabel(updated, "modifié")}, ${countLabel(removed, "retiré")}`;
  return `${run.status === "failed" ? "Synchro incomplète" : "Synchro"} le ${when} : ${changes}`;
}

function RunProblems({ run }: { run: SyncRun }) {
  const failures = run.report?.failures ?? [];
  if (!run.error && failures.length === 0) {
    return null;
  }
  return (
    <details className="sync-problems">
      <summary>
        {run.error ? "Erreur" : null}
        {run.error && failures.length > 0 ? " · " : null}
        {failures.length > 0 ? countLabel(failures.length, "fichier illisible", "fichiers illisibles") : null}
      </summary>
      {run.error ? <pre>{run.error}</pre> : null}
      {failures.length > 0 ? (
        <ul>
          {failures.map((failure) => (
            <li key={failure.filePath}>
              <code>{failure.filePath}</code> : {failure.error}
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

type IndicatorState = "running" | "ok" | "warning" | "unknown";

function indicatorState(status: SyncStatus | null): IndicatorState {
  if (!status) return "unknown";
  if (status.current) return "running";
  if (!status.lastFinished) return "unknown";
  return status.lastFinished.status === "failed" || (status.lastFinished.report?.failures.length ?? 0) > 0 ? "warning" : "ok";
}

function pillLabel(status: SyncStatus | null): string {
  if (!status) return "Synchro";
  if (status.current) return "Synchro en cours…";
  if (!status.lastFinished) return "Jamais synchronisé";
  return `Synchro ${relativeTimeLabel(status.lastFinished.finishedAt ?? status.lastFinished.startedAt)}`;
}

/** A small pill in the header; the details and the "Synchroniser" button sit in a popover. Calls `onSynced` when a run finishes. */
export function SyncIndicator({ onSynced }: { onSynced: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  // Bumped to poll right away instead of waiting for the next tick.
  const [pollRequest, setPollRequest] = useState(0);
  // undefined until the first answer, so loading the page does not count as "a run just finished".
  const lastFinishedId = useRef<number | null | undefined>(undefined);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const isRunning = Boolean(status?.current);

  useEffect(() => {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const nextStatus = await fetchSyncStatus(controller.signal);
        const finishedId = nextStatus.lastFinished?.id ?? null;
        if (lastFinishedId.current !== undefined && finishedId !== lastFinishedId.current) {
          onSynced();
        }
        lastFinishedId.current = finishedId;
        setStatus(nextStatus);
        setRequestError(null);
        timeout = setTimeout(poll, nextStatus.current ? POLL_WHILE_RUNNING_MS : POLL_WHILE_IDLE_MS);
      } catch (error) {
        if (!controller.signal.aborted) {
          setRequestError((error as Error).message);
          timeout = setTimeout(poll, POLL_WHILE_IDLE_MS);
        }
      }
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [pollRequest, onSynced]);

  // Clicking anywhere else closes the popover, as a menu would.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  async function handleStart() {
    setIsStarting(true);
    try {
      await startSync();
    } catch (error) {
      // 409 means a sync (maybe the scheduled one) is already running: polling will show it.
      if (!(error instanceof ApiError && error.status === 409)) {
        setRequestError((error as Error).message);
      }
    } finally {
      setIsStarting(false);
      setPollRequest((count) => count + 1);
    }
  }

  const state = indicatorState(status);
  return (
    <details className="sync-menu" ref={detailsRef}>
      <summary className="sync-pill" title="Synchronisation avec MEGA">
        <span className={`sync-dot is-${state}`} aria-hidden="true" />
        <span className="sync-pill-label">{pillLabel(status)}</span>
      </summary>
      <div className="sync-popover" aria-label="Synchronisation">
        <p className="sync-summary">
          {isRunning ? "Synchronisation en cours…" : status?.lastFinished ? runSummary(status.lastFinished) : "La bibliothèque n'a jamais été synchronisée."}
        </p>
        {!isRunning && status?.lastFinished ? <RunProblems run={status.lastFinished} /> : null}
        {status?.nextScheduledAt && !isRunning ? <p className="sync-next">Prochaine synchro automatique : {dateTimeLabel(status.nextScheduledAt)}</p> : null}
        {requestError ? (
          <p className="error" role="alert">
            {requestError}
          </p>
        ) : null}
        <button type="button" className="button primary" onClick={() => void handleStart()} disabled={isRunning || isStarting}>
          {isRunning ? "En cours…" : "Synchroniser maintenant"}
        </button>
      </div>
    </details>
  );
}
