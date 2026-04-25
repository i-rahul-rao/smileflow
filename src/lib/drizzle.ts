// create a drizzle instance and cache in development
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

const globalForDb = global as unknown as { db: typeof db };

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
