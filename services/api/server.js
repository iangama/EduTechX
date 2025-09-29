import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import authRouter from "./src/routes/auth.js";
import courseRouter from "./src/routes/courses.js";
import enrollmentRouter from "./src/routes/enrollments.js";
import paymentRouter from "./src/routes/payments.js";

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.API_PORT || 4000;
const SESSION_SECRET = process.env.SESSION_SECRET || "change";
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const USE_MEMORY_SESS = String(process.env.USE_MEMORY_SESS || "").toLowerCase() === "true";

async function buildSession() {
  if (USE_MEMORY_SESS) {
    console.warn("USANDO MemoryStore (USE_MEMORY_SESS=true).");
    return session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000*60*60*2 }
    });
  }

  try {
    const client = createClient({ url: REDIS_URL });
    client.on("error", (err) => console.error("Redis error:", err?.message || err));

    // Retry simples de conexão
    let attempts = 0;
    while (!client.isOpen && attempts < 20) {
      try { await client.connect(); }
      catch (e) {
        attempts++;
        console.warn(`Redis connect fail (${attempts}/20): ${e?.message || e}`);
        await new Promise(r => setTimeout(r, 1000));
      }
      if (client.isOpen) break;
    }

    if (!client.isOpen) throw new Error("Redis indisponível após retries");

    // connect-redis v7: classe direta, sem passar session
    const store = new RedisStore({ client, prefix: "sess:" });
    console.log("Redis conectado — usando RedisStore para sessões.");
    return session({
      store,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000*60*60*2 }
    });
  } catch (e) {
    console.warn("Falha ao configurar RedisStore — fallback para MemoryStore:", e?.message || e);
    return session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000*60*60*2 }
    });
  }
}

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.set("trust proxy", 1);

const sessionMw = await buildSession();
app.use(sessionMw);

app.get("/api/health", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok:false, error:String(e?.message||e) }); }
});

app.use("/api/auth", authRouter);
app.use("/api/courses", courseRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/payments", paymentRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.listen(PORT, () => console.log(`API running on :${PORT}`));
