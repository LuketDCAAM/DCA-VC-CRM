
import React from 'react';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';

interface DealsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  showAdvancedFilters: boolean;
  onToggleAdvanced: () => void;
}

export function DealsFilters({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  showAdvancedFilters,
  onToggleAdvanced,
}: DealsFiltersProps) {
  const filterOptions: FilterOption[] = [
    {
      key: 'pipeline_stage',
      label: 'Pipeline Stage',
      value: 'pipeline_stage',
      type: 'select',
      options: [
        { label: 'Seen Not Reviewed', value: 'Seen Not Reviewed' },
        { label: 'Initial Review', value: 'Initial Review' },
        { label: 'Initial Contact', value: 'Initial Contact' },
        { label: 'First Meeting', value: 'First Meeting' },
        { label: 'Due Diligence', value: 'Due Diligence' },
        { label: 'Term Sheet', value: 'Term Sheet' },
        { label: 'Legal Review', value: 'Legal Review' },
        { label: 'Invested', value: 'Invested' },
        { label: 'Passed', value: 'Passed' },
      ]
    },
    {
      key: 'round_stage',
      label: 'Round Stage',
      value: 'round_stage',
      type: 'select',
      options: [
        { label: 'Pre-Seed', value: 'Pre-Seed' },
        { label: 'Seed', value: 'Seed' },
        { label: 'Series A', value: 'Series A' },
        { label: 'Series B', value: 'Series B' },
        { label: 'Series C', value: 'Series C' },
        { label: 'Growth', value: 'Growth' },
      ]
    },
    {
      key: 'location',
      label: 'Location',
      value: 'location',
      type: 'select',
      options: [
        { label: 'San Francisco', value: 'San Francisco' },
        { label: 'New York', value: 'New York' },
        { label: 'Los Angeles', value: 'Los Angeles' },
        { label: 'Austin', value: 'Austin' },
        { label: 'Remote', value: 'Remote' },
      ]
    },
    {
      key: 'round_size',
      label: 'Round Size',
      value: 'round_size',
      type: 'range'
    },
    {
      key: 'deal_score',
      label: 'Deal Score',
      value: 'deal_score',
      type: 'range',
    },
    {
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
      type: 'date'
    },
    {
      key: 'deal_source',
      label: 'Deal Source',
      value: 'deal_source',
      type: 'select',
      options: [
        { label: 'Referral', value: 'Referral' },
        { label: 'Conference', value: 'Conference' },
        { label: 'Cold Outreach', value: 'Cold Outreach' },
        { label: 'Inbound', value: 'Inbound' },
        { label: 'Network', value: 'Network' },
      ]
    },
    {
      key: 'source_date',
      label: 'Source Date',
      value: 'source_date',
      type: 'date'
    }
  ];

  return (
    <SearchAndFilter
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      filters={filterOptions}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      placeholder="Search by company, contact, location, or description..."
      showAdvanced={showAdvancedFilters}
      onToggleAdvanced={onToggleAdvanced}
    />
  );
}
