import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { type AuthService, createAuthService, SESSION_IDLE_MS } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { createSyncService } from "../src/sync/sync-service.js";

const ADMIN_PASSWORD = "correct horse battery";
const MEMBER_PASSWORD = "member password 123";

let database: LibraryDatabase;
let auth: AuthService;
let app: FastifyInstance;
let currentTime: Date;

beforeEach(async () => {
  currentTime = new Date("2026-11-21T10:00:00Z");
  database = openLibraryDatabase(":memory:");
  auth = await createAuthService({ database, now: () => currentTime });
  await auth.createUser("alice", ADMIN_PASSWORD, "admin");
  await auth.createUser("bob", MEMBER_PASSWORD, "member");
  app = buildApp({
    catalog: createCatalogQueries(database),
    auth,
    trustProxy: true,
    sync: createSyncService({
      database,
      store: createLibraryStore(database),
      booksDirectory: "/nonexistent/books",
      coversDirectory: "/nonexistent/covers",
      rcloneRemote: null,
      runCommand: async () => ({ exitCode: 0, stderrTail: "" }),
      logError: () => {},
    }),
    nextScheduledSyncAt: () => null,
    booksDirectory: "/nonexistent/books",
    coversDirectory: "/nonexistent/covers",
  });
});

afterEach(async () => {
  await app.close();
  database.close();
});

function advanceTime(milliseconds: number) {
  currentTime = new Date(currentTime.getTime() + milliseconds);
}

function login(username: string, password: string, headers: Record<string, string> = {}) {
  return app.inject({ method: "POST", url: "/api/auth/login", payload: { username, password }, headers });
}

/** Logs in and returns the `cookie` header to send with later requests. */
async function sessionOf(username: string, password: string): Promise<{ cookie: string }> {
  const response = await login(username, password);
  expect(response.statusCode).toBe(200);
  return { cookie: String(response.headers["set-cookie"]).split(";", 1)[0] ?? "" };
}

describe("session requirement", () => {
  it("refuses every API route without a session", async () => {
    for (const url of ["/api/books", "/api/facets", "/api/sync", "/api/books/1/file", "/api/auth/me", "/api/admin/users"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(401);
    }
  });

  it("opens the API once logged in", async () => {
    const headers = await sessionOf("bob", MEMBER_PASSWORD);

    expect((await app.inject({ method: "GET", url: "/api/books", headers })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers })).json()).toMatchObject({ username: "bob", role: "member" });
  });

  it("ignores a cookie that was never issued", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books", headers: { cookie: "kyle_session=forged" } });

    expect(response.statusCode).toBe(401);
  });

  it("ends the session at logout", async () => {
    const headers = await sessionOf("bob", MEMBER_PASSWORD);

    const logout = await app.inject({ method: "POST", url: "/api/auth/logout", headers });

    expect(logout.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/books", headers })).statusCode).toBe(401);
  });

  it("expires a session left idle for too long, but not one in regular use", async () => {
    const headers = await sessionOf("bob", MEMBER_PASSWORD);

    advanceTime(SESSION_IDLE_MS - 1000);
    expect((await app.inject({ method: "GET", url: "/api/books", headers })).statusCode).toBe(200);
    advanceTime(SESSION_IDLE_MS - 1000);
    expect((await app.inject({ method: "GET", url: "/api/books", headers })).statusCode).toBe(200);
    advanceTime(SESSION_IDLE_MS + 1000);
    expect((await app.inject({ method: "GET", url: "/api/books", headers })).statusCode).toBe(401);
  });
});

describe("POST /api/auth/login", () => {
  it("sets an HttpOnly, SameSite cookie and never returns the password hash", async () => {
    const response = await login("alice", ADMIN_PASSWORD);

    const cookie = String(response.headers["set-cookie"]);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Secure");
    expect(Object.keys(response.json())).toEqual(["id", "username", "role", "createdAt"]);
  });

  it("marks the cookie Secure when the proxy reports HTTPS", async () => {
    const response = await login("alice", ADMIN_PASSWORD, { "x-forwarded-proto": "https" });

    expect(String(response.headers["set-cookie"])).toContain("Secure");
  });

  it("accepts the username in any letter case", async () => {
    expect((await login("ALICE", ADMIN_PASSWORD)).statusCode).toBe(200);
  });

  it("answers the same way for an unknown user and a wrong password", async () => {
    const unknownUser = await login("mallory", "whatever password");
    const wrongPassword = await login("alice", "whatever password");

    expect(unknownUser.statusCode).toBe(401);
    expect(unknownUser.json()).toEqual(wrongPassword.json());
  });

  it("locks an account after five failures, even from other addresses, then unlocks it", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await login("alice", "wrong password!", { "x-forwarded-for": `10.0.0.${attempt}` })).statusCode).toBe(401);
    }

    const locked = await login("alice", ADMIN_PASSWORD, { "x-forwarded-for": "10.0.0.99" });
    expect(locked.statusCode).toBe(429);
    expect(Number(locked.headers["retry-after"])).toBeGreaterThan(0);

    advanceTime(15 * 60 * 1000 + 1000);
    expect((await login("alice", ADMIN_PASSWORD, { "x-forwarded-for": "10.0.0.99" })).statusCode).toBe(200);
  });

  it("locks an address that tries many accounts", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await login(`user${attempt}`, "wrong password!", { "x-forwarded-for": "10.0.0.7" });
    }

    expect((await login("alice", ADMIN_PASSWORD, { "x-forwarded-for": "10.0.0.7" })).statusCode).toBe(429);
    expect((await login("alice", ADMIN_PASSWORD, { "x-forwarded-for": "10.0.0.8" })).statusCode).toBe(200);
  });
});

