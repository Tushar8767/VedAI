const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

function buildPoolConfig() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.INTERNAL_DATABASE_URL ||
    process.env.PG_URL;

  const max = Number(process.env.PG_MAX_POOL || 25);
  const idleTimeoutMillis = process.env.NODE_ENV === "test" ? 1000 : 30000;
  const connectionTimeoutMillis = Number(process.env.PG_CONNECT_TIMEOUT_MS || 5000);

  if (connectionString) {
    const isLocal =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");
    const sslDisabled =
      connectionString.includes("sslmode=disable") ||
      process.env.PGSSL === "false";
    const useSsl =
      !sslDisabled &&
      (process.env.PGSSL === "true" || !isLocal);

    return {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  const host = process.env.PGHOST || "localhost";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const sslDisabled = process.env.PGSSL === "false";
  const useSsl =
    !sslDisabled &&
    (process.env.PGSSL === "true" ||
      (!isLocal && Boolean(process.env.PGHOST)));

  return {
    host,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "vedai",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "1234",
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool(buildPoolConfig());

    pool.on("error", (err) => {
      const msg = (err && (err.message || err.code || String(err))) || "Unknown error";
      console.error("Unexpected error on idle PostgreSQL client:", msg);
    });
  }
  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 500) {
      console.warn(`Slow query (${duration}ms): ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (error) {
    const errorMsg = (error && (error.message || error.code || String(error))) || "Unknown database error";
    console.error("Database query error:", errorMsg, "SQL:", text.slice(0, 100));
    throw error;
  }
}

async function checkConnection() {
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      const res = await client.query("SELECT NOW() as current_time, current_database() as db;");
      isConnected = true;
      return { ok: true, details: res.rows[0] };
    } finally {
      client.release();
    }
  } catch (error) {
    isConnected = false;
    const errorMsg = (error && (error.message || error.code || error.name || String(error))) || "Database connection unavailable";
    return { ok: false, error: errorMsg };
  }
}

async function runMigrations() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await query(schemaSql);
  console.log("PostgreSQL schema migrations applied successfully.");
}

module.exports = {
  getPool,
  query,
  checkConnection,
  runMigrations,
  isConnected: () => isConnected,
};
