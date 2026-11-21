import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest, type FastifyServerOptions } from "fastify";
import { ACTIVITY_ACTIONS, type ActivityAction, type ActivityLog } from "../activity/activity-log.js";
import type { LibraryHealthQueries } from "../admin/library-health.js";
import { AuthError, type AuthService } from "../auth/auth-service.js";
import type { BookSort, CatalogQueries } from "../catalog/catalog-queries.js";
import type { SyncService } from "../sync/sync-service.js";
import { actorOf, registerAuth } from "./auth-routes.js";
import { type UploadActor, UploadError, type UploadPreview, type UploadService } from "../uploads/upload-service.js";

export type AppOptions = {
  catalog: CatalogQueries;
  /** Omitted in tests of the catalog itself: every route is then open. The real server always passes it. */
  auth?: AuthService;
  /** Omitted in tests that do not look at the log; nothing is recorded then. */
  activity?: ActivityLog;
  /** Admin report on what is wrong with the library; the route is not registered without it. */
  health?: LibraryHealthQueries;
  /** True behind a reverse proxy, so the client address and protocol come from the X-Forwarded-* headers. */
  trustProxy?: boolean;
  sync: SyncService;
  /** Omitted in tests that do not exercise uploads; the upload routes are then not registered. */
  uploads?: UploadService;
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

type ActivityQuerystring = { action?: ActivityAction; username?: string; page: number; pageSize: number };

const activityQuerystringSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ACTIVITY_ACTIONS },
    username: { type: "string", maxLength: 80 },
    page: { type: "integer", minimum: 1, default: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 200, default: 50 },
  },
  additionalProperties: false,
} as const;

type BookParams = { id: number };
type UploadParams = { id: string };

const bookParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "integer", minimum: 1 } },
} as const;

const uploadParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

type UploadChanges = { title: string; authors: string[] };

const uploadChangesSchema = {
  type: "object",
  required: ["title", "authors"],
  properties: {
    title: { type: "string", maxLength: 500 },
    authors: { type: "array", maxItems: 10, items: { type: "string", maxLength: 200 } },
  },
  additionalProperties: false,
} as const;

const rejectUploadSchema = {
  type: "object",
  properties: { reason: { type: "string", maxLength: 500 } },
  additionalProperties: false,
} as const;

// Without the auth service (catalog tests) there is nobody to tell apart: every request acts as one admin.
const OPEN_ACCESS_ACTOR: UploadActor = { id: 0, username: "local", role: "admin" };

function uploadActor(request: FastifyRequest): UploadActor {
  return request.user ?? OPEN_ACCESS_ACTOR;
}

/** The title is copied into the log so the entry still means something once the upload or the book is gone. */
function uploadDetails(preview: UploadPreview) {
  return { title: preview.title, authors: preview.authors.join(", "), uploadedBy: preview.uploadedBy, targetPath: preview.targetPath };
}

