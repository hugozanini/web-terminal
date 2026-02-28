import { useCatalogData } from '../../hooks/useCatalogData';
import { Clock, User, Activity } from 'lucide-react';

export function Runs() {
  const { runs } = useCatalogData();

  const sortedRuns = [...runs].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Processing Runs</h2>
        <span className="text-sm text-gray-500">{runs.length} runs</span>
      </div>

      <div className="space-y-3">
        {sortedRuns.map((run) => (
          <div key={run.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{run.runNumber}</h3>
                <p className="text-sm text-gray-600">{run.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                run.qualityMetrics.score >= 90 ? 'bg-green-100 text-green-800' :
                run.qualityMetrics.score >= 80 ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                Quality: {run.qualityMetrics.score}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="text-gray-900 font-medium">{run.duration} min</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Operator</p>
                  <p className="text-gray-900 font-medium">{run.operator}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Yield</p>
                  <p className="text-gray-900 font-medium">{run.yieldPercentage}%</p>
                </div>
              </div>
            </div>

            {Object.keys(run.parameters).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Parameters:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(run.parameters).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              Started: {new Date(run.startTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
