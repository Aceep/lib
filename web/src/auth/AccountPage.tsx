import { type FormEvent, useState } from "react";
import { changePassword, logout } from "../api/client.js";
import type { User } from "../api/types.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

export const MIN_PASSWORD_LENGTH = 12;

type Outcome = { kind: "success" } | { kind: "error"; message: string } | null;

export function AccountPage({ user, onLoggedOut }: { user: User; onLoggedOut: () => void }) {
  useDocumentTitle("Mon compte");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setOutcome(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setOutcome({ kind: "success" });
    } catch (error) {
      setOutcome({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    // Even if the request fails, the session is gone or about to expire: show the login page either way.
    await logout().catch(() => {});
    onLoggedOut();
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Mon compte</h1>
        <p className="page-subtitle">
          Connecté en tant que <strong>{user.username}</strong> ({user.role === "admin" ? "administrateur" : "membre"})
        </p>
      </header>
      <button type="button" className="button" onClick={() => void handleLogout()}>
        Se déconnecter
      </button>

      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <h2>Changer de mot de passe</h2>
        <label className="filter">
          Mot de passe actuel
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="filter">
          Nouveau mot de passe ({MIN_PASSWORD_LENGTH} caractères minimum)
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        {outcome?.kind === "error" ? (
          <p className="error" role="alert">
            {outcome.message}
          </p>
        ) : null}
        {outcome?.kind === "success" ? (
          <p className="form-success" role="status">
            Mot de passe changé. Vos autres appareils ont été déconnectés.
          </p>
        ) : null}
        <button type="submit" className="button primary" disabled={isSubmitting}>
          Changer le mot de passe
        </button>
      </form>
    </main>
  );
}
