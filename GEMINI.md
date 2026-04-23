# oracle-models Agent Skill

This project defines the `oracle-models` agent skill, which specializes in classifying software development tasks by complexity and recommending the most cost-effective and capable AI models for their execution.

## Project Overview

The core of this project is a behavioral instruction set for AI assistants. It aims to optimize development workflows by providing a standardized classification system (LIGHT, MEDIUM, HEAVY) based on computational complexity rather than subjective difficulty. The skill leverages independent benchmarks from [artificialanalysis.ai](https://artificialanalysis.ai/leaderboards/models) to suggest models from major providers like Anthropic (Claude), Google (Gemini), Z AI (GLM), and xAI (Grok).

## Directory Structure

- `SKILL.md`: The primary source file containing the skill's logic, activation rules, classification criteria, and AI model tables.
- `GEMINI.md`: This file, providing project context and usage guidelines.

## Skill Functionality

### Activation Rule
The skill is designed to activate **only during Plan Mode** when a multi-step action plan or implementation analysis is being generated. This prevents unnecessary token consumption during direct execution or simple inquiries.

### Classification Tiers
- **LIGHT (🟢)**: Low-entropy, deterministic changes (e.g., literal values, CSS tweaks, documentation).
- **MEDIUM (🟡)**: Delimited new logic involving state, side effects, or component interfaces.
- **HEAVY (🔴)**: High-entropy decisions with systemic risk or architectural impact (e.g., auth systems, performance optimizations, migrations).

### Output
The skill appends a standardized classification block to the end of action plans, detailing the assigned tier, the technical rationale, estimated scope, and suggested models for each tier.

## Maintenance and Updates

The models and pricing within `SKILL.md` are intended to be updated autonomously by AI agents as new benchmarks become available. The file contains a "Protocol for Updating Models" that guides agents on how to refresh the data using Artificial Analysis as the source of truth.
