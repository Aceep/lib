import { useMemo, useState } from "react";
import { Link } from "react-router";
import { fetchFacets } from "../api/client.js";
import { countLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { KyleSays } from "../shared/KyleSays.js";
import { useDocumentTitle } from "../shared/use-document-title.js";
import { groupAuthorsByLetter } from "./authors-index.js";

function authorLink(author: string): string {
  return `/?${new URLSearchParams({ author })}`;
}

export function AuthorsPage({ libraryVersion }: { libraryVersion: number }) {
  useDocumentTitle("Auteurs");
  const facets = useAsync((signal) => fetchFacets(signal), [libraryVersion]);
  const [filter, setFilter] = useState("");

  const groups = useMemo(() => {
    const authors = facets.data?.authors ?? [];
    const needle = filter.trim().toLowerCase();
    return groupAuthorsByLetter(needle ? authors.filter((author) => author.name.toLowerCase().includes(needle)) : authors);
  }, [facets.data, filter]);
  const authorCount = facets.data?.authors.length ?? 0;

  return (
    <main className="page authors-page">
      <header className="page-header">
        <h1>Auteurs</h1>
        {facets.data ? <p className="page-subtitle">{countLabel(authorCount, "auteur")}</p> : null}
      </header>
      <input
        type="search"
        className="search-input authors-filter"
        placeholder="Filtrer les auteurs…"
        aria-label="Filtrer les auteurs"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      {facets.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger les auteurs : {facets.error.message}
        </p>
      ) : null}
      {!filter && groups.length > 1 ? (
        <nav className="letter-nav" aria-label="Aller à la lettre">
          {groups.map((group) => (
            <a key={group.letter} href={`#auteurs-${group.letter}`}>
              {group.letter}
            </a>
          ))}
        </nav>
      ) : null}
      {facets.data && groups.length === 0 ? (
        <div className="kyle-empty">
          <KyleSays pose="search">
            <strong>Rien sous cette pierre.</strong> Aucun auteur ne correspond.
          </KyleSays>
        </div>
      ) : null}
      {groups.map((group) => (
        <section key={group.letter} className="author-group" id={`auteurs-${group.letter}`}>
          <h2>{group.letter}</h2>
          <ul className="author-list">
            {group.authors.map((author) => (
              <li key={author.name}>
                <Link to={authorLink(author.name)}>{author.name}</Link>
                <span className="author-count">{author.bookCount}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
