---
name: oracle-models
description: Classifies development task complexity (LIGHT/MEDIUM/HEAVY) at the end of plan responses and suggests the most cost-effective and capable AI model per company (Claude, Gemini, GLM, Grok). Silent during code execution — activates only when producing multi-step action plans. Models ranked by artificialanalysis.ai Intelligence Index. Updatable by any AI without manual reconfiguration.
---

# ORACLE MODELS
> Behavior instruction set for AI development assistants.
> Version: 2.0 | Last updated: 05/02/2026

---

## ⚠️ ACTIVATION RULE — READ BEFORE ALL

**THIS INSTRUCTION MUST ONLY BE EXECUTED IN PLAN MODE.**

Activate the classification block ONLY when the AI is producing:
- A multi-step action plan (e.g., "Step 1... Step 2... Step 3...")
- An analysis of how to implement a feature, fix, or refactor
- A response where the AI describes WHAT it will do BEFORE doing it

**DO NOT activate on:**
- Direct one-line responses (unless the user explicitly calls the SKILL)
- During code execution (ACT mode)
- During one-off edits without prior planning
- Conceptual or explanatory questions without an associated task

> Objective: Minimize unnecessary token consumption. The block is a signal for
> the user to decide whether to keep or switch the model before execution.

---

## 🔍 REFERENCE SOURCE FOR MODELS

**Official benchmark site used as base:**
**https://artificialanalysis.ai/leaderboards/models**

- Independent methodology (not self-reported by providers)
- Covers: Intelligence Index, blended price, speed (tokens/s), latency
- Continuous updates with 100+ tracked models
- To update the models in this skill: access the site above, filter by
  company (Anthropic, Google, Z AI, xAI) and replace the models in the table
  below, maintaining the 3-tier structure.

---

## 🤖 MODEL TABLE (May 2026)

> Scores based on the "Artificial Analysis Intelligence Index" as of 05/02/2026.
> 1 model per company per tier. To swap a model, edit only this table.

| Tier          | AA Score | Claude (Anthropic) | Gemini (Google)        | GLM (Z.ai)  | Grok (xAI)       |
|---------------|----------|--------------------|------------------------|-------------|------------------|
| 🔴 HEAVY (H)  | 51–57    | Claude Opus 4.7    | Gemini 3.1 Pro         | GLM-5.1     | Grok 4.20        |
| 🟡 MEDIUM (M) | 44–50    | Claude Sonnet 4.6  | Gemini 3 Flash         | GLM-5       | Grok 4 Fast      |
| 🟢 LIGHT (L)  | ≤43      | Claude Haiku 4.5   | Gemini 3.1 Flash Lite  | GLM-4.7     | Grok 4.1         |

### Cost Reference (blended USD/1M tokens — source: artificialanalysis.ai)

| Tier | Claude         | Gemini               | GLM       | Grok    |
|------|----------------|----------------------|-----------|---------|
| 🔴 H | $10.00 (Opus)  | $4.50 (3.1 Pro)      | $2.15     | $3.00   |
| 🟡 M | $6.00 (Sonnet) | $1.13 (3 Flash)      | $1.55     | ~$0.80  |
| 🟢 L | ~$1.50 (Haiku) | ~$0.15 (Flash Lite)  | ~$0.20    | $0.20   |

---

## 📐 TECHNICAL CLASSIFICATION CRITERIA

Classification is based on **task computational complexity**, not
subjective difficulty. Use the criteria below:

---

### 🟢 LIGHT — Tier L

**Profile:** Low-entropy deterministic transformation. No new logical branching.

Classify as LIGHT when the task meets ≥2 of these criteria:
- Literal value change: string, number, boolean, label, UI message
- Style change without logic impact: point CSS/Tailwind, color, spacing
- Rename of variable, function, or file without impact on public interface
- Addition/removal of field in existing form without new validation
- Existing route adjustment: path, parameter, redirect — no new business logic
- Internationalization/translation of pre-structured text
- Copy/adapt code block with minimal change (< 5 lines difference)
- Typo correction in functional code (wrong variable, wrong value)

