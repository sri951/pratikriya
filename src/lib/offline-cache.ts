import { openDB, type IDBPDatabase } from "idb";
import type { SavedDoubt } from "./doubts.functions";

const DB_NAME = "clarity-offline";
const DB_VERSION = 1;
const STORE = "doubts";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: "cacheKey" });
          s.createIndex("byUser", "userId");
        }
      },
    });
  }
  return dbPromise;
}

type CachedRow = SavedDoubt & { userId: string; cacheKey: string };

export async function cacheDoubts(userId: string, doubts: SavedDoubt[]): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction(STORE, "readwrite");
  const idx = tx.store.index("byUser");
  let cursor = await idx.openCursor(IDBKeyRange.only(userId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  for (const d of doubts) {
    const row: CachedRow = { ...d, userId, cacheKey: `${userId}:${d.id}` };
    await tx.store.put(row);
  }
  await tx.done;
}

export async function readCachedDoubts(userId: string): Promise<SavedDoubt[]> {
  const db = await getDB();
  if (!db) return [];
  const rows = (await db.getAllFromIndex(STORE, "byUser", userId)) as CachedRow[];
  return rows
    .map(({ userId: _u, cacheKey: _c, ...rest }) => rest as SavedDoubt)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function removeCachedDoubt(userId: string, id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE, `${userId}:${id}`);
}