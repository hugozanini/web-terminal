import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { SplitView } from './components/layout/SplitView';
import { Terminal } from './components/terminal/Terminal';
import { TerminalToggle } from './components/terminal/TerminalToggle';
import { DataSamples } from './components/catalog/DataSamples';
import { Lineage } from './components/catalog/Lineage';
import { Runs } from './components/catalog/Runs';
import { Logs } from './components/catalog/Logs';
import { Costs } from './components/catalog/Costs';

function App() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const catalogContent = (
    <Routes>
      <Route path="/" element={<DataSamples />} />
      <Route path="/lineage" element={<Lineage />} />
      <Route path="/runs" element={<Runs />} />
      <Route path="/logs" element={<Logs />} />
      <Route path="/costs" element={<Costs />} />
    </Routes>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-6">
          <SplitView
            catalog={catalogContent}
            terminal={<Terminal />}
            isTerminalOpen={isTerminalOpen}
          />
        </main>

        <TerminalToggle
          isOpen={isTerminalOpen}
          onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
        />

        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600">
            Happy Coffee © {new Date().getFullYear()} - Brazilian Coffee Export Data Catalog
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
