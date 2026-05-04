import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { classifyTask, Tier } from "./classify";
import { getModelSuggestions } from "./models";
import { formatPlanBlock } from "./format";

export const server = new Server(
  {
    name: "oracle-models",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

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
          },
          required: ["description"],
        },
      },
      {
        name: "get_model_suggestions",
        description: "Returns the suggested models for a tier with updated prices. If you are Claude → pass preferred_provider: 'anthropic'. If you are Gemini → pass preferred_provider: 'google'. If you are GLM → pass preferred_provider: 'zai'. If you are Grok → pass preferred_provider: 'xai'. If you are GPT → pass preferred_provider: 'openai'.",
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
    const { description, files_affected } = request.params.arguments as any;
    const result = classifyTask(description, files_affected);
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
