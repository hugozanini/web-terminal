import { create } from 'zustand';
import type { CatalogData } from '../data/types';
import { generateCatalogData } from '../data/generators';

interface CatalogStore extends CatalogData {
  initialized: boolean;
  initialize: () => void;
  regenerate: () => void;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  datasets: [],
  dataSources: [],
  lineage: [],
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
}));
