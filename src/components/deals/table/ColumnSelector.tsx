
import React, { useState, useEffect } from 'react';
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

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

import { Settings, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { TableColumn, useTableColumns } from '@/hooks/deals/useTableColumns';

interface ColumnSelectorProps {
  onColumnsChange?: () => void;
}

export function ColumnSelector({ onColumnsChange }: ColumnSelectorProps) {
  const { columns, reorderColumns, resetToDefault, toggleColumnVisibility } = useTableColumns();
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<TableColumn[]>(columns);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleDragEnd = (result: DropResult) => {
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localColumns.map((column, index) => (
                    <Draggable
                      key={column.key}
                      draggableId={column.key}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between rounded border p-2 ${
                            snapshot.isDragging ? 'bg-gray-200' : 'bg-white'
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-move mr-2">
                            <GripVertical className="h-5 w-5 text-gray-500" />
                          </div>

                          <div className="flex-1">
                            <Checkbox
                              checked={column.visible}
                              onCheckedChange={() => handleToggleVisibility(column.key)}
                            />
                            <span className="ml-2">{column.label}</span>
                          </div>

                          {/* Optional: Add reset visibility button or info here */}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="ghost" onClick={handleReset} leftIcon={<RotateCcw />}>
            Reset to Default
          </Button>
          <Button onClick={handleApplyChanges}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
