import fs from 'fs';
import path from 'path';
import os from 'os';
import { Tier } from './classify';

export type ProviderKey = 'anthropic' | 'google' | 'openai' | 'xai' | 'deepseek' | 'moonshot' | 'alibaba' | 'meta' | 'mistral' | 'glm';
export type ProviderCategory = 'proprietary' | 'opensource' | 'national';
export type ClientType = 'native' | 'aggregator' | 'unknown';

export interface ModelData {
  name: string;
  score: number;
  price: number;
  speed: number;
}

export type TierModels = Record<string, ModelData>;

export interface ModelsData {
  updated_at: string;
  tiers: {
    HEAVY: TierModels;
    MEDIUM: TierModels;
    LIGHT: TierModels;
  };
}

export interface ClientClassification {
  type: ClientType;
  provider?: ProviderKey;
  label: string;
}

interface ProviderMeta {
  key: ProviderKey;
  category: ProviderCategory;
  displayLabel: string;
  creatorNames: string[];
}

const PROVIDER_REGISTRY: ProviderMeta[] = [
  { key: 'anthropic', category: 'proprietary', displayLabel: 'Claude', creatorNames: ['Anthropic'] },
  { key: 'google', category: 'proprietary', displayLabel: 'Gemini', creatorNames: ['Google'] },
  { key: 'openai', category: 'proprietary', displayLabel: 'GPT', creatorNames: ['OpenAI'] },
  { key: 'xai', category: 'proprietary', displayLabel: 'Grok', creatorNames: ['xAI'] },
  { key: 'deepseek', category: 'opensource', displayLabel: 'DeepSeek', creatorNames: ['DeepSeek'] },
  { key: 'moonshot', category: 'opensource', displayLabel: 'Kimi', creatorNames: ['Kimi'] },
  { key: 'alibaba', category: 'opensource', displayLabel: 'Qwen', creatorNames: ['Alibaba'] },
  { key: 'meta', category: 'opensource', displayLabel: 'Llama', creatorNames: ['Meta'] },
  { key: 'mistral', category: 'opensource', displayLabel: 'Mistral', creatorNames: ['Mistral'] },
  { key: 'glm', category: 'national', displayLabel: 'GLM', creatorNames: ['Z AI'] },
];

const CREATOR_TO_PROVIDER: Record<string, ProviderKey> = {};
for (const p of PROVIDER_REGISTRY) {
  for (const name of p.creatorNames) {
    CREATOR_TO_PROVIDER[name] = p.key;
  }
}

export function getProviderDisplayLabel(key: string): string {
  const provider = PROVIDER_REGISTRY.find(p => p.key === key);
  return provider?.displayLabel || key;
}

function getProviderCategory(key: string): ProviderCategory {
  const provider = PROVIDER_REGISTRY.find(p => p.key === key);
  return provider?.category || 'proprietary';
}

const OSS_PROVIDER_KEYS: string[] = PROVIDER_REGISTRY.filter(p => p.category === 'opensource').map(p => p.key);

const CACHE_DIR = path.join(os.homedir(), '.oracle-models');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const AA_API_URL = 'https://artificialanalysis.ai/api/v2/data/llms/models';

let detectedClient: string | null = null;

export function setDetectedClient(name: string): void {
  detectedClient = name;
}

export function getDetectedClient(): string | null {
  return detectedClient;
}

