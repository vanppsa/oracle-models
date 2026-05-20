export type Tier = "LIGHT" | "MEDIUM" | "HEAVY";

export interface ClassificationResult {
  tier: Tier;
  reason: string;
  estimated_files: string;
  estimated_tokens: string;
  score: number;
}

const CRITICAL_DOMAINS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bauthentication\b|\bauthorization\b|\bauth\b|\bsession\b|\bsecure login\b|\boauth\b|\boauth2?\b/i, reason: "Security and authentication domain" },
  { pattern: /\bwebhook\b|\bexternal system integration\b|\bnon-trivial api contracts?\b/i, reason: "Complex integration with external systems" },
  { pattern: /\bschema migration\b|\bdatabase in production\b|\bmigrate\b.*\bto\b/i, reason: "Systemic risk: data migration in production" },
  { pattern: /\bbilling\b|\bpayment\b|\bfinancial flow\b|\bstripe\b|\bcheckout\b|\binvoice\b|\bcard\b/i, reason: "Critical financial flow" },
  { pattern: /\bsecurity\b|\bcryptography\b|\bcompliance\b|\bencrypt\b|\bdecrypt\b|\bhash\b/i, reason: "Changes in security or compliance domains" },
  { pattern: /\bdata pipeline\b|\betl\b|\basync worker\b|\bretry\b.*\bfallback\b/i, reason: "Complex asynchronous processing / ETL" },
  { pattern: /\bextract logic.*affect\b|\barchitecture redesign\b/i, reason: "Architectural redesign or high-impact logic extraction" },
  { pattern: /\bmemory leak\b|\brace condition\b|\bintermittent behavior\b|\bnon-deterministic\b|\bintermittent\b.*\bbug\b|\bintermittent\b.*\bfail/i, reason: "Debugging complex and non-deterministic bug" },
  { pattern: /\bperformance optimization\b|\bprofiling\b/i, reason: "Deep performance optimization" },
  { pattern: /\brefactoring.*dependency graph\b|\bgeneral refactoring\b/i, reason: "Wide-scope refactoring affecting multiple domains" },
  { pattern: /\brbac\b|\bpermission\b|\brole.?based\b/i, reason: "Role-based access control domain" },
  { pattern: /\bjwt\b|\btoken\b.*\bmanage\b|\btoken\b.*\brefresh\b/i, reason: "Token management in authentication flow" },
  { pattern: /\blgpd\b|\bgdpr\b|\baudit\b.*\blog\b/i, reason: "Regulatory compliance requirement" },
];

const HEAVY_CRITERIA: { pattern: RegExp; reason: string; weight: number }[] = [
  { pattern: /\bextract logic.*affect\b|\barchitecture redesign\b|\bmigrate .* to\b/i, reason: "Architectural redesign or high-impact logic extraction", weight: 30 },
  { pattern: /\bauthentication\b|\bauthorization\b|\bauth\b|\bsession\b|\bsecure login\b|\boauth2?\b/i, reason: "Security and authentication domain", weight: 30 },
  { pattern: /\bwebhook\b|\bexternal system integration\b|\bnon-trivial api contracts?\b/i, reason: "Complex integration with external systems", weight: 25 },
  { pattern: /\bmemory leak\b|\brace condition\b|\bintermittent behavior\b|\bnon-deterministic\b|\bintermittent\b.*\bbug\b|\bintermittent\b.*\bfail/i, reason: "Debugging complex and non-deterministic bug", weight: 25 },
  { pattern: /\bschema migration\b|\bdatabase in production\b/i, reason: "Systemic risk: data migration in production", weight: 30 },
  { pattern: /\bperformance optimization\b|\bprofiling\b/i, reason: "Deep performance optimization", weight: 25 },
  { pattern: /\bbilling\b|\bpayment\b|\bfinancial flow\b|\bstripe\b/i, reason: "Critical financial flow", weight: 30 },
  { pattern: /\bdata pipeline\b|\betl\b|\basync worker\b|\bretry\b|\bfallback\b/i, reason: "Complex asynchronous processing / ETL", weight: 25 },
  { pattern: /\bsecurity\b|\bcryptography\b|\bcompliance\b/i, reason: "Changes in security or compliance domains", weight: 30 },
  { pattern: /\brefactoring.*dependency graph\b|\bgeneral refactoring\b/i, reason: "Wide-scope refactoring affecting multiple domains", weight: 25 },
  { pattern: /\bstate management\b|\bredux\b|\bzustand\b|\bcontext api\b|\bstore\b.*\bprovider\b/i, reason: "State management architecture change", weight: 25 },
  { pattern: /\bshared logic\b|\bshared util\b|\bshared hook\b|\bshared service\b/i, reason: "Shared logic extraction affecting multiple consumers", weight: 25 },
];

