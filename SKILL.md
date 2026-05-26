---
name: oracle-models
description: Classifies development task complexity (LIGHT/MEDIUM/HEAVY) and suggests cost-efficient AI models per provider. Auto-detects MCP client environment for tailored suggestions. Activates only during plan mode. Models ranked by artificialanalysis.ai Intelligence Index. Updatable by any AI without manual reconfiguration. Works as both a skill (behavioral instructions) and an MCP server (live tools).
license: MIT
compatibility: opencode
metadata:
  author: vanppsa
  version: "2.0.0"
  audience: developers
---

# ORACLE MODELS

> Behavioral instruction set for AI development assistants.
> Version: 2.0.0 | Last updated: 2026-05-20

---

## ACTIVATION RULE

**THIS SKILL IS MANDATORY IN PLAN MODE.**

When plan mode is active, you MUST execute the oracle workflow before presenting any plan:
1. classify_task (the execution of the plan)
2. get_model_suggestions (for the returned tier)
3. Append the output block at the end of the plan

This is not optional. Every plan ends with an oracle classification.

Apply this workflow ONLY when producing:
- A multi-step action plan (e.g., "Step 1... Step 2... Step 3...")
- An analysis of how to implement a feature, fix, or refactor
- A response describing WHAT will be done BEFORE doing it

**DO NOT apply on:**
- Direct one-line responses (unless the user explicitly invokes the skill)
- During code execution (ACT mode)
- During one-off edits without prior planning
- Conceptual or explanatory questions without an associated task

---

## CRITICAL: CLASSIFY THE EXECUTION, NOT THE PLANNING

**The classification ALWAYS refers to executing the plan — never to the act of writing or creating the plan.**

If you just produced a plan for "how to install an Android emulator", the correct question is:
> "How complex is it TO EXECUTE this installation?" → classify the installation.

**WRONG:** `reason: "Planning task — research and recommendation for X"` ← this describes writing the plan, not executing it.

**CORRECT:** `reason: "System configuration involving GPU drivers and multiple tools on Linux"` ← this describes executing the plan.

Apply this rule regardless of whether the plan is for code, infra, configuration, or research.

---

## CRITICAL: NORMALIZE TO ENGLISH BEFORE CLASSIFYING

**Before calling `classify_task`, normalize non-English task descriptions to English.**

The pattern matching engine uses English as the **primary language**. PT-BR and ES patterns are included as fallback, but relying on them reduces accuracy.

**WRONG:** Passing `"Adicionar validação de email no formulário"` directly → may miss English-first patterns.

**CORRECT:** Translate core intent first: `"Adicionar validação de email"` → `"Add email validation to form"` → then classify.

This ensures consistent matching against the weighted criteria (validation, business rules, form fields, etc.).

---

## CRITICAL: NEVER INJECT RAW TOOL OUTPUT

When using MCP tools (`format_plan_block`, `get_model_suggestions`, etc.), **never paste the raw tool call output directly into the response**.

**WRONG:** Exposing the raw tool invocation in the response text instead of composing the formatted block.

**CORRECT:**
1. Call the tool internally.
2. Capture the returned data (tier, reason, models, etc.).
3. Manually compose the final block following the OUTPUT BLOCK FORMAT defined in this skill.
4. Append the composed block at the end of your plan response.

After calling classify_task and get_model_suggestions, you MUST write the formatted output block in your response text. The tool call appearing in the UI does not replace the block — both must exist.

The formatted block must always be clean markdown, integrated into the response — not a raw tool invocation dump.

---

## CLIENT DETECTION

The MCP server auto-detects your client environment during initialization. Based on the detected client, model suggestions are filtered:

### Native Clients (single provider)
These clients only have access to their own provider's models. Oracle returns only that provider's best model for the tier.

| Client | Provider | Suggested models |
|--------|----------|------------------|
| Claude Code | Anthropic (Claude) | Only Claude models |
| Gemini CLI | Google (Gemini) | Only Gemini models |
| Antigravity CLI | Google (Gemini) | Only Gemini models |
| Codex | OpenAI (GPT) | Only GPT models |

### Aggregator Clients (all providers)
These clients access models through OpenRouter or similar gateways. Oracle returns the best 4 models across all providers with diversity (at least 1 open-source, DeepSeek prioritized).

