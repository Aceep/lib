import { type FormEvent, useState } from "react";
import { login } from "../api/client.js";
import type { User } from "../api/types.js";
import { KyleSays } from "../shared/KyleSays.js";
import { Logo } from "../shared/Logo.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

export function LoginPage({ onLoggedIn }: { onLoggedIn: (user: User) => void }) {
  useDocumentTitle("Connexion");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      onLoggedIn(await login(username, password));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="form login-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="login-hero">
          <img className="login-figure" src="/Kyle.png" alt="Kyle, le dinosaure jaune" width="455" height="548" />
          <h1 className="visually-hidden">Kyle Lib</h1>
          <Logo />
          <p className="login-tagline">La bibliothèque, rien qu'à nous deux.</p>
        </div>
        <label className="filter">
          Identifiant
          <input
            type="text"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="filter">
          Mot de passe
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {errorMessage ? (
          <div role="alert">
            <KyleSays pose="mirrored" size="small">
              <strong>Je ne te reconnais pas.</strong> {errorMessage}
            </KyleSays>
          </div>
        ) : null}
        <button type="submit" className="button primary" disabled={isSubmitting}>
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
