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

function getFallbackData(): ModelsData {
  try {
    const fallbackPath = path.join(__dirname, '..', 'data', 'fallback.json');
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      updated_at: "2026-04-20",
      tiers: {
        HEAVY: {
          claude:  { name: "Claude Opus 4.7",       score: 57, price: 10.00 },
          gemini:  { name: "Gemini 3.1 Pro",        score: 55, price: 4.50  },
          glm:     { name: "GLM-5.1",               score: 53, price: 2.15  },
          grok:    { name: "Grok 4.20",             score: 51, price: 3.00  }
        },
        MEDIUM: {
          claude:  { name: "Claude Sonnet 4.6",     score: 50, price: 6.00  },
          gemini:  { name: "Gemini 3 Flash",        score: 48, price: 1.13  },
          glm:     { name: "GLM-5",                 score: 46, price: 1.55  },
          grok:    { name: "Grok 4 Fast",           score: 44, price: 0.80  }
        },
        LIGHT: {
          claude:  { name: "Claude Haiku 4.5",      score: 43, price: 1.50  },
          gemini:  { name: "Gemini 3.1 Flash Lite", score: 40, price: 0.15  },
          glm:     { name: "GLM-4.7",               score: 38, price: 0.20  },
          grok:    { name: "Grok 4.1",              score: 36, price: 0.20  }
        }
      }
    };
  }
}

async function fetchLiveData(): Promise<ModelsData | null> {
  try {
    const response = await request('https://artificialanalysis.ai/leaderboards/models', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.statusCode !== 200) {
      return null;
    }

    const html = await response.body.text();
    
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (nextDataMatch) {
      return null;
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function getModelSuggestions(tier: Tier, preferred_provider?: string) {
  let dataSource: "cache" | "live" = "cache";
  let modelsData: ModelsData | null = null;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheContent = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const cacheAge = Date.now() - new Date(cacheContent.fetched_at).getTime();
      
      if (cacheAge < CACHE_EXPIRATION_MS) {
        modelsData = cacheContent.data;
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
        data: modelsData
      }, null, 2));
    } else {
      modelsData = getFallbackData();
    }
  }

  const tierModels = modelsData.tiers[tier];

  const normalizedProvider = preferred_provider ? preferred_provider.toLowerCase() : undefined;
  let suggestedFirst: string | undefined = undefined;
  
  if (normalizedProvider) {
    if (normalizedProvider.includes("anthropic") || normalizedProvider.includes("claude")) suggestedFirst = "claude";
    else if (normalizedProvider.includes("google") || normalizedProvider.includes("gemini")) suggestedFirst = "gemini";
    else if (normalizedProvider.includes("zai") || normalizedProvider.includes("glm")) suggestedFirst = "glm";
    else if (normalizedProvider.includes("xai") || normalizedProvider.includes("grok")) suggestedFirst = "grok";
    else if (normalizedProvider.includes("openai") || normalizedProvider.includes("gpt")) {
    }
  }

  return {
    tier,
    updated_at: modelsData.updated_at,
    data_source: dataSource,
    models: {
      claude: { ...tierModels.claude, price_blended_usd_per_1m: tierModels.claude.price },
      gemini: { ...tierModels.gemini, price_blended_usd_per_1m: tierModels.gemini.price },
      glm: { ...tierModels.glm, price_blended_usd_per_1m: tierModels.glm.price },
      grok: { ...tierModels.grok, price_blended_usd_per_1m: tierModels.grok.price }
    },
    ...(suggestedFirst ? { suggested_first: suggestedFirst } : {})
  };
}
