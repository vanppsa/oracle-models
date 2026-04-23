#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_1 = require("./server");
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server_1.server.connect(transport);
    console.error("Oracle Models MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in MCP Server:", error);
    process.exit(1);
});
