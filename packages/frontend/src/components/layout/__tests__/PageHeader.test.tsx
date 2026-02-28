import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Datasets" />);
    expect(screen.getByText('Datasets')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Datasets" subtitle="50 items" />);
    expect(screen.getByText('50 items')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<PageHeader title="Datasets" />);
    const subtitles = container.querySelectorAll('p');
    expect(subtitles).toHaveLength(0);
  });

  it('renders actions slot when provided', () => {
    render(<PageHeader title="Test" actions={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
