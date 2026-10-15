import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.SEO_SMOKE_PORT ?? 3210);
const ORIGIN = `http://${HOST}:${PORT}`;
const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

let output = "";
const server = spawn(process.execPath, [NEXT_CLI, "start", "-H", HOST, "-p", String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});

for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    output += chunk;
    process.stdout.write(chunk);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready.\n${output}`);
    }
    try {
      const response = await fetch(`${ORIGIN}/`, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${ORIGIN}.\n${output}`);
}

async function getRoute(pathname, expectedContentType) {
  const response = await fetch(`${ORIGIN}${pathname}`, {
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  assert.equal(response.status, 200, `${pathname} returned ${response.status}\n${body}`);
  assert.match(
    response.headers.get("content-type") ?? "",
    expectedContentType,
    `${pathname} returned the wrong content type`,
  );
  return { body, response };
}

async function readRoute(pathname, expectedContentType) {
  const route = await getRoute(pathname, expectedContentType);
  return route.body;
}

async function stopServer() {
  if (server.exitCode !== null) return;

  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");
  await Promise.race([exited, delay(5_000)]);

  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await Promise.race([exited, delay(2_000)]);
  }

  server.stdout.destroy();
  server.stderr.destroy();
}

try {
  await waitForServer();

  const homepage = await readRoute("/", /text\/html/i);
  for (const marker of [
    "The desktop-first agentic co-learner",
    "One course, one dedicated Space",
    "Dual Study &amp; Studio views",
    "Active retrieval, not passive reading",
    "Durable learning traces",
  ]) {
    assert.ok(homepage.includes(marker), `homepage is missing ${marker}`);
  }
  assert.equal(homepage.includes("Star on GitHub"), false, "Star on GitHub must be hidden");
  for (const retired of [
    ["no longer just a ", "t", "3", " code fork"].join(""),
    "Opus 4.8",
    "GPT-5.5",
    "Composer 2.5",
    "500+ models",
    "The command center for agentic development",
  ]) {
    assert.equal(
      homepage.toLowerCase().includes(retired.toLowerCase()),
      false,
      `homepage still renders retired copy: ${retired}`,
    );
  }
  assert.match(
    homepage,
    /<title>Mimir — AI Coding Workspace for Claude Code, Codex &amp; Cursor<\/title>/,
  );
  assert.match(
    homepage,
    /<link rel="canonical" href="https:\/\/mimir\.himelz\.studio"\/>/,
    "homepage must emit the exact canonical production origin",
  );
  assert.ok(homepage.includes('"@type":"SoftwareApplication"'));
  assert.ok(homepage.includes('"@type":"FAQPage"'));

  for (const hiddenPath of [
    "/install",
    "/sponsor",
    "/sponsors",
    "/changelog",
    "/docs",
    "/docs/providers",
    "/docs/workflows",
    "/docs/troubleshooting",
  ]) {
    const { response, body } = await getRoute(hiddenPath, /text\/html/i);
    assert.ok(
      response.url.endsWith("/") || body.includes("The desktop-first agentic co-learner"),
      `${hiddenPath} must redirect to homepage`,
    );
  }

  const docsIndexMarkdown = await readRoute("/docs.md", /text\/markdown/i);
  assert.ok(docsIndexMarkdown.includes("# Mimir documentation"));
  assert.ok(docsIndexMarkdown.includes("## What is Mimir?"));

  const { body: docsMarkdown, response: docsMarkdownResponse } = await getRoute(
    "/docs/providers/claude-code.md",
    /text\/markdown/i,
  );
  assert.equal(docsMarkdownResponse.headers.get("x-robots-tag"), "noindex, follow");
  assert.equal(
    docsMarkdownResponse.headers.get("link"),
    '<https://mimir.himelz.studio/docs/providers/claude-code>; rel="canonical"',
  );
  for (const marker of [
    "# Claude Code",
    "Canonical URL: https://mimir.himelz.studio/docs/providers/claude-code",
    "## Install",
    "claude --version",
  ]) {
    assert.ok(docsMarkdown.includes(marker), `Markdown documentation is missing ${marker}`);
  }
  assert.equal(docsMarkdown.includes("<html"), false);

  const robots = await readRoute("/robots.txt", /text\/plain/i);
  for (const marker of [
    "User-Agent: OAI-SearchBot",
    "User-Agent: ChatGPT-User",
    "User-Agent: Claude-SearchBot",
    "User-Agent: Claude-User",
    "User-Agent: PerplexityBot",
    "User-Agent: GPTBot",
    "Disallow: /api/",
    "Sitemap: https://mimir.himelz.studio/sitemap-index.xml",
  ]) {
    assert.ok(robots.includes(marker), `robots.txt is missing ${marker}`);
  }

  const sitemapIndex = await readRoute("/sitemap-index.xml", /application\/xml/i);
  assert.equal(
    (sitemapIndex.match(/<sitemap>/g) ?? []).length,
    2,
    "sitemap index must contain the main and changelog sitemaps",
  );
  assert.ok(sitemapIndex.includes("https://mimir.himelz.studio/sitemap.xml"));
  assert.ok(sitemapIndex.includes("https://mimir.himelz.studio/changelog/sitemap.xml"));

  const sitemap = await readRoute("/sitemap.xml", /application\/xml/i);
  for (const route of [
    "/docs",
    "/docs/providers/claude-code",
    "/docs/workflows/agent-gateway",
    "/docs/troubleshooting/report-a-problem",
  ]) {
    assert.ok(
      sitemap.includes(`https://mimir.himelz.studio${route}`),
      `sitemap.xml is missing ${route}`,
    );
  }
  for (const utilityPath of ["/llms.txt", "/llms-full.txt", "/ai.txt"]) {
    assert.equal(
      sitemap.includes(`https://mimir.himelz.studio${utilityPath}`),
      false,
      `sitemap.xml should not advertise ${utilityPath} as a search-result page`,
    );
  }

  const llms = await readRoute("/llms.txt", /text\/plain/i);
  for (const marker of [
    "The desktop-first agentic learning workspace",
    "## Product model",
    "One course, one dedicated Space",
    "## Documentation index",
    "https://mimir.himelz.studio/docs/providers.md",
    "https://mimir.himelz.studio/docs/workflows.md",
    "https://mimir.himelz.studio/docs/troubleshooting.md",
    "robots.txt and page-level indexing directives remain authoritative",
  ]) {
    assert.ok(llms.includes(marker), `llms.txt is missing ${marker}`);
  }

  const llmsFull = await readRoute("/llms-full.txt", /text\/plain/i);
  assert.ok(llmsFull.includes("## Full documentation"));
  assert.ok(llmsFull.includes("# Report a problem"));
  assert.ok(
    llmsFull.includes(
      "Canonical URL: https://mimir.himelz.studio/docs/troubleshooting/report-a-problem",
    ),
  );
  assert.ok(llmsFull.includes("claude --version"));

  const ai = await readRoute("/ai.txt", /text\/plain/i);
  assert.ok(ai.includes("AI search and user-directed retrieval agents:"));
  assert.ok(ai.includes("Model-development controls, separate from search visibility:"));
  assert.ok(ai.includes("Supported runtimes: Claude Code, Codex, OpenCode"));
  assert.ok(ai.includes("Markdown documentation: https://mimir.himelz.studio/docs.md"));
  assert.ok(
    ai.includes("This file is informational and does not grant or revoke crawler permission."),
  );

  console.log("Marketing, SEO, AEO, and AI discovery smoke test passed.");
} finally {
  await stopServer();
}
