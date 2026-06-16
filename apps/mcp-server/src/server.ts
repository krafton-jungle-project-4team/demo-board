import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import fastify, { type FastifyReply, type FastifyRequest, type HookHandlerDoneFunction } from "fastify";
import { mcpServerEnv } from "./env.js";
import { registerEstateTools } from "./tools/estate-tools.js";

const MCP_ENDPOINT = "/mcp";

export function createMcpHttpApp() {
    const app = fastify({
        bodyLimit: 1024 * 1024
    });

    app.post(MCP_ENDPOINT, { preHandler: validateMcpRequest }, handleMcpPostRequest);
    app.get(MCP_ENDPOINT, { preHandler: validateMcpRequest }, handleMcpUnsupportedStreamRequest);
    app.delete(MCP_ENDPOINT, { preHandler: validateMcpRequest }, handleMcpUnsupportedStreamRequest);

    return app;
}

function createMcpServer() {
    const server = new McpServer({
        name: "estate-mcp-server",
        version: "0.0.0"
    });

    registerEstateTools(server);

    return server;
}

async function handleMcpPostRequest(request: FastifyRequest, reply: FastifyReply) {
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    reply.raw.on("close", () => {
        void transport.close();
    });

    await mcpServer.connect(transport);
    reply.hijack();
    await transport.handleRequest(request.raw, reply.raw, request.body);
}

function handleMcpUnsupportedStreamRequest(_request: FastifyRequest, reply: FastifyReply) {
    reply.status(405).send({
        error: "MCP stream connections are not supported. Send JSON-RPC messages with POST /mcp."
    });
}

function validateMcpRequest(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
    const authorization = request.headers.authorization;

    if (authorization !== `Bearer ${mcpServerEnv.bearerToken}`) {
        reply.status(401).send({ error: "Missing or invalid MCP bearer token." });
        return;
    }

    const origin = request.headers.origin;

    if (origin && !mcpServerEnv.allowedOrigins.includes(origin)) {
        reply.status(403).send({ error: "Origin is not allowed for this MCP server." });
        return;
    }

    done();
}
