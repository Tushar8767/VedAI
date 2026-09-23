const http = require("http");
const os = require("os");

const HOST = "127.0.0.1";
const PORT = 5000;
const DURATION_SECONDS = 3; // 3 seconds per benchmark tier for quick, rigorous evaluation

function runConcurrencyTier({
  concurrency,
  endpoint = "/health",
  method = "GET",
  body = null
}) {
  return new Promise((resolve) => {
    let completed = 0;
    let errors = 0;
    const latencies = [];
    const startTime = Date.now();
    const endTime = startTime + (DURATION_SECONDS * 1000);

    const postPayload = body ? JSON.stringify(body) : null;
    const headers = {
      "Connection": "keep-alive"
    };

    if (postPayload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postPayload);
    }

    const agent = new http.Agent({
      keepAlive: true,
      maxSockets: Math.max(concurrency * 2, 50)
    });

    const startCpu = process.cpuUsage();
    const startMem = process.memoryUsage();

    function sendRequest() {
      if (Date.now() >= endTime) {
        return;
      }

      const reqStart = Date.now();
      const req = http.request({
        host: HOST,
        port: PORT,
        path: endpoint,
        method,
        agent,
        headers
      }, (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          const reqDuration = Date.now() - reqStart;
          latencies.push(reqDuration);
          completed++;
          if (res.statusCode >= 400 && res.statusCode !== 429) {
            errors++;
          }
          sendRequest();
        });
      });

      req.on("error", () => {
        errors++;
        sendRequest();
      });

      req.setTimeout(8000, () => {
        req.destroy();
      });

      if (postPayload) {
        req.write(postPayload);
      }
      req.end();
    }

    // Launch concurrent virtual users
    for (let i = 0; i < concurrency; i++) {
      sendRequest();
    }

    // Check for completion
    const checkInterval = setInterval(() => {
      if (Date.now() >= endTime + 1000) {
        clearInterval(checkInterval);
        agent.destroy();

        const totalDuration = (Date.now() - startTime) / 1000;
        latencies.sort((a, b) => a - b);

        const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
        const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
        const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
        const rps = Math.round(completed / totalDuration);
        const errorRate = completed + errors > 0 ? (errors / (completed + errors)) * 100 : 0;

        const endMem = process.memoryUsage();
        const rssMb = (endMem.rss / (1024 * 1024)).toFixed(1);

        resolve({
          endpoint,
          concurrency,
          completed,
          errors,
          rps,
          p50_ms: p50,
          p95_ms: p95,
          p99_ms: p99,
          error_rate_pct: parseFloat(errorRate.toFixed(2)),
          rss_mb: rssMb
        });
      }
    }, 200);
  });
}

async function runBenchmark() {
  console.log("=================================================");
  console.log("       VEDAI MULTI-ENDPOINT BENCHMARK ENGINE     ");
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`CPUs: ${os.cpus().length} cores | Memory: ${(os.totalmem() / (1024**3)).toFixed(1)} GB`);
  console.log(`Target: http://${HOST}:${PORT}`);
  console.log("=================================================");

  const scenarios = [
    {
      name: "Gateway Health Ping (/health)",
      endpoint: "/health",
      method: "GET",
      body: null,
      tiers: [50, 200]
    },
    {
      name: "Multimodal Emotion Fusion (/api/v1/emotion/multimodal)",
      endpoint: "/api/v1/emotion/multimodal",
      method: "POST",
      body: {
        text_prediction: { emotion: "anxiety", confidence: 0.8 },
        face_prediction: { emotion: "stress", confidence: 0.7 }
      },
      tiers: [20, 50]
    },
    {
      name: "Conversational RAG (/api/v1/chat)",
      endpoint: "/api/v1/chat",
      method: "POST",
      body: { message: "I am feeling anxious about my duties" },
      tiers: [10, 30]
    },
    {
      name: "NLP ML Pipeline (/api/v1/process)",
      endpoint: "/api/v1/process",
      method: "POST",
      body: { user_text: "I feel overwhelmed with work and fear failure" },
      tiers: [5, 15]
    }

  ];

  const allResults = [];

  for (const scenario of scenarios) {
    console.log(`\n--- Running Benchmark: ${scenario.name} ---`);
    for (const c of scenario.tiers) {
      process.stdout.write(`Testing ${c} concurrent users... `);
      const res = await runConcurrencyTier({
        concurrency: c,
        endpoint: scenario.endpoint,
        method: scenario.method,
        body: scenario.body
      });
      console.log(`Done. ${res.rps} RPS | p50: ${res.p50_ms}ms | p95: ${res.p95_ms}ms | p99: ${res.p99_ms}ms | RSS: ${res.rss_mb}MB | Errors: ${res.error_rate_pct}%`);
      allResults.push(res);
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  console.log("\n================ MULTI-ENDPOINT SUMMARY TABLE ================");
  console.table(allResults);
  console.log("==============================================================");
  return allResults;
}

if (require.main === module) {
  runBenchmark().then(() => process.exit(0)).catch(err => {
    console.error("Benchmark error:", err);
    process.exit(1);
  });
}

module.exports = { runBenchmark, runConcurrencyTier };
