---
name: oracle-models
description: Classifies development task complexity (LIGHT/MEDIUM/HEAVY) and suggests the most cost-efficient AI model per provider (Claude, Gemini, GLM, Grok, GPT). Activates only during plan mode. Models ranked by artificialanalysis.ai Intelligence Index. Updatable by any AI without manual reconfiguration. Works as both a skill (behavioral instructions) and an MCP server (live tools).
license: MIT
compatibility: opencode
metadata:
  author: vanppsa
  version: "2.0"
  audience: developers
---

# ORACLE MODELS

> Behavioral instruction set for AI development assistants.
> Version: 2.0 | Last updated: 2026-05-02

---

## ACTIVATION RULE

**THIS SKILL ACTIVATES ONLY IN PLAN MODE.**

Activate the classification block ONLY when producing:
- A multi-step action plan (e.g., "Step 1... Step 2... Step 3...")
- An analysis of how to implement a feature, fix, or refactor
- A response describing WHAT will be done BEFORE doing it

**DO NOT activate on:**
- Direct one-line responses (unless the user explicitly invokes the skill)
- During code execution (ACT mode)
- During one-off edits without prior planning
- Conceptual or explanatory questions without an associated task

---

## MCP TOOLS (PREFERRED)

If the Oracle Models MCP server is available (configured as `oracle-models` in MCP settings), use these tools instead of manual classification:

### `classify_task`
Call this first with the task description and optionally `files_affected`.

```
classify_task(description: string, files_affected?: number)
→ { tier, reason, estimated_files, estimated_tokens }
```

### `get_model_suggestions`
Call after classification to get the recommended models for the tier.

```
get_model_suggestions(tier: "LIGHT" | "MEDIUM" | "HEAVY", preferred_provider?: "anthropic" | "google" | "zai" | "xai" | "openai")
→ { tier, updated_at, data_source, models: { claude, gemini, glm, grok, openai }, suggested_first? }
```

### `format_plan_block`
Call to generate the formatted output block with all data filled in.

```
format_plan_block(tier, reason, estimated_files, estimated_tokens, preferred_provider?)
→ formatted markdown string
```

### Workflow with MCP tools

1. Call `classify_task` with the task description
2. Call `get_model_suggestions` with the returned tier (pass `preferred_provider` matching your own provider)
3. Call `format_plan_block` with all the data
4. Append the returned block at the end of the plan

### `preferred_provider` mapping

| You are | Pass as preferred_provider |
|---------|---------------------------|
| Claude (Anthropic) | `anthropic` |
| Gemini (Google) | `google` |
| GLM (Z.ai) | `zai` |
| Grok (xAI) | `xai` |
| GPT (OpenAI) | `openai` |

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

## MANUAL CLASSIFICATION (FALLBACK)

If MCP tools are NOT available, classify manually using the criteria below.

---

### REFERENCE SOURCE

**https://artificialanalysis.ai/leaderboards/models**

- Independent methodology (not self-reported by providers)
- Covers: Intelligence Index, blended price, speed (tokens/s), latency
- Continuous updates with 350+ tracked models
- To update models: access the site, filter by company, and replace entries in the table below

---

### MODEL TABLE (May 2026)

| Tier | AA Score | Claude (Anthropic) | Gemini (Google) | GLM (Z.ai) | Grok (xAI) | GPT (OpenAI) |
|------|----------|--------------------|------------------------|-------------|------------------|---------------------|
| HEAVY (H) | 51-60 | Claude Opus 4.7 (max) | Gemini 3.1 Pro Preview | GLM-5.1 (Reasoning) | Grok 4.3 | GPT-5.5 (xhigh) |
| MEDIUM (M) | 38-52 | Claude Sonnet 4.6 (max) | Gemini 3 Flash Preview | GLM-5 (Reasoning) | Grok 4.1 Fast (Reasoning) | GPT-5.4 mini (xhigh) |
| LIGHT (L) | <=44 | Claude 4.5 Haiku (Reasoning) | Gemini 3.1 Flash-Lite Preview | GLM-4.7-Flash (Reasoning) | Grok 4.1 Fast (Non-reasoning) | GPT-5.4 nano (xhigh) |

### Cost Reference (blended USD/1M tokens)

| Tier | Claude | Gemini | GLM | Grok | GPT |
|------|----------------|----------------------|-----------|---------|---------|
| H | $10.00 (Opus) | $4.50 (3.1 Pro) | $2.15 | $1.56 | $11.25 |
| M | $6.56 (Sonnet) | $1.13 (3 Flash) | $1.55 | $0.28 | $1.69 |
| L | $2.19 (Haiku) | $0.56 (Flash-Lite) | $0.15 | $0.28 | $0.46 |

---

### LIGHT - Tier L

**Profile:** Low-entropy deterministic transformation. No new logical branching.

