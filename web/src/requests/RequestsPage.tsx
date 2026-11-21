import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { createRequest, fetchRequests, setRequestStatus } from "../api/client.js";
import type { BookRequest, RequestStatus, User } from "../api/types.js";
import { countLabel, relativeTimeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const STATUS_LABELS: Record<RequestStatus, string> = { open: "Demandé", fulfilled: "Ajouté", dropped: "Abandonné" };
// Same colours as uploads: green once it is in the library, red when it will not be.
const STATUS_CLASSES: Record<RequestStatus, string> = { open: "", fulfilled: "is-approved", dropped: "is-rejected" };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function NewRequestForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await createRequest({ title, ...(author.trim() ? { author } : {}), ...(note.trim() ? { note } : {}) });
      setTitle("");
      setAuthor("");
      setNote("");
      onCreated();
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Demander un livre</h2>
      <label className="filter">
        Titre
        <input type="text" required value={title} disabled={isBusy} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="filter">
        Auteur (facultatif)
        <input type="text" value={author} disabled={isBusy} onChange={(event) => setAuthor(event.target.value)} />
      </label>
      <label className="filter">
        Précision (facultatif) : édition, traduction, tome…
        <input type="text" value={note} disabled={isBusy} onChange={(event) => setNote(event.target.value)} />
      </label>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" className="button primary" disabled={isBusy}>
        Demander
      </button>
    </form>
  );
}

function RequestLine({ request, user, onChanged }: { request: BookRequest; user: User; onChanged: () => void }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isAdmin = user.role === "admin";
  const isMine = request.requestedBy === user.username;

  async function change(status: RequestStatus) {
    setErrorMessage(null);
    try {
      await setRequestStatus(request.id, status);
      onChanged();
    } catch (error) {
      setErrorMessage(errorText(error));
    }
  }

  return (
    <li>
      <span className="record-main">
        {request.bookId !== null ? <Link to={`/books/${request.bookId}`}>{request.title}</Link> : <strong>{request.title}</strong>}
        {request.author ? <span className="record-secondary"> — {request.author}</span> : null}
      </span>
      <span className={`status-tag ${STATUS_CLASSES[request.status]}`}>{STATUS_LABELS[request.status]}</span>
      <span className="record-secondary">
        par {request.requestedBy}, {relativeTimeLabel(request.createdAt)}
        {request.note ? ` · ${request.note}` : null}
      </span>
      <span className="merge-actions">
        {request.status === "open" && isAdmin ? (
          <button type="button" onClick={() => void change("fulfilled")}>
            Marquer comme ajouté
          </button>
        ) : null}
        {request.status === "open" && (isAdmin || isMine) ? (
          <button type="button" onClick={() => void change("dropped")}>
            Abandonner
          </button>
        ) : null}
        {request.status !== "open" && (isAdmin || (isMine && request.status === "dropped")) ? (
          <button type="button" onClick={() => void change("open")}>
            Rouvrir
          </button>
        ) : null}
      </span>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </li>
  );
}

/** The shared wish list: anyone asks, everyone sees, and a request closes by itself when its book arrives. */
export function RequestsPage({ user, libraryVersion }: { user: User; libraryVersion: number }) {
  useDocumentTitle("Demandes");
  const requests = useAsync((signal) => fetchRequests(signal), [libraryVersion]);
  const open = requests.data?.filter((request) => request.status === "open") ?? [];
  const closed = requests.data?.filter((request) => request.status !== "open") ?? [];

  return (
    <main className="page">
      <header className="page-header">
        <h1>Demandes</h1>
        <p className="page-subtitle">
          Les livres que l'on aimerait trouver dans la bibliothèque. Une demande se ferme toute seule quand le livre est ajouté.
        </p>
      </header>
      {requests.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger les demandes : {requests.error.message}
        </p>
      ) : null}
      {requests.data ? (
        <>
          <section className="admin-section">
            <h2>
              En attente <span className="count-badge is-muted">{open.length}</span>
            </h2>
            {open.length === 0 ? <p className="record-secondary">Aucune demande en attente.</p> : null}
            <ul className="record-list">
              {open.map((request) => (
                <RequestLine key={request.id} request={request} user={user} onChanged={requests.reload} />
              ))}
            </ul>
          </section>
          <NewRequestForm onCreated={requests.reload} />
          {closed.length > 0 ? (
            <details className="admin-section">
              <summary>{countLabel(closed.length, "demande close", "demandes closes")}</summary>
              <ul className="record-list">
                {closed.map((request) => (
                  <RequestLine key={request.id} request={request} user={user} onChanged={requests.reload} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
