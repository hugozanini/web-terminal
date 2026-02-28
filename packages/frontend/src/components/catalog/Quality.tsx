import { useState, useMemo } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { FilterChips } from '../ui/FilterChips';
import { DataTable, type Column } from '../ui/DataTable';
import { useCatalogData } from '../../hooks/useCatalogData';
import type { QualityEntry } from '../../data/types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const severityDot: Record<string, string> = {
  Critical: 'bg-red-500',
  Error: 'bg-orange-500',
  Warning: 'bg-amber-400',
  Info: 'bg-blue-400',
};

const resultDot: Record<string, string> = {
  Passed: 'bg-emerald-500',
  Failed: 'bg-red-500',
  Warning: 'bg-amber-400',
};

const severityOptions = [
  { value: 'Info', label: 'Info' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Error', label: 'Error' },
  { value: 'Critical', label: 'Critical' },
];

const checkTypeOptions = [
  { value: 'Freshness', label: 'Freshness' },
  { value: 'Schema', label: 'Schema' },
  { value: 'Volume', label: 'Volume' },
  { value: 'Accuracy', label: 'Accuracy' },
  { value: 'Completeness', label: 'Completeness' },
];

const resultOptions = [
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Warning', label: 'Warning' },
];

const columns: Column<QualityEntry>[] = [
  {
    key: 'timestamp',
    header: 'Timestamp',
    width: '160px',
    sortable: true,
    sortValue: (row) => new Date(row.timestamp).getTime(),
    render: (row) => (
      <span className="text-xs text-cream-600 whitespace-nowrap">
        {new Date(row.timestamp).toLocaleString()}
      </span>
    ),
  },
  {
    key: 'checkType',
    header: 'Check Type',
    width: '110px',
    sortable: true,
    sortValue: (row) => row.checkType,
    render: (row) => <span className="text-xs">{row.checkType}</span>,
  },
  {
    key: 'dataset',
    header: 'Dataset',
    width: '160px',
    sortable: true,
    sortValue: (row) => row.datasetName,
    render: (row) => <span className="text-xs font-medium">{row.datasetName}</span>,
  },
  {
    key: 'rule',
    header: 'Rule',
    width: '200px',
    render: (row) => <span className="text-xs text-cream-600 line-clamp-1">{row.rule}</span>,
  },
  {
    key: 'result',
    header: 'Result',
    width: '90px',
    sortable: true,
    sortValue: (row) => {
      const order = { Failed: 0, Warning: 1, Passed: 2 };
      return order[row.result as keyof typeof order] ?? 3;
    },
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', resultDot[row.result])} />
        {row.result}
      </span>
    ),
  },
  {
    key: 'severity',
    header: 'Severity',
    width: '90px',
    sortable: true,
    sortValue: (row) => {
      const order = { Critical: 0, Error: 1, Warning: 2, Info: 3 };
      return order[row.severity as keyof typeof order] ?? 4;
    },
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', severityDot[row.severity])} />
        {row.severity}
      </span>
    ),
  },
  {
    key: 'message',
    header: 'Message',
    render: (row) => <span className="text-xs text-cream-700 line-clamp-2">{row.message}</span>,
  },
];

export function Quality() {
  const { qualityChecks } = useCatalogData();
  useDocumentTitle('Data Quality');
  const [search, setSearch] = useState('');
  const [severities, setSeverities] = useState<string[]>([]);
  const [checkTypes, setCheckTypes] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = qualityChecks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.datasetName.toLowerCase().includes(q) || e.message.toLowerCase().includes(q)
      );
    }
    if (severities.length > 0) {
      result = result.filter((e) => severities.includes(e.severity));
    }
    if (checkTypes.length > 0) {
      result = result.filter((e) => checkTypes.includes(e.checkType));
    }
    if (results.length > 0) {
      result = result.filter((e) => results.includes(e.result));
    }
    return [...result].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [qualityChecks, search, severities, checkTypes, results]);

  return (
    <div>
      <PageHeader
        title="Data Quality"
        subtitle={`${filtered.length} of ${qualityChecks.length} checks`}
      />

      <div className="space-y-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by dataset name or message..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterChips options={checkTypeOptions} selected={checkTypes} onChange={setCheckTypes} />
          <div className="w-px bg-cream-200" />
          <FilterChips options={resultOptions} selected={results} onChange={setResults} />
          <div className="w-px bg-cream-200" />
          <FilterChips options={severityOptions} selected={severities} onChange={setSeverities} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={20}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
