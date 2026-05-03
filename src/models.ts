import fs from 'fs';
import path from 'path';
import os from 'os';
import { request } from 'undici';
import { Tier } from './classify';

export interface ModelData {
  name: string;
  score: number;
  price: number;
}

export interface TierModels {
  claude: ModelData;
  gemini: ModelData;
  glm: ModelData;
  grok: ModelData;
  openai: ModelData;
}

export interface ModelsData {
  updated_at: string;
  tiers: {
    HEAVY: TierModels;
    MEDIUM: TierModels;
    LIGHT: TierModels;
  };
}

const CACHE_DIR = path.join(os.homedir(), '.oracle-models');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const AA_API_URL = 'https://artificialanalysis.ai/api/v2/data/llms/models';

type ProviderKey = 'claude' | 'gemini' | 'glm' | 'grok' | 'openai';

const CREATOR_MAP: Record<string, ProviderKey> = {
  'Anthropic': 'claude',
  'Google': 'gemini',
  'Z AI': 'glm',
  'xAI': 'grok',
  'OpenAI': 'openai',
};

const TIER_SELECTION: Record<Tier, { heavy: string[]; medium: string[]; light: string[] }> = {
  HEAVY: {
    heavy: ['Claude Opus 4.7 (Adaptive Reasoning, Max Effort)', 'Gemini 3.1 Pro Preview', 'GLM-5.1 (Reasoning)', 'Grok 4.3', 'GPT-5.5 (xhigh)'],
    medium: ['Claude Sonnet 4.6 (Adaptive Reasoning, Max Effort)', 'Gemini 3 Flash Preview (Reasoning)', 'GLM-5 (Reasoning)', 'Grok 4.1 Fast (Reasoning)', 'GPT-5.4 mini (xhigh)'],
    light: ['Claude 4.5 Haiku (Reasoning)', 'Gemini 3.1 Flash-Lite Preview', 'GLM-4.7-Flash (Reasoning)', 'Grok 4.1 Fast (Non-reasoning)', 'GPT-5.4 nano (xhigh)'],
  },
  MEDIUM: {
    heavy: ['Claude Opus 4.7 (Adaptive Reasoning, Max Effort)', 'Gemini 3.1 Pro Preview', 'GLM-5.1 (Reasoning)', 'Grok 4.3', 'GPT-5.5 (xhigh)'],
    medium: ['Claude Sonnet 4.6 (Adaptive Reasoning, Max Effort)', 'Gemini 3 Flash Preview (Reasoning)', 'GLM-5 (Reasoning)', 'Grok 4.1 Fast (Reasoning)', 'GPT-5.4 mini (xhigh)'],
    light: ['Claude 4.5 Haiku (Reasoning)', 'Gemini 3.1 Flash-Lite Preview', 'GLM-4.7-Flash (Reasoning)', 'Grok 4.1 Fast (Non-reasoning)', 'GPT-5.4 nano (xhigh)'],
  },
  LIGHT: {
    heavy: ['Claude Opus 4.7 (Adaptive Reasoning, Max Effort)', 'Gemini 3.1 Pro Preview', 'GLM-5.1 (Reasoning)', 'Grok 4.3', 'GPT-5.5 (xhigh)'],
    medium: ['Claude Sonnet 4.6 (Adaptive Reasoning, Max Effort)', 'Gemini 3 Flash Preview (Reasoning)', 'GLM-5 (Reasoning)', 'Grok 4.1 Fast (Reasoning)', 'GPT-5.4 mini (xhigh)'],
    light: ['Claude 4.5 Haiku (Reasoning)', 'Gemini 3.1 Flash-Lite Preview', 'GLM-4.7-Flash (Reasoning)', 'Grok 4.1 Fast (Non-reasoning)', 'GPT-5.4 nano (xhigh)'],
  },
};

