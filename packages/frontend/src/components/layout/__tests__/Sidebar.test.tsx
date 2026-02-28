import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { useCatalogStore } from '../../../store/catalog-store';

function renderSidebar(path = '/', isTerminalOpen = false) {
  const onToggle = vi.fn();
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar isTerminalOpen={isTerminalOpen} onToggleTerminal={onToggle} />
    </MemoryRouter>
  );
  return { ...result, onToggle };
}

describe('Sidebar', () => {
  beforeEach(() => {
    useCatalogStore.getState().initialize();
  });

  it('renders all nav links', () => {
    renderSidebar();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Pipelines')).toBeInTheDocument();
    expect(screen.getByText('Costs')).toBeInTheDocument();
  });

  it('renders the terminal toggle button', () => {
    renderSidebar();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });

  it('shows dataset and pipeline counts', () => {
    renderSidebar();
    const state = useCatalogStore.getState();
    expect(screen.getByText(String(state.datasets.length))).toBeInTheDocument();
    expect(screen.getByText(String(state.pipelines.length))).toBeInTheDocument();
  });

  it('terminal toggle calls onToggleTerminal', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderSidebar();
    await user.click(screen.getByText('Terminal'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders the Happy Coffee branding', () => {
    renderSidebar();
    expect(screen.getByText('Happy Coffee')).toBeInTheDocument();
    expect(screen.getByText('Data Catalog')).toBeInTheDocument();
  });
});
