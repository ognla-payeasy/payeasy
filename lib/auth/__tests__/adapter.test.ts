import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { FileDataStore } from "../db-adapter";
import { existsSync, rmSync } from "fs";

const TEST_DATA_DIR = "test-data-adapter";

describe("DataStore Adapter Test", () => {
  let dataStore: FileDataStore;

  beforeEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    dataStore = new FileDataStore(TEST_DATA_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  test("should create a user", async () => {
    const user = await dataStore.createUser(
      "test@example.com",
      "Test User",
      "hashedpassword"
    );

    assert.ok(user.id);
    assert.strictEqual(user.email, "test@example.com");
    assert.strictEqual(user.name, "Test User");
    assert.strictEqual(user.passwordHash, "hashedpassword");
    assert.ok(user.createdAt);
  });

  test("should normalize email to lowercase", async () => {
    const user = await dataStore.createUser(
      "TEST@EXAMPLE.COM",
      "Test",
      "hash"
    );

    assert.strictEqual(user.email, "test@example.com");

    // Should be findable with different case
    const found = await dataStore.findUserByEmail("Test@Example.Com");
    assert.ok(found);
    assert.strictEqual(found.id, user.id);
  });

  test("should trim email and name", async () => {
    const user = await dataStore.createUser(
      "  test@example.com  ",
      "  Test User  ",
      "hash"
    );

    assert.strictEqual(user.email, "test@example.com");
    assert.strictEqual(user.name, "Test User");
  });

  test("should find user by email", async () => {
    const created = await dataStore.createUser(
      "find@example.com",
      "Find Me",
      "hash"
    );

    const found = await dataStore.findUserByEmail("find@example.com");
    assert.ok(found);
    assert.strictEqual(found.id, created.id);
    assert.strictEqual(found.name, "Find Me");
  });

  test("should find user by id", async () => {
    const created = await dataStore.createUser(
      "byid@example.com",
      "By ID",
      "hash"
    );

    const found = await dataStore.findUserById(created.id);
    assert.ok(found);
    assert.strictEqual(found.email, "byid@example.com");
  });

  test("should return undefined for non-existent user", async () => {
    const found = await dataStore.findUserByEmail("nonexistent@example.com");
    assert.strictEqual(found, undefined);

    const foundById = await dataStore.findUserById("nonexistent-id");
    assert.strictEqual(foundById, undefined);
  });

  test("should return all users", async () => {
    await dataStore.createUser("user1@example.com", "User 1", "hash1");
    await dataStore.createUser("user2@example.com", "User 2", "hash2");
    await dataStore.createUser("user3@example.com", "User 3", "hash3");

    const allUsers = await dataStore.getAllUsers();
    assert.strictEqual(allUsers.length, 3);

    const emails = allUsers.map((u) => u.email).sort();
    assert.deepStrictEqual(emails, [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ]);
  });
});
