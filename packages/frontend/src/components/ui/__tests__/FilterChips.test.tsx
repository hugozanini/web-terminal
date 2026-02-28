import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips } from '../FilterChips';

const options = [
  { value: 'a', label: 'Alpha', count: 5 },
  { value: 'b', label: 'Beta', count: 3 },
  { value: 'c', label: 'Gamma' },
];

describe('FilterChips', () => {
  it('renders all options', () => {
    render(<FilterChips options={options} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders count badge when provided', () => {
    render(<FilterChips options={options} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('clicking a chip triggers onChange with the value selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterChips options={options} selected={[]} onChange={onChange} />);
    await user.click(screen.getByText('Alpha'));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('clicking an active chip deselects it in multiple mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterChips options={options} selected={['a']} onChange={onChange} multiple />);
    await user.click(screen.getByText('Alpha'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('supports single-select mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterChips options={options} selected={['a']} onChange={onChange} multiple={false} />);
    await user.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });
});
