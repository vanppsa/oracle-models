# Oracle Models MCP Server

This project transforms the `oracle-models` skill into a **local MCP Server**. It classifies development tasks (LIGHT, MEDIUM, HEAVY) based on their technical complexity and suggests the most cost-efficient AI model using aggregated data from multiple AI leaderboard sources.

## Data Sources

The server dynamically assesses and suggests models by pulling performance and pricing context from the following priority sources:
1. **[Artificial Analysis](https://artificialanalysis.ai/leaderboards/models)** (Primary Intelligence Index)
2. **[LMSYS Chatbot Arena](https://arena.ai/leaderboard/code)** (Coding specific capabilities)
3. **[OpenRouter Rankings](https://openrouter.ai/rankings)** (Volume and adoption metrics)
4. **[LLM Stats](https://llm-stats.com)** (Additional pricing and context)

## Features

1. **`classify_task`**: Receives a task description (and optionally the estimated number of affected files) and returns its complexity classification based on specific technical heuristics and patterns.
2. **`get_model_suggestions`**: Returns the most efficient model suggestions per provider (Claude, Gemini, GLM, Grok) for a given `tier`.
3. **`format_plan_block`**: Formats and returns a ready-to-use text block with the classification and model suggestions.

## Installation and Usage

**Compatibility:** Works natively on **Windows**, **macOS**, and **Linux**. The cache is automatically saved in the user's home directory in an OS-agnostic way (e.g., `C:\Users\Name\.oracle-models` on Windows or `~/.oracle-models` on Linux/Mac).

The server operates 100% locally via Node.js. There are no infrastructure costs or backend requirements. Node.js `npx` automatically resolves path slashes and execution regardless of your operating system.

### Claude Code

Run the command below in your terminal to add the MCP to Claude Code:

```bash
claude mcp add oracle-models -- npx -y @oracle-models/mcp
```

### Gemini CLI

Add the server to your `~/.gemini/settings.json` file:

```json
{
  "mcpServers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "@oracle-models/mcp"]
    }
  }
}
```

### Cursor / Cline / Windsurf

In your project's root directory, add the server to the `.mcp.json` file or to your editor's specific configuration:

```json
{
  "mcpServers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "@oracle-models/mcp"]
    }
  }
}
```

## How the MCP Identifies the Preferred Provider

When calling the `get_model_suggestions` and `format_plan_block` tools, you can send an optional `preferred_provider` field. If configured with `anthropic`, `google`, `openai`, or `xai`, the respective model will be highlighted in the output table, for example:

```
  🤖 SUGGESTED MODELS FOR EXECUTION
  Claude  : Claude Opus 4.7 ✨ (Suggested for your environment)
```

**Hint for Models:**
Agent detection is **automatic** because the tool description exported by the server carries the following built-in instruction for the invoking AI:
> "If you are Claude → pass preferred_provider: 'anthropic'. If you are Gemini → pass preferred_provider: 'google'. If you are GPT → pass preferred_provider: 'openai'. If you are Grok → pass preferred_provider: 'xai'."

Thus, the running model reads the server's capabilities, identifies itself, and fills the parameter dynamically.

## Cache and Offline Support

To avoid unnecessary latency, model data is persisted locally in the `~/.oracle-models/cache.json` file and renewed every 7 days. If the user is offline or the source site changes its data delivery structure, the server transparently and resiliently uses the built-in *mock data* (`fallback.json`), allowing continuous evaluation.
