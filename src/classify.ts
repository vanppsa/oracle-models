export type Tier = "LIGHT" | "MEDIUM" | "HEAVY";

export interface ClassificationResult {
  tier: Tier;
  reason: string;
  estimated_files: string;
  estimated_tokens: string;
}

const HEAVY_CRITERIA = [
  { pattern: /extract logic.*affect|architecture redesign|migrate .* to/i, reason: "Architectural redesign or high-impact logic extraction" },
  { pattern: /authentication|authorization|auth|session|secure login|oauth/i, reason: "Security and authentication domain" },
  { pattern: /webhook|external system integration|non-trivial api contracts/i, reason: "Complex integration with external systems" },
  { pattern: /memory leak|race condition|intermittent behavior|non-deterministic/i, reason: "Debugging complex and non-deterministic bug" },
  { pattern: /schema migration|database in production/i, reason: "Systemic risk: data migration in production" },
  { pattern: /performance optimization|profiling/i, reason: "Deep performance optimization" },
  { pattern: /billing|payment|financial flow|stripe/i, reason: "Critical financial flow" },
  { pattern: /data pipeline|etl|async worker|retry|fallback/i, reason: "Complex asynchronous processing / ETL" },
  { pattern: /security|cryptography|compliance/i, reason: "Changes in security or compliance domains" },
  { pattern: /refactoring.*dependency graph|general refactoring/i, reason: "Wide-scope refactoring affecting multiple domains" }
];

const MEDIUM_CRITERIA = [
  { pattern: /component.*state|new function|new module/i, reason: "Creation of component/function with internal state" },
  { pattern: /signature change|function refactoring/i, reason: "Refactoring of existing function altering contracts" },
  { pattern: /validation with multiple|business rule/i, reason: "Inclusion of complex business rules/validations" },
  { pattern: /endpoint integration|new endpoint/i, reason: "Integration of new endpoint in existing flow" },
  { pattern: /hook creation|composable/i, reason: "Creation of hook/composable with dependencies" },
  { pattern: /feature flag|toggle|new conditional logic/i, reason: "Implementation of new conditional logic" },
  { pattern: /data migration.*transformation/i, reason: "Local data migration and transformation" },
  { pattern: /pagination|filter|sorting/i, reason: "Addition of list manipulation (filtering, sorting, pagination)" },
  { pattern: /identified cause.*bug/i, reason: "Delimited bug fix" },
  { pattern: /docker|proxy|simple pipeline|simple infrastructure/i, reason: "Configuration of simple environment/infrastructure" },
  { pattern: /unit test|integration test|test coverage|test case/i, reason: "Implementation or expansion of test suite" },
  { pattern: /environment variable|config file|\.env|configuration settings/i, reason: "Environment or system configuration changes" }
];

const LIGHT_CRITERIA = [
  { pattern: /literal value|string|number|boolean|label|ui message/i, reason: "Change of static literal values" },
  { pattern: /style|css|tailwind|color|spacing|simple layout/i, reason: "Purely visual changes without logical alteration" },
  { pattern: /rename|rename.*variable|rename.*function/i, reason: "Safe renaming without public impact" },
  { pattern: /addition.*field.*form|removal.*field/i, reason: "Adjustment in existing form without complex validation" },
  { pattern: /route adjustment|path|redirect/i, reason: "Simple routing adjustments" },
  { pattern: /translation|internationalization|i18n|translate/i, reason: "Language translation or internationalization" },
  { pattern: /documentation|readme|jsdoc|comments/i, reason: "Documentation or code commenting" },
  { pattern: /dependency update|version bump|package update/i, reason: "Routine dependency maintenance" },
  { pattern: /typo/i, reason: "Isolated typo correction" }
];

export function classifyTask(description: string, files_affected?: number): ClassificationResult {
  const desc = description.toLowerCase();
  
  let heavyMatches = [];
  let mediumMatches = [];
  let lightMatches = [];

  for (const c of HEAVY_CRITERIA) if (c.pattern.test(desc)) heavyMatches.push(c.reason);
  for (const c of MEDIUM_CRITERIA) if (c.pattern.test(desc)) mediumMatches.push(c.reason);
  for (const c of LIGHT_CRITERIA) if (c.pattern.test(desc)) lightMatches.push(c.reason);

  let isFilesHeavy = files_affected !== undefined && files_affected >= 5;
  let isFilesMedium = files_affected !== undefined && files_affected >= 2 && files_affected < 5;
  let isFilesLight = files_affected !== undefined && files_affected < 2;

  if (heavyMatches.length >= 1 || isFilesHeavy) {
    return {
      tier: "HEAVY",
      reason: heavyMatches[0] || "High entropy identified by the large number of affected files (>= 5).",
      estimated_files: "5+",
      estimated_tokens: "800+"
    };
  }

  if (mediumMatches.length >= 2 || (mediumMatches.length >= 1 && isFilesMedium) || isFilesMedium) {
    return {
      tier: "MEDIUM",
      reason: mediumMatches[0] || "New logic within a well-delimited scope (2-4 files).",
      estimated_files: "2–5",
      estimated_tokens: "200–800"
    };
  }

  let reason = "Deterministic transformation with low entropy.";
  if (lightMatches.length > 0) {
    reason = lightMatches[0];
  } else if (mediumMatches.length === 1) {
    reason = "Scope reduced to 1 file with minimal logical alteration.";
  }

  return {
    tier: "LIGHT",
    reason: reason,
    estimated_files: "1–2",
    estimated_tokens: "< 200"
  };
}
