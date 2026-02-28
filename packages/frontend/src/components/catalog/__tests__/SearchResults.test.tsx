import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchResults } from '../SearchResults';
import { useCatalogStore } from '../../../store/catalog-store';

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

function renderSearchResults(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/search?q=${encodeURIComponent(query)}`]}>
      <SearchResults />
    </MemoryRouter>
  );
}

describe('SearchResults', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders search results page with tabs', async () => {
    renderSearchResults('coffee');
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Datasets')).toBeInTheDocument();
      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('Pipelines')).toBeInTheDocument();
    });
  });

  it('shows a back button', async () => {
    renderSearchResults('test');
    await waitFor(() => {
      expect(screen.getByText(/back to home/i)).toBeInTheDocument();
    });
  });

  it('shows search input with query value', async () => {
    renderSearchResults('inventory');
    await waitFor(() => {
      expect(screen.getByDisplayValue('inventory')).toBeInTheDocument();
    });
  });

  it('renders matching results for a known term', async () => {
    const state = useCatalogStore.getState();
    const firstDataset = state.datasets[0];
    renderSearchResults(firstDataset.displayName);
    await waitFor(() => {
      expect(screen.getByText(firstDataset.displayName)).toBeInTheDocument();
    });
  });
});
