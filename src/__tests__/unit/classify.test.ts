import { describe, it, expect } from 'vitest';
import { classifyTask, Tier } from '../../classify';

function h(desc: string, files?: number): ReturnType<typeof classifyTask> {
  return classifyTask(desc, files);
}

describe('classifyTask', () => {
  describe('critical domains (immediate HEAVY)', () => {
    it.each([
      ['authentication', 'authentication'],
      ['authorization', 'authorization'],
      ['auth', 'auth'],
      ['oauth', 'oauth'],
      ['webhook', 'webhook integration with slack'],
      ['schema migration', 'create a schema migration'],
      ['database in production', 'database in production migration'],
      ['billing', 'billing system'],
      ['payment', 'payment flow'],
      ['stripe', 'integrate stripe checkout'],
      ['compliance', 'security compliance audit'],
      ['cryptography', 'implement cryptography'],
      ['encrypt', 'encrypt user data'],
      ['data pipeline', 'build data pipeline'],
      ['etl', 'etl process'],
      ['memory leak', 'fix memory leak'],
      ['race condition', 'fix race condition'],
      ['architecture redesign', 'architecture redesign project'],
      ['rbac', 'implement rbac'],
      ['permission', 'permission system'],
      ['jwt', 'jwt token management'],
      ['lgpd', 'lgpd compliance'],
      ['gdpr', 'gdpr requirements'],
    ])('"%s" returns HEAVY with score 100', (_, desc) => {
      const r = h(desc);
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBe(100);
    });
  });

  describe('description length thresholds', () => {
    it('returns HEAVY with score 100 when length > 3000', () => {
      const desc = 'x'.repeat(3001);
      const r = h(desc);
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBe(100);
    });

    it('returns HEAVY with score 100 when explicit description_length > 3000', () => {
      const r = classifyTask('short summary', undefined, 3001);
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBe(100);
    });

    it('adds +15 when length > 1500 and no other criteria match', () => {
      const desc = 'a'.repeat(1600);
      const r = h(desc);
      expect(r.score).toBe(15);
      expect(r.tier).not.toBe('HEAVY');
    });
  });

  describe('HEAVY criteria scoring (25-30 pts each)', () => {
    it('accumulates score and returns HEAVY when >= 40', () => {
      const r = h('state management with redux and shared logic extraction');
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBeGreaterThanOrEqual(40);
    });

    it('single heavy criterion with weight 30 and files_affected=5 triggers HEAVY', () => {
      const r = h('authentication refactor', 5);
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBeGreaterThanOrEqual(40);
    });
  });

  describe('MEDIUM criteria scoring (10-15 pts each)', () => {
    it('returns MEDIUM when score >= 20 from medium criteria', () => {
      const r = h('new function with validation and business rule');
      expect(r.tier).toBe('MEDIUM');
      expect(r.score).toBeGreaterThanOrEqual(20);
    });

    it('two medium criteria add up to MEDIUM', () => {
      const r = h('add pagination with error handling', 2);
      expect(r.tier).toBe('MEDIUM');
    });

    it('new endpoint integration returns MEDIUM', () => {
      const r = h('implement new endpoint for user api integration');
      expect(r.tier).toBe('MEDIUM');
    });
  });

  describe('LIGHT criteria and fallback', () => {
    it('change button color returns LIGHT with score 5', () => {
      const r = h('change button color to blue');
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBe(5);
    });

    it('fix typo returns LIGHT', () => {
      const r = h('fix typo in header');
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBe(3);
    });

    it('empty description returns LIGHT', () => {
      const r = h('');
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBe(0);
    });

    it('non-matching text returns LIGHT with score 0', () => {
      const r = h('do something');
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBe(0);
    });

    it('score between 1-19 without penalty/files returns LIGHT', () => {
      const r = h('update css style and rename variable');
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBeGreaterThanOrEqual(5);
      expect(r.score).toBeLessThan(20);
    });
  });

  describe('penalty keywords safety net', () => {
    it('export interface upgrades to MEDIUM even with low score', () => {
      const r = h('export interface UserProps');
      expect(r.tier).toBe('MEDIUM');
    });

    it('breaking change upgrades to MEDIUM', () => {
      const r = h('breaking change');
      expect(r.tier).toBe('MEDIUM');
    });

    it('database keyword with penalty upgrades to MEDIUM', () => {
      const r = h('change database schema field type');
      expect(r.tier).toBe('MEDIUM');
    });
  });

  describe('files_affected + criteriaScore safety net', () => {
    it('files=2 + criteriaScore >= 5 upgrades to MEDIUM', () => {
      const r = h('update css and fix typo', 2);
      expect(r.tier).toBe('MEDIUM');
      expect(r.score).toBeGreaterThanOrEqual(5);
    });

    it('files=2 + criteriaScore=0 stays LIGHT (files bonus adds to score but not criteriaScore)', () => {
      const r = h('adjust system behavior', 2);
      expect(r.tier).toBe('LIGHT');
      expect(r.score).toBe(5);
    });

    it('files=3 pushes criteria score >= 20 to MEDIUM', () => {
      const r = h('new validation logic', 3);
      expect(r.tier).toBe('MEDIUM');
    });
  });

  describe('files_affected bonus', () => {
    it('files >= 5 adds +30', () => {
      const r = h('rename variable', 5);
      expect(r.tier).toBe('MEDIUM');
      expect(r.score).toBe(35);
    });

    it('files=3 adds +15', () => {
      const r = h('rename variable', 3);
      expect(r.score).toBe(5 + 15);
    });

    it('files=undefined adds no bonus', () => {
      const r = h('rename variable');
      expect(r.score).toBe(5);
    });

    it('files=0 adds no bonus', () => {
      const r = h('rename variable', 0);
      expect(r.score).toBe(5);
    });
  });

  describe('estimated files and tokens match tier', () => {
    it('HEAVY returns files=5+ and tokens=800+', () => {
      const r = h('authentication rewrite');
      expect(r.estimated_files).toBe('5+');
      expect(r.estimated_tokens).toBe('800+');
    });

    it('MEDIUM returns files=2–5 and tokens=200–800', () => {
      const r = h('add pagination and validation');
      expect(r.estimated_files).toBe('2–5');
      expect(r.estimated_tokens).toBe('200–800');
    });

    it('LIGHT returns files=1–2 and tokens=< 200', () => {
      const r = h('fix typo');
      expect(r.estimated_files).toBe('1–2');
      expect(r.estimated_tokens).toBe('< 200');
    });
  });

  describe('description_length parameter edge cases', () => {
    it('description_length=0 does not trigger length bonus', () => {
      const r = classifyTask('anything', undefined, 0);
      expect(r.tier).toBe('LIGHT');
    });

    it('description_length=1500 does not trigger 1500 threshold', () => {
      const r = classifyTask('anything', undefined, 1500);
      expect(r.score).toBe(0);
    });

    it('description_length=1501 triggers +15', () => {
      const r = classifyTask('anything', undefined, 1501);
      expect(r.score).toBe(15);
    });
  });

  describe('combined scenarios', () => {
    it('medium criteria with 2 files pushes to MEDIUM via safety net', () => {
      const r = h('add pagination with config settings', 2);
      expect(r.tier).toBe('MEDIUM');
    });

    it('light criteria + 5 files = MEDIUM (via threshold)', () => {
      const r = h('fix typo', 5);
      expect(r.tier).toBe('MEDIUM');
      expect(r.score).toBe(33);
    });

    it('multiple heavy criteria accumulate correctly', () => {
      const r = h('state management with shared logic and migrate to new store');
      expect(r.tier).toBe('HEAVY');
      expect(r.score).toBeGreaterThanOrEqual(70);
    });
  });
});
