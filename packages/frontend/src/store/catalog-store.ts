import { create } from 'zustand';
import type { CatalogData, PipelineRun, Pipeline } from '../data/types';
import { generateCatalogData } from '../data/generators';

interface CatalogStore extends CatalogData {
  initialized: boolean;
  initialize: () => void;
  regenerate: () => void;
  addPipelineRun: (run: PipelineRun) => void;
  updatePipelineRun: (runId: string, patch: Partial<PipelineRun>) => void;
  updatePipeline: (pipelineId: string, patch: Partial<Pipeline>) => void;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  datasets: [],
  dataSources: [],
  lineage: [],
  pipelines: [],
  pipelineRuns: [],
  qualityChecks: [],
  costs: [],
  initialized: false,

  initialize: () => {
    const data = generateCatalogData();
    set({
      ...data,
      initialized: true,
    });
  },

  regenerate: () => {
    const data = generateCatalogData();
    set(data);
  },

  addPipelineRun: (run) =>
    set((state) => ({
      pipelineRuns: [run, ...state.pipelineRuns],
    })),

  updatePipelineRun: (runId, patch) =>
    set((state) => ({
      pipelineRuns: state.pipelineRuns.map((r) =>
        r.id === runId ? { ...r, ...patch } : r
      ),
    })),

  updatePipeline: (pipelineId, patch) =>
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, ...patch } : p
      ),
    })),
}));
