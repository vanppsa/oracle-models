# Oracle Models MCP Server

This project is an **MCP Server** that classifies development tasks (LIGHT, MEDIUM, HEAVY) based on their technical complexity and suggests the most cost-efficient and capable AI models using data aggregated from major AI benchmarks.

## Data Sources

The server suggests models based on metrics from [Artificial Analysis](https://artificialanalysis.ai/leaderboards/models), prioritizing the Intelligence Index for technical capabilities and pricing.

## Features

1. **`classify_task`**: Receives a task description (and optionally the number of affected files) and returns a complexity classification using technical heuristics.
2. **`get_model_suggestions`**: Returns model suggestions per provider (Claude, Gemini, GLM, Grok) for a specific complexity `tier`.

## Installation and Usage

### Claude Code

Add to Claude Code:
```bash
claude mcp add oracle-models -- npx -y @oracle-models/mcp
```

### Gemini CLI

Add to your `~/.gemini/settings.json`:
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

Add to your editor's MCP configuration:
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

## Cache and Offline Support

Model data is cached locally in `~/.oracle-models/cache.json` and renewed every 7 days. If the remote source is unreachable, the server transparently uses the built-in fallback data (`data/fallback.json`).
