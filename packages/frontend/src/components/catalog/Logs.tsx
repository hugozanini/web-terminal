import { useCatalogData } from '../../hooks/useCatalogData';
import { AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

export function Logs() {
  const { logs } = useCatalogData();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Error':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-50 border-red-200';
      case 'Error':
        return 'bg-orange-50 border-orange-200';
      case 'Warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
        <span className="text-sm text-gray-500">{logs.length} entries</span>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`border rounded-lg p-4 ${getSeverityColor(log.severity)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getSeverityIcon(log.severity)}</div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-medium text-gray-900">{log.type}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {log.entityType}: {log.entityId.substring(0, 8)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">{log.message}</p>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>User: {log.user}</span>
                  {log.metadata.source && <span>Source: {String(log.metadata.source)}</span>}
                  {log.metadata.location && <span>Location: {String(log.metadata.location)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
