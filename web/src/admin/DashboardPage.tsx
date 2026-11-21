import type { ReactNode } from "react";
import { Link } from "react-router";
import { fetchLibraryStats } from "../api/client.js";
import type { LibraryStats } from "../api/types.js";
import { fileSizeLabel, languageLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const numberFormat = new Intl.NumberFormat("fr");
const shortMonthFormat = new Intl.DateTimeFormat("fr", { month: "short", timeZone: "UTC" });
const longMonthFormat = new Intl.DateTimeFormat("fr", { month: "long", year: "numeric", timeZone: "UTC" });
const MAX_LANGUAGES = 6;

const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

function StatTile({ label, value, detail, to }: { label: string; value: string; detail?: string; to?: string }) {
  const content = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {detail ? <span className="stat-detail">{detail}</span> : null}
    </>
  );
  return to ? (
    <Link to={to} className="stat-tile">
      {content}
    </Link>
  ) : (
    <div className="stat-tile">{content}</div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="chart-card">
      <h2>{title}</h2>
      {subtitle ? <p className="record-secondary">{subtitle}</p> : null}
      {children}
    </section>
  );
}

/** One column per month. Only the tallest carries its value; the others show theirs on hover or focus, and in the table below. */
function AdditionsChart({ months }: { months: LibraryStats["addedByMonth"] }) {
  const peak = Math.max(...months.map((month) => month.count));
  if (peak === 0) {
    return <p className="record-secondary">Aucun livre ajouté sur la période.</p>;
  }
  const peakMonth = months.find((month) => month.count === peak)?.month;
  return (
    <>
      <ul className="column-chart">
        {months.map(({ month, count }) => {
          const height = (count / peak) * 100;
          return (
            <li
              key={month}
              tabIndex={0}
              className={month === peakMonth ? "is-peak" : undefined}
              aria-label={`${longMonthFormat.format(monthDate(month))} : ${numberFormat.format(count)}`}
            >
              <span className="column-value" style={{ top: `${100 - height}%` }}>
                {numberFormat.format(count)}
              </span>
              <span className="column-bar" style={{ height: `${height}%` }} />
            </li>
          );
        })}
      </ul>
      <div className="column-axis" aria-hidden="true">
        {months.map(({ month }) => (
          <span key={month}>{shortMonthFormat.format(monthDate(month)).replace(".", "")}</span>
        ))}
      </div>
      <details>
        <summary>Voir les chiffres</summary>
        <table className="data-table">
          <tbody>
            {months.map(({ month, count }) => (
              <tr key={month}>
                <th scope="row">{longMonthFormat.format(monthDate(month))}</th>
                <td>{numberFormat.format(count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

type RankedRow = { key: string; label: ReactNode; title: string; count: number };

/** Largest first, one hue, the figure at the end of each row: the bars rank, the numbers say how much. */
function RankedBars({ rows, emptyText }: { rows: RankedRow[]; emptyText: string }) {
  const peak = Math.max(0, ...rows.map((row) => row.count));
  if (peak === 0) {
    return <p className="record-secondary">{emptyText}</p>;
  }
  return (
    <ul className="ranked-bars">
      {rows.map((row) => (
        <li key={row.key}>
          <span className="ranked-label" title={row.title}>
            {row.label}
          </span>
          <span className="ranked-track" aria-hidden="true">
            <span className="ranked-bar" style={{ display: "block", width: `${(row.count / peak) * 100}%` }} />
          </span>
          <span className="ranked-value">{numberFormat.format(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}

function languageRows(languages: LibraryStats["languages"]): RankedRow[] {
  const named = languages.map((language) => ({ ...language, label: language.label ? languageLabel(language.label) : "Non renseignée" }));
  const shown = named.slice(0, MAX_LANGUAGES);
  const rest = named.slice(MAX_LANGUAGES).reduce((sum, language) => sum + language.count, 0);
  const rows = rest > 0 ? [...shown, { label: "Autres", count: rest }] : shown;
  return rows.map((row) => ({ key: row.label, label: row.label, title: row.label, count: row.count }));
}

export function DashboardPage({ libraryVersion }: { libraryVersion: number }) {
  useDocumentTitle("Tableau de bord");
  const stats = useAsync((signal) => fetchLibraryStats(signal), [libraryVersion]);

  if (stats.status === "error") {
    return (
      <p className="error" role="alert">
        Impossible de charger le tableau de bord : {stats.error.message}
      </p>
    );
  }
  if (!stats.data) {
    return null;
  }
  const { totals, downloads, addedByMonth, languages } = stats.data;
  const format = (value: number) => numberFormat.format(value);

  return (
    <>
      <header className="page-header">
        <h1>Tableau de bord</h1>
      </header>
      <div className="stat-row">
        <StatTile label="Livres" value={format(totals.books)} detail={fileSizeLabel(totals.totalBytes)} to="/" />
        <StatTile label="Auteurs" value={format(totals.authors)} detail={`${format(totals.series)} séries`} to="/authors" />
        <StatTile label="Téléchargements" value={format(downloads.last30Days)} detail={`sur 30 jours · ${format(downloads.total)} au total`} to="/admin/activity" />
        <StatTile label="Jamais téléchargés" value={format(downloads.neverDownloaded)} detail={`sur ${format(totals.books)} livres`} />
        <StatTile label="Envois à valider" value={format(totals.pendingUploads)} to="/admin/uploads" />
        <StatTile label="Demandes ouvertes" value={format(totals.openRequests)} to="/requests" />
        <StatTile label="Fichiers illisibles" value={format(totals.invalidFiles)} to="/admin/health" />
        <StatTile label="Comptes" value={format(totals.users)} to="/admin/users" />
      </div>
      <div className="chart-grid">
        <ChartCard title="Livres ajoutés par mois" subtitle="Douze derniers mois">
          <AdditionsChart months={addedByMonth} />
        </ChartCard>
        <ChartCard title="Livres les plus téléchargés" subtitle="Nombre de téléchargements">
          <RankedBars
            emptyText="Aucun téléchargement enregistré pour l'instant."
            rows={downloads.topBooks.map((book) => ({
              key: `${book.bookId}:${book.title}`,
              label: book.bookId !== null ? <Link to={`/books/${book.bookId}`}>{book.title}</Link> : book.title,
              title: book.title,
              count: book.count,
            }))}
          />
        </ChartCard>
        <ChartCard title="Téléchargements par compte">
          <RankedBars
            emptyText="Aucun téléchargement enregistré pour l'instant."
            rows={downloads.byUser.map((user) => ({ key: user.label, label: user.label, title: user.label, count: user.count }))}
          />
        </ChartCard>
        <ChartCard title="Livres par langue">
          <RankedBars emptyText="Aucun livre." rows={languageRows(languages)} />
        </ChartCard>
      </div>
    </>
  );
}
