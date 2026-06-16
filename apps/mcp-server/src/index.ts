import { mcpServerEnv } from "./env.js";
import { createMcpHttpApp } from "./server.js";

const app = createMcpHttpApp();
const server = app.listen(mcpServerEnv.port, "0.0.0.0", () => {
    console.error(`MCP server listening on http://localhost:${mcpServerEnv.port}/mcp`);
});

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

function closeServer() {
    server.close(() => {
        process.exit(0);
    });
}
