import { useSearchParams } from "react-router";
import { fetchBooks, fetchFacets } from "../api/client.js";
import { useAsync } from "../shared/use-async.js";
import { BookCard } from "./BookCard.js";
import { CatalogFilters } from "./CatalogFilters.js";
import { type CatalogParams, PAGE_SIZE, readCatalogParams, updateCatalogParams, writeCatalogParams } from "./catalog-params.js";

function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ← Précédent
      </button>
      <span>
        Page {page} / {pageCount}
      </span>
      <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Suivant →
      </button>
    </nav>
  );
}

function resultCountLabel(total: number): string {
  if (total === 0) {
    return "Aucun livre";
  }
  return `${total} livre${total > 1 ? "s" : ""}`;
}

export function CatalogPage({ libraryVersion }: { libraryVersion: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readCatalogParams(searchParams);

  const books = useAsync(
    (signal) => fetchBooks({ ...params, pageSize: PAGE_SIZE }, signal),
    [params.query, params.author, params.language, params.sort, params.page, libraryVersion],
  );
  const facets = useAsync((signal) => fetchFacets(signal), [libraryVersion]);

  function applyChange(change: Partial<CatalogParams>) {
    // Typing in the search box should not stack one history entry per word.
    const isTyping = Object.keys(change).length === 1 && "query" in change;
    setSearchParams(writeCatalogParams(updateCatalogParams(params, change)), { replace: isTyping });
  }

  function changePage(page: number) {
    applyChange({ page });
    window.scrollTo({ top: 0 });
  }

  const hasFilters = Boolean(params.query || params.author || params.language);
  const pageCount = books.data ? Math.ceil(books.data.total / books.data.pageSize) : 0;

  return (
    <main className="catalog">
      <CatalogFilters params={params} facets={facets.data} onChange={applyChange} />

      <div className="catalog-summary" aria-live="polite">
        {books.data ? <span>{resultCountLabel(books.data.total)}</span> : null}
        {hasFilters ? (
          <button type="button" className="link-button" onClick={() => setSearchParams(new URLSearchParams())}>
            Effacer les filtres
          </button>
        ) : null}
      </div>

      {books.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger le catalogue : {books.error.message}{" "}
          <button type="button" className="link-button" onClick={books.reload}>
            Réessayer
          </button>
        </p>
      ) : null}

      {books.data && books.data.items.length === 0 ? (
        <p className="empty-state">
          {hasFilters ? "Aucun livre ne correspond à cette recherche." : "Le catalogue est vide. Lance une synchro pour l'alimenter."}
        </p>
      ) : null}

      {books.data ? (
        <ul className={`book-grid${books.status === "loading" ? " is-loading" : ""}`}>
          {books.data.items.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </ul>
      ) : null}

      <Pagination page={params.page} pageCount={pageCount} onPageChange={changePage} />
    </main>
  );
}
