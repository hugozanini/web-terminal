import { useCatalogData } from '../../hooks/useCatalogData';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

export function Costs() {
  const { costs } = useCatalogData();

  // Calculate totals by category
  const totalsByCategory = costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalCost = Object.values(totalsByCategory).reduce((sum, val) => sum + val, 0);

  const sortedCosts = [...costs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Cost Analysis</h2>
        <span className="text-sm text-gray-500">{costs.length} entries</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <PieChart className="w-6 h-6 opacity-75" />
          </div>
          <p className="text-sm opacity-90">Total Cost</p>
          <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
        </div>

        {Object.entries(totalsByCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, amount]) => (
            <div key={category} className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">{category}</p>
              <p className="text-xl font-bold text-gray-900">${amount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((amount / totalCost) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
      </div>

      {/* Cost Entries */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Recent Costs</h3>
        {sortedCosts.map((cost) => (
          <div key={cost.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{cost.subcategory}</h4>
                <p className="text-sm text-gray-600">{cost.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${cost.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{cost.currency}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">{cost.description}</p>

            {cost.breakdown && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Breakdown:</p>
                <div className="space-y-1">
                  {cost.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.item}</span>
                      <span className="text-gray-900">${item.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
              <span>{cost.entityType}: {cost.entityId.substring(0, 8)}</span>
              <span>{new Date(cost.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
