import { Coffee } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Coffee className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Happy Coffee</h1>
            <p className="text-sm text-amber-100">Brazilian Coffee Export Data Catalog</p>
          </div>
        </div>
      </div>
    </header>
  );
}
