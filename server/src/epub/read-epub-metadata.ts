import path from "node:path";
import { parseContainer, parseOpf } from "./opf.js";
import { openZipArchive } from "./zip.js";

export type EpubCover = {
  data: Buffer;
  mediaType: string;
};

export type EpubMetadata = {
  title: string;
  authors: string[];
  language: string | null;
  description: string | null;
  series: string | null;
  seriesIndex: number | null;
  cover: EpubCover | null;
};

export class InvalidEpubError extends Error {
  constructor(filePath: string, reason: string) {
    super(`Invalid EPUB "${filePath}": ${reason}`);
    this.name = "InvalidEpubError";
  }
}

const CONTAINER_PATH = "META-INF/container.xml";

function titleFromFileName(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export async function readEpubMetadata(filePath: string): Promise<EpubMetadata> {
  let archive;
  try {
    archive = await openZipArchive(filePath);
  } catch (error) {
    throw new InvalidEpubError(filePath, `not a readable zip (${(error as Error).message})`);
  }

  try {
    const containerXml = await archive.readEntry(CONTAINER_PATH);
    if (!containerXml) {
      throw new InvalidEpubError(filePath, `missing ${CONTAINER_PATH}`);
    }

    const opfPath = parseContainer(containerXml.toString("utf8"));
    if (!opfPath) {
      throw new InvalidEpubError(filePath, "container.xml declares no package document");
    }

    const opfXml = await archive.readEntry(opfPath);
    if (!opfXml) {
      throw new InvalidEpubError(filePath, `package document "${opfPath}" not found`);
    }

    const opf = parseOpf(opfXml.toString("utf8"), opfPath);
    const coverData = opf.coverPath ? await archive.readEntry(opf.coverPath) : null;

    return {
      title: opf.title ?? titleFromFileName(filePath),
      authors: opf.authors,
      language: opf.language,
      description: opf.description,
      series: opf.series,
      seriesIndex: opf.seriesIndex,
      cover: coverData && opf.coverMediaType ? { data: coverData, mediaType: opf.coverMediaType } : null,
    };
  } finally {
    archive.close();
  }
}
