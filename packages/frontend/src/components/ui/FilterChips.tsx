import clsx from 'clsx';

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean;
}

export function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  multiple = true,
}: FilterChipsProps<T>) {
  const toggle = (value: T) => {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(({ value, label, count }) => {
        const isActive = selected.includes(value);
        return (
          <button
            key={value}
            onClick={() => toggle(value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
              isActive
                ? 'bg-brand-100 border-brand-300 text-brand-900'
                : 'bg-white border-cream-200 text-cream-600 hover:border-cream-300 hover:text-cream-800'
            )}
          >
            {label}
            {count !== undefined && (
              <span className={clsx(
                'text-[10px] px-1 py-0 rounded-full',
                isActive ? 'bg-brand-200 text-brand-700' : 'bg-cream-100 text-cream-500'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
