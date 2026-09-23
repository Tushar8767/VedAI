const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("./config/env");
const { checkConnection, runMigrations, isConnected } = require("./database/db");

const processRoutes = require("./routes/processRoutes");
const authRoutes = require("./routes/authRoutes");
const userDataRoutes = require("./routes/userDataRoutes");

const app = express();

// Trust reverse proxy (e.g. Nginx, ALB, Cloudflare) for secure cookies, IP rate-limiting, and HTTPS detection
app.set("trust proxy", 1);

// Hardened Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  // HSTS when serving over HTTPS or behind TLS terminating proxy
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Configurable CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
}));

app.use(express.json({ limit: "10mb" })); // Allow base64 image uploads

// Request ID & Structured Logging Middleware
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || Math.random().toString(36).substring(2, 10);
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Rate limiters (configurable via env for production tuning)
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === "production" ? 100 : 500));
const apiMax = Number(process.env.API_RATE_LIMIT_MAX || (process.env.NODE_ENV === "production" ? 1000 : 2000));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Please try again later." } }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Request limit exceeded. Please slow down." } }
});

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/process", apiLimiter);
app.use("/api/v1/chat", apiLimiter);


// Root & Health
app.get("/", (req, res) => {
  res.json({
    name: "VedAI API",
    status: "running",
    version: "2.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: isConnected() ? "connected" : "fallback_mode"
  });
});

app.get("/ready", (req, res) => {
  res.json({
    status: "ready",
    dependencies: {
      database: isConnected() ? "postgresql" : "file_store",
      modelApiConfigured: Boolean(config.MODEL_API_URL),
      youtubeConfigured: Boolean(config.YOUTUBE_API_KEY)
    }
  });
});

// Mount routes
app.use("/", authRoutes);
app.use("/", userDataRoutes);
app.use("/", processRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] [${req.id || 'N/A'}] Unhandled API error:`, err.message);
  res.status(err.status || 500).json({
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "VedAI could not complete the request. Please try again."
    }
  });
});

// Bootstrap database migrations and start server
async function startServer() {
  try {
    const dbStatus = await checkConnection();
    if (dbStatus.ok) {
      console.log("PostgreSQL connected successfully.");
      await runMigrations();
    } else {
      console.warn("PostgreSQL connection notice:", dbStatus.error, "- using local resilience mode.");
    }
  } catch (e) {
    console.warn("PostgreSQL bootstrap notice:", e.message);
  }

  if (require.main === module) {
    app.listen(config.PORT, () => {
      console.log(`VedAI Server running on port ${config.PORT}`);
    });
  }
}

startServer();

module.exports = app;