// Generous for an EPUB (a few MB usually, tens of MB with many images).
const MAX_UPLOAD_BYTES = 300 * 1024 * 1024;

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
  const { catalog, auth, activity, health, sync, uploads, nextScheduledSyncAt, booksDirectory, coversDirectory, webDirectory = null, logger = false } = options;
  const app = Fastify({ logger, trustProxy: options.trustProxy ?? false });

  if (webDirectory) {
    void app.register(fastifyStatic, { root: webDirectory, wildcard: false });
  }
  void app.register(fastifyMultipart, { limits: { files: 1, fileSize: MAX_UPLOAD_BYTES } });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof UploadError) {
      return reply.code(error.status).send({ error: error.code, message: error.message });
    }
    if (error instanceof AuthError) {
      if (error.retryAfterSeconds !== null) {
        void reply.header("retry-after", error.retryAfterSeconds);
      }
      return reply.code(error.status).send({ error: error.code, message: error.message });
    }
    return reply.send(error);
  });

  if (auth) {
    registerAuth(app, auth, activity ?? null);
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

  app.post("/api/sync", async (request, reply) => {
    const run = sync.start("manual");
    if (!run) {
      return reply.code(409).send({ error: "sync_running", message: "A sync is already running" });
    }
    activity?.record("sync_started", actorOf(request));
    return reply.code(202).send(run);
  });

  if (uploads) {
    app.post("/api/uploads", async (request, reply) => {
      const part = await request.file();
      if (!part) {
        return reply.code(400).send({ error: "no_file", message: "Send the EPUB as a multipart field" });
      }
      return reply.code(201).send(await uploads.stage(part.filename, part.file, uploadActor(request)));
    });

    app.get("/api/uploads/mine", async (request) => uploads.listSubmissionsOf(uploadActor(request).id));

    app.patch<{ Params: UploadParams; Body: UploadChanges }>(
      "/api/uploads/:id",
      { schema: { params: uploadParamsSchema, body: uploadChangesSchema } },
      async (request) => uploads.update(request.params.id, request.body, uploadActor(request)),
    );

    app.post<{ Params: UploadParams }>("/api/uploads/:id/submit", { schema: { params: uploadParamsSchema } }, async (request) => {
      const preview = uploads.submit(request.params.id, uploadActor(request));
      activity?.record("upload_submitted", actorOf(request), { details: uploadDetails(preview) });
      return preview;
    });

    app.post<{ Params: UploadParams }>("/api/uploads/:id/confirm", { schema: { params: uploadParamsSchema } }, async (request) => {
      const { preview, ...result } = await uploads.confirm(request.params.id, uploadActor(request));
      // An admin's own upload goes straight in; a member's was waiting and is being approved.
      activity?.record(preview.status === "submitted" ? "upload_approved" : "upload", actorOf(request), {
        bookId: result.bookId,
        details: uploadDetails(preview),
      });
      return result;
    });

    app.delete<{ Params: UploadParams }>("/api/uploads/:id", { schema: { params: uploadParamsSchema } }, async (request, reply) => {
      const preview = await uploads.cancel(request.params.id, uploadActor(request));
      activity?.record("upload_cancelled", actorOf(request), { details: uploadDetails(preview) });
      return reply.code(204).send();
    });

    app.get("/api/admin/uploads", async () => uploads.listSubmitted());

    app.get("/api/admin/uploads/count", async () => ({ count: uploads.countSubmitted() }));

    app.post<{ Params: UploadParams; Body: { reason?: string } }>(
      "/api/admin/uploads/:id/reject",
      { schema: { params: uploadParamsSchema, body: rejectUploadSchema } },
      async (request, reply) => {
        const preview = await uploads.reject(request.params.id, request.body.reason ?? null, uploadActor(request));
        activity?.record("upload_rejected", actorOf(request), {
          details: { ...uploadDetails(preview), reason: request.body.reason?.trim() || null },
        });
        return reply.code(204).send();
      },
    );
  }

  if (health) {
    app.get("/api/admin/health", async () => ({ ...health.getHealth(), syncRuns: sync.listRecentRuns(20) }));
  }

  if (activity) {
    app.get<{ Querystring: ActivityQuerystring }>(
      "/api/admin/activity",
      { schema: { querystring: activityQuerystringSchema } },
      async (request) => ({
        ...activity.list({
          action: request.query.action ?? null,
          username: request.query.username?.trim() || null,
          page: request.query.page,
          pageSize: request.query.pageSize,
        }),
        usernames: activity.listUsernames(),
      }),
    );
  }

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
    activity?.record("download", actorOf(request), {
      bookId: request.params.id,
      details: { title: catalog.getBook(request.params.id)?.title ?? null, filePath: storedPath },
    });
    return reply
      .type("application/epub+zip")
      .header("content-disposition", attachmentDisposition(path.basename(filePath)))
      .send(createReadStream(filePath));
  });

  return app;
}
