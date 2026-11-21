import { useCallback, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { BookPage } from "./book/BookPage.js";
import { CatalogPage } from "./catalog/CatalogPage.js";
import { SyncPanel } from "./sync/SyncPanel.js";
import { UploadPage } from "./upload/UploadPage.js";

function NotFoundPage() {
  return (
    <main className="book-page">
      <p className="empty-state">Cette page n'existe pas.</p>
      <Link to="/">← Retour au catalogue</Link>
    </main>
  );
}

export function App() {
  // Bumped after each sync or upload so the catalog and filters refetch without a page reload.
  const [libraryVersion, setLibraryVersion] = useState(0);
  const handleLibraryChanged = useCallback(() => setLibraryVersion((version) => version + 1), []);

  return (
    <BrowserRouter>
      <header className="app-header">
        <div className="app-nav">
          <Link to="/" className="app-title">
            Kyle Lib
          </Link>
          <Link to="/upload" className="button">
            Ajouter des livres
          </Link>
        </div>
        <SyncPanel onSynced={handleLibraryChanged} />
      </header>
      <Routes>
        <Route path="/" element={<CatalogPage libraryVersion={libraryVersion} />} />
        <Route path="/books/:bookId" element={<BookPage />} />
        <Route path="/upload" element={<UploadPage onLibraryChanged={handleLibraryChanged} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
