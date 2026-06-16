import { mcpServerEnv } from "./env.js";
import { createMcpHttpApp } from "./server.js";

const app = createMcpHttpApp();

await app.listen({ port: mcpServerEnv.port, host: "0.0.0.0" });
console.error(`MCP server listening on http://localhost:${mcpServerEnv.port}/mcp`);

process.on("SIGINT", () => {
    void closeServer();
});
process.on("SIGTERM", () => {
    void closeServer();
});

async function closeServer() {
    await app.close();
    process.exit(0);
}
