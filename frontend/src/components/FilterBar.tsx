'use client';

import type { EventFilters, SortOrder, EventType } from '@/lib/types';

interface FilterBarProps {
  filters: EventFilters;
  sort: SortOrder;
  total: number;
  onChange: (filters: EventFilters) => void;
  onSortChange: (sort: SortOrder) => void;
}

export function FilterBar({ filters, sort, total, onChange, onSortChange }: FilterBarProps) {
  function update(patch: Partial<EventFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span className="font-medium text-gray-700">{total} events</span>
      </div>

      <Select
        label="Date Range"
        value={filters.dateRange}
        onChange={v => update({ dateRange: v as EventFilters['dateRange'] })}
        options={[
          { value: 'all', label: 'All Dates' },
          { value: '30', label: 'Next 30 Days' },
          { value: '60', label: 'Next 60 Days' },
          { value: '90', label: 'Next 90 Days' },
        ]}
      />

      <Select
        label="Location"
        value={filters.location}
        onChange={v => update({ location: v as EventFilters['location'] })}
        options={[
          { value: 'all', label: 'US & Global' },
          { value: 'us', label: 'US Only' },
          { value: 'global', label: 'International' },
        ]}
      />

      <Select
        label="Relevance"
        value={filters.relevance}
        onChange={v => update({ relevance: v as EventFilters['relevance'] })}
        options={[
          { value: 'all', label: 'All Relevance' },
          { value: 'high', label: 'High Priority (75+)' },
        ]}
      />

      <Select
        label="Type"
        value={filters.type}
        onChange={v => update({ type: v as EventType | 'all' })}
        options={[
          { value: 'all', label: 'All Types' },
          { value: 'conference', label: 'Conference' },
          { value: 'regulatory', label: 'Regulatory' },
          { value: 'institutional', label: 'Institutional' },
          { value: 'summit', label: 'Summit' },
          { value: 'meetup', label: 'Meetup' },
          { value: 'hackathon', label: 'Hackathon' },
        ]}
      />

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort:</span>
        <Select
          label="Sort"
          value={sort}
          onChange={v => onSortChange(v as SortOrder)}
          options={[
            { value: 'score', label: 'Highest Relevance' },
            { value: 'date', label: 'Soonest Date' },
          ]}
        />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-nexus-amber focus:border-transparent cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
