import { useState } from "react";
import { Link } from "react-router";
import { fetchSeriesReport, mergeSeries } from "../api/client.js";
import type { SeriesSummary } from "../api/types.js";
import { authorsLabel, countLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";

const seriesLink = (name: string) => `/?${new URLSearchParams({ series: name })}`;

function SeriesName({ series }: { series: SeriesSummary }) {
  return (
    <>
      <Link to={seriesLink(series.name)}>{series.name}</Link> ({series.bookCount})
    </>
  );
}

/**
 * Tidies the series of the library: one name for a series typed several ways, and no series at all for what
 * is only a publisher's collection or a placeholder.
 */
export function SeriesCleanup({ onChanged }: { onChanged: () => void }) {
  const report = useAsync((signal) => fetchSeriesReport(signal), []);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMerge(from: string[], into: string | null) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await mergeSeries(from, into);
      const books = countLabel(result.changedBooks, "livre");
      setMessage(result.series === null ? `${books} sorti(s) de « ${from.join(" », « ")} ».` : `${books} désormais dans « ${result.series} ».`);
      report.reload();
      onChanged();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    setIsBusy(false);
  }

  if (!report.data) {
    return null;
  }
  const { similarSeries, doubtfulSeries, duplicateVolumes } = report.data;

  return (
    <>
      {message ? (
        <p className="form-success" role="status">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="admin-section">
        <h2>
          Séries en double probable <span className="count-badge is-muted">{similarSeries.length}</span>
        </h2>
        {similarSeries.length === 0 ? (
          <p className="record-secondary">Aucune série n'est écrite de deux façons.</p>
        ) : (
          <ul className="record-list">
            {similarSeries.map((group) => (
              <li key={group.names.map((series) => series.name).join("|")}>
                <span className="record-main">
                  {group.names.map((series, index) => (
                    <span key={series.name}>
                      {index > 0 ? " · " : null}
                      <SeriesName series={series} />
                    </span>
                  ))}
                  <span className="record-secondary"> — {authorsLabel(group.names[0]?.authors ?? [])}</span>
                </span>
                <span className="merge-actions">
                  <span className="record-secondary">Tout regrouper sous :</span>
                  {group.names.map((series) => (
                    <button
                      key={series.name}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void handleMerge(
                          group.names.map((other) => other.name),
                          series.name,
                        )
                      }
                    >
                      {series.name}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section">
        <h2>
          Séries douteuses <span className="count-badge is-muted">{doubtfulSeries.length}</span>
        </h2>
        {doubtfulSeries.length === 0 ? (
          <p className="record-secondary">Toutes les séries ont l'air d'en être.</p>
        ) : (
          <ul className="record-list">
            {doubtfulSeries.map((series) => (
              <li key={series.name}>
                <span className="record-main">
                  <SeriesName series={series} />
                  <span className="record-secondary">
                    {" "}
                    — {authorsLabel(series.authors)} · {series.reason}
                  </span>
                </span>
                <span className="merge-actions">
                  <button type="button" disabled={isBusy} onClick={() => void handleMerge([series.name], null)}>
                    Retirer cette série de {series.bookCount > 1 ? `ses ${series.bookCount} livres` : "son livre"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section">
        <h2>
          Numéros de tome en double <span className="count-badge is-muted">{duplicateVolumes.length}</span>
        </h2>
        {duplicateVolumes.length === 0 ? (
          <p className="record-secondary">Aucune série n'a deux livres sous le même numéro.</p>
        ) : (
          <ul className="record-list">
            {duplicateVolumes.map((volume) => (
              <li key={`${volume.series}|${volume.seriesIndex}`}>
                <span className="record-main">
                  <Link to={seriesLink(volume.series)}>{volume.series}</Link>, tome {volume.seriesIndex} :{" "}
                  {volume.books.map((book, index) => (
                    <span key={book.id}>
                      {index > 0 ? " · " : null}
                      <Link to={`/books/${book.id}`}>{book.title}</Link>
                    </span>
                  ))}
                </span>
                <span className="record-secondary">Même livre en double, ou numéro à corriger sur l'une des fiches.</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