const MEDIUM_CRITERIA: { pattern: RegExp; reason: string; weight: number }[] = [
  { pattern: /\bcomponent.*state\b|\bnew function\b|\bnew module\b/i, reason: "Creation of component/function with internal state", weight: 15 },
  { pattern: /\bsignature change\b|\bfunction refactoring\b/i, reason: "Refactoring of existing function altering contracts", weight: 15 },
  { pattern: /\bvalidation with multiple\b|\bbusiness rule\b/i, reason: "Inclusion of complex business rules/validations", weight: 15 },
  { pattern: /\bendpoint integration\b|\bnew endpoint\b/i, reason: "Integration of new endpoint in existing flow", weight: 15 },
  { pattern: /\bhook creation\b|\bcomposable\b/i, reason: "Creation of hook/composable with dependencies", weight: 15 },
  { pattern: /\bfeature flag\b|\btoggle\b|\bnew conditional logic\b/i, reason: "Implementation of new conditional logic", weight: 10 },
  { pattern: /\bdata migration.*transformation\b/i, reason: "Local data migration and transformation", weight: 15 },
  { pattern: /\bpagination\b|\bfilter\b|\bsorting\b/i, reason: "Addition of list manipulation (filtering, sorting, pagination)", weight: 10 },
  { pattern: /\bidentified cause.*bug\b/i, reason: "Delimited bug fix", weight: 10 },
  { pattern: /\bdocker\b|\bproxy\b|\bsimple pipeline\b|\bsimple infrastructure\b/i, reason: "Configuration of simple environment/infrastructure", weight: 10 },
  { pattern: /\bunit test\b|\bintegration test\b|\btest coverage\b|\btest case\b/i, reason: "Implementation or expansion of test suite", weight: 10 },
  { pattern: /\benvironment variable\b|\bconfig file\b|\.env\b|\bconfiguration settings\b/i, reason: "Environment or system configuration changes", weight: 10 },
  { pattern: /\berror handling\b|\berror boundary\b|\btry.?catch\b|\bexception\b/i, reason: "Error handling implementation", weight: 12 },
  { pattern: /\brefactor\b|\brestructure\b|\breorganize\b/i, reason: "Code restructuring requiring careful dependency analysis", weight: 12 },
  { pattern: /\bapi\b.*\bintegration\b|\bthird.?party\b|\bexternal service\b/i, reason: "Third-party API integration", weight: 15 },
];

const LIGHT_CRITERIA: { pattern: RegExp; reason: string; weight: number }[] = [
  { pattern: /\bliteral value\b|\bstring\b|\bnumber\b|\bboolean\b|\blabel\b|\bui message\b/i, reason: "Change of static literal values", weight: 5 },
  { pattern: /\bstyle\b|\bcss\b|\btailwind\b|\bcolor\b|\bspacing\b|\bsimple layout\b/i, reason: "Purely visual changes without logical alteration", weight: 5 },
  { pattern: /\brename\b|\brename.*variable\b|\brename.*function\b/i, reason: "Safe renaming without public impact", weight: 5 },
  { pattern: /\baddition.*field.*form\b|\bremoval.*field\b/i, reason: "Adjustment in existing form without complex validation", weight: 5 },
  { pattern: /\broute adjustment\b|\bpath\b|\bredirect\b/i, reason: "Simple routing adjustments", weight: 5 },
  { pattern: /\btranslation\b|\binternationalization\b|\bi18n\b|\btranslate\b/i, reason: "Language translation or internationalization", weight: 5 },
  { pattern: /\bdocumentation\b|\breadme\b|\bjsdoc\b|\bcomments?\b/i, reason: "Documentation or code commenting", weight: 3 },
  { pattern: /\bdependency update\b|\bversion bump\b|\bpackage update\b/i, reason: "Routine dependency maintenance", weight: 3 },
  { pattern: /\btypo\b/i, reason: "Isolated typo correction", weight: 3 },
];

