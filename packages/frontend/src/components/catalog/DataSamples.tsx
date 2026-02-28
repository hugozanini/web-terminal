import { useCatalogData } from '../../hooks/useCatalogData';
import { MapPin, Award, Package } from 'lucide-react';

export function DataSamples() {
  const { coffeeBeans } = useCatalogData();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Coffee Bean Samples</h2>
        <span className="text-sm text-gray-500">{coffeeBeans.length} samples</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coffeeBeans.map((bean) => (
          <div key={bean.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{bean.batchNumber}</h3>
                <p className="text-sm text-gray-600">{bean.variety} - {bean.subVariety}</p>
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                {bean.processingMethod}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">{bean.origin.farm}</p>
                  <p className="text-gray-500">{bean.origin.region}, {bean.origin.state}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">Grade: {bean.gradeScore}/100</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{bean.bagWeight}kg bag</span>
              </div>

              {bean.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {bean.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Harvested: {new Date(bean.harvestDate).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
