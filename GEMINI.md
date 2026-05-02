# GEMINI.md — Oracle Models MCP

## Project Overview
This project implements a **Model Context Protocol (MCP)** server that classifies development tasks into three tiers (**LIGHT**, **MEDIUM**, **HEAVY**) based on technical complexity and suggests the most cost-efficient AI models from providers like Anthropic (Claude), Google (Gemini), GLM, and xAI (Grok).

### Key Technologies
- **TypeScript**: Main development language.
- **Node.js**: Runtime environment.
- **MCP SDK**: For server implementation and tool communication.
- **Undici**: For handling HTTP requests to fetch live model data.

### Architecture
- `src/index.ts`: Entry point that initializes the server.
- `src/server.ts`: Defines MCP tools (`classify_task`, `get_model_suggestions`, `format_plan_block`) and handles requests.
- `src/classify.ts`: Contains the heuristic logic and regex patterns for task classification.
- `src/models.ts`: Manages model data, local caching (`~/.oracle-models/cache.json`), and scraping/fallback logic.
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
- **TODO**: No explicit test suite (e.g., Jest, Vitest) found in `package.json`. Manual verification via MCP clients (Claude Code, Gemini CLI, Cursor) is the current practice.

---

## Development Conventions

### Task Classification (Heuristics)
Classification is driven by regex patterns in `src/classify.ts`:
- **HEAVY**: High-risk domains (Auth, Payments, Security), architectural changes, or tasks affecting 5+ files.
- **MEDIUM**: New features/components with state, complex business rules, or tasks affecting 2-4 files.
- **LIGHT**: Static value changes, CSS/styling, simple layout adjustments, or tasks affecting 1 file.

### Model Suggestions & Caching
- Data is fetched from sources like Artificial Analysis.
- Caching is OS-agnostic, stored in `~/.oracle-models/cache.json`.
- Cache expiration is set to 7 days (`CACHE_EXPIRATION_MS`).
- Fallback logic ensures reliability when offline or when scraping fails (common with SPAs).

### Coding Standards
- Use **UTF-8** for all source files.
- Adhere to **TypeScript** best practices for type safety.
- **Tool Definitions**: When updating tools in `src/server.ts`, ensure descriptions include self-identification hints for AI models (e.g., "If you are Claude → pass preferred_provider: 'anthropic'").

### Deployment / Distribution
- The project is designed to be run as an npx package: `@oracle-models/mcp`.
- Ensure `dist/index.js` is up-to-date before publishing.

---

## Usage in Gemini CLI
Add to `~/.gemini/settings.json`:
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
