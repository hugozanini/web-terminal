import { describe, it, expect } from 'vitest';
import { generatePipelines, generatePipelineRuns } from '../pipeline-runs';

describe('generatePipelines', () => {
  const datasetIds = ['ds-1', 'ds-2', 'ds-3', 'ds-4', 'ds-5'];
  const pipelines = generatePipelines(datasetIds);

  it('generates 22 pipelines from PIPELINE_DEFS', () => {
    expect(pipelines).toHaveLength(22);
  });

  it('each pipeline has a unique id', () => {
    const ids = pipelines.map((p) => p.id);
    expect(new Set(ids).size).toBe(pipelines.length);
  });

  it('each pipeline references valid dataset IDs', () => {
    for (const p of pipelines) {
      expect(p.inputDatasets.length).toBeGreaterThan(0);
      expect(p.outputDatasets.length).toBeGreaterThan(0);
      for (const id of [...p.inputDatasets, ...p.outputDatasets]) {
        expect(datasetIds).toContain(id);
      }
    }
  });

  it('each pipeline has valid type', () => {
    const validTypes = ['Ingestion', 'Transformation', 'Quality Check', 'Export', 'Aggregation'];
    for (const p of pipelines) {
      expect(validTypes).toContain(p.type);
    }
  });

  it('each pipeline has valid lastRunStatus', () => {
    const valid = ['Success', 'Failed', 'Running', 'Cancelled'];
    for (const p of pipelines) {
      expect(valid).toContain(p.lastRunStatus);
    }
  });

  it('scheduled pipelines have a cron expression', () => {
    for (const p of pipelines) {
      if (p.schedule) {
        expect(typeof p.schedule.cron).toBe('string');
        expect(typeof p.schedule.timezone).toBe('string');
        expect(typeof p.schedule.enabled).toBe('boolean');
        expect(p.schedule.nextRun).toBeInstanceOf(Date);
      }
    }
  });
});

describe('generatePipelineRuns', () => {
  const datasetIds = ['ds-1', 'ds-2', 'ds-3'];
  const pipelines = generatePipelines(datasetIds);
  const runs = generatePipelineRuns(pipelines);

  it('generates at least 3 runs per pipeline', () => {
    expect(runs.length).toBeGreaterThanOrEqual(pipelines.length * 3);
  });

  it('each run references an existing pipeline', () => {
    const pipelineIds = new Set(pipelines.map((p) => p.id));
    for (const run of runs) {
      expect(pipelineIds.has(run.pipelineId)).toBe(true);
    }
  });

  it('each run has valid status', () => {
    const valid = ['Success', 'Failed', 'Running', 'Cancelled'];
    for (const run of runs) {
      expect(valid).toContain(run.status);
    }
  });

  it('each run has logs', () => {
    for (const run of runs) {
      expect(Array.isArray(run.logs)).toBe(true);
      expect(run.logs.length).toBeGreaterThan(0);
      for (const log of run.logs) {
        expect(log.timestamp).toBeInstanceOf(Date);
        expect(['INFO', 'WARN', 'ERROR', 'DEBUG']).toContain(log.level);
        expect(typeof log.message).toBe('string');
      }
    }
  });

  it('runs are sorted by startTime descending', () => {
    for (let i = 1; i < runs.length; i++) {
      expect(new Date(runs[i - 1].startTime).getTime())
        .toBeGreaterThanOrEqual(new Date(runs[i].startTime).getTime());
    }
  });

  it('failed runs have recordsFailed > 0', () => {
    const failedRuns = runs.filter((r) => r.status === 'Failed');
    for (const run of failedRuns) {
      expect(run.recordsFailed).toBeGreaterThan(0);
    }
  });
});
