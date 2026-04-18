import { getBaseUrl } from "../../../../lib/site";

export const revalidate = 3600;

const serverVersion = "0.1.0";
const protocolVersion = "2025-06-18";

export async function GET() {
  const baseUrl = await getBaseUrl();

  const body = {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion,
    serverInfo: {
      name: "berme-io",
      title: "berme.io MCP Server",
      version: serverVersion,
    },
    description:
      "Discovery metadata for the berme.io codebase. The MCP transport endpoint is reserved at /mcp and is not enabled yet.",
    documentationUrl: `${baseUrl}/llms.txt`,
    transport: {
      type: "streamable-http",
      endpoint: "/mcp",
    },
    capabilities: {},
    authentication: {
      required: false,
      schemes: [],
    },
    instructions:
      "Use this server card for discovery only. The /mcp transport endpoint is reserved for future MCP activation and currently returns a not-implemented response.",
    resources: [],
    tools: [],
    prompts: [],
  };

  return Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
}
