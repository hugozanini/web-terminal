import { generateDatasets } from './datasets';
import { generateDataSources } from './data-sources';
import { generatePipelines, generatePipelineRuns } from './pipeline-runs';
import { generateLineage } from './lineage';
import { generateQualityChecks } from './quality-checks';
import { generateCosts } from './costs';
import type { CatalogData } from '../types';

function ensureAllDatasetsHavePipelines(
  datasetIds: string[],
  pipelines: CatalogData['pipelines'],
): void {
  const coveredIds = new Set<string>();
  for (const p of pipelines) {
    for (const id of p.inputDatasets) coveredIds.add(id);
    for (const id of p.outputDatasets) coveredIds.add(id);
  }

  const uncovered = datasetIds.filter((id) => !coveredIds.has(id));
  for (const dsId of uncovered) {
    const target = pipelines[Math.floor(Math.random() * pipelines.length)];
    target.inputDatasets.push(dsId);
  }
}

export function generateCatalogData(): CatalogData {
  const datasets = generateDatasets(50);
  const dataSources = generateDataSources(20);
  const datasetIds = datasets.map(d => d.id);
  const pipelines = generatePipelines(datasetIds);

  ensureAllDatasetsHavePipelines(datasetIds, pipelines);

  const pipelineRuns = generatePipelineRuns(pipelines);
  const lineage = generateLineage(datasetIds);
  const qualityChecks = generateQualityChecks(100, datasets);
  const costs = generateCosts(80, datasets, pipelineRuns, dataSources);

  return { datasets, dataSources, lineage, pipelines, pipelineRuns, qualityChecks, costs };
}
