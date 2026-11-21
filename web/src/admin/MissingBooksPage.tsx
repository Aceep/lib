import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import {
  decideWork,
  fetchFacets,
  fetchMissingBooks,
  followAuthor,
  refreshFollowedAuthor,
  searchAuthorCandidates,
  unfollowAuthor,
} from "../api/client.js";
import type { AuthorCandidate, AuthorWork, FollowedAuthor, SeriesGap, WorkDecision } from "../api/types.js";
import { countLabel, dateTimeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const NO_SERIES = "Hors série";
const volumeFormat = new Intl.NumberFormat("fr", { maximumFractionDigits: 2 });

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function SeriesGaps({ gaps }: { gaps: SeriesGap[] }) {
  return (
    <section className="admin-section">
      <h2>
        Trous dans les séries <span className="count-badge is-muted">{gaps.length}</span>
      </h2>
      <p className="record-secondary">D'après les numéros de tome des livres de la bibliothèque, sans source externe.</p>
      {gaps.length === 0 ? <p className="record-secondary">Aucune série numérotée n'a de trou.</p> : null}
      <ul className="record-list">
        {gaps.map((gap) => (
          <li key={gap.series}>
            <span className="record-main">
              <Link to={`/?${new URLSearchParams({ series: gap.series })}`}>{gap.series}</Link>
              {gap.authors.length > 0 ? <span className="record-secondary"> — {gap.authors.join(", ")}</span> : null}
            </span>
            <span className="record-secondary">
              {gap.missing.length > 1 ? "tomes manquants" : "tome manquant"} : <strong>{gap.missing.join(", ")}</strong> (présents : {gap.owned.join(", ")})
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Two steps, because names are ambiguous: look the author up, then pick the right person among the answers. */
function FollowAuthorForm({ followedNames, onFollowed }: { followedNames: string[]; onFollowed: () => void }) {
  const facets = useAsync((signal) => fetchFacets(signal), []);
  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<AuthorCandidate[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The authors with the most books come first: they are the ones worth completing.
  const suggestions = [...(facets.data?.authors ?? [])]
    .filter((author) => !followedNames.includes(author.name))
    .sort((left, right) => right.bookCount - left.bookCount);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setIsBusy(false);
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void run(async () => setCandidates(await searchAuthorCandidates(name.trim())));
  }

  function handleFollow(candidate: AuthorCandidate) {
    void run(async () => {
      await followAuthor(name.trim(), candidate);
      setName("");
      setCandidates(null);
      onFollowed();
    });
  }

  return (
    <form className="form follow-form" onSubmit={handleSearch}>
      <h2>Suivre un auteur</h2>
      <label className="filter">
        Auteur de la bibliothèque
        <input
          type="text"
          list="follow-author-suggestions"
          required
          value={name}
          disabled={isBusy}
          onChange={(event) => {
            setName(event.target.value);
            setCandidates(null);
          }}
        />
        <datalist id="follow-author-suggestions">
          {suggestions.map((author) => (
            <option key={author.name} value={author.name}>
              {countLabel(author.bookCount, "livre")}
            </option>
          ))}
        </datalist>
      </label>
      <button type="submit" className="button" disabled={isBusy}>
        {isBusy ? "Recherche…" : "Chercher sur Wikidata"}
      </button>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {candidates?.length === 0 ? <p className="record-secondary">Wikidata ne connaît personne sous ce nom. Essayez une autre orthographe.</p> : null}
      {candidates && candidates.length > 0 ? (
        <ul className="record-list candidate-list">
          {candidates.map((candidate) => (
            <li key={candidate.wikidataId}>
              <span className="record-main">
                <strong>{candidate.label}</strong>
                <span className="record-secondary"> — {candidate.description ?? "sans description"}</span>
              </span>
              <button type="button" disabled={isBusy} onClick={() => handleFollow(candidate)}>
                C'est cette personne
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

function WorkLine({ work, onDecide }: { work: AuthorWork; onDecide: (decision: WorkDecision | null) => void }) {
  return (
    <li>
      <span className="record-main">
        {work.seriesIndex !== null ? `${volumeFormat.format(work.seriesIndex)}. ` : null}
        {work.ownedBookId !== null ? <Link to={`/books/${work.ownedBookId}`}>{work.title}</Link> : work.title}
        <span className="record-secondary">
          {work.year !== null ? ` (${work.year})` : null}
          {work.alternateTitles.length > 0 ? ` — ${work.alternateTitles.slice(0, 2).join(" ; ")}` : null}
        </span>
      </span>
      {work.source === "openlibrary" ? (
        <span className="status-tag" title="Trouvé seulement sur Open Library : moins fiable">
          Open Library
        </span>
      ) : null}
      <span className="merge-actions">
        {work.state === "missing" ? (
          <>
            <button type="button" onClick={() => onDecide("owned")}>
              Je l'ai déjà
            </button>
            <button type="button" onClick={() => onDecide("ignored")}>
              Ignorer
            </button>
          </>
        ) : null}
        {work.decision !== null ? (
          <button type="button" onClick={() => onDecide(null)}>
            Annuler ce choix
          </button>
        ) : null}
        {/* Title matching said "owned" and got it wrong: forcing it back to missing is not a stored state, hiding it is. */}
        {work.state === "owned" && work.decision === null ? (
          <button type="button" onClick={() => onDecide("ignored")}>
            Ignorer
          </button>
        ) : null}
      </span>
    </li>
  );
}

function groupBySeries(works: AuthorWork[]): [string, AuthorWork[]][] {
  const groups = new Map<string, AuthorWork[]>();
  for (const work of works) {
    const key = work.series ?? NO_SERIES;
    groups.set(key, [...(groups.get(key) ?? []), work]);
  }
  return [...groups];
}

function AuthorCard({ author, onChanged }: { author: FollowedAuthor; onChanged: () => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const missing = author.works.filter((work) => work.state === "missing");
  const owned = author.works.filter((work) => work.state === "owned");
  const ignored = author.works.filter((work) => work.state === "ignored");

  async function run(action: () => Promise<unknown>) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setIsBusy(false);
      // Also after a failure: the server keeps the reason next to the author.
      onChanged();
    }
  }

  function handleUnfollow() {
    if (window.confirm(`Ne plus suivre ${author.name} ? Vos choix « je l'ai déjà » et « ignorer » seront perdus.`)) {
      void run(() => unfollowAuthor(author.id));
    }
  }

  const decide = (work: AuthorWork) => (decision: WorkDecision | null) => void run(() => decideWork(work.id, decision));

  return (
    <li className="upload-item">
      <h3 className="followed-author-name">
        <Link to={`/?${new URLSearchParams({ author: author.name })}`}>{author.name}</Link>{" "}
        <span className="count-badge">{missing.length}</span>
      </h3>
      <p className="record-secondary">
        {countLabel(missing.length, "manquant")}, {countLabel(owned.length, "possédé")}
        {ignored.length > 0 ? `, ${countLabel(ignored.length, "ignoré")}` : null} ·{" "}
        {author.fetchedAt ? `actualisé le ${dateTimeLabel(author.fetchedAt)}` : "jamais récupéré"} ·{" "}
        <a href={`https://www.wikidata.org/wiki/${author.wikidataId}`} target="_blank" rel="noreferrer">
          {author.wikidataLabel} sur Wikidata
        </a>
      </p>
      {errorMessage || author.fetchError ? (
        <p className="error" role="alert">
          {errorMessage ?? `Dernière récupération échouée : ${author.fetchError}`}
        </p>
      ) : null}
      {groupBySeries(missing).map(([series, works]) => (
        <div key={series} className="work-group">
          <h4>{series}</h4>
          <ul className="record-list">
            {works.map((work) => (
              <WorkLine key={work.id} work={work} onDecide={decide(work)} />
            ))}
          </ul>
        </div>
      ))}
      {[
        { label: "possédés", works: owned },
        { label: "ignorés", works: ignored },
      ].map(({ label, works }) =>
        works.length > 0 ? (
          <details key={label} className="work-group">
            <summary>
              {works.length} {label}
            </summary>
            <ul className="record-list">
              {works.map((work) => (
                <WorkLine key={work.id} work={work} onDecide={decide(work)} />
              ))}
            </ul>
          </details>
        ) : null,
      )}
      <div className="upload-actions">
        <button type="button" disabled={isBusy} onClick={() => void run(() => refreshFollowedAuthor(author.id))}>
          {isBusy ? "En cours…" : "Actualiser"}
        </button>
        <button type="button" disabled={isBusy} onClick={handleUnfollow}>
          Ne plus suivre
        </button>
      </div>
    </li>
  );
}

export function MissingBooksPage({ libraryVersion }: { libraryVersion: number }) {
  useDocumentTitle("Livres manquants");
  const report = useAsync((signal) => fetchMissingBooks(signal), [libraryVersion]);

  return (
    <>
      <header className="page-header">
        <h1>Livres manquants</h1>
        <p className="page-subtitle">
          Pour chaque auteur suivi, sa bibliographie vient de Wikidata (titres français, séries) et d'Open Library. Le rapprochement avec la
          bibliothèque se fait par titre : corrigez-le avec « Je l'ai déjà » ou « Ignorer ».
        </p>
      </header>
      {report.status === "error" ? (
        <p className="error" role="alert">
          Impossible de charger le rapport : {report.error.message}
        </p>
      ) : null}
      {report.data ? (
        <>
          <section className="admin-section">
            <h2>
              Auteurs suivis <span className="count-badge is-muted">{report.data.authors.length}</span>
            </h2>
            <ul className="upload-list">
              {report.data.authors.map((author) => (
                <AuthorCard key={author.id} author={author} onChanged={report.reload} />
              ))}
            </ul>
            <FollowAuthorForm followedNames={report.data.authors.map((author) => author.name)} onFollowed={report.reload} />
          </section>
          <SeriesGaps gaps={report.data.seriesGaps} />
        </>
      ) : null}
    </>
  );
}
