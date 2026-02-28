import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Costs } from '../Costs';
import { useCatalogStore } from '../../../store/catalog-store';

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

function renderCosts() {
  return render(
    <MemoryRouter initialEntries={['/costs']}>
      <Costs />
    </MemoryRouter>
  );
}

describe('Costs', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders stat cards', () => {
    renderCosts();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Cost per Dataset')).toBeInTheDocument();
    expect(screen.getAllByText('Storage').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Compute').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the date range selector', () => {
    renderCosts();
    expect(screen.getByDisplayValue('Last 90 days')).toBeInTheDocument();
  });

  it('date range selector changes the filter', async () => {
    const user = userEvent.setup();
    renderCosts();
    const select = screen.getByDisplayValue('Last 90 days');
    await user.selectOptions(select, '30');
    expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
  });

  it('renders category and entity type dropdowns', () => {
    renderCosts();
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Entity Types')).toBeInTheDocument();
  });

  it('renders trend indicators', () => {
    renderCosts();
    const trendLabels = screen.getAllByText(/vs prev 15d/);
    expect(trendLabels.length).toBeGreaterThanOrEqual(1);
  });
});
