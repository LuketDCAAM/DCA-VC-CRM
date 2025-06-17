
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

// Change this import to import the whole namespace as Dnd
import * as Dnd from '@hello-pangea/dnd';

import { Settings, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { TableColumn, useTableColumns } from '@/hooks/deals/useTableColumns';

interface ColumnSelectorProps {
  onColumnsChange?: () => void;
}

export function ColumnSelector({ onColumnsChange }: ColumnSelectorProps) {
  const { columns, reorderColumns, resetToDefault, toggleColumnVisibility } = useTableColumns();
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<TableColumn[]>(columns);

  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleDragEnd = (result: Dnd.DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalColumns(items);
  };

  const handleApplyChanges = () => {
    reorderColumns(localColumns.map(col => col.key));
    onColumnsChange?.();
    setOpen(false);
  };

  const handleToggleVisibility = (key: string) => {
    const updated = localColumns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updated);
    toggleColumnVisibility(key);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalColumns(columns);
    onColumnsChange?.();
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Columns
          <Badge variant="secondary" className="ml-2">
            {visibleCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
          <DialogDescription>
            Drag and drop to reorder columns, or toggle visibility. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Dnd.DragDropContext onDragEnd={handleDragEnd}>
            <Dnd.Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localColumns.map((column, index) => (
                    <Dnd.Draggable
                      key={column.key}
                      draggableId={column.key}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
