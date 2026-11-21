import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router";
import type { BookSort, CatalogFacets } from "../api/types.js";
import { countLabel, languageLabel } from "../shared/format.js";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // The URL can change underneath (back button, author link): follow it, without eating a space being typed.
  useEffect(() => setDraft((current) => (current.trim() === query ? current : query)), [query]);

  useEffect(() => {
    if (debouncedDraft !== query) {
      onSearch(debouncedDraft);
    }
    // Only a settled draft triggers a search; `query` changing is handled by the effect above.
  }, [debouncedDraft]);

  // Focus on "/" (see SearchShortcut in App) and when another page sent us here for that purpose.
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    if ((location.state as { focusSearch?: boolean } | null)?.focusSearch) {
      focus();
    }
    document.addEventListener("kyle-lib:focus-search", focus);
    return () => document.removeEventListener("kyle-lib:focus-search", focus);
  }, [location.state]);

  return (
    <div className="search-box">
      <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2m0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        className="search-input"
        placeholder="Titre, auteur, résumé…"
        aria-label="Rechercher un livre"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <kbd className="search-shortcut" aria-hidden="true">
        /
      </kbd>
    </div>
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
      <input type="search" list={listId} placeholder="Tous les auteurs" value={draft} onChange={(event) => handleChange(event.target.value)} />
      <datalist id={listId}>
        {facets?.authors.map((candidate) => (
          <option key={candidate.name} value={candidate.name}>
            {countLabel(candidate.bookCount, "livre")}
          </option>
        ))}
      </datalist>
    </label>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className="chip" onClick={onRemove} aria-label={`Retirer le filtre ${label}`}>
      {label} <span aria-hidden="true">×</span>
    </button>
  );
}

export function CatalogFilters({ params, facets, onChange }: CatalogFiltersProps) {
  // Without a query there is nothing to rank, and the server falls back to title order.
  const displayedSort: BookSort = params.sort === "relevance" && !params.query ? "title" : params.sort;
  const activeCount = Number(Boolean(params.author)) + Number(Boolean(params.language)) + Number(Boolean(params.series));
  // On a phone the filter row is folded behind a button; on wider screens CSS always shows it.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`filters${isOpen ? " is-open" : ""}`}>
      <div className="filters-top">
        <SearchInput query={params.query} onSearch={(query) => onChange({ query })} />
        <button type="button" className={`filters-toggle${activeCount > 0 ? " has-active" : ""}`} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
          Filtres{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>
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
      {activeCount > 0 ? (
        <div className="chips" aria-label="Filtres actifs">
          {params.series ? <FilterChip label={`Série : ${params.series}`} onRemove={() => onChange({ series: "" })} /> : null}
          {params.author ? <FilterChip label={params.author} onRemove={() => onChange({ author: "" })} /> : null}
          {params.language ? <FilterChip label={languageLabel(params.language)} onRemove={() => onChange({ language: "" })} /> : null}
        </div>
      ) : null}
    </div>
  );
}
