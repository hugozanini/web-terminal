import { describe, it, expect } from 'vitest';
import { generateLineage } from '../lineage';

describe('generateLineage', () => {
  const datasetIds = Array.from({ length: 50 }, (_, i) => `ds-${i}`);
  const nodes = generateLineage(datasetIds);

  it('generates nodes for all provided dataset IDs', () => {
    const coveredDatasetIds = new Set<string>();
    for (const node of nodes) {
      for (const id of node.datasetIds) {
        coveredDatasetIds.add(id);
      }
    }
    for (const id of datasetIds) {
      expect(coveredDatasetIds.has(id)).toBe(true);
    }
  });

  it('nodes have valid types', () => {
    const validTypes = ['Source', 'Ingestion', 'Bronze', 'Silver', 'Gold', 'BI'];
    for (const node of nodes) {
      expect(validTypes).toContain(node.type);
    }
  });

  it('parentId references an existing node when set', () => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const node of nodes) {
      if (node.parentId) {
        expect(nodeIds.has(node.parentId)).toBe(true);
      }
    }
  });

  it('each node has required fields', () => {
    for (const node of nodes) {
      expect(typeof node.id).toBe('string');
      expect(typeof node.name).toBe('string');
      expect(typeof node.location).toBe('string');
      expect(node.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(node.datasetIds)).toBe(true);
      expect(node.datasetIds.length).toBeGreaterThan(0);
    }
  });

  it('creates 15 unique chains (6 nodes each)', () => {
    const rootNodes = nodes.filter((n) => !n.parentId);
    expect(rootNodes).toHaveLength(15);
    expect(nodes).toHaveLength(15 * 6);
  });
});