export function classifyClient(clientName: string): ClientClassification {
  const lower = clientName.toLowerCase();

  if (lower.includes('antigravity')) return { type: 'native', provider: 'google', label: 'Antigravity CLI' };
  if (lower.includes('claude')) return { type: 'native', provider: 'anthropic', label: 'Claude Code' };
  if (lower.includes('gemini')) return { type: 'native', provider: 'google', label: 'Gemini CLI' };
  if (lower.includes('codex')) return { type: 'native', provider: 'openai', label: 'Codex' };

  if (lower.includes('opencode')) return { type: 'aggregator', label: 'OpenCode' };
  if (lower.includes('cursor')) return { type: 'aggregator', label: 'Cursor' };
  if (lower.includes('cline')) return { type: 'aggregator', label: 'Cline' };
  if (lower.includes('windsurf')) return { type: 'aggregator', label: 'Windsurf' };
  if (lower.includes('roo')) return { type: 'aggregator', label: 'Roo Code' };
  if (lower.includes('copilot')) return { type: 'aggregator', label: 'GitHub Copilot' };
  if (lower.includes('goose')) return { type: 'aggregator', label: 'Goose' };
  if (lower.includes('kiro')) return { type: 'aggregator', label: 'Kiro CLI' };
  if (lower.includes('augment')) return { type: 'aggregator', label: 'Augment' };
  if (lower.includes('aider')) return { type: 'aggregator', label: 'Aider' };
  if (lower.includes('trae')) return { type: 'aggregator', label: 'Trae' };
  if (lower.includes('amp')) return { type: 'aggregator', label: 'Amp' };

  return { type: 'unknown', label: 'Unknown' };
}

function resolvePreferredProvider(raw?: string): ProviderKey | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();

  if (lower.includes('anthropic') || lower.includes('claude')) return 'anthropic';
  if (lower.includes('google') || lower.includes('gemini')) return 'google';
  if (lower.includes('openai') || lower.includes('gpt')) return 'openai';
  if (lower.includes('xai') || lower.includes('grok')) return 'xai';
  if (lower.includes('deepseek')) return 'deepseek';
  if (lower.includes('moonshot') || lower.includes('kimi')) return 'moonshot';
  if (lower.includes('alibaba') || lower.includes('qwen')) return 'alibaba';
  if (lower.includes('meta') || lower.includes('llama')) return 'meta';
  if (lower.includes('mistral')) return 'mistral';
  if (lower.includes('zai') || lower.includes('glm')) return 'glm';

  return undefined;
}

function getFallbackData(): ModelsData {
  try {
    const fallbackPath = path.join(__dirname, '..', 'data', 'fallback.json');
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      updated_at: '2026-05-20',
      tiers: {
        HEAVY: {
          anthropic: { name: 'Claude Opus 4.7 (max)', score: 57, price: 4.10, speed: 512 },
          google: { name: 'Gemini 3.1 Pro Preview', score: 57, price: 1.74, speed: 232 },
          openai: { name: 'GPT-5.5 (xhigh)', score: 60, price: 4.35, speed: 659 },
          xai: { name: 'Grok 4.3 (high)', score: 53, price: 0.64, speed: 927 },
          deepseek: { name: 'DeepSeek V4 Pro (Max)', score: 52, price: 0.71, speed: 302 },
          moonshot: { name: 'Kimi K2.6', score: 54, price: 0.70, speed: 972 },
          alibaba: { name: 'Qwen3.6 Plus', score: 50, price: 0.43, speed: 522 },
          meta: { name: 'Muse Spark', score: 52, price: 0.34, speed: 0 },
          mistral: { name: 'Mistral Medium 3.5', score: 39, price: 2.10, speed: 167 },
          glm: { name: 'GLM-5.1', score: 51, price: 0.90, speed: 541 },
        },
        MEDIUM: {
          anthropic: { name: 'Claude Sonnet 4.6 (max)', score: 52, price: 2.46, speed: 621 },
          google: { name: 'Gemini 3 Flash', score: 46, price: 0.43, speed: 171 },
          openai: { name: 'GPT-5.4 mini (xhigh)', score: 49, price: 0.65, speed: 1688 },
          xai: { name: 'Grok 4.1 Fast', score: 39, price: 0.28, speed: 0 },
          deepseek: { name: 'DeepSeek V4 Flash (Max)', score: 47, price: 0.06, speed: 1051 },
          moonshot: { name: 'Kimi K2.6 (Non-reasoning)', score: 43, price: 0.70, speed: 652 },
          alibaba: { name: 'Qwen3.6 35B A3B', score: 43, price: 0.37, speed: 184 },
          meta: { name: 'Llama 4 Maverick', score: 18, price: 0.34, speed: 113 },
          mistral: { name: 'Mistral Small 4', score: 28, price: 0.20, speed: 156 },
          glm: { name: 'GLM-5', score: 50, price: 0.66, speed: 666 },
        },
        LIGHT: {
          anthropic: { name: 'Claude 4.5 Haiku (Reasoning)', score: 37, price: 0.82, speed: 1021 },
          google: { name: 'Gemini 3.1 Flash-Lite Preview', score: 34, price: 0.22, speed: 3155 },
          openai: { name: 'GPT-5.4 nano (xhigh)', score: 44, price: 0.18, speed: 1564 },
          xai: { name: 'Grok 4.1 Fast (Non-reasoning)', score: 24, price: 0.10, speed: 0 },
          deepseek: { name: 'DeepSeek V4 Flash', score: 36, price: 0.06, speed: 1001 },
          moonshot: { name: 'Kimi K2.5', score: 37, price: 0.49, speed: 443 },
          alibaba: { name: 'Qwen3.5 0.8B (Non-reasoning)', score: 11, price: 0.01, speed: 0 },
          meta: { name: 'Llama 4 Scout', score: 14, price: 0.22, speed: 1280 },
          mistral: { name: 'Devstral 2', score: 22, price: 0.005, speed: 571 },
          glm: { name: 'GLM-5 (Non-reasoning)', score: 41, price: 0.66, speed: 512 },
        },
      },
    };
  }
}