| Client | Access |
|--------|--------|
| OpenCode | All 10 providers |
| Cursor | All 10 providers |
| Cline | All 10 providers |
| Windsurf | All 10 providers |
| Roo Code | All 10 providers |
| GitHub Copilot | All 10 providers |
| Goose | All 10 providers |
| Kiro CLI | All 10 providers |
| Aider | All 10 providers |

### Unknown Clients
If the client is not recognized, Oracle treats it as an aggregator and returns the best 4 models.

---

## MCP TOOLS (PREFERRED)

If the Oracle Models MCP server is available (configured as `oracle-models` in MCP settings), use these tools instead of manual classification.

### Mandatory workflow with MCP tools

Execute in order at the END of the plan:

**Step 0 — Normalize description to English (if needed):**
> Before calling `classify_task`, normalize the task description to English if it's in another language (e.g., "traduzir" → "translate", "validação de email" → "email validation"). This ensures patterns match correctly. PT/ES patterns are included as fallback, but English is the primary matching language.

**Step 1 — Classify the EXECUTION of the plan:**
```
classify_task(description: string, files_affected?: number, description_length?: number)
→ { tier, reason, estimated_files, estimated_tokens, score }
```
> The `description` must describe the execution, not the planning. See "CLASSIFY THE EXECUTION" section above.

**Step 2 — Get model suggestions for the returned tier:**
```
get_model_suggestions(tier: "LIGHT" | "MEDIUM" | "HEAVY", preferred_provider?: string)
→ { tier, updated_at, data_source, client_detected, client_type, models, suggested_first? }
```
> Client detection is automatic. Pass `preferred_provider` only to override highlighting.

**Step 3 — Compose the output block manually using the returned data:**
> Do NOT paste raw tool output. Use the tool return values to fill the OUTPUT BLOCK FORMAT below.

### `format_plan_block` (optional helper)
```
format_plan_block(tier, reason, estimated_files, estimated_tokens, preferred_provider?)
→ formatted markdown string
```
> If using this tool, capture the returned string and embed it cleanly in your response. Never expose the tool call itself.

### `preferred_provider` mapping

| You are | Pass as preferred_provider |
|---------|---------------------------|
| Claude (Anthropic) | `anthropic` |
| Gemini (Google) | `google` |
| GLM (Z.ai) | `zai` |
| Grok (xAI) | `xai` |
| GPT (OpenAI) | `openai` |
| DeepSeek | `deepseek` |
| Kimi (Moonshot) | `moonshot` |
| Qwen (Alibaba) | `alibaba` |
| Llama (Meta) | `meta` |
| Mistral | `mistral` |

---

## PROVIDERS

Oracle Models covers 10 providers across 3 categories:

### Proprietary
- **Claude** (Anthropic)
- **Gemini** (Google)
- **GPT** (OpenAI)
- **Grok** (xAI)

### Open-source
- **DeepSeek** — prioritized as best value open-source
- **Kimi** (Moonshot)
- **Qwen** (Alibaba)
- **Llama** (Meta)
- **Mistral**

### National
- **GLM** (Z.ai)

---

## LIVE DATA VIA API (OPTIONAL)

The MCP server can fetch live model data from the Artificial Analysis API.

### Setup

