import { useEffect, useId, useState } from "react";
import type { BookSort, CatalogFacets } from "../api/types.js";
import { languageLabel } from "../shared/format.js";
import { useDebouncedValue } from "../shared/use-debounced-value.js";
import { type CatalogParams, toBookSort } from "./catalog-params.js";

type CatalogFiltersProps = {
  params: CatalogParams;
  facets: CatalogFacets | null;
  onChange: (change: Partial<CatalogParams>) => void;
};

const SEARCH_DEBOUNCE_MS = 250;

function SearchInput({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [draft, setDraft] = useState(query);
  const debouncedDraft = useDebouncedValue(draft.trim(), SEARCH_DEBOUNCE_MS);

  // The URL can change underneath (back button, author link): follow it, without eating a space being typed.
  useEffect(() => setDraft((current) => (current.trim() === query ? current : query)), [query]);

  useEffect(() => {
    if (debouncedDraft !== query) {
      onSearch(debouncedDraft);
    }
    // Only a settled draft triggers a search; `query` changing is handled by the effect above.
  }, [debouncedDraft]);

  return (
    <input
      type="search"
      className="search-input"
      placeholder="Titre, auteur, résumé…"
      aria-label="Rechercher un livre"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      autoFocus
    />
  );
}

function AuthorInput({ author, facets, onSelect }: { author: string; facets: CatalogFacets | null; onSelect: (author: string) => void }) {
  const listId = useId();
  const [draft, setDraft] = useState(author);

  useEffect(() => setDraft(author), [author]);

  function handleChange(value: string) {
    setDraft(value);
    if (value === "") {
      onSelect("");
      return;
    }
    // Filter only on a real author name, picked from the list or typed in full.
    const match = facets?.authors.find((candidate) => candidate.name.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      onSelect(match.name);
    }
  }

  return (
    <label className="filter">
      <span>Auteur</span>
      <input
        type="search"
        list={listId}
        placeholder="Tous les auteurs"
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
      />
      <datalist id={listId}>
        {facets?.authors.map((candidate) => (
          <option key={candidate.name} value={candidate.name}>
            {`${candidate.bookCount} livre${candidate.bookCount > 1 ? "s" : ""}`}
          </option>
        ))}
      </datalist>
    </label>
  );
}

export function CatalogFilters({ params, facets, onChange }: CatalogFiltersProps) {
  // Without a query there is nothing to rank, and the server falls back to title order.
  const displayedSort: BookSort = params.sort === "relevance" && !params.query ? "title" : params.sort;

  return (
    <div className="filters">
      <SearchInput query={params.query} onSearch={(query) => onChange({ query })} />
      <div className="filter-row">
        <AuthorInput author={params.author} facets={facets} onSelect={(author) => onChange({ author })} />
        <label className="filter">
          <span>Langue</span>
          <select value={params.language} onChange={(event) => onChange({ language: event.target.value })}>
            <option value="">Toutes</option>
            {facets?.languages.map((language) => (
              <option key={language.code} value={language.code}>
                {`${languageLabel(language.code)} (${language.bookCount})`}
              </option>
            ))}
          </select>
        </label>
        <label className="filter">
          <span>Tri</span>
          <select value={displayedSort} onChange={(event) => onChange({ sort: toBookSort(event.target.value) })}>
            {params.query ? <option value="relevance">Pertinence</option> : null}
            <option value="title">Titre</option>
            <option value="recent">Ajouts récents</option>
          </select>
        </label>
      </div>
    </div>
  );
}
