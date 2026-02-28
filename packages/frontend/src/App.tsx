import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { ContentShell } from './components/layout/ContentShell';
import { Home } from './components/catalog/Home';
import { Datasets } from './components/catalog/Datasets';
import { DatasetDetail } from './components/catalog/DatasetDetail';
import { Lineage } from './components/catalog/Lineage';
import { Pipelines } from './components/catalog/Pipelines';
import { PipelineDetail } from './components/catalog/PipelineDetail';
import { Quality } from './components/catalog/Quality';
import { Costs } from './components/catalog/Costs';
import { SearchResults } from './components/catalog/SearchResults';

function App() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-cream-50">
        <Sidebar
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        />
        <ContentShell isTerminalOpen={isTerminalOpen}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/datasets/:id" element={<DatasetDetail />} />
            <Route path="/lineage" element={<Lineage />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/pipelines/:id" element={<PipelineDetail />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/costs" element={<Costs />} />
          </Routes>
        </ContentShell>
      </div>
    </BrowserRouter>
  );
}

export default App;
