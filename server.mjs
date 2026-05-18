import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize } from "node:path";
import { readFile } from "node:fs/promises";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const filePath = normalize(join(root, requested));

    if (!filePath.startsWith(normalize(root))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const extension = extname(filePath);
    const body = await readFile(filePath);
    const cacheControl = [".jpg", ".jpeg", ".png", ".svg"].includes(extension)
      ? "public, max-age=31536000, immutable"
      : "no-store";
    res.writeHead(200, {
      "Content-Type": types[extension] || "application/octet-stream",
      "Cache-Control": cacheControl
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Luxury Carousel Studio running at http://localhost:${port}`);
});
