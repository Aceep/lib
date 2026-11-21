import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router";
import { AuthorsPage } from "./authors/AuthorsPage.js";
import { BookPage } from "./book/BookPage.js";
import { CatalogPage } from "./catalog/CatalogPage.js";
import { useDocumentTitle } from "./shared/use-document-title.js";
import { SyncIndicator } from "./sync/SyncIndicator.js";
import { UploadPage } from "./upload/UploadPage.js";

function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <main className="page">
      <p className="empty-state">Cette page n'existe pas.</p>
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

export function App() {
  // Bumped after each sync or upload so the catalog and filters refetch without a page reload.
  const [libraryVersion, setLibraryVersion] = useState(0);
  const handleLibraryChanged = useCallback(() => setLibraryVersion((version) => version + 1), []);

  return (
    <BrowserRouter>
      <SearchShortcut />
      <header className="app-header">
        <Link to="/" className="app-title">
          <img className="app-logo" src="/favicon.svg" alt="" width="24" height="24" />
          <span>Kyle Lib</span>
        </Link>
        <nav className="app-nav" aria-label="Navigation">
          <NavLink to="/authors" className="nav-link">
            Auteurs
          </NavLink>
          <NavLink to="/upload" className="nav-link">
            Ajouter
          </NavLink>
          <SyncIndicator onSynced={handleLibraryChanged} />
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<CatalogPage libraryVersion={libraryVersion} />} />
        <Route path="/books/:bookId" element={<BookPage />} />
        <Route path="/authors" element={<AuthorsPage libraryVersion={libraryVersion} />} />
        <Route path="/upload" element={<UploadPage onLibraryChanged={handleLibraryChanged} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
