# Oracle Models

[![npm](https://img.shields.io/npm/v/oracle-models-mcp?label=npm)](https://www.npmjs.com/package/oracle-models-mcp) [![skills](https://img.shields.io/badge/skills.sh-installable-blue)](https://skills.sh) [![MCP](https://img.shields.io/badge/MCP-compatible-green)](https://modelcontextprotocol.io) [![license](https://img.shields.io/badge/license-MIT-brightgreen)](./LICENSE)

Classifies development task complexity (LIGHT/MEDIUM/HEAVY) and suggests the most cost-efficient AI model per provider — works as both an **MCP server** (live tools) and an **agent skill** (behavioral instructions).

Providers: **Claude** (Anthropic), **Gemini** (Google), **GLM** (Z.ai), **Grok** (xAI), **GPT** (OpenAI).

Data sourced from the [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/leaderboards/models).

---

## Agent Compatibility

| Agent | MCP Server | Skill | Install command |
|-------|:----------:|:-----:|-----------------|
| [OpenCode](https://opencode.ai) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a opencode -y` |
| [Gemini CLI](https://geminicli.com) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a gemini-cli -y` |
| [Claude Code](https://claude.com/product/claude-code) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a claude-code -y` |
| [Codex](https://openai.com/codex) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a codex -y` |

> **Other Compatible Agents:** Cursor, Cline, Windsurf, Roo Code, Goose, Kiro CLI, Amp, Augment, Trae, GitHub Copilot, VS Code Copilot.
>
> To install for other agents, use the same command format: `npx skills add vanppsa/oracle-models -g -a <agent-name> -y`.

---

## Quick Start

### Install the Skill

```bash
# Install for all detected agents (recommended)
npx skills add vanppsa/oracle-models -g -y

# Install for a specific agent
npx skills add vanppsa/oracle-models -g -a opencode -y
```

### Add the MCP Server

The skill provides behavioral instructions, but you also need the MCP server for live tools. Pick your agent below:

---

## MCP Server Setup by Agent

### Standard MCP Configuration
The following agents share the same MCP configuration structure. Add this block to their respective configuration files as indicated:

```json
{
  "mcpServers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "oracle-models-mcp"]
    }
  }
}
```

*   **Claude:** `claude mcp add oracle-models -- npx -y oracle-models-mcp`
*   **Cursor:** Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global).
*   **Cline:** Add to `.cline/mcp.json` or via Cline settings → MCP Servers.
*   **Windsurf:** Add to `.codeium/windsurf/mcp.json` or via Windsurf settings → MCP.
*   **Codex:** Add to `~/.codex/mcp.json` or via Codex settings.
*   **Roo Code:** Add to `.roo/mcp.json` or via Roo Code settings → MCP.
*   **Goose:** Add to `~/.config/goose/mcp.json` or via `goose session --with-mcp oracle-models -- npx -y oracle-models-mcp`.
*   **Kiro CLI:** Add to `.kiro/mcp.json`.

### Gemini CLI
Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "oracle-models-mcp"],
      "timeout": 10000
    }
  }
}
```

Or via CLI:

```bash
gemini mcp add oracle-models -- npx -y oracle-models-mcp
```

### OpenCode
Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "oracle-models": {
      "type": "local",
      "command": ["npx", "-y", "oracle-models-mcp"],
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

### VS Code Copilot
Add to `.vscode/mcp.json` or via VS Code settings → MCP:

```json
{
  "servers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "oracle-models-mcp"]
    }
  }
}
```

---

## MCP Tools Reference

### `classify_task`

Classifies a development task by complexity using regex-based heuristics.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `description` | string | Yes | Natural language description of the task |
| `files_affected` | number | No | Estimated number of affected files |

**Example:**

```json
{ "description": "Add email validation to registration form", "files_affected": 2 }
```

**Response:**

```json
{
  "tier": "MEDIUM",
  "reason": "Inclusion of complex business rules/validations",
  "estimated_files": "2–5",
  "estimated_tokens": "200–800"
}
```

### `get_model_suggestions`

Returns recommended models for a tier with scores and pricing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `tier` | `"LIGHT" \| "MEDIUM" \| "HEAVY"` | Yes | Complexity tier |
| `preferred_provider` | `"anthropic" \| "google" \| "zai" \| "xai" \| "openai"` | No | Provider to highlight |

**Provider mapping:**

| You are | Pass as `preferred_provider` |
|---------|------------------------------|
| Claude | `anthropic` |
| Gemini | `google` |
| GLM | `zai` |
| Grok | `xai` |
| GPT | `openai` |

**Example:**

```json
{ "tier": "MEDIUM", "preferred_provider": "anthropic" }
```

**Response:**

```json
{
  "tier": "MEDIUM",
  "updated_at": "2026-05-02",
  "data_source": "cache",
  "suggested_first": "claude",
  "models": {
    "claude": { "name": "Claude Sonnet 4.6 (max)", "score": 51.7, "price_blended_usd_per_1m": 6.56 },
    "gemini": { "name": "Gemini 3 Flash Preview", "score": 46.4, "price_blended_usd_per_1m": 1.13 },
    "glm": { "name": "GLM-5 (Reasoning)", "score": 49.8, "price_blended_usd_per_1m": 1.55 },
    "grok": { "name": "Grok 4.1 Fast (Reasoning)", "score": 38.6, "price_blended_usd_per_1m": 0.28 },
    "openai": { "name": "GPT-5.4 mini (xhigh)", "score": 48.9, "price_blended_usd_per_1m": 1.69 }
  }
}
```

### `format_plan_block`

Generates the formatted classification block to append at the end of a plan.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `tier` | `"LIGHT" \| "MEDIUM" \| "HEAVY"` | Yes | Complexity tier |
| `reason` | string | Yes | Technical reason for classification |
| `estimated_files` | string | Yes | Estimated files affected |
| `estimated_tokens` | string | Yes | Estimated tokens to generate |
| `preferred_provider` | string | No | Provider to highlight |

**Example:**

```json
{
  "tier": "MEDIUM",
  "reason": "Inclusion of complex business rules/validations",
  "estimated_files": "2–5",
  "estimated_tokens": "200–800",
  "preferred_provider": "anthropic"
}
```

**Response:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tier     : MEDIUM
Reason   : Inclusion of complex business rules/validations
Files    : ~2–5 files | ~200–800 tokens generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 SUGGESTED MODELS FOR EXECUTION
Claude   : Claude Sonnet 4.6 (max) ✨ (Suggested for your environment)
Gemini   : Gemini 3 Flash Preview
GLM      : GLM-5 (Reasoning)
Grok     : Grok 4.1 Fast (Reasoning)
GPT      : GPT-5.4 mini (xhigh)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## How It Works

### Recommended workflow (MCP tools available)

1. The AI produces a multi-step action plan
2. Calls `classify_task` with the task description
3. Calls `get_model_suggestions` with the returned tier
4. Calls `format_plan_block` to generate the output block
5. Appends the block at the end of the plan

### Fallback workflow (skill only, no MCP)

If the MCP server is not configured, the skill contains the full classification criteria and model tables. The AI classifies manually using the regex patterns and hardcoded data in `SKILL.md`.

---

## Cache and Offline Support

Model data follows a 3-tier data strategy:

1. **Cache** — check `~/.oracle-models/cache.json` (7-day TTL)
2. **Live** — fetch from [Artificial Analysis API v2](https://artificialanalysis.ai/api/v2/data/llms/models) (requires `AA_API_KEY`)
3. **Fallback** — use bundled `data/fallback.json`

If the remote source is unreachable or no API key is configured, the server transparently uses fallback data.

### Live Data Setup (Optional)

To enable live model data updates from Artificial Analysis:

1. Create a free account at [https://artificialanalysis.ai/login](https://artificialanalysis.ai/login)
2. Generate an API key in the Insights Platform
3. Set the `AA_API_KEY` environment variable:

```bash
export AA_API_KEY=your_api_key_here
```

Or configure in your MCP setup:

```json
{
  "mcpServers": {
    "oracle-models": {
      "command": "npx",
      "args": ["-y", "oracle-models-mcp"],
      "env": {
        "AA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

- **Rate limit:** 1,000 requests/day (free tier)
- **Cache:** 7 days locally
- **Attribution:** Data sourced from [artificialanalysis.ai](https://artificialanalysis.ai/)
- **Without API key:** The server uses bundled fallback data (updated periodically)

---

## Classification Criteria

| Tier | Profile | Triggers | Expected scope |
|------|---------|----------|----------------|
| **LIGHT** | Low-entropy deterministic transformation | ≥2 of: literal change, style-only, rename, form field, route adjust, i18n, copy/adapt, typo | 1–2 files, <200 tokens |
| **MEDIUM** | New logic in a delimited scope | ≥2 of: new component/state, signature change, complex validation, new endpoint, hook/composable, feature flag, data migration, pagination/filter, bug fix ≤3 files, simple infra | 2–5 files, 200–800 tokens |
| **HEAVY** | High decision entropy, systemic risk | ≥1 of: shared logic extraction ≥3 consumers, architecture redesign, auth/security, external integration, non-deterministic bugs, DB schema migration, performance profiling, billing/payment, data pipeline/ETL, security/compliance domain, full dependency graph refactoring | 5+ files, 800+ tokens |

---

## Development

```bash
npm install
npm run build
npm run start
```

### Publishing

The MCP server is published on npm as `oracle-models-mcp`:

```bash
npm run build
npm publish
```

The skill is distributed via GitHub and [skills.sh](https://skills.sh). Users install with:

```bash
npx skills add vanppsa/oracle-models -g -y
```

No manual registration is needed — skills appear on the leaderboard automatically as users install them via the CLI.

---

## License

MIT
