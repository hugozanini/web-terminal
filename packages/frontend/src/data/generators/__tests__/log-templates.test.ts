import { describe, it, expect } from 'vitest';
import { getSuccessLogSteps, getFailureLogSteps } from '../log-templates';

describe('getSuccessLogSteps', () => {
  const steps = getSuccessLogSteps('test-pipeline');

  it('returns a non-empty array', () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it('each step has delay, level, and message', () => {
    for (const step of steps) {
      expect(typeof step.delay).toBe('number');
      expect(step.delay).toBeGreaterThanOrEqual(0);
      expect(['INFO', 'WARN', 'ERROR', 'DEBUG']).toContain(step.level);
      expect(typeof step.message).toBe('string');
      expect(step.message.length).toBeGreaterThan(0);
    }
  });

  it('includes the pipeline name in messages', () => {
    const hasName = steps.some((s) => s.message.includes('test-pipeline'));
    expect(hasName).toBe(true);
  });

  it('ends with SUCCESS status', () => {
    const last = steps[steps.length - 1];
    expect(last.message).toContain('SUCCESS');
  });

  it('delays are monotonically increasing', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].delay).toBeGreaterThanOrEqual(steps[i - 1].delay);
    }
  });
});

describe('getFailureLogSteps', () => {
  const steps = getFailureLogSteps('test-pipeline');

  it('returns a non-empty array', () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it('contains ERROR level entries', () => {
    const errors = steps.filter((s) => s.level === 'ERROR');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('ends with FAILED status', () => {
    const last = steps[steps.length - 1];
    expect(last.message).toContain('FAILED');
  });

  it('includes the pipeline name in messages', () => {
    const hasName = steps.some((s) => s.message.includes('test-pipeline'));
    expect(hasName).toBe(true);
  });
});
