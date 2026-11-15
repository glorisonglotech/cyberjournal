import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { connectDB, disconnectDB, isMemoryMode } from "./config/db.js";
import { UPLOAD_DIR } from "./middleware/upload.js";
import { allowedOrigins, sameOriginGuard, apiLimiter } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/error.js";
import apiRoutes from "./routes/index.js";
import { Article } from "./models/Article.js";
import { seedDatabase } from "./services/seed.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const origins = allowedOrigins();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    // The SPA uses no raw HTML from article bodies and no eval. `unsafe-inline`
    // covers the JSON-LD block the reader injects and Tailwind style attributes.
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origins.has(String(origin).replace(/\/+$/, ""))) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(mongoSanitize({ replaceWith: "_" }));
app.use(sameOriginGuard);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Content-Disposition", "inline");
    },
  }),
);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }),
);

app.use("/api", apiLimiter, apiRoutes);

// Serve the compiled client when it exists (single-service deployments).
const clientDist = path.resolve(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(
    express.static(clientDist, {
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
        else if (/\/assets\//.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    return res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

async function start() {
  const connection = await connectDB();
  console.log(
    `[db] connected (${connection.mode})${isMemoryMode() ? " — data resets when the API stops" : ""}`,
  );

  if (process.env.NODE_ENV !== "production") {
    const count = await Article.countDocuments();
    if (count === 0) {
      const result = await seedDatabase();
      if (result.seeded) {
        console.log(`[seed] inserted ${result.articles} demonstration articles`);
      }
    }
  }

  if (process.env.NODE_ENV === "production" && origins.size === 0) {
    console.warn("[cors] CLIENT_ORIGIN is empty — browsers will not be able to call this API.");
  }

  const server = app.listen(PORT, () => {
    console.log(`[api] Glorison Cyber Journal listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received — closing`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("[api] failed to start:", error.message);
  process.exit(1);
});