Classify as LIGHT when the task meets >=2 of these criteria:
- Literal value change: string, number, boolean, label, UI message
- Style change without logic impact: CSS/Tailwind, color, spacing
- Rename of variable, function, or file without impact on public interface
- Addition/removal of field in existing form without new validation
- Existing route adjustment: path, parameter, redirect - no new business logic
- Internationalization/translation of pre-structured text
- Copy/adapt code block with minimal change (< 5 lines difference)
- Typo correction in functional code (wrong variable, wrong value)

**Expected modified files:** 1-2
**Expected new tokens generated:** < 200

---

### MEDIUM - Tier M

**Profile:** New logic within a well-delimited scope. Requires reasoning about state, side effects, or component interface.

Classify as MEDIUM when the task meets >=2 of these criteria:
- Creation of new component, function, or module with internal state
- Refactor of existing function with signature change or return type change
- Addition of validation with multiple conditions or business rules
- Integration of new endpoint in existing flow (no new auth)
- Creation of simple hook/composable with 1-2 dependencies
- Implementation of feature flag, behavior toggle, or new conditional logic
- Data migration with transformation (field mapping, type conversion)
- Addition of pagination, filter, or sort in existing list
- Bug fix with identified cause requiring change in <=3 files
- Simple infra/pipeline/Docker/proxy configuration

**Expected modified files:** 2-5
**Expected new tokens generated:** 200-800

---

### HEAVY - Tier H

**Profile:** High decision entropy. Multiple consumers affected, distributed logic, or systemic risk if implemented incorrectly.

Classify as HEAVY when the task meets >=1 of these criteria:
- Shared logic extraction affecting >=3 consumers (hooks, contexts, providers)
- Module or layer architecture redesign (e.g., migrating REST to tRPC, ORM switch)
- Implementation of authentication, authorization, or session management
- External system integration with OAuth, webhooks, or non-trivial API contracts
- Debugging non-deterministic bugs (race conditions, memory leaks, intermittent behavior)
- Database schema migration with production data
- Performance optimization requiring profiling and multiple hypotheses
- Creation of billing/payment system or any financial flow
- Implementation of data pipeline, ETL, or async worker with retry/fallback
- Any task crossing security, cryptography, or compliance domains
- Refactoring requiring understanding of the entire project dependency graph

**Expected modified files:** 5+
**Expected new tokens generated:** 800+

---

## OUTPUT BLOCK FORMAT

At the end of any action plan activating this skill, add exactly this block:

### TASK CLASSIFICATION
- Tier: [LIGHT | MEDIUM | HEAVY]
- Reason: [Technical phrase referencing the determining criteria]
- Files: ~[N] files | ~[N] generated tokens

### SUGGESTED MODELS
- Claude: [model]
- Gemini: [model]
- GLM: [model]
- Grok: [model]
- GPT: [model]

---

## MODEL UPDATE PROTOCOL

If the user requests to swap, add, or remove models from this skill, execute autonomously:

### Swap an existing model
1. Access https://artificialanalysis.ai/leaderboards/models
2. Filter by the desired provider
3. Identify the equivalent model in the same tier by Intelligence Index score
4. Replace only the corresponding cell in the MODEL TABLE
5. Update the cost in the price reference table

### Add a new company (e.g., DeepSeek)
1. Add a new column to the model table with 3 tiers (H/M/L)
2. Use artificialanalysis.ai to identify the 3 models by score:
   - HEAVY = Intelligence Index >= 51
   - MEDIUM = Intelligence Index 38-50
   - LIGHT = Intelligence Index <= 44
3. Add costs to the price reference table
4. Add the corresponding line to the OUTPUT BLOCK FORMAT block
5. Log the change in the HISTORY table

### Remove a company
1. Delete the company column from the model table
2. Delete the corresponding cost row
3. Delete the line in the OUTPUT BLOCK FORMAT block
4. Log the change in the HISTORY table

---

## CLASSIFICATION EXAMPLES

| Task | Tier | Main Criterion |
|------|------|----------------|
| Change button text | LIGHT | Literal value change |
| Correct component color in CSS | LIGHT | Style change without logic |
| Create card component with props and conditional render | MEDIUM | New component with state/props |
| Add date filter to existing list | MEDIUM | Filter with new delimited logic |
| Add email validation to registration | MEDIUM | Validation with new business rule |
| Integrate payment webhook with retry/logging | HEAVY | Financial system + async worker |
| Refactor auth logic to shared hook | HEAVY | Affects >=3 consumers + security domain |
| Database table migration without downtime | HEAVY | Schema migration in production |

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
| 2026-04-20 | Version 2.0 - technical criteria, plan-only, referenced source |
| 2026-05-02 | Version 1.0 - English, MCP tools integration, dual-mode (skill + MCP server) |
| 2026-05-02 | Version 2.0 - Added OpenAI/GPT provider, AA API v2 integration, decimal scores, live data via AA_API_KEY, updated all model data |
