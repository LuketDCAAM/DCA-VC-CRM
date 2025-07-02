
import { FilterOption } from '@/components/common/SearchAndFilter';
import { Deal } from '@/types/deal';
import { getUniqueSectors, getUniqueLocations, getUniqueDealSources } from '@/utils/dealFilterUtils';

export function generateDealsFilterOptions(deals: Deal[]): FilterOption[] {
  console.log('Generating dynamic filter options from deals:', deals.length);
  
  return [
    {
      key: 'pipeline_stage',
      label: 'Pipeline Stage',
      value: 'pipeline_stage',
      type: 'select',
      options: [
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Initial Review', value: 'Initial Review' },    // Updated from 'Initial Review'
        { label: 'Scorecard', value: 'Scorecard' },        // Updated from 'Initial Contact'
        { label: 'One Pager', value: 'One Pager' },               // Previously 'Scorecard'
        { label: 'Due Diligence', value: 'Due Diligence' },
        { label: 'Term Sheet', value: 'Term Sheet' },
        { label: 'Memo', value: 'Memo' },
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
      key: 'sector',
      label: 'Sector',
      value: 'sector',
      type: 'select',
      options: getUniqueSectors(deals)
    },
    {
      key: 'location',
      label: 'Location',
      value: 'location',
      type: 'select',
      options: getUniqueLocations(deals)
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
      options: getUniqueDealSources(deals)
    },
    {
      key: 'source_date',
      label: 'Source Date',
      value: 'source_date',
      type: 'date'
    }
  ];
}

// Keep the static version for backward compatibility if needed
export const DEALS_FILTER_OPTIONS: FilterOption[] = [
  {
    key: 'pipeline_stage',
    label: 'Pipeline Stage',
    value: 'pipeline_stage',
    type: 'select',
    options: [
      { label: 'Inactive', value: 'Inactive' },
        { label: 'Initial Review', value: 'Initial Review' },    // Updated from 'Initial Review'
        { label: 'Scorecard', value: 'Scorecard' },        // Updated from 'Initial Contact'
        { label: 'One Pager', value: 'One Pager' },               // Previously 'Scorecard'
        { label: 'Due Diligence', value: 'Due Diligence' },
        { label: 'Term Sheet', value: 'Term Sheet' },
        { label: 'Memo', value: 'Memo' },
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
    key: 'sector',
    label: 'Sector',
    value: 'sector',
    type: 'select',
    options: [
      { label: 'FinTech', value: 'FinTech' },
      { label: 'HealthTech', value: 'HealthTech' },
      { label: 'AI/ML', value: 'AI/ML' },
      { label: 'SaaS', value: 'SaaS' },
      { label: 'E-commerce', value: 'E-commerce' },
      { label: 'EdTech', value: 'EdTech' },
      { label: 'CleanTech', value: 'CleanTech' },
      { label: 'PropTech', value: 'PropTech' },
      { label: 'Cybersecurity', value: 'Cybersecurity' },
      { label: 'Hardware', value: 'Hardware' },
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
