"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPlanBlock = formatPlanBlock;
function formatPlanBlock(args) {
    const highlight = (provider, modelName) => {
        const isPreferred = args.preferred_provider === provider.toLowerCase();
        return isPreferred ? `${modelName} ✨ (Suggested for your environment)` : modelName;
    };
    const block = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tier    : ${args.tier}
  Reason  : ${args.reason}
  Files   : ~${args.estimated_files} files | ~${args.estimated_tokens} tokens generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 SUGGESTED MODELS FOR EXECUTION
  Claude  : ${highlight("claude", args.models.claude.name)}
  Gemini  : ${highlight("gemini", args.models.gemini.name)}
  GLM     : ${highlight("glm", args.models.glm.name)}
  Grok    : ${highlight("grok", args.models.grok.name)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    return "\n" + block + "\n";
}
