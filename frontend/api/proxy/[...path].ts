import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND_URL = "http://34.35.193.24:8080";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path ?? ""];
    const path = pathParts.join("/");
    const queryString = new URLSearchParams(
      Object.entries(req.query)
        .filter(([k]) => k !== "path")
        .flatMap(([k, v]) => (Array.isArray(v) ? v.map((val) => [k, val]) : [[k, v ?? ""]]))
    ).toString();
    const targetUrl = `${BACKEND_URL}/${path}${queryString ? `?${queryString}` : ""}`;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (["host", "content-length"].includes(key.toLowerCase())) continue;
      if (value) forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : JSON.stringify(req.body),
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
