import { StoredUser } from "./users";

/**
 * DataStore interface provides an abstraction layer for user persistence.
 * Implementations can use file-based storage, databases, or other backends.
 */
export interface DataStore {
  findUserByEmail(email: string): Promise<StoredUser | undefined>;
  findUserById(id: string): Promise<StoredUser | undefined>;
  createUser(
    email: string,
    name: string,
    passwordHash: string
  ): Promise<StoredUser>;
  getAllUsers(): Promise<StoredUser[]>;
}

/**
 * File-based DataStore implementation for local development.
 * Uses atomic file operations to minimize concurrent access issues.
 */
export class FileDataStore implements DataStore {
  private usersFilePath: string;
  private lockFile: string;
  private lockTimeout = 5000; // 5 second lock timeout

  constructor(dataDir: string = "data") {
    const path = require("path");
    this.usersFilePath = path.join(process.cwd(), dataDir, "users.json");
    this.lockFile = this.usersFilePath + ".lock";
  }

  private async acquireLock(): Promise<void> {
    const fs = require("fs").promises;
    const startTime = Date.now();

    while (true) {
      try {
        // Try to create lock file exclusively
        await fs.open(this.lockFile, "wx");
        return;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;

        // Check lock timeout
        if (Date.now() - startTime > this.lockTimeout) {
          throw new Error(
            `Lock acquisition timeout: ${this.lockFile} is stuck`
          );
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  private async releaseLock(): Promise<void> {
    const fs = require("fs").promises;
    try {
      await fs.unlink(this.lockFile);
    } catch (err) {
      // Lock file already removed or doesn't exist
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  private async readUsersFile(): Promise<StoredUser[]> {
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(this.usersFilePath)) {
      const dataDir = path.dirname(this.usersFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.usersFilePath, JSON.stringify([]));
      return [];
    }

    const data = fs.readFileSync(this.usersFilePath, "utf-8");
    return JSON.parse(data) as StoredUser[];
  }

  private async writeUsersFile(users: StoredUser[]): Promise<void> {
    const fs = require("fs").promises;
    const path = require("path");
    const tmpFile = this.usersFilePath + ".tmp";

    // Write to temp file first for atomic operation
    await fs.writeFile(tmpFile, JSON.stringify(users, null, 2));

    // Atomic rename
    await fs.rename(tmpFile, this.usersFilePath);
  }

  async findUserByEmail(email: string): Promise<StoredUser | undefined> {
    const users = await this.readUsersFile();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string): Promise<StoredUser | undefined> {
    const users = await this.readUsersFile();
    return users.find((u) => u.id === id);
  }

  async createUser(
    email: string,
    name: string,
    passwordHash: string
  ): Promise<StoredUser> {
    await this.acquireLock();
    try {
      const users = await this.readUsersFile();
      const { randomUUID } = require("crypto");

      const user: StoredUser = {
        id: randomUUID(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      await this.writeUsersFile(users);
      return user;
    } finally {
      await this.releaseLock();
    }
  }

  async getAllUsers(): Promise<StoredUser[]> {
    return this.readUsersFile();
  }
}

/**
 * Raw user record as returned by the Prisma client.
 */
interface PrismaUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

/**
 * Minimal structural type describing the subset of the Prisma client this
 * adapter relies on. Avoids a hard dependency on the generated client types
 * (which are only available when Prisma is installed).
 */
interface PrismaClientLike {
  user: {
    findUnique(args: {
      where: { email?: string; id?: string };
    }): Promise<PrismaUserRecord | null>;
    create(args: {
      data: { email: string; name: string; passwordHash: string };
    }): Promise<PrismaUserRecord>;
    findMany(): Promise<PrismaUserRecord[]>;
  };
}

/**
 * Database-backed DataStore implementation using Prisma.
 * Suitable for production deployments.
 */
export class DatabaseDataStore implements DataStore {
  private prisma: PrismaClientLike;

  constructor(prismaClient: PrismaClientLike) {
    this.prisma = prismaClient;
  }

  async findUserByEmail(email: string): Promise<StoredUser | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user
      ? this.mapPrismaUserToStoredUser(user)
      : undefined;
  }

  async findUserById(id: string): Promise<StoredUser | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user
      ? this.mapPrismaUserToStoredUser(user)
      : undefined;
  }

  async createUser(
    email: string,
    name: string,
    passwordHash: string
  ): Promise<StoredUser> {
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
      },
    });
    return this.mapPrismaUserToStoredUser(user);
  }

  async getAllUsers(): Promise<StoredUser[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.mapPrismaUserToStoredUser(user));
  }

  private mapPrismaUserToStoredUser(user: PrismaUserRecord): StoredUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

/**
 * Factory function to create the appropriate DataStore based on environment.
 */
export async function createDataStore(): Promise<DataStore> {
  const dataStoreType = process.env.DATA_STORE || "file";

  if (dataStoreType === "database") {
    // Lazy import to avoid requiring Prisma in file-only mode
    // @ts-ignore
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    return new DatabaseDataStore(prisma);
  }

  return new FileDataStore();
}
