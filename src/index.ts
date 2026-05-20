#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server";
import { setDetectedClient } from "./models";

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const clientInfo = (server as any).getClientVersion?.();
  if (clientInfo?.name) {
    setDetectedClient(clientInfo.name);
  }

  console.error("Oracle Models MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP Server:", error);
  process.exit(1);
});
