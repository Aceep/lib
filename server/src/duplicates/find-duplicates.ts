import path from "node:path";
import { toSortKey } from "../db/sort-key.js";
import { readEpubMetadata } from "../epub/read-epub-metadata.js";
import { hashFile } from "../library/hash-file.js";
import { listEpubFiles } from "../library/index-library.js";

export type ScannedFile = {
  /** Relative to the scanned directory, "/" separated, like the paths stored in the database. */
  filePath: string;
  fileSize: number;
  contentHash: string;
  /** Null when the EPUB could not be parsed; the file can still match an identical copy by hash. */
  title: string | null;
  authors: string[];
};

export type DuplicateGroup = {
  /** "identical": same bytes. "same-book": same title and authors in the EPUB metadata, different bytes. */
  kind: "identical" | "same-book";
  label: string;
  /** The file proposed to keep; nothing is ever moved or deleted here. */
  keep: ScannedFile;
  others: ScannedFile[];
};

export type ScanFailure = {
  filePath: string;
  error: string;
};

export type DuplicateReport = {
  scanned: number;
  groups: DuplicateGroup[];
  failures: ScanFailure[];
};

// Names that download managers and copy-paste leave behind: "Dune (1).epub", "Dune - copie.epub", "Dune copy.epub".
const COPY_MARKER = /\(\d+\)|\bcopie\b|\bcopy\b/i;

/**
 * Lower is better. A file without a copy marker is preferred, then the larger file (more likely to carry a cover
 * and complete metadata), then the shorter path (the one filed by hand rather than dropped in a download folder).
 */
export function compareKeepPreference(left: ScannedFile, right: ScannedFile): number {
  const leftMarked = COPY_MARKER.test(path.basename(left.filePath)) ? 1 : 0;
  const rightMarked = COPY_MARKER.test(path.basename(right.filePath)) ? 1 : 0;
  return (
    leftMarked - rightMarked ||
    right.fileSize - left.fileSize ||
    left.filePath.length - right.filePath.length ||
    left.filePath.localeCompare(right.filePath)
  );
}

function bookKey(file: ScannedFile): string | null {
  if (file.title === null) {
    return null;
  }
  const authors = file.authors.map(toSortKey).sort().join(" & ");
  return `${toSortKey(file.title)} | ${authors}`;
}

function bookLabel(file: ScannedFile): string {
  const title = file.title ?? path.basename(file.filePath);
  return file.authors.length > 0 ? `${title} — ${file.authors.join(", ")}` : title;
}

function sortByKeepPreference(files: ScannedFile[]): ScannedFile[] {
  return [...files].sort(compareKeepPreference);
}

/** Callers only pass groups of two or more files. */
function toGroup(kind: DuplicateGroup["kind"], files: ScannedFile[]): DuplicateGroup {
  const [keep, ...others] = sortByKeepPreference(files) as [ScannedFile, ...ScannedFile[]];
  return { kind, label: bookLabel(keep), keep, others };
}

function groupBy<T>(items: T[], keyOf: (item: T) => string | null): T[][] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null) {
      continue;
    }
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }
  return [...buckets.values()];
}

export async function scanEpubFiles(booksDirectory: string): Promise<{ files: ScannedFile[]; failures: ScanFailure[] }> {
  const files: ScannedFile[] = [];
  const failures: ScanFailure[] = [];
  for (const file of await listEpubFiles(booksDirectory)) {
    const absolutePath = path.join(booksDirectory, file.filePath);
    const scanned: ScannedFile = {
      filePath: file.filePath,
      fileSize: file.fileSize,
      contentHash: await hashFile(absolutePath),
      title: null,
      authors: [],
    };
    try {
      const metadata = await readEpubMetadata(absolutePath);
      scanned.title = metadata.title;
      scanned.authors = metadata.authors;
    } catch (error) {
      failures.push({ filePath: file.filePath, error: (error as Error).message });
    }
    files.push(scanned);
  }
  return { files, failures };
}

/**
 * Groups duplicates in two passes: identical files first, then one representative per distinct content is matched
 * on title + authors, so a book present as three identical copies and one other edition yields two groups.
 */
export function groupDuplicates(files: ScannedFile[]): DuplicateGroup[] {
  const byHash = groupBy(files, (file) => file.contentHash);
  const identical = byHash.filter((group) => group.length > 1).map((group) => toGroup("identical", group));

  const representatives = byHash.flatMap((group) => sortByKeepPreference(group).slice(0, 1));
  const sameBook = groupBy(representatives, bookKey)
    .filter((group) => group.length > 1)
    .map((group) => toGroup("same-book", group));

  return [...identical, ...sameBook].sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

export async function findDuplicates(booksDirectory: string): Promise<DuplicateReport> {
  const { files, failures } = await scanEpubFiles(booksDirectory);
  // readdir order is not stable across file systems; sort so the report reads the same on every run.
  failures.sort((left, right) => left.filePath.localeCompare(right.filePath));
  return { scanned: files.length, groups: groupDuplicates(files), failures };
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.ceil(bytes / 1024)} Ko`;
}

export function formatReport(report: DuplicateReport): string {
  const lines: string[] = [];
  const duplicates = report.groups.reduce((count, group) => count + group.others.length, 0);
  lines.push(`${report.scanned} EPUB analysés, ${report.groups.length} groupes, ${duplicates} doublons proposés`);

  for (const group of report.groups) {
    const kind = group.kind === "identical" ? "fichiers identiques" : "même titre et auteurs";
    lines.push("", `## ${group.label} (${kind})`);
    lines.push(`  garder   ${group.keep.filePath} (${formatSize(group.keep.fileSize)})`);
    for (const other of group.others) {
      lines.push(`  doublon  ${other.filePath} (${formatSize(other.fileSize)})`);
    }
  }

  if (report.failures.length > 0) {
    lines.push("", `## ${report.failures.length} fichiers illisibles (comparés sur le contenu seulement)`);
    for (const failure of report.failures) {
      lines.push(`  ${failure.filePath}: ${failure.error}`);
    }
  }
  return lines.join("\n");
}
