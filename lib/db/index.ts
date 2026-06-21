import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. See .env.example");
  }
  return drizzle(neon(process.env.DATABASE_URL), { schema });
}

type DB = ReturnType<typeof createDb>;

let _db: DB | null = null;

// 実際に使われるまで接続初期化を遅延（ビルド時に DATABASE_URL 不要）
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return _db[prop as keyof DB];
  },
});

export * from "./schema";
