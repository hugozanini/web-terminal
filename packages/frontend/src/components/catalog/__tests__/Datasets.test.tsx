import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Datasets } from '../Datasets';
import { useCatalogStore } from '../../../store/catalog-store';

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

function renderDatasets(initialUrl = '/datasets') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Datasets />
    </MemoryRouter>
  );
}

describe('Datasets', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders the page header', async () => {
    renderDatasets();
    await waitFor(() => {
      expect(screen.getByText('Datasets')).toBeInTheDocument();
    });
  });

  it('renders dataset cards from the store', async () => {
    renderDatasets();
    await waitFor(() => {
      const state = useCatalogStore.getState();
      const found = state.datasets.some((d) =>
        screen.queryByText(d.displayName) !== null
      );
      expect(found).toBe(true);
    });
  });

  it('search filters datasets by name', async () => {
    const user = userEvent.setup();
    renderDatasets();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
    const state = useCatalogStore.getState();
    const searchName = state.datasets[0].displayName;
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, searchName);
    await waitFor(() => {
      expect(screen.getByText(searchName)).toBeInTheDocument();
    });
  });

  it('sort dropdown is present', async () => {
    renderDatasets();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sort by Quality Score')).toBeInTheDocument();
    });
  });
  it('reads state from URL search parameters correctly', async () => {
    renderDatasets('/datasets?q=marketing&type=dbt&sort=size');
    await waitFor(() => {
      // The search input should have the URL query text
      expect(screen.getByPlaceholderText(/search/i)).toHaveValue('marketing');
      // The sort dropdown should match 'size'
      const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
      expect(selects[0].value).toBe('size');
    });
  });
});
