import { createHash, randomBytes } from "node:crypto";
import type { LibraryDatabase } from "../db/database.js";
import { hashPassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, verifyPassword } from "./password.js";

export type UserRole = "admin" | "member";

export type User = {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
};

export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Seconds before a throttled login may be retried. */
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthServiceOptions = {
  database: LibraryDatabase;
  now?: () => Date;
};

type UserRow = { id: number; username: string; role: UserRole; created_at: string };
type CredentialsRow = UserRow & { password_hash: string };
type SessionRow = UserRow & { last_seen_at: string };

/** A session dies after this long without a request. */
export const SESSION_IDLE_MS = 30 * 24 * 60 * 60 * 1000;
// Writing last_seen_at on every request would turn each page view into a database write.
const SESSION_TOUCH_INTERVAL_MS = 60 * 60 * 1000;

const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{2,40}$/u;

type FailedLogins = { count: number; lockedUntil: number; lastFailureAt: number };

const toUser = (row: UserRow): User => ({ id: row.id, username: row.username, role: row.role, createdAt: row.created_at });

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function assertPasswordAcceptable(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new AuthError(400, "weak_password", `Le mot de passe doit faire entre ${MIN_PASSWORD_LENGTH} et ${MAX_PASSWORD_LENGTH} caractères`);
  }
}

export type AuthService = Awaited<ReturnType<typeof createAuthService>>;

