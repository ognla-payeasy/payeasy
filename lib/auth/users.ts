import { DataStore, createDataStore } from "./db-adapter";

let dataStore: DataStore | null = null;

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Initialize the data store (file or database based on environment)
 */
async function getDataStore(): Promise<DataStore> {
  if (!dataStore) {
    dataStore = await createDataStore();
  }
  return dataStore;
}

/**
 * Set a custom data store (useful for testing)
 */
export function setDataStore(store: DataStore): void {
  dataStore = store;
}

export async function findUserByEmail(
  email: string
): Promise<StoredUser | undefined> {
  const store = await getDataStore();
  return store.findUserByEmail(email);
}

export async function findUserById(
  id: string
): Promise<StoredUser | undefined> {
  const store = await getDataStore();
  return store.findUserById(id);
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string
): Promise<StoredUser> {
  const store = await getDataStore();
  return store.createUser(email, name, passwordHash);
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}
