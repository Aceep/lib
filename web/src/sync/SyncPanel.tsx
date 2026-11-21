import { useEffect, useRef, useState } from "react";
import { ApiError, fetchSyncStatus, startSync } from "../api/client.js";
import type { SyncRun, SyncStatus } from "../api/types.js";
import { dateTimeLabel } from "../shared/format.js";

const POLL_WHILE_RUNNING_MS = 2000;
// Also catches syncs started by the cron or from the other person's browser.
const POLL_WHILE_IDLE_MS = 60_000;

function runSummary(run: SyncRun): string {
  const when = dateTimeLabel(run.finishedAt ?? run.startedAt);
  if (!run.report) {
    return `Échec le ${when}`;
  }
  const { added, updated, removed } = run.report;
  const changes = `${added} ajouté${added > 1 ? "s" : ""}, ${updated} modifié${updated > 1 ? "s" : ""}, ${removed} retiré${removed > 1 ? "s" : ""}`;
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
        {failures.length > 0 ? `${failures.length} fichier${failures.length > 1 ? "s" : ""} illisible${failures.length > 1 ? "s" : ""}` : null}
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

/** Shows the last sync and lets either of us trigger one; calls `onSynced` when a run finishes. */
export function SyncPanel({ onSynced }: { onSynced: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  // Bumped to poll right away instead of waiting for the next tick.
  const [pollRequest, setPollRequest] = useState(0);
  // undefined until the first answer, so loading the page does not count as "a run just finished".
  const lastFinishedId = useRef<number | null | undefined>(undefined);
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

  return (
    <section className="sync-panel" aria-label="Synchronisation">
      <div className="sync-line">
        <span className="sync-status">
          {isRunning ? "Synchro en cours…" : status?.lastFinished ? runSummary(status.lastFinished) : "Jamais synchronisé"}
        </span>
        <button type="button" onClick={handleStart} disabled={isRunning || isStarting}>
          Synchroniser
        </button>
      </div>
      {!isRunning && status?.lastFinished ? <RunProblems run={status.lastFinished} /> : null}
      {status?.nextScheduledAt && !isRunning ? (
        <span className="sync-next">Prochaine synchro auto : {dateTimeLabel(status.nextScheduledAt)}</span>
      ) : null}
      {requestError ? (
        <span className="error" role="alert">
          {requestError}
        </span>
      ) : null}
    </section>
  );
}
