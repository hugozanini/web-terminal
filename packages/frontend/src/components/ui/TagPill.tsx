import clsx from 'clsx';

type TagVariant = 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray' | 'teal';

const variantStyles: Record<TagVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-cream-100 text-cream-700 border-cream-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};

interface TagPillProps {
  label: string;
  variant?: TagVariant;
  className?: string;
}

export function TagPill({ label, variant = 'gray', className }: TagPillProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
      variantStyles[variant],
      className,
    )}>
      {label}
    </span>
  );
}

const tagVariants: Record<string, TagVariant> = {
  'production': 'green',
  'staging': 'amber',
  'pii': 'red',
  'sla-critical': 'purple',
  'certified': 'teal',
  'deprecated': 'gray',
  'experimental': 'blue',
  'core': 'green',
};

export function getTagVariant(tag: string): TagVariant {
  return tagVariants[tag] ?? 'gray';
}

const datasetTypeVariants: Record<string, TagVariant> = {
  'Table': 'blue',
  'View': 'purple',
  'Materialized View': 'teal',
  'External Table': 'amber',
};

export function getDatasetTypeVariant(type: string): TagVariant {
  return datasetTypeVariants[type] ?? 'gray';
}