**Expected modified files:** 1–2
**Expected new tokens generated:** < 200

---

### 🟡 MEDIUM — Tier M

**Profile:** New logic within a well-delimited scope. Requires reasoning about
state, side effects, or component interface.

Classify as MEDIUM when the task meets ≥2 of these criteria:
- Creation of new component, function, or module with internal state
- Refactor of existing function with signature change or return type change
- Addition of validation with multiple conditions or business rules
- Integration of new endpoint in existing flow (no new auth)
- Creation of simple hook/composable with 1–2 dependencies
- Implementation of feature flag, behavior toggle, or new conditional logic
- Data migration with transformation (field mapping, type conversion)
- Addition of pagination, filter, or sort in existing list
- Bug fix with identified cause requiring change in ≤3 files
- Simple infra/pipeline/Docker/proxy configuration

**Expected modified files:** 2–5
**Expected new tokens generated:** 200–800

---

### 🔴 HEAVY — Tier H

**Profile:** High decision entropy. Multiple consumers affected, distributed
logic, or systemic risk if implemented incorrectly.

Classify as HEAVY when the task meets ≥1 of these criteria:
- Shared logic extraction affecting ≥3 consumers (hooks, contexts, providers)
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

## 📤 OUTPUT BLOCK FORMAT

At the end of any action plan activating this instruction, add
**exactly** this block:

### TASK CLASSIFICATION
- Tier: [LIGHT | MEDIUM | HEAVY]
- Reason: [Technical phrase referencing the determining criteria]
- Files: ~[N] files | ~[N] generated tokens

### SUGGESTED MODELS
- Claude: [model]
- Gemini: [model]
- GLM: [model]
- Grok: [model]

---

## 🔄 MODEL UPDATE PROTOCOL (for the AI)

If the user requests to swap, add, or remove models from this skill,
execute autonomously following this protocol:

### Swap an existing model
1. Access https://artificialanalysis.ai/leaderboards/models
2. Filter by the desired provider
3. Identify the equivalent model in the same tier by Intelligence Index score
4. Replace only the corresponding cell in the `🤖 MODEL TABLE`
5. Update the cost in the price reference table

### Add a new company (e.g., OpenAI/GPT)
1. Add a new column to the model table with 3 tiers (H/M/L)
2. Use artificialanalysis.ai to identify the 3 models by score:
   - HEAVY  = Intelligence Index ≥ 51
   - MEDIUM = Intelligence Index 44–50
   - LIGHT  = Intelligence Index ≤ 43
3. Add costs to the price reference table
4. Add the corresponding line to the `📤 OUTPUT BLOCK FORMAT` block
5. Log the change in the `🗓️ HISTORY` table

### Remove a company
1. Delete the company column from the model table
2. Delete the corresponding cost row
3. Delete the line in the `📤 OUTPUT BLOCK FORMAT` block
4. Log the change in the `🗓️ HISTORY` table

> The AI may execute these changes autonomously at the user's request,
> without needing to re-explain the logic or the reference site.

---

## 💡 CLASSIFICATION EXAMPLES

| Task                                                         | Tier   | Main Criterion                               |
|----------------------------------------------------------------|--------|----------------------------------------------|
| Change button text                                             | LIGHT  | Literal value change                         |
| Correct component color in CSS                                 | LIGHT  | Style change without logic                   |
| Create card component with props and conditional render        | MEDIUM | New component with state/props               |
| Add date filter to existing list                               | MEDIUM | Filter with new delimited logic              |
| Add email validation to registration                           | MEDIUM | Validation with new business rule            |
| Integrate payment webhook with retry/logging                   | HEAVY  | Financial system + async worker              |
| Refactor auth logic to shared hook                             | HEAVY  | Affects ≥3 consumers + security domain       |
| Database table migration without downtime                      | HEAVY  | Schema migration in production               |

---

## 🗓️ HISTORY

| Date       | Change                                                       |
|------------|--------------------------------------------------------------|
| 04/20/2026 | Version 2.0 — technical criteria, plan-only, referenced source|
| 05/02/2026 | Full English translation, updated block format to raw markdown|
