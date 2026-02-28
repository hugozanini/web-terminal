import { useCatalogData } from '../../hooks/useCatalogData';
import { ChevronRight } from 'lucide-react';

export function Lineage() {
  const { lineage, coffeeBeans } = useCatalogData();

  // Group lineage by batch
  const lineageByBatch = lineage.reduce((acc, node) => {
    node.batchIds.forEach((batchId) => {
      if (!acc[batchId]) {
        acc[batchId] = [];
      }
      acc[batchId].push(node);
    });
    return acc;
  }, {} as Record<string, typeof lineage>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Batch Lineage</h2>
        <span className="text-sm text-gray-500">{Object.keys(lineageByBatch).length} tracked batches</span>
      </div>

      <div className="space-y-6">
        {Object.entries(lineageByBatch).map(([batchId, nodes]) => {
          const bean = coffeeBeans.find((b) => b.id === batchId);
          const sortedNodes = [...nodes].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          return (
            <div key={batchId} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {bean?.batchNumber || 'Unknown Batch'}
              </h3>

              <div className="relative">
                {sortedNodes.map((node, index) => (
                  <div key={node.id} className="flex gap-4 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        node.type === 'Farm' ? 'bg-green-600' :
                        node.type === 'Processing' ? 'bg-blue-600' :
                        node.type === 'Warehouse' ? 'bg-purple-600' :
                        node.type === 'Quality Control' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {index + 1}
                      </div>
                      {index < sortedNodes.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300 my-1" />
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{node.name}</h4>
                          <p className="text-sm text-gray-600">{node.type}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <p className="text-sm text-gray-500 mt-1">{node.location}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(node.timestamp).toLocaleString()}
                      </p>

                      {Object.keys(node.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(node.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
