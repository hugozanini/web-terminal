import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../Home';
import { useCatalogStore } from '../../../store/catalog-store';

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders the hero search section', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('renders asset tabs', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Datasets')).toBeInTheDocument();
      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('Pipelines')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/Total Datasets/i)).toBeInTheDocument();
    });
  });

  it('switching tabs updates the active tab styling', async () => {
    const user = userEvent.setup();
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Datasets')).toBeInTheDocument();
    });
    const datasetsTab = screen.getByText('Datasets');
    await user.click(datasetsTab);
    expect(datasetsTab.closest('button')?.className).toContain('brand');
  });
});
