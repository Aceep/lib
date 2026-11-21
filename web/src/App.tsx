import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router";
import { ActivityPage } from "./admin/ActivityPage.js";
import { DashboardPage } from "./admin/DashboardPage.js";
import { AdminLayout } from "./admin/AdminLayout.js";
import { HealthPage } from "./admin/HealthPage.js";
import { MissingBooksPage } from "./admin/MissingBooksPage.js";
import { ReviewUploadsPage } from "./admin/ReviewUploadsPage.js";
import { UsersPage } from "./admin/UsersPage.js";
import { fetchCurrentUser, fetchSubmittedUploadCount, SESSION_ENDED_EVENT } from "./api/client.js";
import type { User } from "./api/types.js";
import { AccountPage } from "./auth/AccountPage.js";
import { LoginPage } from "./auth/LoginPage.js";
import { AuthorsPage } from "./authors/AuthorsPage.js";
import { BookPage } from "./book/BookPage.js";
import { CatalogPage } from "./catalog/CatalogPage.js";
import { KyleSays } from "./shared/KyleSays.js";
import { Logo } from "./shared/Logo.js";
import { RequestsPage } from "./requests/RequestsPage.js";
import { useDocumentTitle } from "./shared/use-document-title.js";
import { SyncIndicator } from "./sync/SyncIndicator.js";
import { UploadPage } from "./upload/UploadPage.js";

function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <main className="page">
      <div className="kyle-empty">
        <KyleSays pose="mirrored">
          <strong>Rien sous cette pierre.</strong> Cette page n'existe pas.
        </KyleSays>
      </div>
      <Link to="/">← Retour au catalogue</Link>
    </main>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** "/" anywhere jumps to the search box, like on most catalog sites. */
function SearchShortcut() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      if (location.pathname === "/") {
        document.dispatchEvent(new CustomEvent("kyle-lib:focus-search"));
      } else {
        void navigate("/", { state: { focusSearch: true } });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, navigate]);

  return null;
}

/** `undefined` while the first check is in flight, `null` when nobody is signed in. */
function useCurrentUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal).then(setUser, (error: unknown) => {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : String(error));
      }
    });
    const handleSessionEnded = () => setUser(null);
    document.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
    return () => {
      controller.abort();
      document.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
    };
  }, []);

  return { user, setUser, loadError };
}

export function App() {
  const { user, setUser, loadError } = useCurrentUser();

  if (loadError) {
    return (
      <main className="page">
        <p className="error" role="alert">
          Impossible de joindre le serveur : {loadError}
        </p>
      </main>
    );
  }
  if (user === undefined) {
    return null;
  }
  if (user === null) {
    return <LoginPage onLoggedIn={setUser} />;
  }
  return <SignedInApp user={user} onLoggedOut={() => setUser(null)} />;
}

const PENDING_UPLOADS_POLL_MS = 60_000;

/** How many member uploads wait for review; always 0 for members, who cannot see the queue. */
function usePendingUploadCount(isAdmin: boolean): { count: number; refresh: () => void } {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    if (isAdmin) {
      // A failed poll keeps the last known count: the badge is a hint, the review page reports real errors.
      fetchSubmittedUploadCount().then(setCount, () => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, PENDING_UPLOADS_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { count, refresh };
}

function SignedInApp({ user, onLoggedOut }: { user: User; onLoggedOut: () => void }) {
  const isAdmin = user.role === "admin";
  const pendingUploads = usePendingUploadCount(isAdmin);
  // Bumped after each sync or upload so the catalog and filters refetch without a page reload.
  const [libraryVersion, setLibraryVersion] = useState(0);
  const handleLibraryChanged = useCallback(() => setLibraryVersion((version) => version + 1), []);

  return (
    <BrowserRouter>
      <SearchShortcut />
      <header className="app-header">
        <Link to="/" className="app-title">
          <Logo />
        </Link>
        <nav className="app-nav" aria-label="Navigation">
          <NavLink to="/authors" className="nav-link">
            Auteurs
          </NavLink>
          <NavLink to="/upload" className="nav-link">
            Ajouter
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className="nav-link">
          <NavLink to="/requests" className="nav-link">
            Demandes
          </NavLink>
              Admin
              {pendingUploads.count > 0 ? (
                <span className="count-badge" aria-label={`${pendingUploads.count} envois à valider`}>
                  {pendingUploads.count}
                </span>
              ) : null}
            </NavLink>
          ) : null}
          <SyncIndicator onSynced={handleLibraryChanged} />
          <NavLink to="/account" className="nav-link" aria-label={`Mon compte (${user.username})`} title={user.username}>
            Compte
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<CatalogPage libraryVersion={libraryVersion} />} />
        <Route path="/books/:bookId" element={<BookPage user={user} onLibraryChanged={handleLibraryChanged} />} />
        <Route path="/authors" element={<AuthorsPage libraryVersion={libraryVersion} />} />
        <Route path="/upload" element={<UploadPage user={user} onLibraryChanged={handleLibraryChanged} />} />
        <Route path="/account" element={<AccountPage user={user} onLoggedOut={onLoggedOut} />} />
        {isAdmin ? (
          <Route path="/admin" element={<AdminLayout pendingUploadCount={pendingUploads.count} />}>
        <Route path="/requests" element={<RequestsPage user={user} libraryVersion={libraryVersion} />} />
            <Route index element={<DashboardPage libraryVersion={libraryVersion} />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route
              path="uploads"
              element={
                <ReviewUploadsPage
                  onDecided={() => {
                    pendingUploads.refresh();
                    handleLibraryChanged();
                  }}
                />
              }
            />
            <Route path="missing" element={<MissingBooksPage libraryVersion={libraryVersion} />} />
            <Route path="health" element={<HealthPage onLibraryChanged={handleLibraryChanged} />} />
            <Route path="users" element={<UsersPage currentUser={user} />} />
          </Route>
        ) : null}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
