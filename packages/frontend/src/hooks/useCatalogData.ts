import { useEffect } from 'react';
import { useCatalogStore } from '../store/catalog-store';

export function useCatalogData() {
  const store = useCatalogStore();

  useEffect(() => {
    if (!store.initialized) {
      store.initialize();
    }
  }, [store.initialized, store]);

  return {
    coffeeBeans: store.coffeeBeans,
    shipments: store.shipments,
    orders: store.orders,
    lineage: store.lineage,
    runs: store.runs,
    logs: store.logs,
    costs: store.costs,
    regenerate: store.regenerate,
  };
}
