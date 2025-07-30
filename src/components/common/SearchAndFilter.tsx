
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar, DollarSign, Building2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  type: 'select' | 'range' | 'date' | 'multiselect';
  options?: { label: string; value: string }[];
}

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterOption[];
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  placeholder?: string;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  placeholder = "Search...",
  showAdvanced = false,
  onToggleAdvanced
}: SearchAndFilterProps) {
  console.log('SearchAndFilter - filters received:', filters);
  console.log('SearchAndFilter - activeFilters:', activeFilters);
  console.log('SearchAndFilter - showAdvanced:', showAdvanced);

  const activeFilterCount = Object.keys(activeFilters).filter(key => {
    const value = activeFilters[key];
    if (!value) return false;
    if (value === 'all' || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAdvanced}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-2 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  {filter.type === 'select' && (
                    <Select
                      value={activeFilters[filter.key] || 'all'}
                      onValueChange={(value) => {
                        console.log(`Filter change - ${filter.key}:`, value);
                        onFilterChange(filter.key, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`All ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {filter.label}</SelectItem>
                        {filter.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {filter.type === 'multiselect' && (
                    <MultiSelect
                      options={filter.options || []}
                      value={activeFilters[filter.key] || []}
                      onValueChange={(value) => {
                        console.log(`Multi-select filter change - ${filter.key}:`, value);
                        onFilterChange(filter.key, value);
                      }}
                      placeholder={`Select ${filter.label}`}
                    />
                  )}
                  {filter.type === 'date' && (
                    <Input
                      type="date"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => {
                        console.log(`Date filter change - ${filter.key}:`, e.target.value);
                        onFilterChange(filter.key, e.target.value);
                      }}
                    />
                  )}
                  {filter.type === 'range' && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={activeFilters[`${filter.key}_min`] || ''}
                        onChange={(e) => {
                          console.log(`Range min filter change - ${filter.key}_min:`, e.target.value);
                          onFilterChange(`${filter.key}_min`, e.target.value);
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={activeFilters[`${filter.key}_max`] || ''}
                        onChange={(e) => {
                          console.log(`Range max filter change - ${filter.key}_max:`, e.target.value);
                          onFilterChange(`${filter.key}_max`, e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {Object.entries(activeFilters).map(([key, value]) => {
                    if (!value || value === 'all' || value === '') return null;
                    if (Array.isArray(value) && value.length === 0) return null;
                    const filter = filters.find(f => f.key === key || key.startsWith(f.key));
                    if (!filter) return null;
                    
                    const displayValue = Array.isArray(value) 
                      ? value.length === 1 
                        ? value[0] 
                        : `${value.length} selected`
                      : value;
                    
                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {filter.label}: {displayValue}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => {
                            console.log(`Removing filter - ${key}`);
                            onFilterChange(key, Array.isArray(value) ? [] : '');
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
