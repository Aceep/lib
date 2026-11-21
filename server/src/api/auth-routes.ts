import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ActivityLog, Actor } from "../activity/activity-log.js";
import { AuthError, type AuthService, SESSION_IDLE_MS, type User, type UserRole } from "../auth/auth-service.js";
import { MAX_PASSWORD_LENGTH } from "../auth/password.js";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by the auth hook on every /api route except login; null only where no session is required. */
    user: User | null;
  }
}

const SESSION_COOKIE = "kyle_session";
const PUBLIC_API_ROUTES = new Set(["/api/auth/login", "/api/auth/logout"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const passwordSchema = { type: "string", minLength: 1, maxLength: MAX_PASSWORD_LENGTH } as const;
const usernameSchema = { type: "string", minLength: 1, maxLength: 80 } as const;

const loginSchema = {
  type: "object",
  required: ["username", "password"],
  properties: { username: usernameSchema, password: passwordSchema },
  additionalProperties: false,
} as const;

const changePasswordSchema = {
  type: "object",
  required: ["currentPassword", "newPassword"],
  properties: { currentPassword: passwordSchema, newPassword: passwordSchema },
  additionalProperties: false,
} as const;

const createUserSchema = {
  type: "object",
  required: ["username", "password", "role"],
  properties: { username: usernameSchema, password: passwordSchema, role: { type: "string", enum: ["admin", "member"] } },
  additionalProperties: false,
} as const;

const resetPasswordSchema = {
  type: "object",
  required: ["password"],
  properties: { password: passwordSchema },
  additionalProperties: false,
} as const;

const userParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "integer", minimum: 1 } },
} as const;

type UserParams = { id: number };

function readSessionToken(request: FastifyRequest): string | null {
  for (const part of request.headers.cookie?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator !== -1 && part.slice(0, separator).trim() === SESSION_COOKIE) {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

function sessionCookie(request: FastifyRequest, token: string, maxAgeSeconds: number): string {
  const attributes = [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  // Over plain HTTP (local dev) a Secure cookie would never come back; behind the HTTPS proxy it always is.
  if (request.protocol === "https") {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

function setSession(request: FastifyRequest, reply: FastifyReply, token: string): void {
  void reply.header("set-cookie", sessionCookie(request, token, Math.floor(SESSION_IDLE_MS / 1000)));
}

/** A browser sends Origin on every cross-site write; one that does not match the host we were reached on is forged. */
function isCrossSiteWrite(request: FastifyRequest): boolean {
  const origin = request.headers.origin;
  if (SAFE_METHODS.has(request.method) || !origin) {
    return false;
  }
  try {
    return new URL(origin).host !== request.host;
  } catch {
    return true;
  }
}

/** Who the activity log should credit a request to. */
export function actorOf(request: FastifyRequest): Actor {
  return { user: request.user, ip: request.ip, userAgent: request.headers["user-agent"] ?? null };
}

/** Puts every /api route behind a session, /api/admin behind the admin role, and registers the account routes. */
export function registerAuth(app: FastifyInstance, auth: AuthService, activity: ActivityLog | null): void {
  app.decorateRequest("user", null);

  app.addHook("onRequest", async (request, reply) => {
    const pathname = request.url.split("?", 1)[0] ?? "";
    if (!pathname.startsWith("/api/")) {
      return;
    }
    if (isCrossSiteWrite(request)) {
      return reply.code(403).send({ error: "cross_site", message: "Cross-site request refused" });
    }
    const token = readSessionToken(request);
    request.user = token ? auth.authenticate(token) : null;
    if (PUBLIC_API_ROUTES.has(pathname)) {
      return;
    }
    if (!request.user) {
      return reply.code(401).send({ error: "unauthenticated", message: "Connexion requise" });
    }
    if (pathname.startsWith("/api/admin/") && request.user.role !== "admin") {
      return reply.code(403).send({ error: "forbidden", message: "Réservé aux administrateurs" });
    }
  });

  app.post<{ Body: { username: string; password: string } }>("/api/auth/login", { schema: { body: loginSchema } }, async (request, reply) => {
    const attempt = await auth.login(request.body.username, request.body.password, request.ip).catch((error: unknown) => {
      if (error instanceof AuthError) {
        // The attempted name goes in the details, not in the username column: it is not an account that acted.
        activity?.record("login_failed", actorOf(request), { details: { attemptedUsername: request.body.username, reason: error.code } });
      }
      throw error;
    });
    setSession(request, reply, attempt.token);
    activity?.record("login", { ...actorOf(request), user: attempt.user });
    return attempt.user;
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const token = readSessionToken(request);
    if (token) {
      auth.logout(token);
    }
    if (request.user) {
      activity?.record("logout", actorOf(request));
    }
    return reply.header("set-cookie", sessionCookie(request, "", 0)).code(204).send();
  });

  app.get("/api/auth/me", async (request) => request.user);

  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    "/api/auth/password",
    { schema: { body: changePasswordSchema } },
    async (request, reply) => {
      const user = request.user as User;
      setSession(request, reply, await auth.changePassword(user.id, request.body.currentPassword, request.body.newPassword));
      activity?.record("password_changed", actorOf(request));
      return reply.code(204).send();
    },
  );

  app.get("/api/admin/users", async () => auth.listUsers());

  app.post<{ Body: { username: string; password: string; role: UserRole } }>(
    "/api/admin/users",
    { schema: { body: createUserSchema } },
    async (request, reply) => {
      const created = await auth.createUser(request.body.username, request.body.password, request.body.role);
      activity?.record("user_created", actorOf(request), { details: { targetUsername: created.username, role: created.role } });
      return reply.code(201).send(created);
    },
  );

  app.post<{ Params: UserParams; Body: { password: string } }>(
    "/api/admin/users/:id/password",
    { schema: { params: userParamsSchema, body: resetPasswordSchema } },
    async (request, reply) => {
      const target = auth.findUser(request.params.id);
      await auth.resetPassword(request.params.id, request.body.password);
      activity?.record("password_reset", actorOf(request), { details: { targetUsername: target?.username ?? null } });
      return reply.code(204).send();
    },
  );

  app.delete<{ Params: UserParams }>("/api/admin/users/:id", { schema: { params: userParamsSchema } }, async (request, reply) => {
    if (request.params.id === request.user?.id) {
      return reply.code(409).send({ error: "self_delete", message: "Vous ne pouvez pas supprimer votre propre compte" });
    }
    const target = auth.findUser(request.params.id);
    auth.deleteUser(request.params.id);
    activity?.record("user_deleted", actorOf(request), { details: { targetUsername: target?.username ?? null } });
    return reply.code(204).send();
  });
}
