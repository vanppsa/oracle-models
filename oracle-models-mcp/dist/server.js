"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const classify_1 = require("./classify");
const models_1 = require("./models");
const format_1 = require("./format");
exports.server = new index_js_1.Server({
    name: "oracle-models-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
exports.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "classify_task",
                description: "Classifies the complexity of a dev task (LIGHT, MEDIUM, HEAVY)",
                inputSchema: {
                    type: "object",
                    properties: {
                        description: {
                            type: "string",
                            description: "Natural language description of the task",
                        },
                        files_affected: {
                            type: "number",
                            description: "Estimation of affected files (optional)",
                        },
                    },
                    required: ["description"],
                },
            },
            {
                name: "get_model_suggestions",
                description: "Returns the suggested models for a tier with updated prices. If you are Claude → pass preferred_provider: 'anthropic'. If you are Gemini → pass preferred_provider: 'google'. If you are GPT → pass preferred_provider: 'openai'. If you are Grok → pass preferred_provider: 'xai'.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tier: {
                            type: "string",
                            enum: ["LIGHT", "MEDIUM", "HEAVY"],
                            description: "Task tier (LIGHT, MEDIUM, HEAVY)",
                        },
                        preferred_provider: {
                            type: "string",
                            enum: ["anthropic", "google", "zai", "xai", "openai"],
                            description: "Preferred provider to highlight (optional)",
                        },
                    },
                    required: ["tier"],
                },
            },
            {
                name: "format_plan_block",
                description: "Generates the formatted output block ready to be pasted at the end of a plan",
                inputSchema: {
                    type: "object",
                    properties: {
                        tier: { type: "string", enum: ["LIGHT", "MEDIUM", "HEAVY"] },
                        reason: { type: "string" },
                        estimated_files: { type: "string" },
                        estimated_tokens: { type: "string" },
                        preferred_provider: { type: "string", description: "Optional, same value passed in get_model_suggestions" },
                    },
                    required: ["tier", "reason", "estimated_files", "estimated_tokens"],
                },
            },
        ],
    };
});
exports.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === "classify_task") {
        const { description, files_affected } = request.params.arguments;
        const result = (0, classify_1.classifyTask)(description, files_affected);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    if (request.params.name === "get_model_suggestions") {
        const { tier, preferred_provider } = request.params.arguments;
        const result = await (0, models_1.getModelSuggestions)(tier, preferred_provider);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    if (request.params.name === "format_plan_block") {
        const { tier, reason, estimated_files, estimated_tokens, preferred_provider } = request.params.arguments;
        const modelsResult = await (0, models_1.getModelSuggestions)(tier, preferred_provider);
        const block = (0, format_1.formatPlanBlock)({
            tier: tier,
            reason,
            estimated_files,
            estimated_tokens,
            preferred_provider,
            models: modelsResult.models,
        });
        return {
            content: [
                {
                    type: "text",
                    text: block,
                },
            ],
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