export async function createAuthService({ database, now = () => new Date() }: AuthServiceOptions) {
  const statements = {
    countUsers: database.prepare<[], { count: number }>("SELECT count(*) AS count FROM users"),
    countAdmins: database.prepare<[], { count: number }>("SELECT count(*) AS count FROM users WHERE role = 'admin'"),
    listUsers: database.prepare<[], UserRow>("SELECT id, username, role, created_at FROM users ORDER BY username COLLATE NOCASE"),
    findUser: database.prepare<[number], CredentialsRow>("SELECT id, username, role, created_at, password_hash FROM users WHERE id = ?"),
    findUserByName: database.prepare<[string], CredentialsRow>(
      "SELECT id, username, role, created_at, password_hash FROM users WHERE username = ?",
    ),
    insertUser: database.prepare<[string, string, UserRole, string]>(
      "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
    ),
    setPassword: database.prepare<[string, number]>("UPDATE users SET password_hash = ? WHERE id = ?"),
    deleteUser: database.prepare<[number]>("DELETE FROM users WHERE id = ?"),
    insertSession: database.prepare<[string, number, string, string]>(
      "INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at) VALUES (?, ?, ?, ?)",
    ),
    findSession: database.prepare<[string], SessionRow>(
      `SELECT users.id, users.username, users.role, users.created_at, sessions.last_seen_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    ),
    touchSession: database.prepare<[string, string]>("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?"),
    deleteSession: database.prepare<[string]>("DELETE FROM sessions WHERE token_hash = ?"),
    deleteUserSessions: database.prepare<[number]>("DELETE FROM sessions WHERE user_id = ?"),
    deleteIdleSessions: database.prepare<[string]>("DELETE FROM sessions WHERE last_seen_at < ?"),
  };

  // Checked against when the username is unknown, so that answer takes as long as a wrong password.
  const decoyHash = await hashPassword(randomBytes(16).toString("hex"));
  // In memory on purpose: a restart forgiving failed attempts is harmless, and nothing needs cleaning up on disk.
  const failedLogins = new Map<string, FailedLogins>();

  statements.deleteIdleSessions.run(new Date(now().getTime() - SESSION_IDLE_MS).toISOString());

  function lockRemainingMs(key: string): number {
    const entry = failedLogins.get(key);
    return entry ? Math.max(0, entry.lockedUntil - now().getTime()) : 0;
  }

  function recordFailure(key: string): void {
    const time = now().getTime();
    const previous = failedLogins.get(key);
    // Failures older than the lock window no longer count towards the next lock.
    const count = previous && time - previous.lastFailureAt < LOGIN_LOCK_MS ? previous.count + 1 : 1;
    failedLogins.set(key, { count, lastFailureAt: time, lockedUntil: count >= MAX_FAILED_LOGINS ? time + LOGIN_LOCK_MS : 0 });
    if (failedLogins.size > 10_000) {
      for (const [otherKey, entry] of failedLogins) {
        if (time - entry.lastFailureAt >= LOGIN_LOCK_MS) {
          failedLogins.delete(otherKey);
        }
      }
    }
  }

  function openSession(userId: number): string {
    const token = randomBytes(32).toString("base64url");
    const timestamp = now().toISOString();
    statements.insertSession.run(hashToken(token), userId, timestamp, timestamp);
    return token;
  }

  async function createUser(username: string, password: string, role: UserRole): Promise<User> {
    const name = username.trim();
    if (!USERNAME_PATTERN.test(name)) {
      throw new AuthError(400, "invalid_username", "L'identifiant doit faire 2 à 40 caractères : lettres, chiffres, point, tiret ou underscore");
    }
    assertPasswordAcceptable(password);
    if (statements.findUserByName.get(name)) {
      throw new AuthError(409, "username_taken", "Cet identifiant est déjà pris");
    }
    const result = statements.insertUser.run(name, await hashPassword(password), role, now().toISOString());
    return toUser(statements.findUser.get(Number(result.lastInsertRowid)) as CredentialsRow);
  }

  return {
    hasUsers: () => (statements.countUsers.get()?.count ?? 0) > 0,

    listUsers: (): User[] => statements.listUsers.all().map(toUser),

    findUser(userId: number): User | null {
      const row = statements.findUser.get(userId);
      return row ? toUser(row) : null;
    },

    createUser,

    /**
     * Returns the session token to put in the cookie. `clientAddress` and the username are throttled separately:
     * one address cannot try many accounts, and many addresses cannot hammer one account.
     */
    async login(username: string, password: string, clientAddress: string): Promise<{ user: User; token: string }> {
      const keys = [`ip:${clientAddress}`, `user:${username.trim().toLowerCase()}`];
      const remainingMs = Math.max(...keys.map(lockRemainingMs));
      if (remainingMs > 0) {
        throw new AuthError(429, "too_many_attempts", "Trop de tentatives, réessayez plus tard", Math.ceil(remainingMs / 1000));
      }
      const row = statements.findUserByName.get(username.trim());
      const passwordMatches = await verifyPassword(password, row?.password_hash ?? decoyHash);
      if (!row || !passwordMatches) {
        keys.forEach(recordFailure);
        throw new AuthError(401, "invalid_credentials", "Identifiant ou mot de passe incorrect");
      }
      keys.forEach((key) => failedLogins.delete(key));
      return { user: toUser(row), token: openSession(row.id) };
    },

    /** The user behind a cookie value, null when the session is unknown or has been idle for too long. */
    authenticate(token: string): User | null {
      const tokenHash = hashToken(token);
      const row = statements.findSession.get(tokenHash);
      if (!row) {
        return null;
      }
      const idleMs = now().getTime() - Date.parse(row.last_seen_at);
      if (idleMs > SESSION_IDLE_MS) {
        statements.deleteSession.run(tokenHash);
        return null;
      }
      if (idleMs > SESSION_TOUCH_INTERVAL_MS) {
        statements.touchSession.run(now().toISOString(), tokenHash);
      }
      return toUser(row);
    },

    logout(token: string): void {
      statements.deleteSession.run(hashToken(token));
    },

    /** Signs the user out everywhere and returns a fresh token for the browser that made the change. */
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<string> {
      const row = statements.findUser.get(userId);
      if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
        throw new AuthError(403, "wrong_password", "Le mot de passe actuel est incorrect");
      }
      assertPasswordAcceptable(newPassword);
      statements.setPassword.run(await hashPassword(newPassword), userId);
      statements.deleteUserSessions.run(userId);
      return openSession(userId);
    },

    /** Admin reset: no current password asked, every session of that user ends. */
    async resetPassword(userId: number, newPassword: string): Promise<void> {
      if (!statements.findUser.get(userId)) {
        throw new AuthError(404, "not_found", "Utilisateur introuvable");
      }
      assertPasswordAcceptable(newPassword);
      statements.setPassword.run(await hashPassword(newPassword), userId);
      statements.deleteUserSessions.run(userId);
    },

    deleteUser(userId: number): void {
      const row = statements.findUser.get(userId);
      if (!row) {
        throw new AuthError(404, "not_found", "Utilisateur introuvable");
      }
      if (row.role === "admin" && (statements.countAdmins.get()?.count ?? 0) <= 1) {
        throw new AuthError(409, "last_admin", "Impossible de supprimer le dernier administrateur");
      }
      statements.deleteUser.run(userId);
    },
  };
}