const PENALTY_KEYWORDS: { pattern: RegExp; penalty: number }[] = [
  { pattern: /\bexport\b.*\binterface\b|\bexport\b.*\btype\b|\bexport\b.*\benum\b|\binterface\b.*\bexport\b|\btype\b.*\bexport\b/i, penalty: 20 },
  { pattern: /\bpublic api\b|\bpublic interface\b|\bpublic type\b/i, penalty: 20 },
  { pattern: /\bbreaking change\b|\bbreaking\b/i, penalty: 25 },
  { pattern: /\bimport\b.*\bfrom\b.*\bshared\b|\bimport\b.*\bfrom\b.*\bcore\b/i, penalty: 15 },
  { pattern: /\bindex\.ts\b|\bindex\.js\b|\btypes\.ts\b|\bmain\.ts\b|\bmain\.js\b/i, penalty: 15 },
  { pattern: /\bcore module\b|\bcore service\b|\bcore util\b/i, penalty: 15 },
  { pattern: /\bconsumer\b.*\bconsume\b|\bmultiple consumer\b|\bshared across\b/i, penalty: 20 },
  { pattern: /\bstate management\b|\bredux\b|\bzustand\b|\bcontext api\b|\bstore\b/i, penalty: 15 },
  { pattern: /\bdatabase\b|\bsql\b|\bschema\b|\bprisma\b|\balembic\b/i, penalty: 15 },
  { pattern: /\benv variable\b|\bsecret\b|\bapi key\b|\bcredential\b/i, penalty: 15 },
  { pattern: /\bchange\b.*\btype\b|\bchange\b.*\benum\b|\bchange\b.*\bproperty\b.*\btype\b|\bstring.*\benum\b|\benum\b.*\bstring\b/i, penalty: 20 },
];

const HEAVY_THRESHOLD = 40;
const MEDIUM_THRESHOLD = 20;

export function classifyTask(description: string, files_affected?: number, description_length?: number): ClassificationResult {
  const desc = description.toLowerCase();
  let score = 0;
  let primaryReason = "";

  for (const c of CRITICAL_DOMAINS) {
    if (c.pattern.test(desc)) {
      return {
        tier: "HEAVY",
        reason: c.reason,
        estimated_files: "5+",
        estimated_tokens: "800+",
        score: 100,
      };
    }
  }

  const effectiveLength = description_length ?? description.length;
  if (effectiveLength > 3000) {
    return {
      tier: "HEAVY",
      reason: "Task description exceeds complexity threshold — high decision entropy detected",
      estimated_files: "5+",
      estimated_tokens: "800+",
      score: 100,
    };
  }

  if (effectiveLength > 1500) {
    score += 15;
    if (!primaryReason) {
      primaryReason = "Extended task scope with multiple instructions";
    }
  }

  for (const c of HEAVY_CRITERIA) {
    if (c.pattern.test(desc)) {
      score += c.weight;
      if (!primaryReason) {
        primaryReason = c.reason;
      }
    }
  }

  for (const c of MEDIUM_CRITERIA) {
    if (c.pattern.test(desc)) {
      score += c.weight;
      if (!primaryReason) {
        primaryReason = c.reason;
      }
    }
  }

  let lightMatches: string[] = [];
  for (const c of LIGHT_CRITERIA) {
    if (c.pattern.test(desc)) {
      score += c.weight;
      lightMatches.push(c.reason);
    }
  }

  for (const p of PENALTY_KEYWORDS) {
    if (p.pattern.test(desc)) {
      score += p.penalty;
    }
  }

  if (files_affected !== undefined) {
    if (files_affected >= 5) {
      score += 30;
      if (!primaryReason) {
        primaryReason = "High entropy identified by the large number of affected files (>= 5)";
      }
    } else if (files_affected >= 3) {
      score += 15;
    } else if (files_affected >= 2) {
      score += 5;
    }
  }

  if (score >= HEAVY_THRESHOLD) {
    return {
      tier: "HEAVY",
      reason: primaryReason || "Accumulated complexity score indicates high decision entropy",
      estimated_files: "5+",
      estimated_tokens: "800+",
      score,
    };
  }

  if (score >= MEDIUM_THRESHOLD) {
    return {
      tier: "MEDIUM",
      reason: primaryReason || "New logic within a well-delimited scope (2-4 files)",
      estimated_files: "2\u20135",
      estimated_tokens: "200\u2013800",
      score,
    };
  }

  let hasPenalty = false;
  for (const p of PENALTY_KEYWORDS) {
    if (p.pattern.test(desc)) {
      hasPenalty = true;
      break;
    }
  }

  if (hasPenalty || (files_affected !== undefined && files_affected >= 2)) {
    return {
      tier: "MEDIUM",
      reason: primaryReason || "Task contains risk indicators requiring intermediate model capability",
      estimated_files: "2\u20135",
      estimated_tokens: "200\u2013800",
      score,
    };
  }

  let lightReason = "Deterministic transformation with low entropy";
  if (lightMatches.length > 0) {
    lightReason = lightMatches[0];
  } else if (score > 0 && score < MEDIUM_THRESHOLD) {
    lightReason = "Minimal scope with low complexity indicators";
  }

  return {
    tier: "LIGHT",
    reason: lightReason,
    estimated_files: "1\u20132",
    estimated_tokens: "< 200",
    score,
  };
}
