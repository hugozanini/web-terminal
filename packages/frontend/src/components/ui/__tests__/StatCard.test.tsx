import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';
import { DollarSign } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard icon={DollarSign} label="Total Cost" value="$1,234" />);
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('$1,234')).toBeInTheDocument();
  });

  it('renders detail text when provided', () => {
    render(<StatCard icon={DollarSign} label="Cost" value="$100" detail="Average" />);
    expect(screen.getByText('Average')).toBeInTheDocument();
  });

  it('does not render detail text when not provided', () => {
    render(<StatCard icon={DollarSign} label="Cost" value="$100" />);
    expect(screen.queryByText('Average')).not.toBeInTheDocument();
  });
});
