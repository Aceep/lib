import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import { fetchActivity } from "../api/client.js";
import type { ActivityAction, ActivityEntry } from "../api/types.js";
import { countLabel, dateTimeLabel, deviceLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const ACTION_LABELS: Record<ActivityAction, string> = {
  download: "Téléchargement",
  upload: "Ajout",
  upload_submitted: "Envoi soumis",
  upload_approved: "Envoi validé",
  upload_rejected: "Envoi refusé",
  upload_cancelled: "Envoi annulé",
  sync_started: "Synchro lancée",
  book_edited: "Fiche corrigée",
  book_deleted: "Livre supprimé",
  authors_merged: "Auteurs fusionnés",
  login: "Connexion",
  login_failed: "Connexion échouée",
  logout: "Déconnexion",
  password_changed: "Mot de passe changé",
  password_reset: "Mot de passe réinitialisé",
  user_created: "Compte créé",
  user_deleted: "Compte supprimé",
};

const LOGIN_FAILURE_LABELS: Record<string, string> = {
  invalid_credentials: "identifiants incorrects",
  too_many_attempts: "bloqué après trop de tentatives",
};

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

/** The book, account or reason an entry is about. */
function ActivitySubject({ entry }: { entry: ActivityEntry }): ReactNode {
  const { details } = entry;
  switch (entry.action) {
    case "download":
    case "upload":
    case "upload_approved": {
      const title = text(details.title) || "Livre supprimé";
      const byMember = entry.action === "upload_approved" ? ` (envoyé par ${text(details.uploadedBy)})` : "";
      // The book may have left the library since; the link then leads to the "not found" message of the book page.
      return (
        <>
          {entry.bookId !== null ? <Link to={`/books/${entry.bookId}`}>{title}</Link> : title}
          {byMember}
        </>
      );
    }
    case "book_edited": {
      const renamed = details.previousTitle !== details.title ? ` (avant : ${text(details.previousTitle)})` : "";
      return (
        <>
          {entry.bookId !== null ? <Link to={`/books/${entry.bookId}`}>{text(details.title)}</Link> : text(details.title)}
          {renamed}
        </>
      );
    }
    case "book_deleted":
      return `${text(details.title)} → ${text(details.trashedTo)}`;
    case "authors_merged":
      return `${text(details.from)} → ${text(details.into)} (${text(details.changedBooks)} livres)`;
    case "upload_submitted":
    case "upload_cancelled":
      return text(details.title);
    case "upload_rejected":
      return `${text(details.title)} (envoyé par ${text(details.uploadedBy)})${details.reason ? ` — ${text(details.reason)}` : ""}`;
    case "login_failed":
      return `« ${text(details.attemptedUsername)} » : ${LOGIN_FAILURE_LABELS[text(details.reason)] ?? text(details.reason)}`;
    case "user_created":
    case "user_deleted":
    case "password_reset":
      return text(details.targetUsername);
    default:
      return null;
  }
}

export function ActivityPage() {
  useDocumentTitle("Activité");
  const [action, setAction] = useState<ActivityAction | "">("");
  const [username, setUsername] = useState("");
  const [page, setPage] = useState(1);
  const activity = useAsync((signal) => fetchActivity({ action, username, page }, signal), [action, username, page]);
  const pageCount = activity.data ? Math.max(1, Math.ceil(activity.data.total / activity.data.pageSize)) : 1;

  return (
    <>
      <header className="page-header">
        <h1>Activité</h1>
        {activity.data ? <p className="page-subtitle">{countLabel(activity.data.total, "événement")}</p> : null}
      </header>
      <div className="filter-row admin-filters">
        <label className="filter">
          Type
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value as ActivityAction | "");
              setPage(1);
            }}
          >
            <option value="">Tout</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter">
          Utilisateur
          <select
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous</option>
            {(activity.data?.usernames ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {activity.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger l'activité : {activity.error.message}
        </p>
      ) : null}
      {activity.data && activity.data.items.length === 0 ? <p className="empty-state">Aucun événement.</p> : null}
      {activity.data && activity.data.items.length > 0 ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Utilisateur</th>
                <th scope="col">Action</th>
                <th scope="col">Détail</th>
                <th scope="col">Adresse IP</th>
                <th scope="col">Appareil</th>
              </tr>
            </thead>
            <tbody>
              {activity.data.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{dateTimeLabel(entry.occurredAt)}</td>
                  <td>{entry.username ?? "—"}</td>
                  <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
                  <td className="data-table-wide">
                    <ActivitySubject entry={entry} />
                  </td>
                  <td>{entry.ip ?? "—"}</td>
                  <td title={entry.userAgent ?? undefined}>{deviceLabel(entry.userAgent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {pageCount > 1 ? (
        <div className="pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Plus récent
          </button>
          <span>
            Page {page} sur {pageCount}
          </span>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
            Plus ancien →
          </button>
        </div>
      ) : null}
    </>
  );
}
