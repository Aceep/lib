import { type FormEvent, useState } from "react";
import { createUser, deleteUser, fetchUsers, resetUserPassword } from "../api/client.js";
import type { User, UserRole } from "../api/types.js";
import { MIN_PASSWORD_LENGTH } from "../auth/AccountPage.js";
import { dateTimeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const ROLE_LABELS: Record<UserRole, string> = { admin: "Administrateur", member: "Membre" };

function NewUserForm({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await createUser(username, password, role);
      setUsername("");
      setPassword("");
      setRole("member");
      onCreated();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Nouveau compte</h2>
      <label className="filter">
        Identifiant
        <input type="text" autoComplete="off" autoCapitalize="none" required value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="filter">
        Mot de passe ({MIN_PASSWORD_LENGTH} caractères minimum)
        {/* Shown in clear: the admin has to read it out to the new user anyway. */}
        <input
          type="text"
          autoComplete="off"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="filter">
        Rôle
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="member">{ROLE_LABELS.member}</option>
          <option value="admin">{ROLE_LABELS.admin}</option>
        </select>
      </label>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" className="button primary" disabled={isSubmitting}>
        Créer le compte
      </button>
    </form>
  );
}

export function UsersPage({ currentUser }: { currentUser: User }) {
  useDocumentTitle("Utilisateurs");
  const users = useAsync((signal) => fetchUsers(signal), []);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function run(action: () => Promise<void>, successText: string) {
    setMessage(null);
    try {
      await action();
      setMessage({ kind: "success", text: successText });
      users.reload();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    }
  }

  function handleReset(user: User) {
    const password = window.prompt(`Nouveau mot de passe pour ${user.username} (${MIN_PASSWORD_LENGTH} caractères minimum) :`);
    if (password) {
      void run(() => resetUserPassword(user.id, password), `Mot de passe de ${user.username} réinitialisé, ses sessions sont fermées.`);
    }
  }

  function handleDelete(user: User) {
    if (window.confirm(`Supprimer le compte ${user.username} ?`)) {
      void run(() => deleteUser(user.id), `Compte ${user.username} supprimé.`);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Utilisateurs</h1>
      </header>
      {users.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger les utilisateurs : {users.error.message}
        </p>
      ) : null}
      {message ? (
        <p className={message.kind === "error" ? "error" : "form-success"} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      ) : null}
      {users.data ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Identifiant</th>
                <th scope="col">Rôle</th>
                <th scope="col">Créé le</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user) => (
                <tr key={user.id}>
                  <th scope="row">{user.username}</th>
                  <td>{ROLE_LABELS[user.role]}</td>
                  <td>{dateTimeLabel(user.createdAt)}</td>
                  <td className="data-table-actions">
                    <button type="button" className="link-button" onClick={() => handleReset(user)}>
                      Réinitialiser le mot de passe
                    </button>
                    {user.id !== currentUser.id ? (
                      <button type="button" className="link-button" onClick={() => handleDelete(user)}>
                        Supprimer
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <NewUserForm onCreated={users.reload} />
    </>
  );
}
