import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";

type UserRecord = {
  id: string;
  email: string;
  userId: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: string;
  passwordResetRequestedAt?: string;
  passwordUpdatedAt?: string;
};

const SALT_ROUNDS = 10;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function is404Error(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404);
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeTokenMatch(actualHash: string, expectedHash: string): boolean {
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type CreateUserResult =
  | { ok: true; user: { id: string; name: string; email: string } }
  | { ok: false; reason: "email-taken" | "cosmos-not-configured" | "cosmos-error"; message?: string };

export async function createUserWithPassword(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  if (!isCosmosConfigured()) {
    return { ok: false, reason: "cosmos-not-configured" };
  }
  const email = normalizeEmail(input.email);
  const container = getContainer(CONTAINERS.users);

  try {
    const { resource } = await container.item(email, email).read<UserRecord>();
    if (resource) return { ok: false, reason: "email-taken" };
  } catch (err: unknown) {
    if (!is404Error(err)) {
      return {
        ok: false,
        reason: "cosmos-error",
        message: err instanceof Error ? err.message : "Cosmos read gagal.",
      };
    }
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const userId = randomUUID();
  const record: UserRecord = {
    id: email,
    email,
    userId,
    name: input.name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  try {
    await container.items.create(record);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 409) {
      return { ok: false, reason: "email-taken" };
    }
    return {
      ok: false,
      reason: "cosmos-error",
      message: err instanceof Error ? err.message : "Cosmos write gagal.",
    };
  }
  return {
    ok: true,
    user: {
      id: record.userId,
      name: record.name,
      email: record.email,
    },
  };
}

type VerifiedUser = {
  id: string;
  name: string;
  email: string;
};

export type VerifyResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; reason: "invalid" | "cosmos-not-configured" | "cosmos-error"; message?: string };

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<VerifyResult> {
  if (!isCosmosConfigured()) {
    return { ok: false, reason: "cosmos-not-configured" };
  }
  const lowered = normalizeEmail(email);
  const container = getContainer(CONTAINERS.users);
  try {
    const { resource } = await container
      .item(lowered, lowered)
      .read<UserRecord>();
    if (!resource) return { ok: false, reason: "invalid" };
    const ok = await bcrypt.compare(password, resource.passwordHash);
    if (!ok) return { ok: false, reason: "invalid" };
    if (!resource.userId) {
      return {
        ok: false,
        reason: "cosmos-error",
        message:
          "Akun ini belum dimigrasi ke userId baru. Hubungi admin untuk menjalankan migrasi.",
      };
    }
    return {
      ok: true,
      user: {
        id: resource.userId,
        name: resource.name,
        email: resource.email,
      },
    };
  } catch (err: unknown) {
    if (is404Error(err)) return { ok: false, reason: "invalid" };
    return {
      ok: false,
      reason: "cosmos-error",
      message: err instanceof Error ? err.message : "Cosmos read gagal.",
    };
  }
}

export type CreatePasswordResetTokenResult =
  | {
      ok: true;
      user: { name: string; email: string };
      token: string;
      expiresAt: Date;
    }
  | {
      ok: false;
      reason: "not-found" | "cosmos-not-configured" | "cosmos-error";
      message?: string;
    };

export async function createPasswordResetToken(
  email: string,
  expiresInMinutes: number,
): Promise<CreatePasswordResetTokenResult> {
  if (!isCosmosConfigured()) {
    return { ok: false, reason: "cosmos-not-configured" };
  }

  const lowered = normalizeEmail(email);
  const container = getContainer(CONTAINERS.users);

  try {
    const { resource } = await container
      .item(lowered, lowered)
      .read<UserRecord>();
    if (!resource) return { ok: false, reason: "not-found" };

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const nextRecord: UserRecord = {
      ...resource,
      passwordResetTokenHash: hashResetToken(token),
      passwordResetTokenExpiresAt: expiresAt.toISOString(),
      passwordResetRequestedAt: new Date().toISOString(),
    };

    await container.item(nextRecord.id, nextRecord.id).replace(nextRecord);

    return {
      ok: true,
      user: { name: nextRecord.name, email: nextRecord.email },
      token,
      expiresAt,
    };
  } catch (err: unknown) {
    if (is404Error(err)) return { ok: false, reason: "not-found" };
    return {
      ok: false,
      reason: "cosmos-error",
      message: err instanceof Error ? err.message : "Cosmos update gagal.",
    };
  }
}

export type ResetUserPasswordResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "invalid-token"
        | "expired-token"
        | "cosmos-not-configured"
        | "cosmos-error";
      message?: string;
    };

export async function resetUserPasswordWithToken(input: {
  email: string;
  token: string;
  password: string;
}): Promise<ResetUserPasswordResult> {
  if (!isCosmosConfigured()) {
    return { ok: false, reason: "cosmos-not-configured" };
  }

  const lowered = normalizeEmail(input.email);
  const token = input.token.trim();
  if (!lowered || !token) return { ok: false, reason: "invalid-token" };

  const container = getContainer(CONTAINERS.users);

  try {
    const { resource } = await container
      .item(lowered, lowered)
      .read<UserRecord>();
    if (!resource?.passwordResetTokenHash || !resource.passwordResetTokenExpiresAt) {
      return { ok: false, reason: "invalid-token" };
    }

    const expectedHash = hashResetToken(token);
    if (!safeTokenMatch(resource.passwordResetTokenHash, expectedHash)) {
      return { ok: false, reason: "invalid-token" };
    }

    const expiresAtMs = Date.parse(resource.passwordResetTokenExpiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
      return { ok: false, reason: "expired-token" };
    }

    const nextRecord: UserRecord = {
      ...resource,
      passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
      passwordUpdatedAt: new Date().toISOString(),
    };
    delete nextRecord.passwordResetTokenHash;
    delete nextRecord.passwordResetTokenExpiresAt;
    delete nextRecord.passwordResetRequestedAt;

    await container.item(nextRecord.id, nextRecord.id).replace(nextRecord);

    return { ok: true };
  } catch (err: unknown) {
    if (is404Error(err)) return { ok: false, reason: "invalid-token" };
    return {
      ok: false,
      reason: "cosmos-error",
      message: err instanceof Error ? err.message : "Cosmos update gagal.",
    };
  }
}


export async function deleteUserById(userId: string): Promise<void> {
  if (!isCosmosConfigured()) return;
  const container = getContainer(CONTAINERS.users);
  const { resources } = await container.items
    .query<UserRecord>({
      query: "SELECT * FROM c WHERE c.userId = @uid",
      parameters: [{ name: "@uid", value: userId }],
    })
    .fetchAll();
  const record = resources[0];
  if (!record) return;
  try {
    await container.item(record.id, record.id).delete();
  } catch (err: unknown) {
    if (is404Error(err)) return;
    throw err;
  }
}
