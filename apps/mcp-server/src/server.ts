import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import { mcpServerEnv } from "./env.js";

const MCP_ENDPOINT = "/mcp";

export function createMcpHttpApp() {
    const app = express();

    app.use(express.json({ limit: "1mb" }));
    app.use(MCP_ENDPOINT, validateMcpRequest);
    app.post(MCP_ENDPOINT, handleMcpPostRequest);
    app.get(MCP_ENDPOINT, handleMcpUnsupportedStreamRequest);
    app.delete(MCP_ENDPOINT, handleMcpUnsupportedStreamRequest);

    return app;
}

function createMcpServer() {
    return new McpServer({
        name: "estate-mcp-server",
        version: "0.0.0"
    });
}

async function handleMcpPostRequest(request: Request, response: Response) {
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    response.on("close", () => {
        void transport.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(request, response, request.body);
}

function handleMcpUnsupportedStreamRequest(_request: Request, response: Response) {
    response.status(405).json({
        error: "MCP stream connections are not supported. Send JSON-RPC messages with POST /mcp."
    });
}

function validateMcpRequest(request: Request, response: Response, next: () => void) {
    const authorization = request.header("authorization");

    if (authorization !== `Bearer ${mcpServerEnv.bearerToken}`) {
        response.status(401).json({ error: "Missing or invalid MCP bearer token." });
        return;
    }

    const origin = request.header("origin");

    if (origin && !mcpServerEnv.allowedOrigins.includes(origin)) {
        response.status(403).json({ error: "Origin is not allowed for this MCP server." });
        return;
    }

    next();
}
