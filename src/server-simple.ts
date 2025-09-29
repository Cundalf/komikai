import { serve } from "bun";
import { renderLogin } from "./templates";

const server = serve({
  port: 3005,
  fetch(request) {
    const url = new URL(request.url);
    console.log(`${request.method} - ${url.pathname}`);

    // Solo respuesta simple para /
    if (url.pathname === "/") {
      try {
        const html = renderLogin();
        return new Response(html, {
          headers: { "Content-Type": "text/html" }
        });
      } catch (error) {
        console.error("Error:", error);
        return new Response("Error rendering", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Simple server running on port ${server.port}`);