interface AAModel {
  id: string;
  name: string;
  slug: string;
  model_creator: {
    id: string;
    name: string;
    slug: string;
  };
  evaluations: {
    artificial_analysis_intelligence_index?: number;
    [key: string]: number | undefined;
  };
  pricing: {
    price_1m_blended_3_to_1?: number;
    [key: string]: number | undefined;
  };
  median_output_tokens_per_second?: number | null;
  median_time_to_first_token_seconds?: number | null;
}

interface AAResponse {
  status: number;
  data: AAModel[];
}

function selectBestModel(models: AAModel[], strategy: 'highest_score' | 'best_midrange' | 'cheapest_fastest'): AAModel | null {
  const withData = models.filter(
    m => m.evaluations.artificial_analysis_intelligence_index != null
      && m.pricing.price_1m_blended_3_to_1 != null
      && m.pricing.price_1m_blended_3_to_1 > 0
  );
  if (withData.length === 0) return null;

  switch (strategy) {
    case 'highest_score':
      return withData.reduce((best, m) =>
        (m.evaluations.artificial_analysis_intelligence_index ?? 0) > (best.evaluations.artificial_analysis_intelligence_index ?? 0) ? m : best
      );
    case 'best_midrange': {
      const sorted = [...withData].sort((a, b) =>
        (b.evaluations.artificial_analysis_intelligence_index ?? 0) - (a.evaluations.artificial_analysis_intelligence_index ?? 0)
      );
      const topScore = sorted[0].evaluations.artificial_analysis_intelligence_index ?? 0;
      const threshold = topScore * 0.7;
      const midrange = sorted.filter(m => (m.evaluations.artificial_analysis_intelligence_index ?? 0) >= threshold);
      return midrange.reduce((best, m) =>
        (m.pricing.price_1m_blended_3_to_1 ?? Infinity) < (best.pricing.price_1m_blended_3_to_1 ?? Infinity) ? m : best
      );
    }
    case 'cheapest_fastest': {
      const sorted = [...withData].sort((a, b) =>
        (a.pricing.price_1m_blended_3_to_1 ?? Infinity) - (b.pricing.price_1m_blended_3_to_1 ?? Infinity)
      );
      const cheapestPrice = sorted[0].pricing.price_1m_blended_3_to_1 ?? 0;
      const cheapThreshold = cheapestPrice * 3;
      const affordable = sorted.filter(m => (m.pricing.price_1m_blended_3_to_1 ?? Infinity) <= cheapThreshold);
      return affordable.reduce((best, m) => {
        const speedA = m.median_output_tokens_per_second ?? 0;
        const speedB = best.median_output_tokens_per_second ?? 0;
        const scoreA = m.evaluations.artificial_analysis_intelligence_index ?? 0;
        const scoreB = best.evaluations.artificial_analysis_intelligence_index ?? 0;
        if (scoreA !== scoreB) return scoreA > scoreB ? m : best;
        return speedA > speedB ? m : best;
      });
    }
  }
}

