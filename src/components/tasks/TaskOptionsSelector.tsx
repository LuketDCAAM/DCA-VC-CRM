
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskOptionsSelectorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | undefined;
  onPriorityChange: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  onDueDateChange: (date: Date | undefined) => void;
}

export function TaskOptionsSelector({
  priority,
  dueDate,
  onPriorityChange,
  onDueDateChange,
}: TaskOptionsSelectorProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(value: any) => onPriorityChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={onDueDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
