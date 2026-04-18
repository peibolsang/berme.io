export async function GET() {
  return Response.json(
    {
      error: "MCP transport not enabled",
      message:
        "This endpoint is reserved for a future MCP streamable HTTP server. Discovery metadata is available at /.well-known/mcp/server-card.json.",
    },
    {
      status: 501,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Cache-Control": "no-store",
      },
    },
  );
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