function getFallbackData(): ModelsData {
  try {
    const fallbackPath = path.join(__dirname, '..', 'data', 'fallback.json');
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      updated_at: "2026-05-02",
      tiers: {
        HEAVY: {
          claude: { name: "Claude Opus 4.7 (max)", score: 57.3, price: 10.00 },
          gemini: { name: "Gemini 3.1 Pro Preview", score: 57.2, price: 4.50 },
          glm: { name: "GLM-5.1 (Reasoning)", score: 51.4, price: 2.15 },
          grok: { name: "Grok 4.3", score: 53.2, price: 1.56 },
          openai: { name: "GPT-5.5 (xhigh)", score: 60.2, price: 11.25 },
        },
        MEDIUM: {
          claude: { name: "Claude Sonnet 4.6 (max)", score: 51.7, price: 6.56 },
          gemini: { name: "Gemini 3 Flash Preview", score: 46.4, price: 1.13 },
          glm: { name: "GLM-5 (Reasoning)", score: 49.8, price: 1.55 },
          grok: { name: "Grok 4.1 Fast (Reasoning)", score: 38.6, price: 0.28 },
          openai: { name: "GPT-5.4 mini (xhigh)", score: 48.9, price: 1.69 },
        },
        LIGHT: {
          claude: { name: "Claude 4.5 Haiku (Reasoning)", score: 37.1, price: 2.19 },
          gemini: { name: "Gemini 3.1 Flash-Lite Preview", score: 33.5, price: 0.56 },
          glm: { name: "GLM-4.7-Flash (Reasoning)", score: 30.1, price: 0.15 },
          grok: { name: "Grok 4.1 Fast (Non-reasoning)", score: 23.6, price: 0.28 },
          openai: { name: "GPT-5.4 nano (xhigh)", score: 44.0, price: 0.46 },
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
      return affordable.reduce((best, m) =>
        (m.evaluations.artificial_analysis_intelligence_index ?? 0) > (best.evaluations.artificial_analysis_intelligence_index ?? 0) ? m : best
      );
    }
  }
}

function mapApiDataToModelsData(apiModels: AAModel[]): ModelsData {
  const byProvider: Record<string, AAModel[]> = {};
  for (const m of apiModels) {
    const creatorName = m.model_creator?.name;
    if (!creatorName || !CREATOR_MAP[creatorName]) continue;
    if (!byProvider[creatorName]) byProvider[creatorName] = [];
    byProvider[creatorName].push(m);
  }

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

  for (const [creatorName, providerKey] of Object.entries(CREATOR_MAP)) {
    const models = byProvider[creatorName] || [];
    for (const tier of ['HEAVY', 'MEDIUM', 'LIGHT'] as Tier[]) {
      const best = selectBestModel(models, strategies[tier]);
      tiers[tier][providerKey] = best
        ? {
            name: best.name,
            score: best.evaluations.artificial_analysis_intelligence_index!,
            price: best.pricing.price_1m_blended_3_to_1!,
          }
        : getFallbackData().tiers[tier][providerKey];
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
    const response = await request(AA_API_URL, {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'oracle-models-mcp/1.0',
      },
    });

    if (response.statusCode !== 200) return null;

    const body = await response.body.json() as AAResponse;

    if (!body.data || !Array.isArray(body.data)) return null;

    return mapApiDataToModelsData(body.data);
  } catch (err) {
    return null;
  }
}

export async function getModelSuggestions(tier: Tier, preferred_provider?: string) {
  let dataSource: "cache" | "live" | "fallback" = "fallback";
  let modelsData: ModelsData | null = null;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheContent = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const cacheAge = Date.now() - new Date(cacheContent.fetched_at).getTime();
      if (cacheAge < CACHE_EXPIRATION_MS) {
        modelsData = cacheContent.data;
        dataSource = "cache";
      }
    } catch (e) {
    }
  }

  if (!modelsData) {
    modelsData = await fetchLiveData();
    if (modelsData) {
      dataSource = "live";
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
    dataSource = "fallback";
  }

  const tierModels = modelsData.tiers[tier];

  const normalizedProvider = preferred_provider ? preferred_provider.toLowerCase() : undefined;
  let suggestedFirst: string | undefined = undefined;

  if (normalizedProvider) {
    if (normalizedProvider.includes("anthropic") || normalizedProvider.includes("claude")) suggestedFirst = "claude";
    else if (normalizedProvider.includes("google") || normalizedProvider.includes("gemini")) suggestedFirst = "gemini";
    else if (normalizedProvider.includes("zai") || normalizedProvider.includes("glm")) suggestedFirst = "glm";
    else if (normalizedProvider.includes("xai") || normalizedProvider.includes("grok")) suggestedFirst = "grok";
    else if (normalizedProvider.includes("openai") || normalizedProvider.includes("gpt")) suggestedFirst = "openai";
  }

  return {
    tier,
    updated_at: modelsData.updated_at,
    data_source: dataSource,
    models: {
      claude: { ...tierModels.claude, price_blended_usd_per_1m: tierModels.claude.price },
      gemini: { ...tierModels.gemini, price_blended_usd_per_1m: tierModels.gemini.price },
      glm: { ...tierModels.glm, price_blended_usd_per_1m: tierModels.glm.price },
      grok: { ...tierModels.grok, price_blended_usd_per_1m: tierModels.grok.price },
      openai: { ...tierModels.openai, price_blended_usd_per_1m: tierModels.openai.price },
    },
    ...(suggestedFirst ? { suggested_first: suggestedFirst } : {}),
  };
}
