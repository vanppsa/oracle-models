import { Tier } from './classify';
import { ClientType, getProviderDisplayLabel } from './models';

export interface FormatPlanBlockArgs {
  tier: Tier;
  reason: string;
  estimated_files: string;
  estimated_tokens: string;
  preferred_provider?: string;
  client_type?: ClientType;
  client_label?: string;
  models: Record<string, { name: string; score: number; price_blended_usd_per_1m: number }>;
  suggested_first?: string;
}

export function formatPlanBlock(args: FormatPlanBlockArgs): string {
  const headerSuffix = args.client_label && args.client_label !== 'Unknown'
    ? ` (${args.client_label})`
    : '';

  const modelLines = Object.entries(args.models)
    .map(([key, model]) => {
      const label = getProviderDisplayLabel(key).padEnd(10);
      const isSuggested = args.suggested_first === key;
      const suffix = isSuggested ? ' \u2728 (Suggested for your environment)' : '';
      return `${label}: ${model.name}${suffix}`;
    })
    .join('\n');

  const block = `
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\uD83D\uDCCB TASK CLASSIFICATION
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Tier     : ${args.tier}
Reason   : ${args.reason}
Files    : ~${args.estimated_files} files | ~${args.estimated_tokens} tokens generated
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\uD83E\uDD16 SUGGESTED MODELS FOR EXECUTION${headerSuffix}
${modelLines}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`.trim();

  return '\n' + block + '\n';
}