function mapApiDataToModelsData(apiModels: AAModel[]): ModelsData {
  const byProvider: Record<string, AAModel[]> = {};
  for (const m of apiModels) {
    const creatorName = m.model_creator?.name;
    if (!creatorName || !CREATOR_TO_PROVIDER[creatorName]) continue;
    if (!byProvider[creatorName]) byProvider[creatorName] = [];
    byProvider[creatorName].push(m);
  }

  const fallback = getFallbackData();
  const tiers: ModelsData['tiers'] = {
    HEAVY: {} as TierModels,
    MEDIUM: {} as TierModels,
    LIGHT: {} as TierModels,
  };

  const strategies: Record<Tier, 'highest_score' | 'best_midrange' | 'cheapest_fastest'> = {
    HEAVY: 'highest_score',
    MEDIUM: 'best_midrange',
    LIGHT: 'cheapest_fastest',
  };

  for (const [creatorName, providerKey] of Object.entries(CREATOR_TO_PROVIDER)) {
    const models = byProvider[creatorName] || [];
    for (const tier of ['HEAVY', 'MEDIUM', 'LIGHT'] as Tier[]) {
      const best = selectBestModel(models, strategies[tier]);
      tiers[tier][providerKey] = best
        ? {
            name: best.name,
            score: best.evaluations.artificial_analysis_intelligence_index!,
            price: best.pricing.price_1m_blended_3_to_1!,
            speed: best.median_output_tokens_per_second ?? 0,
          }
        : fallback.tiers[tier][providerKey];
    }
  }

  return {
    updated_at: new Date().toISOString().split('T')[0],
    tiers,
  };
}

async function fetchLiveData(): Promise<ModelsData | null> {
  const apiKey = process.env.AA_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(AA_API_URL, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'oracle-models-mcp/2.0',
      },
    });

    if (response.status !== 200) return null;

    const body = await response.json() as AAResponse;

    if (!body.data || !Array.isArray(body.data)) return null;

    return mapApiDataToModelsData(body.data);
  } catch (err) {
    return null;
  }
}

function selectTopModels(
  allTierModels: TierModels,
  tier: Tier,
  maxModels: number
): TierModels {
  const entries = Object.entries(allTierModels);
  if (entries.length <= maxModels) return allTierModels;

  let sorted: [string, ModelData][];
  switch (tier) {
    case 'HEAVY':
      sorted = [...entries].sort((a, b) => b[1].score - a[1].score);
      break;
    case 'MEDIUM':
      sorted = [...entries].sort((a, b) => {
        const ratioA = a[1].price / Math.max(a[1].score, 1);
        const ratioB = b[1].price / Math.max(b[1].score, 1);
        return ratioA - ratioB;
      });
      break;
    case 'LIGHT':
      sorted = [...entries].sort((a, b) => {
        if (a[1].price !== b[1].price) return a[1].price - b[1].price;
        if (b[1].speed !== a[1].speed) return b[1].speed - a[1].speed;
        return b[1].score - a[1].score;
      });
      break;
  }

  const topN = sorted.slice(0, maxModels);
  const selectedKeys = new Set(topN.map(([k]) => k));

  if (!selectedKeys.has('deepseek')) {
    const deepseekEntry = sorted.find(([k]) => k === 'deepseek');
    if (deepseekEntry) {
      topN[topN.length - 1] = deepseekEntry;
      selectedKeys.add('deepseek');
    }
  }

  const hasOss = topN.some(([k]) => OSS_PROVIDER_KEYS.includes(k));
  if (!hasOss) {
    const ossEntry = sorted.find(([k]) => OSS_PROVIDER_KEYS.includes(k) && !selectedKeys.has(k));
    if (ossEntry) {
      topN[topN.length - 1] = ossEntry;
    }
  }

  return Object.fromEntries(topN);
}

