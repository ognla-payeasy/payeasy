import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { FileDataStore } from "../db-adapter";
import { randomUUID } from "crypto";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const TEST_DATA_DIR = "test-data-concurrent";

describe("Concurrent Writes Test", () => {
  let dataStore: FileDataStore;

  beforeEach(() => {
    // Clean up test data directory
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    dataStore = new FileDataStore(TEST_DATA_DIR);
  });

  afterEach(() => {
    // Clean up test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  test("should handle multiple concurrent signups without data corruption", async () => {
    const emailPrefix = `user-${randomUUID().slice(0, 8)}`;
    const concurrentCount = 5;

    // Simulate 5 concurrent signup operations
    const createPromises = Array.from({ length: concurrentCount }, (_, i) =>
      dataStore.createUser(
        `${emailPrefix}-${i}@example.com`,
        `User ${i}`,
        `hash-${i}`
      )
    );

    const results = await Promise.all(createPromises);

    // Verify all users were created
    assert.strictEqual(
      results.length,
      concurrentCount,
      "All users should be created"
    );

    // Verify all IDs are unique
    const ids = results.map((u) => u.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(
      uniqueIds.size,
      concurrentCount,
      "All user IDs should be unique"
    );

    // Verify all can be retrieved
    for (let i = 0; i < concurrentCount; i++) {
      const user = await dataStore.findUserByEmail(
        `${emailPrefix}-${i}@example.com`
      );
      assert.ok(user, `User ${i} should be found`);
      assert.strictEqual(user.name, `User ${i}`);
      assert.strictEqual(user.passwordHash, `hash-${i}`);
    }
  });

  test("should not lose data on concurrent writes", async () => {
    // Create initial users
    await dataStore.createUser("initial1@example.com", "Initial 1", "hash1");
    await dataStore.createUser("initial2@example.com", "Initial 2", "hash2");

    // Perform concurrent writes
    const moreWrites = Array.from({ length: 3 }, (_, i) =>
      dataStore.createUser(
        `concurrent-${i}@example.com`,
        `Concurrent ${i}`,
        `hash-${i}`
      )
    );

    await Promise.all(moreWrites);

    // Verify all 5 users exist
    const allUsers = await dataStore.getAllUsers();
    assert.strictEqual(
      allUsers.length,
      5,
      "Should have all 5 users after concurrent writes"
    );

    // Verify initial users still exist
    const initialUser1 = await dataStore.findUserByEmail(
      "initial1@example.com"
    );
    const initialUser2 = await dataStore.findUserByEmail(
      "initial2@example.com"
    );

    assert.ok(initialUser1, "Initial user 1 should still exist");
    assert.ok(initialUser2, "Initial user 2 should still exist");
  });

  test("should handle rapid successive writes", async () => {
    const writeCount = 10;
    const results = [];

    for (let i = 0; i < writeCount; i++) {
      const user = await dataStore.createUser(
        `rapid-${i}@example.com`,
        `Rapid ${i}`,
        `hash-${i}`
      );
      results.push(user);
    }

    assert.strictEqual(results.length, writeCount);

    // Verify file integrity by reading all users
    const allUsers = await dataStore.getAllUsers();
    assert.strictEqual(
      allUsers.length,
      writeCount,
      "All users should be persisted"
    );
  });
});
