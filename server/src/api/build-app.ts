import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyServerOptions } from "fastify";
import type { BookSort, CatalogQueries } from "../catalog/catalog-queries.js";
import type { SyncService } from "../sync/sync-service.js";

export type AppOptions = {
  catalog: CatalogQueries;
  sync: SyncService;
  /** When the next scheduled sync will run, null when scheduling is off. */
  nextScheduledSyncAt: () => Date | null;
  booksDirectory: string;
  coversDirectory: string;
  /** Built SPA (web/dist). Null in tests and in dev, where Vite serves the front end. */
  webDirectory?: string | null;
  logger?: FastifyServerOptions["logger"];
};

type BookListQuerystring = {
  q?: string;
  author?: string;
  language?: string;
  sort: BookSort;
  page: number;
  pageSize: number;
};

type BookParams = { id: number };

const bookParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "integer", minimum: 1 } },
} as const;

const bookListQuerystringSchema = {
  type: "object",
  properties: {
    q: { type: "string", maxLength: 200 },
    author: { type: "string", maxLength: 300 },
    language: { type: "string", maxLength: 20 },
    sort: { type: "string", enum: ["relevance", "title", "recent"], default: "relevance" },
    page: { type: "integer", minimum: 1, default: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 100, default: 24 },
  },
  additionalProperties: false,
} as const;

const COVER_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Resolves a stored relative path, refusing anything that would escape its base directory. */
function resolveInside(baseDirectory: string, relativePath: string): string | null {
  const absoluteBase = path.resolve(baseDirectory);
  const absolutePath = path.resolve(absoluteBase, relativePath);
  return absolutePath.startsWith(absoluteBase + path.sep) ? absolutePath : null;
}

async function isReadableFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

// Browsers need the RFC 5987 form for non-ASCII names; the plain filename is the fallback for old clients.
function attachmentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function notFound(reply: FastifyReply, message: string) {
  return reply.code(404).send({ error: "not_found", message });
}

export function buildApp(options: AppOptions): FastifyInstance {
  const { catalog, sync, nextScheduledSyncAt, booksDirectory, coversDirectory, webDirectory = null, logger = false } = options;
  const app = Fastify({ logger });

  if (webDirectory) {
    void app.register(fastifyStatic, { root: webDirectory, wildcard: false });
  }

  app.setNotFoundHandler(async (request, reply) => {
    const isPageNavigation = request.method === "GET" && !request.url.startsWith("/api/");
    if (webDirectory && isPageNavigation) {
      // Client-side routes such as /books/42 only exist in the SPA: hand it index.html and let it route.
      return reply.header("cache-control", "no-cache").sendFile("index.html");
    }
    return notFound(reply, "Route not found");
  });

  app.get("/api/sync", async () => ({
    ...sync.getStatus(),
    nextScheduledAt: nextScheduledSyncAt()?.toISOString() ?? null,
  }));

  app.post("/api/sync", async (_request, reply) => {
    const run = sync.start("manual");
    if (!run) {
      return reply.code(409).send({ error: "sync_running", message: "A sync is already running" });
    }
    return reply.code(202).send(run);
  });

  app.get<{ Querystring: BookListQuerystring }>(
    "/api/books",
    { schema: { querystring: bookListQuerystringSchema } },
    async (request) => {
      const { q, author, language, sort, page, pageSize } = request.query;
      return catalog.listBooks({
        query: q?.trim() || null,
        author: author?.trim() || null,
        language: language?.trim().toLowerCase() || null,
        sort,
        page,
        pageSize,
      });
    },
  );

  app.get("/api/facets", async () => catalog.getFacets());

  app.get<{ Params: BookParams }>("/api/books/:id", { schema: { params: bookParamsSchema } }, async (request, reply) => {
    const book = catalog.getBook(request.params.id);
    return book ?? notFound(reply, "Book not found");
  });

  app.get<{ Params: BookParams }>("/api/books/:id/cover", { schema: { params: bookParamsSchema } }, async (request, reply) => {
    const coverFile = catalog.getCoverFile(request.params.id);
    const coverPath = coverFile ? resolveInside(coversDirectory, coverFile) : null;
    if (!coverPath || !(await isReadableFile(coverPath))) {
      return notFound(reply, "Cover not found");
    }
    return reply
      .type(COVER_CONTENT_TYPES[path.extname(coverPath)] ?? "application/octet-stream")
      // Covers are named after the book id and rewritten in place when the book changes.
      .header("cache-control", "public, max-age=3600")
      .send(createReadStream(coverPath));
  });

  app.get<{ Params: BookParams }>("/api/books/:id/file", { schema: { params: bookParamsSchema } }, async (request, reply) => {
    const storedPath = catalog.getBookFilePath(request.params.id);
    const filePath = storedPath ? resolveInside(booksDirectory, storedPath) : null;
    if (!filePath) {
      return notFound(reply, "Book not found");
    }
    // The index can lag behind the disk between two syncs.
    if (!(await isReadableFile(filePath))) {
      return notFound(reply, "Book file is no longer on disk");
    }
    return reply
      .type("application/epub+zip")
      .header("content-disposition", attachmentDisposition(path.basename(filePath)))
      .send(createReadStream(filePath));
  });

  return app;
}
