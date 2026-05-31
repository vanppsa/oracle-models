import { describe, it, expect } from 'vitest';
import { classifyClient, getProviderDisplayLabel, selectTopModels, getFallbackData } from './models';
import type { Tier } from './classify';

describe('classifyClient', () => {
  describe('native clients', () => {
    it('detects Claude Code', () => {
      const r = classifyClient('Claude Code CLI');
      expect(r).toEqual({ type: 'native', provider: 'anthropic', label: 'Claude Code' });
    });

    it('detects Gemini CLI', () => {
      const r = classifyClient('Gemini CLI');
      expect(r).toEqual({ type: 'native', provider: 'google', label: 'Gemini CLI' });
    });

    it('detects Antigravity CLI', () => {
      const r = classifyClient('Antigravity CLI v2');
      expect(r).toEqual({ type: 'native', provider: 'google', label: 'Antigravity CLI' });
    });

    it('detects Codex', () => {
      const r = classifyClient('Codex Agent');
      expect(r).toEqual({ type: 'native', provider: 'openai', label: 'Codex' });
    });
  });

  describe('aggregator clients', () => {
    it.each([
      ['OpenCode', 'OpenCode'],
      ['Cursor', 'Cursor'],
      ['Cline', 'Cline'],
      ['Windsurf', 'Windsurf'],
      ['Roo Code', 'Roo Code'],
      ['GitHub Copilot', 'GitHub Copilot'],
      ['Goose', 'Goose'],
      ['Kiro CLI', 'Kiro CLI'],
      ['Augment', 'Augment'],
      ['Aider', 'Aider'],
      ['Trae', 'Trae'],
      ['Amp', 'Amp'],
    ])('detects %s', (clientName, expectedLabel) => {
      const r = classifyClient(clientName);
      expect(r.type).toBe('aggregator');
      expect(r.label).toBe(expectedLabel);
    });
  });

  describe('unknown clients', () => {
    it('returns unknown for unrecognized name', () => {
      const r = classifyClient('Some Random Tool');
      expect(r).toEqual({ type: 'unknown', label: 'Unknown' });
    });

    it('returns unknown for empty string', () => {
      const r = classifyClient('');
      expect(r.type).toBe('unknown');
    });
  });

  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      expect(classifyClient('OPEnCoDe').type).toBe('aggregator');
      expect(classifyClient('claude-code').type).toBe('native');
    });
  });
});

describe('getProviderDisplayLabel', () => {
  it('returns Claude for anthropic', () => {
    expect(getProviderDisplayLabel('anthropic')).toBe('Claude');
  });

  it('returns Gemini for google', () => {
    expect(getProviderDisplayLabel('google')).toBe('Gemini');
  });

  it('returns GPT for openai', () => {
    expect(getProviderDisplayLabel('openai')).toBe('GPT');
  });

  it('returns Grok for xai', () => {
    expect(getProviderDisplayLabel('xai')).toBe('Grok');
  });

  it('returns DeepSeek for deepseek', () => {
    expect(getProviderDisplayLabel('deepseek')).toBe('DeepSeek');
  });

  it('returns GLM for glm', () => {
    expect(getProviderDisplayLabel('glm')).toBe('GLM');
  });

  it('falls back to input key for unknown provider', () => {
    expect(getProviderDisplayLabel('unknown-provider')).toBe('unknown-provider');
  });
});

describe('selectTopModels', () => {
  const fallback = getFallbackData();

  it('returns all models when less than maxModels', () => {
    const r = selectTopModels({ a: { name: 'A', score: 50, price: 1, speed: 100 } }, 'HEAVY', 4);
    expect(Object.keys(r)).toEqual(['a']);
  });

  it('sorts HEAVY by score descending', () => {
    const r = selectTopModels(fallback.tiers.HEAVY, 'HEAVY', 3);
    const scores = Object.values(r).map(m => m.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('ensures at least one open-source model in HEAVY top 4', () => {
    const r = selectTopModels(fallback.tiers.HEAVY, 'HEAVY', 4);
    const ossProviders = ['deepseek', 'moonshot', 'alibaba', 'meta', 'mistral'];
    const hasOss = Object.keys(r).some(k => ossProviders.includes(k));
    expect(hasOss).toBe(true);
  });

  it('forces DeepSeek into top N when not present', () => {
    const models = {
      a: { name: 'A', score: 100, price: 10, speed: 1 },
      b: { name: 'B', score: 99, price: 9, speed: 2 },
      c: { name: 'C', score: 98, price: 8, speed: 3 },
      deepseek: { name: 'DS', score: 1, price: 0.01, speed: 100 },
    };
    const r = selectTopModels(models, 'HEAVY', 3);
    expect(Object.keys(r)).toContain('deepseek');
  });

  it('sorts LIGHT by price ascending with speed tiebreaker', () => {
    const models = {
      a: { name: 'Expensive', score: 50, price: 100, speed: 10 },
      b: { name: 'CheapSlow', score: 20, price: 5, speed: 1 },
      c: { name: 'Mid', score: 30, price: 50, speed: 20 },
      d: { name: 'CheapFast', score: 30, price: 5, speed: 50 },
    };
    const r = selectTopModels(models, 'LIGHT', 3);
    const entries = Object.entries(r);
    const prices = entries.map(([, m]) => m.price);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  it('sorts MEDIUM by price/score ratio ascending', () => {
    const models = {
      a: { name: 'A', score: 50, price: 100, speed: 10 },
      b: { name: 'B', score: 10, price: 1, speed: 100 },
      c: { name: 'C', score: 100, price: 50, speed: 5 },
      d: { name: 'D', score: 20, price: 2, speed: 50 },
    };
    const r = selectTopModels(models, 'MEDIUM', 3);
    const ratios = Object.values(r).map(m => m.price / Math.max(m.score, 1));
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1]);
    }
  });
});

describe('getFallbackData', () => {
  it('returns data with all three tiers', () => {
    const data = getFallbackData();
    expect(data.tiers).toHaveProperty('HEAVY');
    expect(data.tiers).toHaveProperty('MEDIUM');
    expect(data.tiers).toHaveProperty('LIGHT');
  });

  it('has all 10 providers in each tier', () => {
    const data = getFallbackData();
    const expected = ['anthropic', 'google', 'openai', 'xai', 'deepseek', 'moonshot', 'alibaba', 'meta', 'mistral', 'glm'];
    for (const tier of ['HEAVY', 'MEDIUM', 'LIGHT'] as const) {
      expect(Object.keys(data.tiers[tier]).sort()).toEqual(expected.sort());
    }
  });

  it('has updated_at date string', () => {
    const data = getFallbackData();
    expect(data.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
