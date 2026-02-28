import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder text', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Find datasets..." />);
    expect(screen.getByPlaceholderText('Find datasets...')).toBeInTheDocument();
  });

  it('calls onChange on user typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).toHaveBeenCalledWith('h');
  });

  it('calls onSubmit on Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchInput value="test" onChange={() => {}} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onSubmit is not provided and Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchInput value="test" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Enter}');
  });

  it('renders the current value', () => {
    render(<SearchInput value="current" onChange={() => {}} />);
    expect(screen.getByDisplayValue('current')).toBeInTheDocument();
  });
});
