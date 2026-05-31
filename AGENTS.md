# AGENTS.md — Oracle Models MCP

## Project Overview

This project implements a **Model Context Protocol (MCP)** server that classifies development tasks into three tiers (**LIGHT**, **MEDIUM**, **HEAVY**) based on technical complexity and suggests the most cost-efficient AI models from providers like Anthropic (Claude), Google (Gemini), OpenAI (GPT), xAI (Grok), DeepSeek, and others.

### Key Technologies
- **TypeScript**: Main development language.
- **Node.js**: Runtime environment.
- **MCP SDK**: For server implementation and tool communication.
- **Undici**: For handling HTTP requests to fetch live model data.

### Architecture
- `src/index.ts`: Entry point that initializes the server and detects client environment.
- `src/server.ts`: Defines MCP tools (`classify_task`, `get_model_suggestions`, `format_plan_block`) and handles requests.
- `src/classify.ts`: Contains the heuristic logic and regex patterns for task classification. **English-only patterns.**
- `src/models.ts`: Manages model data, client detection (native vs aggregator), local caching (`~/.oracle-models/cache.json`), and live data fetching.
- `src/format.ts`: Logic for formatting output blocks.
- `data/fallback.json`: Built-in model data used when live fetching fails.

---

## Building and Running

### Build
To compile the TypeScript source into the `dist/` directory:
```bash
npm run build
```

### Development
To watch for changes and recompile automatically:
```bash
npm run dev
```

### Running the Server
The server runs via Node.js:
```bash
npm start
```

### Testing
Manual verification via MCP clients (Claude Code, Gemini CLI, Cursor, OpenCode) is the current practice. No automated test suite configured.

---

## Development Conventions

### Task Classification (Heuristics)

Classification is driven by regex patterns in `src/classify.ts`. **All patterns are in English.** Non-English descriptions must be normalized to English before classification.

#### Decision Flow (top-down, pessimistic)
1. **Critical domain match?** → HEAVY (score 100, immediate return)
2. **Description length > 3000 chars?** → HEAVY (score 100, immediate return)
3. **Accumulated score >= 40?** → HEAVY
4. **Accumulated score >= 20?** → MEDIUM
5. **Penalty keywords OR (files >= 2 AND criteriaScore >= 5)?** → MEDIUM
6. **Otherwise** → LIGHT

#### Critical Domains (automatic HEAVY)
- Auth/security: `authentication`, `authorization`, `oauth`, `jwt`, `token`
- Financial: `billing`, `payment`, `stripe`, `checkout`, `invoice`
- Data: `schema migration`, `database in production`
- Security: `cryptography`, `encrypt`, `decrypt`, `compliance`, `lgpd`, `gdpr`
- Architecture: `extract logic`, `architecture redesign`, `dependency graph`
- Debugging: `memory leak`, `race condition`, `non-deterministic`
- Infrastructure: `data pipeline`, `etl`, `async worker`

#### Scoring Weights
- **HEAVY criteria:** +25 to +30 points each
- **MEDIUM criteria:** +10 to +15 points each
- **LIGHT criteria:** +3 to +5 points each
- **Penalty keywords:** +15 to +25 points (prevent LIGHT classification)
- **Files bonus:** +5 (2 files), +15 (3 files), +30 (5+ files)

#### criteriaScore vs Total Score
- **criteriaScore**: Sum of matches from HEAVY/MEDIUM/LIGHT criteria and penalty keywords
- **Total score**: criteriaScore + files_affected bonus
- **Safety net**: `files >= 2` upgrades to MEDIUM **only if** `criteriaScore >= 5`

This prevents tasks with zero criteria matches (e.g., "adjust system behavior") from being upgraded to MEDIUM solely due to affecting multiple files.

### English-Only Patterns
**All classification patterns are in English.** Before calling `classify_task`, normalize non-English task descriptions to English:
- "validação de email" → "email validation"
- "mudar cor do botão" → "change button color"
- "refatorar autenticação" → "refactor authentication"

This ensures patterns match correctly. The MCP server does not perform automatic translation.

### Model Suggestions & Caching
- Data is fetched from [Artificial Analysis API v2](https://artificialanalysis.ai/api/v2/data/llms/models).
- Caching is OS-agnostic, stored in `~/.oracle-models/cache.json`.
- Cache expiration is set to 7 days (`CACHE_EXPIRATION_MS`).
- Fallback logic ensures reliability when offline or when API fetch fails.

### Client Detection
The server auto-detects the MCP client during initialization:
- **Native clients** (Claude Code, Gemini CLI, Codex): Receive only their provider's models.
- **Aggregator clients** (OpenCode, Cursor, Cline, etc.): Receive best 4 models across all providers, with at least 1 open-source model (DeepSeek prioritized).

### Coding Standards
- Use **UTF-8** for all source files.
- Adhere to **TypeScript** best practices for type safety.
- **Tool Definitions**: When updating tools in `src/server.ts`, ensure descriptions are clear and include usage hints.

### Deployment / Distribution
- The project is designed to be run as an npx package: `oracle-models-mcp`.
- Ensure `dist/index.js` is up-to-date before publishing.
- Version is synced across `package.json`, `src/server.ts`, and `SKILL.md` via the version script.

---

## Usage in MCP Clients

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

### Antigravity CLI
**Workspace:** Add to `.agents/mcp_config.json`:
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

### Claude Code
```bash
claude mcp add oracle-models -- npx -y oracle-models-mcp
```

### Cursor / Cline / Windsurf
Add to editor's MCP configuration:
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

---

## Live Data Setup (Optional)

To enable live model data updates from Artificial Analysis API:

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
- **Cache:** 7 days locally in `~/.oracle-models/cache.json`
- **Attribution:** Data sourced from [artificialanalysis.ai](https://artificialanalysis.ai/)

---

## Version History

- **v2.0.0**: criteriaScore separation, English-only patterns, client detection for 10 providers
- **v1.3.0**: Antigravity CLI support with dual Gemini compatibility
- **v1.2.4**: README agent compatibility table and MCP setup refactor
- **v1.2.0**: Execution-focused classification, weighted scoring engine
- **v1.1.0**: Enhanced classification criteria and mandatory invocation protocol
- **v1.0.1**: OpenAI/GPT provider and AA API v2 integration
- **v1.0.0**: Initial release with technical criteria
