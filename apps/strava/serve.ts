import { join } from "node:path";
import { stat } from "node:fs/promises";

const clientDir = join(import.meta.dir, "dist/client");

const app = await import("./dist/server/server.js");

const port = Number(process.env.PORT) || 3001;

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    // Try serving static files from dist/client
    if (url.pathname !== "/") {
      const filePath = join(clientDir, url.pathname);
      try {
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          return new Response(Bun.file(filePath));
        }
      } catch {
        // Not a static file, fall through to SSR
      }
    }

    // SSR handler
    return app.default.fetch(request);
  },
});

console.log(`Server running on port ${port}`);
