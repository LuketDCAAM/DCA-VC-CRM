
import React, { useState } from 'react';
import { Deal } from '@/types/deal';
import { DealsHeader } from './DealsHeader';
import { DealsStats } from './DealsStats';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { DealsViewTabs } from './DealsViewTabs';
import { DealsGrid } from './DealsGrid';
import { DealPipelineBoard } from './DealPipelineBoard';
import { ConfigurableDealsTable } from './ConfigurableDealsTable';
import { DealStats } from '@/hooks/deals/dealStatsCalculator';

export type ViewMode = 'grid' | 'configurable' | 'pipeline';

interface DealsPageContentProps {
  filteredDeals: Deal[];
  dealStats: DealStats;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  showAdvancedFilters: boolean;
  onToggleAdvanced: () => void;
  selectedDeals: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (action: string, dealIds: string[]) => Promise<void>;
  isAllSelected: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onViewDetails: (deal: Deal) => void;
  onToggleDealSelection: (dealId: string) => void;
  onDealAdded: () => void;
  onDealUpdated: () => void;
  csvTemplateColumns: any[];
  exportColumns: any[];
  onCSVImport: (data: any[]) => Promise<any>;
}

export function DealsPageContent({
  filteredDeals,
  dealStats,
  loading,
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  showAdvancedFilters,
  onToggleAdvanced,
  selectedDeals,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  isAllSelected,
  viewMode,
  onViewModeChange,
  onViewDetails,
  onToggleDealSelection,
  onDealAdded,
  onDealUpdated,
  csvTemplateColumns,
  exportColumns,
  onCSVImport,
}: DealsPageContentProps) {
  console.log('DealsPageContent - showAdvancedFilters:', showAdvancedFilters);
  console.log('DealsPageContent - activeFilters:', activeFilters);

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

  const renderView = () => {
    const commonProps = {
      deals: filteredDeals,
      onViewDetails,
      selectedDeals,
      onToggleDealSelection,
      onSelectAll,
      onDeselectAll,
      isAllSelected,
    };

    switch (viewMode) {
      case 'configurable':
        return <ConfigurableDealsTable {...commonProps} />;
      case 'grid':
        return <DealsGrid {...commonProps} onDealUpdated={onDealUpdated} />;
      case 'pipeline':
        return (
          <DealPipelineBoard
            deals={filteredDeals}
            onViewDetails={onViewDetails}
            onDealUpdated={onDealUpdated}
          />
        );
      default:
        return <ConfigurableDealsTable {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <DealsHeader 
        filteredDeals={filteredDeals}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onCSVImport={onCSVImport}
        onDealAdded={onDealAdded}
      />
      
      <DealsStats 
        totalDeals={dealStats.totalDeals}
        activeDeals={dealStats.activeDeals}
        investedDeals={dealStats.investedDeals}
        passedDeals={dealStats.passedDeals}
        screeningDeals={dealStats.screeningDeals}
      />
      
      <div className="space-y-4">
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder="Search deals by company, contact, location, or description..."
          filters={filterOptions}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={onToggleAdvanced}
        />
      </div>

      <DealsViewTabs 
        viewMode={viewMode} 
        onViewModeChange={onViewModeChange}
        dealCount={filteredDeals.length}
      />

      {renderView()}
    </div>
  );
}
