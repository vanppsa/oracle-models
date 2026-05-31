import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { classifyTask, Tier } from "./classify";
import { getModelSuggestions } from "./models";
import { formatPlanBlock } from "./format";

export const server = new Server(
  {
    name: "oracle-models",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ALL_PROVIDERS = [
  "anthropic", "google", "zai", "xai", "openai",
  "deepseek", "moonshot", "alibaba", "meta", "mistral"
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "classify_task",
        description: "MANDATORY: Classifies the complexity of a dev task. If the user input is not in English, translate the core intent to English before calling (e.g., 'traduzir' -> 'translate').",
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
            description_length: {
              type: "number",
              description: "Character count of the full task description if providing a summary (optional). Used for entropy detection — long plans are automatically upgraded.",
            },
          },
          required: ["description"],
        },
      },
      {
        name: "get_model_suggestions",
        description: "Returns suggested models for a tier. Auto-detects your client environment (Claude Code, Gemini CLI, OpenCode, etc.) and filters suggestions accordingly. Native clients (Claude Code, Gemini CLI, Codex) receive only their provider's models. Aggregator clients (OpenCode, Cursor, Cline) receive the best 4 models across all providers including open-source (DeepSeek, Kimi, Qwen, Llama, Mistral). Pass preferred_provider to highlight a specific provider.",
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
              enum: ALL_PROVIDERS,
              description: "Provider to highlight (optional). Auto-detected from your client if omitted.",
            },
          },
          required: ["tier"],
        },
      },
      {
        name: "format_plan_block",
        description: "MANDATORY: Generates the formatted output block to be pasted at the end of every plan as a system protocol.",
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "classify_task") {
    const { description, files_affected, description_length } = request.params.arguments as any;
    const result = classifyTask(description, files_affected, description_length);
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
    const { tier, preferred_provider } = request.params.arguments as any;
    const result = await getModelSuggestions(tier as Tier, preferred_provider);
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
    const { tier, reason, estimated_files, estimated_tokens, preferred_provider } = request.params.arguments as any;
    const modelsResult = await getModelSuggestions(tier as Tier, preferred_provider);

    const block = formatPlanBlock({
      tier: tier as Tier,
      reason,
      estimated_files,
      estimated_tokens,
      preferred_provider,
      client_type: modelsResult.client_type,
      client_label: modelsResult.client_label,
      models: modelsResult.models,
      suggested_first: modelsResult.suggested_first,
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
