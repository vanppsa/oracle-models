import { Tier } from './classify';

export interface FormatPlanBlockArgs {
  tier: Tier;
  reason: string;
  estimated_files: string;
  estimated_tokens: string;
  preferred_provider?: string;
  models: {
    claude: { name: string; score: number; price_blended_usd_per_1m: number };
    gemini: { name: string; score: number; price_blended_usd_per_1m: number };
    glm: { name: string; score: number; price_blended_usd_per_1m: number };
    grok: { name: string; score: number; price_blended_usd_per_1m: number };
    openai: { name: string; score: number; price_blended_usd_per_1m: number };
  };
}

export function formatPlanBlock(args: FormatPlanBlockArgs): string {
  const highlight = (provider: string, modelName: string) => {
    const isPreferred = args.preferred_provider === provider.toLowerCase();
    return isPreferred ? `${modelName} ✨ (Suggested for your environment)` : modelName;
  };

  const block = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tier     : ${args.tier}
Reason   : ${args.reason}
Files    : ~${args.estimated_files} files | ~${args.estimated_tokens} tokens generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 SUGGESTED MODELS FOR EXECUTION
Claude   : ${highlight("claude", args.models.claude.name)}
Gemini   : ${highlight("gemini", args.models.gemini.name)}
GLM      : ${highlight("glm", args.models.glm.name)}
Grok     : ${highlight("grok", args.models.grok.name)}
GPT      : ${highlight("openai", args.models.openai.name)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

  return "\n" + block + "\n";
}
