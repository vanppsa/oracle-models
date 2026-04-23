"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyTask = classifyTask;
const HEAVY_CRITERIA = [
    { pattern: /extract logic.*affect|architecture redesign|migrate .* to|redesign de arquitetura|extração de lógica/i, reason: "Architectural redesign or high-impact logic extraction" },
    { pattern: /authentication|authorization|auth|session|secure login|oauth|autenticação|autorização|sessão/i, reason: "Security and authentication domain" },
    { pattern: /webhook|external system integration|non-trivial api contracts|integração de sistema externo/i, reason: "Complex integration with external systems" },
    { pattern: /memory leak|race condition|intermittent behavior|non-deterministic|comportamento intermitente/i, reason: "Debugging complex and non-deterministic bug" },
    { pattern: /schema migration|database in production|migração de schema|banco de dados em produção/i, reason: "Systemic risk: data migration in production" },
    { pattern: /performance optimization|profiling|otimização de performance/i, reason: "Deep performance optimization" },
    { pattern: /billing|payment|financial flow|stripe|pagamento|fluxo financeiro/i, reason: "Critical financial flow" },
    { pattern: /data pipeline|etl|async worker|retry|fallback|pipeline de dados/i, reason: "Complex asynchronous processing / ETL" },
    { pattern: /security|cryptography|compliance|segurança|criptografia/i, reason: "Changes in security or compliance domains" },
    { pattern: /refactoring.*dependency graph|general refactoring|refatoração geral/i, reason: "Wide-scope refactoring affecting multiple domains" }
];
const MEDIUM_CRITERIA = [
    { pattern: /component.*state|new function|new module|componente.*estado|função nova/i, reason: "Creation of component/function with internal state" },
    { pattern: /signature change|function refactoring|mudança de assinatura|refatoração de função/i, reason: "Refactoring of existing function altering contracts" },
    { pattern: /validation with multiple|business rule|validação com múltiplas|regra de negócio/i, reason: "Inclusion of complex business rules/validations" },
    { pattern: /endpoint integration|new endpoint|integração de endpoint/i, reason: "Integration of new endpoint in existing flow" },
    { pattern: /hook creation|composable|criação de hook/i, reason: "Creation of hook/composable with dependencies" },
    { pattern: /feature flag|toggle|new conditional logic|lógica condicional nova/i, reason: "Implementation of new conditional logic" },
    { pattern: /data migration.*transformation|migração de dados.*transformação/i, reason: "Local data migration and transformation" },
    { pattern: /pagination|filter|sorting|paginação|filtro|ordenação/i, reason: "Addition of list manipulation (filtering, sorting, pagination)" },
    { pattern: /identified cause.*bug|causa identificada.*bug/i, reason: "Delimited bug fix" },
    { pattern: /docker|proxy|simple pipeline|simple infrastructure|infraestrutura simples/i, reason: "Configuration of simple environment/infrastructure" }
];
const LIGHT_CRITERIA = [
    { pattern: /literal value|string|number|boolean|label|ui message|valor literal|número/i, reason: "Change of static literal values" },
    { pattern: /style|css|tailwind|color|spacing|simple layout|estilo|cor|espaçamento/i, reason: "Purely visual changes without logical alteration" },
    { pattern: /rename|renomear.*variable|rename.*function/i, reason: "Safe renaming without public impact" },
    { pattern: /addition.*field.*form|removal.*field|adição.*campo.*formulário/i, reason: "Adjustment in existing form without complex validation" },
    { pattern: /route adjustment|path|redirect|ajuste de rota/i, reason: "Simple routing adjustments" },
    { pattern: /translation|internationalization|i18n|tradução|internacionalização/i, reason: "Alteration of internationalization texts" },
    { pattern: /copy.*block|adapt block|copiar.*bloco/i, reason: "Adaptation of existing code with minimal variation" },
    { pattern: /typo|erro de digitação/i, reason: "Isolated typo correction" }
];
function classifyTask(description, files_affected) {
    const desc = description.toLowerCase();
    let heavyMatches = [];
    let mediumMatches = [];
    let lightMatches = [];
    for (const c of HEAVY_CRITERIA)
        if (c.pattern.test(desc))
            heavyMatches.push(c.reason);
    for (const c of MEDIUM_CRITERIA)
        if (c.pattern.test(desc))
            mediumMatches.push(c.reason);
    for (const c of LIGHT_CRITERIA)
        if (c.pattern.test(desc))
            lightMatches.push(c.reason);
    let isFilesHeavy = files_affected !== undefined && files_affected >= 5;
    let isFilesMedium = files_affected !== undefined && files_affected >= 2 && files_affected < 5;
    let isFilesLight = files_affected !== undefined && files_affected < 2;
    // HEAVY: >= 1 criterion
    if (heavyMatches.length >= 1 || isFilesHeavy) {
        return {
            tier: "HEAVY",
            reason: heavyMatches[0] || "High entropy identified by the large number of affected files (>= 5).",
            estimated_files: "5+",
            estimated_tokens: "800+"
        };
    }
    // MEDIUM: >= 2 criteria (or inferred via files + some criterion)
    if (mediumMatches.length >= 2 || (mediumMatches.length >= 1 && isFilesMedium) || isFilesMedium) {
        return {
            tier: "MEDIUM",
            reason: mediumMatches[0] || "New logic within a well-delimited scope (2-4 files).",
            estimated_files: "2–5",
            estimated_tokens: "200–800"
        };
    }
    // LIGHT: Fallback or LIGHT matches
    let reason = "Deterministic transformation with low entropy.";
    if (lightMatches.length > 0) {
        reason = lightMatches[0];
    }
    else if (mediumMatches.length === 1) {
        reason = "Scope reduced to 1 file with minimal logical alteration.";
    }
    return {
        tier: "LIGHT",
        reason: reason,
        estimated_files: "1–2",
        estimated_tokens: "< 200"
    };
}
