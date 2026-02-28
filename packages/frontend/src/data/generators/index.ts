import { generateDatasets } from './datasets';
import { generateDataSources } from './data-sources';
import { generatePipelines, generatePipelineRuns } from './pipeline-runs';
import { generateLineage } from './lineage';
import { generateQualityChecks } from './quality-checks';
import { generateCosts } from './costs';
import type { CatalogData } from '../types';

export function generateCatalogData(): CatalogData {
  const datasets = generateDatasets(50);
  const dataSources = generateDataSources(20);
  const datasetIds = datasets.map(d => d.id);
  const pipelines = generatePipelines(datasetIds);
  const pipelineRuns = generatePipelineRuns(pipelines);
  const lineage = generateLineage(datasetIds);
  const qualityChecks = generateQualityChecks(100, datasets);
  const costs = generateCosts(80, datasets, pipelineRuns, dataSources);

  return { datasets, dataSources, lineage, pipelines, pipelineRuns, qualityChecks, costs };
}
