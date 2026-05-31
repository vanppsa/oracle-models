import { describe, it, expect } from 'vitest';
import { formatPlanBlock } from './format';

const baseArgs = {
  tier: 'LIGHT' as const,
  reason: 'Simple visual change',
  estimated_files: '1–2',
  estimated_tokens: '< 200',
  models: {
    deepseek: { name: 'DeepSeek V4 Flash', score: 36, price_blended_usd_per_1m: 0.06 },
  },
};

describe('formatPlanBlock', () => {
  it('includes tier in output', () => {
    const block = formatPlanBlock(baseArgs);
    expect(block).toContain('LIGHT');
  });

  it('includes reason in output', () => {
    const block = formatPlanBlock(baseArgs);
    expect(block).toContain('Simple visual change');
  });

  it('includes estimated files and tokens', () => {
    const block = formatPlanBlock(baseArgs);
    expect(block).toContain('1–2');
    expect(block).toContain('< 200');
  });

  it('includes model name', () => {
    const block = formatPlanBlock(baseArgs);
    expect(block).toContain('DeepSeek V4 Flash');
  });

  it('appends client label suffix when provided and not Unknown', () => {
    const block = formatPlanBlock({ ...baseArgs, client_label: 'OpenCode' });
    expect(block).toContain('(OpenCode)');
  });

  it('omits client label suffix when Unknown', () => {
    const block = formatPlanBlock({ ...baseArgs, client_label: 'Unknown' });
    expect(block).not.toContain('(Unknown)');
  });

  it('highlights suggested model with star', () => {
    const block = formatPlanBlock({ ...baseArgs, suggested_first: 'deepseek' });
    expect(block).toContain('✨');
  });

  it('marks suggested model with star and not others', () => {
    const args = {
      ...baseArgs,
      models: {
        deepseek: { name: 'DS', score: 36, price_blended_usd_per_1m: 0.06 },
        anthropic: { name: 'Claude', score: 52, price_blended_usd_per_1m: 2.46 },
      },
      suggested_first: 'anthropic',
    };
    const block = formatPlanBlock(args);
    expect(block).toContain('Claude ✨');
    expect(block).not.toContain('DS ✨');
  });

  it('includes multiple models when provided', () => {
    const args = {
      ...baseArgs,
      models: {
        deepseek: { name: 'DS', score: 36, price_blended_usd_per_1m: 0.06 },
        anthropic: { name: 'Claude', score: 52, price_blended_usd_per_1m: 2.46 },
      },
    };
    const block = formatPlanBlock(args);
    expect(block).toContain('DS');
    expect(block).toContain('Claude');
  });

  it('output starts and ends with newline', () => {
    const block = formatPlanBlock(baseArgs);
    expect(block[0]).toBe('\n');
    expect(block[block.length - 1]).toBe('\n');
  });

  it('Tier line shows correct tier for HEAVY', () => {
    const args = { ...baseArgs, tier: 'HEAVY' as const, reason: 'Complex refactor' };
    const block = formatPlanBlock(args);
    expect(block).toContain('HEAVY');
    expect(block).toContain('Complex refactor');
  });

  it('formats provider display label', () => {
    const args = {
      ...baseArgs,
      models: {
        anthropic: { name: 'Claude Opus', score: 57, price_blended_usd_per_1m: 4.10 },
      },
    };
    const block = formatPlanBlock(args);
    expect(block).toContain('Claude');
  });
});
