import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders page buttons', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables the previous button on page 1', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('calls onPageChange with the correct page number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onChange} />);
    await user.click(screen.getByText('3'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with prev/next', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith(2);
    await user.click(buttons[buttons.length - 1]);
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
