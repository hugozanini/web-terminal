import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Pipelines } from '../Pipelines';
import { useCatalogStore } from '../../../store/catalog-store';

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

function renderPipelines() {
  return render(
    <MemoryRouter initialEntries={['/pipelines']}>
      <Pipelines />
    </MemoryRouter>
  );
}

describe('Pipelines', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders the page header with title', async () => {
    renderPipelines();
    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('Pipelines');
    });
  });

  it('renders dashboard stats', async () => {
    renderPipelines();
    await waitFor(() => {
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Active Pipelines')).toBeInTheDocument();
    });
  });

  it('renders pipeline cards from the store', async () => {
    renderPipelines();
    await waitFor(() => {
      const state = useCatalogStore.getState();
      const found = state.pipelines.some((p) =>
        screen.queryByText(p.displayName) !== null
      );
      expect(found).toBe(true);
    });
  });

  it('renders filter dropdowns', async () => {
    renderPipelines();
    await waitFor(() => {
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    renderPipelines();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search pipelines...')).toBeInTheDocument();
    });
  });
});