export interface ModelSuggestionsResult {
  tier: Tier;
  updated_at: string;
  data_source: 'cache' | 'live' | 'fallback';
  client_detected: string | null;
  client_type: ClientType;
  native_provider?: ProviderKey;
  client_label: string;
  models: Record<string, ModelData & { price_blended_usd_per_1m: number }>;
  suggested_first?: string;
}

export async function getModelSuggestions(tier: Tier, preferred_provider?: string): Promise<ModelSuggestionsResult> {
  let dataSource: 'cache' | 'live' | 'fallback' = 'fallback';
  let modelsData: ModelsData | null = null;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheContent = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const cacheAge = Date.now() - new Date(cacheContent.fetched_at).getTime();
      if (cacheAge < CACHE_EXPIRATION_MS) {
        modelsData = cacheContent.data;
        dataSource = 'cache';
      }
    } catch (e) {
    }
  }

  if (!modelsData) {
    modelsData = await fetchLiveData();
    if (modelsData) {
      dataSource = 'live';
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        fetched_at: new Date().toISOString(),
        data: modelsData,
      }, null, 2));
    }
  }

  if (!modelsData) {
    modelsData = getFallbackData();
    dataSource = 'fallback';
  }

  const tierModels = modelsData.tiers[tier];

  const clientName = detectedClient;
  const clientClass = clientName ? classifyClient(clientName) : { type: 'unknown' as ClientType, label: 'Unknown' };

  let filteredModels: TierModels;
  let nativeProvider: ProviderKey | undefined;

  if (clientClass.type === 'native' && clientClass.provider) {
    nativeProvider = clientClass.provider;
    const nativeModel = tierModels[nativeProvider];
    filteredModels = nativeModel ? { [nativeProvider]: nativeModel } : tierModels;
  } else if (clientClass.type === 'aggregator') {
    filteredModels = selectTopModels(tierModels, tier, 4);
  } else {
    filteredModels = selectTopModels(tierModels, tier, 4);
  }

  const preferredKey = resolvePreferredProvider(preferred_provider);
  let suggestedFirst: string | undefined = preferredKey;

  if (!suggestedFirst && clientClass.type === 'native' && nativeProvider) {
    suggestedFirst = nativeProvider;
  } else if (!suggestedFirst && clientClass.type === 'aggregator') {
    const entries = Object.entries(filteredModels);
    if (entries.length > 0) {
      switch (tier) {
        case 'HEAVY':
          suggestedFirst = entries.reduce((a, b) => b[1].score > a[1].score ? b : a)[0];
          break;
        case 'MEDIUM':
          suggestedFirst = entries.reduce((a, b) => {
            const ra = a[1].price / Math.max(a[1].score, 1);
            const rb = b[1].price / Math.max(b[1].score, 1);
            return rb < ra ? b : a;
          })[0];
          break;
        case 'LIGHT':
          suggestedFirst = entries.reduce((a, b) => a[1].price <= b[1].price ? a : b)[0];
          break;
      }
    }
  }

  if (suggestedFirst && !filteredModels[suggestedFirst]) {
    suggestedFirst = Object.keys(filteredModels)[0];
  }

  const modelsWithPrice: Record<string, ModelData & { price_blended_usd_per_1m: number }> = {};
  for (const [key, model] of Object.entries(filteredModels)) {
    modelsWithPrice[key] = { ...model, price_blended_usd_per_1m: model.price };
  }

  return {
    tier,
    updated_at: modelsData.updated_at,
    data_source: dataSource,
    client_detected: clientName,
    client_type: clientClass.type,
    ...(nativeProvider ? { native_provider: nativeProvider } : {}),
    client_label: clientClass.label,
    models: modelsWithPrice,
    ...(suggestedFirst ? { suggested_first: suggestedFirst } : {}),
  };
}
