# Oracle Models

[![npm](https://img.shields.io/npm/v/oracle-models-mcp?label=npm)](https://www.npmjs.com/package/oracle-models-mcp) [![skills](https://img.shields.io/badge/skills.sh-installable-blue)](https://skills.sh) [![MCP](https://img.shields.io/badge/MCP-compatible-green)](https://modelcontextprotocol.io) [![license](https://img.shields.io/badge/license-MIT-brightgreen)](./LICENSE)

Classifies development task complexity (LIGHT/MEDIUM/HEAVY) and suggests the most cost-efficient AI model — with **client auto-detection** that filters suggestions to match your environment.

**10 providers:** Claude (Anthropic), Gemini (Google), GPT (OpenAI), Grok (xAI), **DeepSeek**, **Kimi** (Moonshot), **Qwen** (Alibaba), **Llama** (Meta), **Mistral**, GLM (Z.ai).

Data sourced from the [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/leaderboards/models).

---

## Agent Compatibility

| Agent | MCP Server | Skill | Install command |
|-------|:----------:|:-----:|-----------------|
| [OpenCode](https://opencode.ai) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a opencode -y` |
| [Antigravity CLI](https://antigravity.google) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a antigravity-cli -y` |
| [Gemini CLI](https://geminicli.com) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a gemini-cli -y` |
| [Claude Code](https://claude.com/product/claude-code) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a claude-code -y` |
| [Codex](https://openai.com/codex) | Yes | Yes | `npx skills add vanppsa/oracle-models -g -a codex -y` |

> **Other Compatible Agents:** Cursor, Cline, Windsurf, Roo Code, Goose, Kiro CLI, Amp, Augment, Trae, GitHub Copilot, VS Code Copilot.
>
> To install for other agents, use the same command format: `npx skills add vanppsa/oracle-models -g -a <agent-name> -y`.

---

## Client Auto-Detection

Oracle Models automatically detects your MCP client during initialization and tailors model suggestions:

**Native clients** (Claude Code, Gemini CLI, Antigravity CLI, Codex) — returns only your provider's models. No noise.

**Aggregator clients** (OpenCode, Cursor, Cline, etc.) — returns the best 4 models across all providers, with at least 1 open-source model. DeepSeek is prioritized as best value.

**Unknown clients** — treated as aggregators.

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

### Antigravity CLI
Antigravity CLI stores MCP servers in a dedicated `mcp_config.json` file. You can configure it globally or per workspace.

**Workspace (recommended):** Add to `.agents/mcp_config.json`:

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

**Global:** Add to `~/.gemini/antigravity-cli/mcp_config.json`:

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
agy mcp add oracle-models -- npx -y oracle-models-mcp
```

> **Note:** For remote MCP servers, Antigravity CLI uses `serverUrl` instead of `url`.

### Gemini CLI
> **Deprecation notice:** Gemini CLI will be fully migrated to Antigravity CLI on **June 18th**. The configuration below remains valid until then.

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

Classifies a development task by complexity using a weighted scoring engine with critical domain detection, penalty keywords, and entropy analysis.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `description` | string | Yes | Natural language description of the task |
| `files_affected` | number | No | Estimated number of affected files |
| `description_length` | number | No | Character count of the full task description if providing a summary. Used for entropy detection — long plans are automatically upgraded |

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
  "estimated_tokens": "200–800",
  "score": 15
}
```

### `get_model_suggestions`

Returns recommended models for a tier. **Auto-detects your client environment** and filters accordingly.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `tier` | `"LIGHT" \| "MEDIUM" \| "HEAVY"` | Yes | Complexity tier |
| `preferred_provider` | string | No | Provider to highlight. One of: `anthropic`, `google`, `zai`, `xai`, `openai`, `deepseek`, `moonshot`, `alibaba`, `meta`, `mistral` |

**Response (aggregator client — e.g., OpenCode):**

```json
{
  "tier": "HEAVY",
  "updated_at": "2026-05-20",
  "data_source": "fallback",
  "client_detected": "opencode",
  "client_type": "aggregator",
  "client_label": "OpenCode",
  "models": {
    "openai": { "name": "GPT-5.5 (xhigh)", "score": 60, "price": 4.35, "speed": 659, "price_blended_usd_per_1m": 4.35 },
    "anthropic": { "name": "Claude Opus 4.7 (max)", "score": 57, "price": 4.10, "speed": 512, "price_blended_usd_per_1m": 4.10 },
    "moonshot": { "name": "Kimi K2.6", "score": 54, "price": 0.70, "speed": 972, "price_blended_usd_per_1m": 0.70 },
    "deepseek": { "name": "DeepSeek V4 Pro (Max)", "score": 52, "price": 0.71, "speed": 302, "price_blended_usd_per_1m": 0.71 }
  },
  "suggested_first": "openai"
}
```

**Response (native client — e.g., Claude Code):**

```json
{
  "tier": "HEAVY",
  "updated_at": "2026-05-20",
  "data_source": "fallback",
  "client_detected": "claude-code",
  "client_type": "native",
  "native_provider": "anthropic",
  "client_label": "Claude Code",
  "models": {
    "anthropic": { "name": "Claude Opus 4.7 (max)", "score": 57, "price": 4.10, "speed": 512, "price_blended_usd_per_1m": 4.10 }
  },
  "suggested_first": "anthropic"
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

**Response:**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tier     : MEDIUM
Reason   : Inclusion of complex business rules/validations
Files    : ~2–5 files | ~200–800 tokens generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 SUGGESTED MODELS FOR EXECUTION (OpenCode)
GPT       : GPT-5.4 mini (xhigh) ✨ (Suggested for your environment)
DeepSeek  : DeepSeek V4 Flash (Max)
Gemini    : Gemini 3 Flash
GLM       : GLM-5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## How It Works

**Oracle Models** ensures you use the right AI model for the right job. It distinguishes between **planning** (designing the solution) and **execution** (actually writing the code or configuring the system).

### Recommended workflow (MCP tools available)

1. The AI produces a multi-step action plan.
2. **Classification**: The AI calls `classify_task` to evaluate the complexity of **EXECUTING** the plan it just wrote.
3. **Suggestion**: The AI calls `get_model_suggestions` to find the best models for that specific execution tier. Client auto-detection filters the results.
4. **Integration**: The AI appends the formatted classification block at the end of the response.

### Fallback workflow (skill only, no MCP)

If the MCP server is not configured, the skill contains the full classification criteria and model tables. The AI classifies manually using the rules defined in `SKILL.md`.

---

## Classification Engine

The classification ALWAYS refers to the complexity of **executing** the plan. The engine uses a weighted scoring system with a pessimistic top-down decision flow.

### Decision Flow (top-down, pessimistic)

1. **Critical domain match?** → HEAVY (stops here)
2. **Description length > 3000 chars?** → HEAVY (stops here)
3. **Accumulated score >= 40?** → HEAVY
4. **Accumulated score >= 20?** → MEDIUM
5. **Penalty keywords OR (files >= 2 AND criteriaScore >= 5)?** → MEDIUM
6. **Otherwise** → LIGHT

> **Important:** The `files >= 2` safety net requires `criteriaScore >= 5` — at least one criterion must match. Tasks with zero criteria matches remain LIGHT even if affecting multiple files.

### Critical Domains (automatic HEAVY)

Any match forces HEAVY regardless of other criteria: auth/security, payment/billing/financial, schema migration/database, cryptography, compliance (LGPD/GDPR), architecture redesign, non-deterministic debugging, data pipeline/ETL.

### Penalty Keywords (disqualify LIGHT)

These terms prevent LIGHT classification: `export interface/type/enum`, `public api`, `breaking change`, `import from shared/core`, entry files (`index.ts`, `types.ts`, `main.ts`), state management (Redux, Zustand, Context API), database terms, secrets/credentials.

### Scoring Overview

**HEAVY criteria (+25-30 pts each):** Architectural changes, auth/security, external integration, non-deterministic bugs, DB migration, performance profiling, billing/payment, data pipelines, state management architecture, wide-scope refactoring.

**MEDIUM criteria (+10-15 pts each):** New component with state, signature change, complex validation, new endpoint, hook/composable, feature flag, data migration, pagination/filter/sort, bug fix, Docker/infra, test suite, config changes, error handling, code restructuring, third-party API integration.

**LIGHT criteria (+3-5 pts each):** Literal value change, CSS/style, safe rename, form field, route adjust, translation/i18n, documentation, dependency update, typo.

**Entropy bonuses:** Description > 1500 chars (+15), > 3000 chars (auto HEAVY). Files >= 5 (+30), >= 3 (+15), >= 2 (+5).

### English-Only Patterns

**All classification patterns are in English.** Before calling `classify_task`, normalize non-English task descriptions to English (e.g., "validação de email" → "email validation"). This ensures patterns match correctly.

### LIGHT Sanitary Filter

A task is only LIGHT if it passes ALL: no penalty keywords, < 2 files, criteriaScore < 5, total score < 20, no critical domain match.

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

## Why Reinforce in Agent Instructions?

**AI agents are autonomous — they choose whether or not to call MCP tools. No skill can force them.**

Oracle Models injects behavioral instructions into the agent's context, telling it when and how to classify tasks. However:

- **The agent decides** whether to follow these instructions on each turn.
- Compliance varies by model, provider, context window, conversation history, and agent configuration.
- Even when the skill says "mandatory," the agent may skip the workflow — intentionally or by oversight.
- This is not a bug. It is inherent to how LLM-based agents work: they interpret instructions, they do not execute them deterministically.

### How to increase compliance

Add the reinforcement block below to your project's agent instruction file. This gives the agent **two independent signals** — one from the skill, one from your instructions — significantly increasing the chance it follows through.

**Where to add it:**

- **OpenCode:** `AGENTS.md` (global or per-project)
- **Claude Code:** `CLAUDE.md`
- **Gemini CLI:** `GEMINI.md`
- **Cursor:** `.cursorrules`
- **Windsurf:** `.windsurfrules`
- **Cline:** `.clinerules`
- **Roo Code:** `.roorules`
- **Codex:** `AGENTS.md` or `codex.md`

### Reinforcement template

Copy and paste this block into your agent's instruction file:

```markdown
## Oracle Models — Mandatory Plan Classification

**RULE:** Every time my response contains a sequence of implementation steps (Step 1, Step 2... or a list of actions the user will execute), I MUST finalize the response with the Oracle Models classification block.

**NOT required** when: response is explanation only, conversation, or direct code edit without a prior plan.

**Mandatory workflow at the end of every plan:**
1. **Normalize description to English** (if task is in another language, translate core intent: "traduzir" → "translate", "validação de email" → "email validation")
2. Call `oracle-models > classify_task` with a description of the EXECUTION (not the planning)
3. Call `oracle-models > get_model_suggestions` with the returned tier
4. Compose and append the block below at the end of the response:

### TASK CLASSIFICATION
- **Tier:** `[LIGHT | MEDIUM | HEAVY]`
- **Reason:** [Technical phrase referencing the determining criteria of the plan's EXECUTION]
- **Estimated Scope:** ~[N] files | ~[N] tokens generated

### SUGGESTED MODELS FOR EXECUTION
[Provider] : [model] | [Provider] : [model] | ...

> **Note:** The classification refers to the complexity of **executing** this plan, not creating it.
```

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
