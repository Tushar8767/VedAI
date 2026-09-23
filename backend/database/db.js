const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const poolConfig = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "vedai",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "1234",
  max: Number(process.env.PG_MAX_POOL || 25),
  idleTimeoutMillis: process.env.NODE_ENV === "test" ? 1000 : 30000,
  connectionTimeoutMillis: 5000,
};

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool(poolConfig);

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err.message);
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
    console.error("Database query error:", error.message, "SQL:", text.slice(0, 100));
    throw error;
  }
}

async function checkConnection() {
  try {
    const res = await query("SELECT NOW() as current_time, current_database() as db;");
    isConnected = true;
    return { ok: true, details: res.rows[0] };
  } catch (error) {
    isConnected = false;
    return { ok: false, error: error.message };
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
