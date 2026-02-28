import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from '../DataTable';

interface Row {
  id: string;
  name: string;
  value: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => <span>{r.name}</span>, sortable: true, sortValue: (r) => r.name },
  { key: 'value', header: 'Value', render: (r) => <span>{r.value}</span>, sortable: true, sortValue: (r) => r.value },
];

const data: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: `row-${i}`,
  name: `Item ${String(i).padStart(2, '0')}`,
  value: 25 - i,
}));

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} pageSize={5} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Item 00')).toBeInTheDocument();
    expect(screen.getByText('Item 04')).toBeInTheDocument();
    expect(screen.queryByText('Item 05')).not.toBeInTheDocument();
  });

  it('shows "No results found" when data is empty', () => {
    render(<DataTable columns={columns} data={[]} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('paginates data correctly', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} pageSize={10} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Item 00')).toBeInTheDocument();

    const nextButtons = screen.getAllByRole('button');
    const nextBtn = nextButtons[nextButtons.length - 1];
    await user.click(nextBtn);
    expect(screen.getByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 00')).not.toBeInTheDocument();
  });

  it('sorts data when clicking a sortable column', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} pageSize={25} keyExtractor={(r) => r.id} />);
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    const rows = screen.getAllByText(/Item \d{2}/);
    expect(rows[0].textContent).toBe('Item 00');

    await user.click(nameHeader);
    const rowsDesc = screen.getAllByText(/Item \d{2}/);
    expect(rowsDesc[0].textContent).toBe('Item 24');
  });

  it('displays showing count text', () => {
    render(<DataTable columns={columns} data={data} pageSize={10} keyExtractor={(r) => r.id} />);
    expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
  });
});