1. Create a free account at [https://artificialanalysis.ai/login](https://artificialanalysis.ai/login)
2. Generate an API key in the Insights Platform
3. Set the environment variable:
   ```bash
   export AA_API_KEY=your_api_key_here
   ```
4. The MCP server will automatically fetch live data and cache it for 7 days

### Without API key

If `AA_API_KEY` is not configured, the server uses local fallback data from `data/fallback.json`. This data is updated periodically but may not reflect the latest model releases or score changes.

### API details

- **Endpoint:** `https://artificialanalysis.ai/api/v2/data/llms/models`
- **Auth:** `x-api-key` header
- **Rate limit:** 1,000 requests/day (free tier)
- **Cache:** 7 days locally in `~/.oracle-models/cache.json`
- **Attribution:** Data sourced from [artificialanalysis.ai](https://artificialanalysis.ai/)

---

## Classification Engine

The classification engine uses a **weighted scoring system** with a pessimistic top-down decision flow. Tasks are never classified as LIGHT by default — they must pass strict sanitary filters.

### Decision Flow (top-down, pessimistic)

1. **Critical domain match?** → HEAVY (stops here)
2. **Description length > 3000 chars?** → HEAVY (stops here)
3. **Accumulated score >= 40?** → HEAVY
4. **Accumulated score >= 20?** → MEDIUM
5. **Penalty keywords detected or >= 2 files?** → MEDIUM
6. **Otherwise** → LIGHT

### Critical Domains (automatic HEAVY)

Any match on these domains forces HEAVY regardless of other criteria:

- **Security:** auth, authentication, authorization, session, oauth, jwt, token management, rbac, permission, role-based
- **Financial:** payment, billing, stripe, checkout, invoice, card, financial flow
- **Data:** schema migration, database in production, migrate
- **Cryptography:** encrypt, decrypt, hash, cryptography
- **Compliance:** lgpd, gdpr, audit log, compliance
- **Architecture:** architecture redesign, extract shared logic, dependency graph refactoring
- **Infrastructure:** memory leak, race condition, non-deterministic, performance profiling
- **Async processing:** data pipeline, etl, async worker, retry/fallback

### Penalty Keywords (disqualify LIGHT)

These terms add penalty points and prevent LIGHT classification:

- Public interface changes: `export interface`, `export type`, `export enum`, `public api`
- Breaking changes: `breaking change`, `breaking`
- Core modules: `core module`, `core service`, `import from shared`, `import from core`
- Entry files: `index.ts`, `index.js`, `types.ts`, `main.ts`, `main.js`
- State management: `redux`, `zustand`, `context api`, `store`
- Database: `database`, `sql`, `schema`, `prisma`, `alembic`
- Secrets: `secret`, `api key`, `credential`

### Scoring Weights

**HEAVY criteria (+25-30 pts each):**
- Architectural redesign or shared logic extraction
- Authentication, authorization, security domains
- External system integration (webhooks, API contracts)
- Non-deterministic debugging (race conditions, memory leaks)
- Database schema migration in production
- Performance optimization requiring profiling
- Billing/payment/financial flows
- Data pipelines, ETL, async workers
- State management architecture changes
- Wide-scope refactoring of dependency graphs

**MEDIUM criteria (+10-15 pts each):**
- New component/function/module with internal state
- Function signature changes or contract refactoring
- Complex validation or business rules
- New endpoint integration
- Hook/composable creation with dependencies
- Feature flags, toggles, conditional logic
- Data migration with transformation
- Pagination, filtering, sorting
- Delimited bug fixes
- Docker/proxy/simple infrastructure config
- Test suite implementation
- Environment/config changes
- Error handling implementation
- Code restructuring requiring dependency analysis
- Third-party API integration

**LIGHT criteria (+3-5 pts each):**
- Literal value changes (string, number, boolean)
- CSS/styling changes without logic impact
- Safe renaming without public interface impact
- Form field addition/removal without validation
- Route adjustments
- Translation/i18n
- Documentation/README/JSDoc
- Dependency updates
- Typo corrections

**Entropy bonuses:**
- Description length > 1500 chars: +15 pts
- Description length > 3000 chars: automatic HEAVY
- Files affected >= 5: +30 pts
- Files affected >= 3: +15 pts
- Files affected >= 2: +5 pts

### LIGHT Sanitary Filter

A task is only classified as LIGHT if it passes ALL of these checks:
- No penalty keyword matches
- Files affected < 2 (or undefined)
- Total score < 20
- No critical domain match

---

## Multilingual Pattern Support

The classification engine includes patterns in **English (primary)**, **Portuguese (PT-BR)**, and **Spanish (ES)** for the following criteria:

- **Validation:** `validate`, `validação`, `validación`, `validar` + targets (email, phone, password, field, form, etc.)
- **Component/Function creation:** `new component`, `novo componente`, `nuevo componente`
- **Refactoring:** `refactor`, `refatorar`, `refactorar`
- **Tests:** `unit test`, `teste de unidade`, `test de integracion`
- **Error handling:** `error handling`, `tratamento de erro`, `manejo de errores`
- **And 10+ more criteria across MEDIUM and LIGHT tiers**

**Important:** While PT-BR and ES patterns are included as fallback, **always normalize task descriptions to English before classification** for maximum accuracy. Non-English patterns are safety nets, not the primary matching strategy.

- Independent methodology (not self-reported by providers)
- Covers: Intelligence Index, blended price, speed (tokens/s), latency
- Continuous updates with 350+ tracked models
- To update models: access the site, filter by company, and replace entries in the table below

---

### MODEL TABLE (May 2026)

#### HEAVY Tier (highest_score — best Intelligence Index per provider)

| Provider | Model | AA Score | $/1M tokens |
|----------|-------|----------|-------------|
| Claude (Anthropic) | Claude Opus 4.7 (max) | 57 | $4.10 |
| Gemini (Google) | Gemini 3.1 Pro Preview | 57 | $1.74 |
| GPT (OpenAI) | GPT-5.5 (xhigh) | 60 | $4.35 |
| Grok (xAI) | Grok 4.3 (high) | 53 | $0.64 |
| DeepSeek | DeepSeek V4 Pro (Max) | 52 | $0.71 |
| Kimi (Moonshot) | Kimi K2.6 | 54 | $0.70 |
| Qwen (Alibaba) | Qwen3.6 Plus | 50 | $0.43 |
| Llama (Meta) | Muse Spark | 52 | $0.34 |
| Mistral | Mistral Medium 3.5 | 39 | $2.10 |
| GLM (Z.ai) | GLM-5.1 | 51 | $0.90 |

#### MEDIUM Tier (best_midrange — best score/cost ratio per provider)

| Provider | Model | AA Score | $/1M tokens |
|----------|-------|----------|-------------|
| Claude (Anthropic) | Claude Sonnet 4.6 (max) | 52 | $2.46 |
| Gemini (Google) | Gemini 3 Flash | 46 | $0.43 |
| GPT (OpenAI) | GPT-5.4 mini (xhigh) | 49 | $0.65 |
| Grok (xAI) | Grok 4.1 Fast | 39 | $0.28 |
| DeepSeek | DeepSeek V4 Flash (Max) | 47 | $0.06 |
| Kimi (Moonshot) | Kimi K2.6 (Non-reasoning) | 43 | $0.70 |
| Qwen (Alibaba) | Qwen3.6 35B A3B | 43 | $0.37 |
| Llama (Meta) | Llama 4 Maverick | 18 | $0.34 |
| Mistral | Mistral Small 4 | 28 | $0.20 |
| GLM (Z.ai) | GLM-5 | 50 | $0.66 |

#### LIGHT Tier (cheapest_fastest — best price and speed per provider)

| Provider | Model | AA Score | $/1M tokens |
|----------|-------|----------|-------------|
| Claude (Anthropic) | Claude 4.5 Haiku (Reasoning) | 37 | $0.82 |
| Gemini (Google) | Gemini 3.1 Flash-Lite Preview | 34 | $0.22 |
| GPT (OpenAI) | GPT-5.4 nano (xhigh) | 44 | $0.18 |
| Grok (xAI) | Grok 4.1 Fast (Non-reasoning) | 24 | $0.10 |
| DeepSeek | DeepSeek V4 Flash | 36 | $0.06 |
| Kimi (Moonshot) | Kimi K2.5 | 37 | $0.49 |
| Qwen (Alibaba) | Qwen3.5 0.8B (Non-reasoning) | 11 | $0.01 |
| Llama (Meta) | Llama 4 Scout | 14 | $0.22 |
| Mistral | Devstral 2 | 22 | $0.005 |
| GLM (Z.ai) | GLM-5 (Non-reasoning) | 41 | $0.66 |

---

### MANUAL CLASSIFICATION (FALLBACK)

If MCP tools are NOT available, classify manually using the scoring system above. Apply the same top-down pessimistic flow: check critical domains first, then entropy, then accumulated score from the weighted criteria lists.

---

## OUTPUT BLOCK FORMAT

At the end of any action plan activating this skill, append exactly this block (in clean markdown, never as raw tool output):

---

### TASK CLASSIFICATION
- **Tier:** `[LIGHT | MEDIUM | HEAVY]`
- **Reason:** [Technical phrase referencing the determining criteria of the plan's EXECUTION]
- **Estimated Scope:** ~[N] files | ~[N] tokens generated

### SUGGESTED MODELS FOR EXECUTION (ClientName)
[Provider] : [model] | [Provider] : [model] | ...

---

> **Note:** The classification refers to the complexity of **executing** this plan, not creating it.

---

## MODEL UPDATE PROTOCOL

If the user requests to swap, add, or remove models from this skill, execute autonomously:

### Swap an existing model
1. Access https://artificialanalysis.ai/leaderboards/models
2. Filter by the desired provider
3. Identify the equivalent model in the same tier by Intelligence Index score
4. Replace only the corresponding cell in the MODEL TABLE
5. Update the cost in the price reference table

### Add a new company
1. Add a new entry to `PROVIDER_REGISTRY` in `src/models.ts` with key, category, displayLabel, and creatorNames
2. Add fallback data to `data/fallback.json` for all 3 tiers
3. Add the creator name to `CREATOR_TO_PROVIDER` mapping
4. Update the MODEL TABLE in SKILL.md
5. Update the `preferred_provider` enum in `src/server.ts`
6. Log the change in the HISTORY table

### Remove a company
1. Remove the entry from `PROVIDER_REGISTRY` in `src/models.ts`
2. Remove fallback data from `data/fallback.json`
3. Remove from `preferred_provider` enum in `src/server.ts`
4. Remove from MODEL TABLE in SKILL.md
5. Log the change in the HISTORY table

---

## CLASSIFICATION EXAMPLES

| Task (execution) | Tier | Score | Main Criterion |
|------|------|-------|----------------|
| Change button text | LIGHT | 5 | Literal value change |
| Correct component color in CSS | LIGHT | 5 | Style change without logic |
| Fix typo in error message | LIGHT | 3 | Typo correction |
| Update package version | LIGHT | 3 | Routine dependency maintenance |
| Rename local variable | LIGHT | 5 | Safe renaming without public impact |
| Create card component with props and conditional render | MEDIUM | 25 | New component with state/props |
| Add date filter to existing list | MEDIUM | 10 | Filter with new delimited logic |
| Add email validation to registration | MEDIUM | 15 | Validation with new business rule |
| Refactor function signature with new return type | MEDIUM | 27 | Signature change + penalty (export type) |
| Change export interface used across app | MEDIUM | 20 | Penalty keyword triggers upgrade from LIGHT |
| Configure emulator + GPU drivers + ADB on Linux | MEDIUM | 20 | Multiple services with integration |
| Change state management store provider | HEAVY | 100 | Critical domain: state management architecture |
| Integrate payment webhook with retry/logging | HEAVY | 100 | Critical domain: financial + async worker |
| Refactor auth logic to shared hook | HEAVY | 100 | Critical domain: auth + shared logic |
| Database table migration without downtime | HEAVY | 100 | Critical domain: schema migration |
| GPU passthrough on VM with container stack | HEAVY | 100 | Critical domain: architecture redesign |
| Migrate REST API to tRPC across 8 endpoints | HEAVY | 55 | Architecture migration + 5+ files |

---

## MCP SERVER SETUP

This skill is also available as an MCP server (`oracle-models-mcp`) for any MCP-compatible client:

### opencode

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

Antigravity CLI stores MCP server configurations in a dedicated `mcp_config.json` file.

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

Or via CLI:

```bash
agy mcp add oracle-models -- npx -y oracle-models-mcp
```

> **Note:** For remote MCP servers, use `serverUrl` instead of `url`.

### Gemini CLI

> Valid until June 18th migration deadline.

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

### Claude Code

```bash
claude mcp add oracle-models -- npx -y oracle-models-mcp
```

### Cursor / Cline / Windsurf

Add to your editor's MCP configuration:
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

### Live data setup (optional)

To enable live model data from Artificial Analysis API, set the `AA_API_KEY` environment variable before starting the MCP server:

```bash
export AA_API_KEY=your_api_key_here
npx -y oracle-models-mcp
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

---

## HISTORY

| Date | Change |
|------|--------|
| 2026-04-20 | Version 1.0.0 - Initial release with technical criteria |
| 2026-05-02 | Version 1.0.1 - Added OpenAI/GPT provider and AA API v2 integration |
| 2026-05-04 | Version 1.1.0 - Enhanced classification criteria (Translation, Tests, Docs) and mandatory invocation protocol |
| 2026-05-04 | Version 1.2.0 - Critical rules: classify execution not planning, never inject raw tool output; infra/config criteria added to all tiers; output block strictly in English; explicit note "classification refers to execution"; mandatory MCP workflow with ordered steps; updated examples with infra tasks |
| 2026-05-20 | Version 2.0.0 - Weighted scoring engine replacing simple match count; critical domains auto-upgrade to HEAVY; penalty keywords disqualify LIGHT; entropy detection by description length; pessimistic top-down decision flow; new `description_length` parameter; `score` field in classification result |
| 2026-05-20 | Version 2.0.0 - Expanded to 10 providers (added DeepSeek, Kimi, Qwen, Llama, Mistral); client auto-detection via MCP handshake (native vs aggregator); smart filtering: native clients get only their provider, aggregators get best 4 with DeepSeek prioritized as best value OSS; dynamic provider registry; fallback data updated to 2026-05-20 with AA leaderboard scores |
