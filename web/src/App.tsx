import { useCallback, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { BookPage } from "./book/BookPage.js";
import { CatalogPage } from "./catalog/CatalogPage.js";
import { SyncPanel } from "./sync/SyncPanel.js";

function NotFoundPage() {
  return (
    <main className="book-page">
      <p className="empty-state">Cette page n'existe pas.</p>
      <Link to="/">← Retour au catalogue</Link>
    </main>
  );
}

export function App() {
  // Bumped after each sync so the catalog and filters refetch without a page reload.
  const [libraryVersion, setLibraryVersion] = useState(0);
  const handleSynced = useCallback(() => setLibraryVersion((version) => version + 1), []);

  return (
    <BrowserRouter>
      <header className="app-header">
        <Link to="/" className="app-title">
          Kyle Lib
        </Link>
        <SyncPanel onSynced={handleSynced} />
      </header>
      <Routes>
        <Route path="/" element={<CatalogPage libraryVersion={libraryVersion} />} />
        <Route path="/books/:bookId" element={<BookPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
