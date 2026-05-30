import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { FileDataStore } from "../db-adapter";
import { existsSync, rmSync } from "fs";

const TEST_DATA_DIR = "test-data-persistence";

describe("Data Persistence Test", () => {
  afterEach(() => {
    // Clean up test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  test("should persist data across store instances", async () => {
    // Create user with first store instance
    let store1 = new FileDataStore(TEST_DATA_DIR);
    const createdUser = await store1.createUser(
      "persist@example.com",
      "Persist User",
      "hash123"
    );

    assert.ok(createdUser.id);
    assert.strictEqual(createdUser.email, "persist@example.com");

    // Create new store instance and verify user still exists
    const store2 = new FileDataStore(TEST_DATA_DIR);
    const foundUser = await store2.findUserByEmail("persist@example.com");

    assert.ok(foundUser, "User should be found in new store instance");
    assert.strictEqual(foundUser.id, createdUser.id);
    assert.strictEqual(foundUser.name, "Persist User");
    assert.strictEqual(foundUser.passwordHash, "hash123");
  });

  test("should recover from partial writes", async () => {
    const store = new FileDataStore(TEST_DATA_DIR);

    // Create initial users
    await store.createUser("user1@example.com", "User 1", "hash1");
    await store.createUser("user2@example.com", "User 2", "hash2");

    // Verify file is valid JSON
    const newStore = new FileDataStore(TEST_DATA_DIR);
    const allUsers = await newStore.getAllUsers();

    assert.strictEqual(
      allUsers.length,
      2,
      "Both users should be recoverable"
    );
    assert.deepStrictEqual(
      allUsers.map((u) => u.email),
      ["user1@example.com", "user2@example.com"]
    );
  });

  test("should initialize empty storage on first access", async () => {
    const store = new FileDataStore(TEST_DATA_DIR);

    // First call should create empty file
    const users = await store.getAllUsers();
    assert.strictEqual(users.length, 0, "Should start with empty storage");
    assert.ok(
      existsSync(`${TEST_DATA_DIR}/users.json`),
      "users.json should be created"
    );
  });
});
