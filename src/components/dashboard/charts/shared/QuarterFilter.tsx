import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuarterFilterProps {
  selectedQuarter: string;
  onQuarterChange: (quarter: string) => void;
  availableQuarters: string[];
}

export function QuarterFilter({ selectedQuarter, onQuarterChange, availableQuarters }: QuarterFilterProps) {
  return (
    <Select value={selectedQuarter} onValueChange={onQuarterChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All quarters" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All quarters</SelectItem>
        {availableQuarters.map((quarter) => (
          <SelectItem key={quarter} value={quarter}>
            {quarter}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
