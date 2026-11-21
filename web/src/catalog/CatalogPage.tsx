import { Link, useSearchParams } from "react-router";
import { fetchBooks, fetchFacets } from "../api/client.js";
import type { BookPage, BookSummary } from "../api/types.js";
import { countLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { KyleSays } from "../shared/KyleSays.js";
import { useDocumentTitle } from "../shared/use-document-title.js";
import { BookCard, BookCardSkeleton } from "./BookCard.js";
import { BookShelf } from "./BookShelf.js";
import { CatalogFilters } from "./CatalogFilters.js";
import { type CatalogParams, PAGE_SIZE, readCatalogParams, updateCatalogParams, writeCatalogParams } from "./catalog-params.js";

const RECENT_SHELF_SIZE = 12;

type LoadedBooks = { items: BookSummary[]; total: number };

/** `page` in the URL means "pages 1 to N are shown", so a reload or the back button restores the whole list. */
async function fetchPagesUpTo(params: CatalogParams, signal: AbortSignal): Promise<LoadedBooks> {
  const pages = await Promise.all(
    Array.from({ length: params.page }, (_, index) => fetchBooks({ ...params, page: index + 1, pageSize: PAGE_SIZE }, signal)),
  );
  return { items: pages.flatMap((page: BookPage) => page.items), total: pages[0]?.total ?? 0 };
}

function pageTitle(params: CatalogParams): string | null {
  if (params.query) return `« ${params.query} »`;
  if (params.series) return params.series;
  if (params.author) return params.author;
  return null;
}

export function CatalogPage({ libraryVersion }: { libraryVersion: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readCatalogParams(searchParams);
  const hasFilters = Boolean(params.query || params.author || params.language || params.series);
  const isHome = !hasFilters && params.sort === "relevance";
  useDocumentTitle(pageTitle(params));

  const books = useAsync((signal) => fetchPagesUpTo(params, signal), [params.query, params.author, params.language, params.series, params.sort, params.page, libraryVersion]);
  const facets = useAsync((signal) => fetchFacets(signal), [libraryVersion]);
  const recent = useAsync(
    (signal) => (isHome ? fetchBooks({ ...params, sort: "recent", page: 1, pageSize: RECENT_SHELF_SIZE }, signal) : Promise.resolve(null)),
    [isHome, libraryVersion],
  );

  function applyChange(change: Partial<CatalogParams>, { replace = false } = {}) {
    // Typing in the search box should not stack one history entry per word.
    const isTyping = Object.keys(change).length === 1 && "query" in change;
    setSearchParams(writeCatalogParams(updateCatalogParams(params, change)), { replace: replace || isTyping });
  }

  const total = books.data?.total ?? 0;
  const shown = books.data?.items.length ?? 0;
  const hasMore = shown < total;

  return (
    <main className="catalog">
      <CatalogFilters params={params} facets={facets.data} onChange={applyChange} />

      {isHome ? (
        <BookShelf
          title="Ajoutés récemment"
          books={recent.data?.items ?? null}
          action={
            <Link to="/?sort=recent" className="shelf-link">
              Voir tout →
            </Link>
          }
        />
      ) : null}

      <div className="catalog-summary" aria-live="polite">
        <h2 className="catalog-heading">
          {isHome ? "Tous les livres" : "Résultats"}
          {books.data ? <span className="catalog-count"> · {total === 0 ? "aucun livre" : countLabel(total, "livre")}</span> : null}
        </h2>
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
        <div className="kyle-empty">
          {hasFilters ? (
            <KyleSays pose="mirrored">
              <strong>Rien sous cette pierre.</strong> Aucun livre ne correspond à cette recherche.
            </KyleSays>
          ) : (
            <KyleSays pose="sleepy">
              <strong>Je dors en attendant la synchro.</strong> Lance-la ou ajoute des livres, je me réveille.
            </KyleSays>
          )}
        </div>
      ) : null}

      <ul className={`book-grid${books.status === "loading" && books.data ? " is-loading" : ""}`}>
        {books.data
          ? books.data.items.map((book) => <BookCard key={book.id} book={book} />)
          : Array.from({ length: PAGE_SIZE }, (_, index) => <BookCardSkeleton key={index} />)}
      </ul>

      {books.data && hasMore ? (
        <div className="load-more">
          <span className="load-more-count">
            {shown} sur {total}
          </span>
          <button type="button" className="button" disabled={books.status === "loading"} onClick={() => applyChange({ page: params.page + 1 }, { replace: true })}>
            {books.status === "loading" ? "Chargement…" : "Afficher plus"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
