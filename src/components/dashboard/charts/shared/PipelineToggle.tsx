import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PipelineToggleProps {
  showActiveOnly: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export function PipelineToggle({ showActiveOnly, onToggle, className = "" }: PipelineToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="pipeline-toggle"
        checked={showActiveOnly}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="pipeline-toggle" className="text-sm font-medium cursor-pointer">
        Active Pipeline Only
      </Label>
    </div>
  );
}