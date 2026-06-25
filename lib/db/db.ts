import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Neon's Pool speaks WebSocket; give it a constructor in Node (local + Vercel).
neonConfig.webSocketConstructor = ws;

const url = process.env.POSTGRES_URL!;

// Drizzle over Neon HTTP — stateless, low-latency; the default for handler
// reads/writes. No interactive transactions — use `txDb` for those.
export const db = drizzleHttp(neon(url), { schema });

// Drizzle over the WebSocket Pool — interactive transactions (order creation)
// and Better Auth's adapter.
export const pool = new Pool({ connectionString: url });
export const txDb = drizzleWs(pool, { schema });
