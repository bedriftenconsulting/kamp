import type { VercelRequest, VercelResponse } from "@vercel/node";

// Disable Vercel's automatic body parsing so we can stream the raw bytes
// directly to the backend without any re-serialization.
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const BACKEND_URL = "http://34.35.193.24:8080";

// Headers that should never be forwarded to the backend.
// - host / content-length: reconstructed by the outgoing fetch
// - origin / referer: would trigger CORS validation on the backend for what
//   is actually a server-to-server call — the backend's CORS middleware should
//   only apply to real browser requests
const SKIP_HEADERS = new Set([
  "host",
  "content-length",
  "origin",
  "referer",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-vercel-id",
  "x-vercel-deployment-url",
]);

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const pathParts = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path ?? ""];
    const path = pathParts.join("/");

    const queryString = new URLSearchParams(
      Object.entries(req.query)
        .filter(([k]) => k !== "path")
        .flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((val) => [k, val]) : [[k, v ?? ""]]
        )
    ).toString();

    const targetUrl = `${BACKEND_URL}/${path}${queryString ? `?${queryString}` : ""}`;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (SKIP_HEADERS.has(key.toLowerCase())) continue;
      if (value) {
        forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
      }
    }

    const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");
    const rawBody = hasBody ? await readRawBody(req) : undefined;

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: rawBody,
    });

    const contentType = backendRes.headers.get("content-type") ?? "application/json";
    res.setHeader("Content-Type", contentType);
    const text = await backendRes.text();
    return res.status(backendRes.status).send(text);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy error", detail: err.message });
  }
}