describe("cross-site requests", () => {
  it("refuses a write whose Origin is another site", async () => {
    const response = await login("alice", ADMIN_PASSWORD, { origin: "https://evil.example", host: "lib.example" });

    expect(response.statusCode).toBe(403);
  });

  it("accepts a write from the app's own origin", async () => {
    const response = await login("alice", ADMIN_PASSWORD, { origin: "https://lib.example", host: "lib.example" });

    expect(response.statusCode).toBe(200);
  });
});

describe("POST /api/auth/password", () => {
  it("changes the password and signs out the other sessions", async () => {
    const otherDevice = await sessionOf("bob", MEMBER_PASSWORD);
    const headers = await sessionOf("bob", MEMBER_PASSWORD);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/password",
      headers,
      payload: { currentPassword: MEMBER_PASSWORD, newPassword: "a brand new password" },
    });

    expect(response.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: otherDevice })).statusCode).toBe(401);
    const renewed = { cookie: String(response.headers["set-cookie"]).split(";", 1)[0] ?? "" };
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: renewed })).statusCode).toBe(200);
    expect((await login("bob", MEMBER_PASSWORD)).statusCode).toBe(401);
    expect((await login("bob", "a brand new password")).statusCode).toBe(200);
  });

  it("refuses a wrong current password and a short new one", async () => {
    const headers = await sessionOf("bob", MEMBER_PASSWORD);
    const change = (currentPassword: string, newPassword: string) =>
      app.inject({ method: "POST", url: "/api/auth/password", headers, payload: { currentPassword, newPassword } });

    expect((await change("not my password", "a brand new password")).statusCode).toBe(403);
    expect((await change(MEMBER_PASSWORD, "short")).statusCode).toBe(400);
  });
});

describe("user administration", () => {
  it("is closed to members", async () => {
    const headers = await sessionOf("bob", MEMBER_PASSWORD);

    expect((await app.inject({ method: "GET", url: "/api/admin/users", headers })).statusCode).toBe(403);
    const creation = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers,
      payload: { username: "carol", password: "carol password 123", role: "admin" },
    });
    expect(creation.statusCode).toBe(403);
  });

  it("lets an admin create a member who can then log in", async () => {
    const headers = await sessionOf("alice", ADMIN_PASSWORD);

    const creation = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers,
      payload: { username: "carol", password: "carol password 123", role: "member" },
    });

    expect(creation.statusCode).toBe(201);
    expect((await login("carol", "carol password 123")).statusCode).toBe(200);
    const users = (await app.inject({ method: "GET", url: "/api/admin/users", headers })).json<{ username: string }[]>();
    expect(users.map((user) => user.username)).toEqual(["alice", "bob", "carol"]);
  });

  it("refuses a taken username, whatever its case, and a short password", async () => {
    const headers = await sessionOf("alice", ADMIN_PASSWORD);
    const create = (username: string, password: string) =>
      app.inject({ method: "POST", url: "/api/admin/users", headers, payload: { username, password, role: "member" } });

    expect((await create("Bob", "another password 1")).statusCode).toBe(409);
    expect((await create("carol", "short")).statusCode).toBe(400);
    expect((await create("no spaces allowed", "another password 1")).statusCode).toBe(400);
  });

  it("resets a password and ends that user's sessions", async () => {
    const admin = await sessionOf("alice", ADMIN_PASSWORD);
    const bob = await sessionOf("bob", MEMBER_PASSWORD);
    const bobId = auth.listUsers().find((user) => user.username === "bob")?.id;

    const reset = await app.inject({
      method: "POST",
      url: `/api/admin/users/${bobId}/password`,
      headers: admin,
      payload: { password: "reset by the admin" },
    });

    expect(reset.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: bob })).statusCode).toBe(401);
    expect((await login("bob", "reset by the admin")).statusCode).toBe(200);
  });

  it("deletes a user along with their sessions", async () => {
    const admin = await sessionOf("alice", ADMIN_PASSWORD);
    const bob = await sessionOf("bob", MEMBER_PASSWORD);
    const bobId = auth.listUsers().find((user) => user.username === "bob")?.id;

    const deletion = await app.inject({ method: "DELETE", url: `/api/admin/users/${bobId}`, headers: admin });

    expect(deletion.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: bob })).statusCode).toBe(401);
  });

  it("does not let an admin delete their own account", async () => {
    const admin = await sessionOf("alice", ADMIN_PASSWORD);
    const aliceId = auth.listUsers().find((user) => user.username === "alice")?.id;

    const deletion = await app.inject({ method: "DELETE", url: `/api/admin/users/${aliceId}`, headers: admin });

    expect(deletion.statusCode).toBe(409);
    expect(auth.listUsers()).toHaveLength(2);
  });
});
